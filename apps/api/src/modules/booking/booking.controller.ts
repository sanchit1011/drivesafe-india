import { Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../config/prisma';
import { AuthRequest } from '../../middleware/auth';
import { NotFoundError, ForbiddenError, AppError } from '../../utils/errors';
import { calculateFare, haversineDistance, estimateDuration } from '../../services/fareCalculator';
import { logger } from '../../utils/logger';

function generateBookingNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `DS${date}${random}`;
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function estimateFare(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { pickupLat, pickupLng, dropLat, dropLng, scheduledAt } = req.body;

    const pricingRule = await prisma.pricingRule.findFirst({
      where: { isActive: true }
    });

    if (!pricingRule) {
      throw new AppError('No pricing rules configured for this zone', 422);
    }

    const distanceKm = haversineDistance(pickupLat, pickupLng, dropLat, dropLng);
    const durationMinutes = estimateDuration(distanceKm);

    const estimate = calculateFare({
      distanceKm,
      durationMinutes,
      baseFare: pricingRule.baseFare,
      perKmRate: pricingRule.perKmRate,
      perMinuteRate: pricingRule.perMinuteRate,
      minimumFare: pricingRule.minimumFare,
      nightSurcharge: pricingRule.nightSurcharge,
      waitingCharge: pricingRule.waitingCharge,
      returnCharge: pricingRule.returnCharge,
      gstPercent: pricingRule.gstPercent,
      scheduledAt: new Date(scheduledAt),
    });

    res.json({ success: true, data: estimate });
  } catch (err) {
    next(err);
  }
}

export async function createBooking(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new ForbiddenError();

    const {
      pickupAddress, pickupLat, pickupLng, pickupPlaceId,
      dropAddress, dropLat, dropLng, dropPlaceId,
      scheduledAt, vehicleId, specialNotes
    } = req.body;

    const pricingRule = await prisma.pricingRule.findFirst({
      where: { isActive: true }
    });

    if (!pricingRule) throw new AppError('Service unavailable in this zone', 422);

    const distanceKm = haversineDistance(pickupLat, pickupLng, dropLat, dropLng);
    const durationMinutes = estimateDuration(distanceKm);

    const fareEstimate = calculateFare({
      distanceKm,
      durationMinutes,
      baseFare: pricingRule.baseFare,
      perKmRate: pricingRule.perKmRate,
      perMinuteRate: pricingRule.perMinuteRate,
      minimumFare: pricingRule.minimumFare,
      nightSurcharge: pricingRule.nightSurcharge,
      waitingCharge: pricingRule.waitingCharge,
      returnCharge: pricingRule.returnCharge,
      gstPercent: pricingRule.gstPercent,
      scheduledAt: new Date(scheduledAt),
    });

    const booking = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.create({
        data: {
          bookingNumber: generateBookingNumber(),
          customerId: req.user!.userId,
          vehicleId: vehicleId || null,
          pricingRuleId: pricingRule.id,
          pickupAddress,
          pickupLat,
          pickupLng,
          pickupPlaceId,
          dropAddress,
          dropLat,
          dropLng,
          dropPlaceId,
          scheduledAt: new Date(scheduledAt),
          distanceKm: fareEstimate.distanceKm,
          durationMinutes: fareEstimate.durationMinutes,
          estimatedFare: fareEstimate.totalAmount,
          baseFare: pricingRule.baseFare,
          perKmRate: pricingRule.perKmRate,
          perMinuteRate: pricingRule.perMinuteRate,
          gstAmount: fareEstimate.gstAmount,
          returnCharge: fareEstimate.returnCharge,
          nightSurcharge: fareEstimate.nightSurcharge,
          status: 'PENDING',
          otp: generateOTP(),
          specialNotes,
        },
        include: {
          vehicle: true,
        }
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: b.id,
          status: 'PENDING',
          changedBy: req.user!.userId,
        }
      });

      return b;
    });

    // Notify customer
    await prisma.notification.create({
      data: {
        userId: req.user.userId,
        bookingId: booking.id,
        type: 'BOOKING_CONFIRMED',
        title: 'Booking Confirmed',
        body: `Your booking ${booking.bookingNumber} is confirmed. Finding a driver...`,
      }
    });

    logger.info('Booking created', { bookingId: booking.id, customerId: req.user.userId });

    res.status(201).json({
      success: true,
      data: {
        ...booking,
        fareEstimate,
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getBooking(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new ForbiddenError();

    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        customer: { include: { profile: true } },
        driver: {
          include: {
            user: { include: { profile: true } }
          }
        },
        vehicle: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        payment: true,
        reviews: true,
      }
    });

    if (!booking) throw new NotFoundError('Booking');

    // Check ownership
    const isOwner = booking.customerId === req.user.userId;
    const isDriver = booking.driver?.userId === req.user.userId;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isDriver && !isAdmin) {
      throw new ForbiddenError('Access to this booking is denied');
    }

    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
}

export async function getMyBookings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new ForbiddenError();

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: { customerId: req.user.userId },
        include: {
          driver: { include: { user: { include: { profile: true } } } },
          vehicle: true,
          payment: { select: { status: true, amount: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where: { customerId: req.user.userId } })
    ]);

    res.json({
      success: true,
      data: {
        items: bookings,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function cancelBooking(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new ForbiddenError();

    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking) throw new NotFoundError('Booking');

    const isOwner = booking.customerId === req.user.userId;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) throw new ForbiddenError();

    const cancellableStatuses = ['PENDING', 'SEARCHING_DRIVER', 'DRIVER_ASSIGNED', 'DRIVER_EN_ROUTE'];
    if (!cancellableStatuses.includes(booking.status)) {
      throw new AppError('This booking cannot be cancelled at this stage', 422);
    }

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CANCELLED',
          cancelReason: req.body.reason || 'Customer cancelled',
          cancelledBy: req.user!.userId,
          cancelledAt: new Date(),
        }
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          status: 'CANCELLED',
          notes: req.body.reason,
          changedBy: req.user!.userId,
        }
      });
    });

    res.json({ success: true, message: 'Booking cancelled' });
  } catch (err) {
    next(err);
  }
}
