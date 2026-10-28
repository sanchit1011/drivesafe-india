import { Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import { AuthRequest } from '../../middleware/auth';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export async function getDashboardStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const [totalUsers, totalDrivers, totalBookings, activeBookings, revenue] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.driver.count(),
      prisma.booking.count(),
      prisma.booking.count({
        where: {
          status: { in: ['DRIVER_ASSIGNED', 'DRIVER_EN_ROUTE', 'DRIVER_ARRIVED', 'TRIP_STARTED'] }
        }
      }),
      prisma.payment.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { amount: true }
      }),
    ]);

    const recentBookings = await prisma.booking.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { include: { profile: true } },
        driver: { include: { user: { include: { profile: true } } } },
      }
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalDrivers,
          totalBookings,
          activeBookings,
          totalRevenue: revenue._sum.amount || 0,
        },
        recentBookings,
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function listUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;
    const role = req.query.role as string;

    const where = {
      ...(role ? { role: role as any } : {}),
      ...(search ? {
        OR: [
          { phone: { contains: search } },
          { email: { contains: search } },
          { profile: { fullName: { contains: search, mode: 'insensitive' as const } } },
        ]
      } : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { profile: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      success: true,
      data: { items: users, total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    next(err);
  }
}

export async function listDrivers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status as string;

    const where = status ? { status: status as any } : {};

    const [drivers, total] = await Promise.all([
      prisma.driver.findMany({
        where,
        include: {
          user: { include: { profile: true } },
          documents: true,
          operatingZone: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.driver.count({ where })
    ]);

    res.json({
      success: true,
      data: { items: drivers, total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyDriver(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { driverId } = req.params;
    const { status, notes } = req.body;

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: { user: { include: { profile: true } } }
    });

    if (!driver) throw new NotFoundError('Driver');

    await prisma.driver.update({
      where: { id: driverId },
      data: { status }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user!.userId,
        action: 'DRIVER_VERIFIED',
        entityType: 'Driver',
        entityId: driverId,
        newValue: { status, notes },
      }
    });

    logger.info('Driver status updated by admin', { driverId, status, adminId: req.user!.userId });

    res.json({ success: true, message: `Driver ${status.toLowerCase()}` });
  } catch (err) {
    next(err);
  }
}

export async function listBookings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const where = {
      ...(status ? { status: status as any } : {}),
      ...(search ? {
        OR: [
          { bookingNumber: { contains: search } },
        ]
      } : {}),
    };

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          customer: { include: { profile: true } },
          driver: { include: { user: { include: { profile: true } } } },
          payment: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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

export async function manualAssignDriver(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { bookingId } = req.params;
    const { driverId } = req.body;

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundError('Booking');

    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) throw new NotFoundError('Driver');

    if (driver.status !== 'VERIFIED') {
      throw new ForbiddenError('Driver is not verified');
    }

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { driverId, status: 'DRIVER_ASSIGNED' }
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId,
          status: 'DRIVER_ASSIGNED',
          notes: 'Manually assigned by admin',
          changedBy: req.user!.userId,
        }
      });

      await tx.driver.update({
        where: { id: driverId },
        data: { availability: 'ON_TRIP' }
      });
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user!.userId,
        action: 'BOOKING_ASSIGNED',
        entityType: 'Booking',
        entityId: bookingId,
        newValue: { driverId },
      }
    });

    res.json({ success: true, message: 'Driver assigned successfully' });
  } catch (err) {
    next(err);
  }
}
