import { Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import { AuthRequest } from '../../middleware/auth';
import { NotFoundError, ForbiddenError, AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export async function getDriverProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new ForbiddenError();

    const driver = await prisma.driver.findUnique({
      where: { userId: req.user.userId },
      include: {
        user: { include: { profile: true } },
        documents: true,
        operatingZone: true,
      }
    });

    if (!driver) throw new NotFoundError('Driver profile');

    res.json({ success: true, data: driver });
  } catch (err) {
    next(err);
  }
}

export async function updateAvailability(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new ForbiddenError();

    const driver = await prisma.driver.findUnique({ where: { userId: req.user.userId } });
    if (!driver) throw new NotFoundError('Driver profile');

    if (driver.status !== 'VERIFIED') {
      throw new AppError('Driver not verified. Cannot go online.', 403);
    }

    const { availability } = req.body;

    const updated = await prisma.driver.update({
      where: { id: driver.id },
      data: { availability }
    });

    logger.info('Driver availability updated', { driverId: driver.id, availability });

    res.json({ success: true, data: { availability: updated.availability } });
  } catch (err) {
    next(err);
  }
}

export async function updateLocation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new ForbiddenError();

    const driver = await prisma.driver.findUnique({ where: { userId: req.user.userId } });
    if (!driver) throw new NotFoundError('Driver');

    const { lat, lng } = req.body;

    await prisma.driver.update({
      where: { id: driver.id },
      data: {
        currentLat: lat,
        currentLng: lng,
        lastLocationAt: new Date(),
      }
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function getDriverBookings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new ForbiddenError();

    const driver = await prisma.driver.findUnique({ where: { userId: req.user.userId } });
    if (!driver) throw new NotFoundError('Driver profile');

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status as string;

    const where = {
      driverId: driver.id,
      ...(status ? { status: status as any } : {}),
    };

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          customer: { include: { profile: true } },
          vehicle: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where })
    ]);

    res.json({
      success: true,
      data: { items: bookings, total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    next(err);
  }
}

export async function acceptBooking(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new ForbiddenError();

    const driver = await prisma.driver.findUnique({ where: { userId: req.user.userId } });
    if (!driver) throw new NotFoundError('Driver profile');
    if (driver.status !== 'VERIFIED') throw new AppError('Driver not verified', 403);
    if (driver.availability !== 'ONLINE') throw new AppError('Driver must be online to accept bookings', 422);

    const booking = await prisma.booking.findUnique({ where: { id: req.params.bookingId } });
    if (!booking) throw new NotFoundError('Booking');
    if (booking.status !== 'SEARCHING_DRIVER') throw new AppError('Booking no longer available', 409);
    if (booking.driverId) throw new AppError('Booking already assigned', 409);

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({
        where: { id: booking.id },
        data: {
          driverId: driver.id,
          status: 'DRIVER_ASSIGNED',
        }
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          status: 'DRIVER_ASSIGNED',
          changedBy: req.user!.userId,
        }
      });

      await tx.driver.update({
        where: { id: driver.id },
        data: { availability: 'ON_TRIP' }
      });

      return b;
    });

    logger.info('Driver accepted booking', { driverId: driver.id, bookingId: booking.id });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function updateBookingStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new ForbiddenError();

    const driver = await prisma.driver.findUnique({ where: { userId: req.user.userId } });
    if (!driver) throw new NotFoundError('Driver');

    const booking = await prisma.booking.findUnique({ where: { id: req.params.bookingId } });
    if (!booking) throw new NotFoundError('Booking');
    if (booking.driverId !== driver.id) throw new ForbiddenError('Not your booking');

    const { status, otp } = req.body;

    // OTP verification for TRIP_STARTED
    if (status === 'TRIP_STARTED') {
      if (booking.otp !== otp) throw new AppError('Invalid OTP', 400);
    }

    const validTransitions: Record<string, string> = {
      DRIVER_ASSIGNED: 'DRIVER_EN_ROUTE',
      DRIVER_EN_ROUTE: 'DRIVER_ARRIVED',
      DRIVER_ARRIVED: 'TRIP_STARTED',
      TRIP_STARTED: 'TRIP_COMPLETED',
    };

    if (validTransitions[booking.status] !== status) {
      throw new AppError(`Cannot transition from ${booking.status} to ${status}`, 422);
    }

    const isCompleted = status === 'TRIP_COMPLETED';

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status,
          ...(status === 'TRIP_STARTED' ? { tripStartedAt: new Date(), otpVerified: true } : {}),
          ...(isCompleted ? { tripEndedAt: new Date(), status: 'PAYMENT_PENDING' } : {}),
        }
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          status: isCompleted ? 'PAYMENT_PENDING' : status,
          changedBy: req.user!.userId,
        }
      });

      if (isCompleted) {
        await tx.driver.update({
          where: { id: driver.id },
          data: { availability: 'ONLINE', totalRides: { increment: 1 } }
        });

        if (booking.finalFare || booking.estimatedFare) {
          const amount = booking.finalFare || booking.estimatedFare;
          await tx.driverEarning.create({
            data: {
              driverId: driver.id,
              bookingId: booking.id,
              amount: amount * 0.8, // 80% to driver
            }
          });

          await tx.driver.update({
            where: { id: driver.id },
            data: { totalEarnings: { increment: amount * 0.8 } }
          });
        }
      }
    });

    res.json({ success: true, message: `Booking status updated to ${isCompleted ? 'PAYMENT_PENDING' : status}` });
  } catch (err) {
    next(err);
  }
}

export async function getEarnings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new ForbiddenError();

    const driver = await prisma.driver.findUnique({ where: { userId: req.user.userId } });
    if (!driver) throw new NotFoundError('Driver');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(today);
    monthStart.setDate(1);

    const [todayEarnings, weekEarnings, monthEarnings, recentEarnings] = await Promise.all([
      prisma.driverEarning.aggregate({
        where: { driverId: driver.id, date: { gte: today } },
        _sum: { amount: true }
      }),
      prisma.driverEarning.aggregate({
        where: { driverId: driver.id, date: { gte: weekStart } },
        _sum: { amount: true }
      }),
      prisma.driverEarning.aggregate({
        where: { driverId: driver.id, date: { gte: monthStart } },
        _sum: { amount: true }
      }),
      prisma.driverEarning.findMany({
        where: { driverId: driver.id },
        orderBy: { date: 'desc' },
        take: 10,
      }),
    ]);

    res.json({
      success: true,
      data: {
        today: todayEarnings._sum.amount || 0,
        week: weekEarnings._sum.amount || 0,
        month: monthEarnings._sum.amount || 0,
        total: driver.totalEarnings,
        totalRides: driver.totalRides,
        rating: driver.rating,
        recent: recentEarnings,
      }
    });
  } catch (err) {
    next(err);
  }
}
