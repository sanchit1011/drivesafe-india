import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import prisma from '../../config/prisma';
import { AuthRequest } from '../../middleware/auth';
import { Response, NextFunction, Request } from 'express';
import { NotFoundError, ForbiddenError, AppError } from '../../utils/errors';
import { config, isDev } from '../../config';
import { logger } from '../../utils/logger';
import crypto from 'crypto';

const router = Router();

// Create Razorpay order
router.post('/orders', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ForbiddenError();

    const { bookingId } = req.body;
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundError('Booking');
    if (booking.customerId !== req.user.userId) throw new ForbiddenError();

    const amount = booking.estimatedFare;

    // Dev mode: create mock order
    if (isDev || !config.RAZORPAY_KEY_ID) {
      const mockOrderId = `mock_order_${Date.now()}`;
      
      await prisma.payment.upsert({
        where: { bookingId },
        update: {
          razorpayOrderId: mockOrderId,
          amount,
          status: 'INITIATED',
          isMockPayment: true,
        },
        create: {
          bookingId,
          razorpayOrderId: mockOrderId,
          amount,
          status: 'INITIATED',
          isMockPayment: true,
        }
      });

      return res.json({
        success: true,
        data: {
          orderId: mockOrderId,
          amount: Math.round(amount * 100),
          currency: 'INR',
          isMock: true,
          key: 'mock_key',
          bookingNumber: booking.bookingNumber,
        }
      });
    }

    // Real Razorpay (requires credentials)
    res.json({
      success: true,
      data: {
        message: 'Configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to enable real payments',
        isMock: true,
      }
    });
  } catch (err) {
    next(err);
  }
});

// Verify payment (dev mock)
router.post('/verify', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ForbiddenError();

    const { bookingId, paymentId, orderId, isMock } = req.body;

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundError('Booking');
    if (booking.customerId !== req.user.userId) throw new ForbiddenError();

    if (isMock || isDev) {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { bookingId },
          data: {
            status: 'SUCCESS',
            razorpayPaymentId: paymentId || `mock_pay_${Date.now()}`,
            paidAt: new Date(),
          }
        });

        await tx.booking.update({
          where: { id: bookingId },
          data: {
            status: 'PAYMENT_COMPLETED',
            finalFare: booking.estimatedFare,
            totalAmount: booking.estimatedFare,
          }
        });

        await tx.bookingStatusHistory.create({
          data: {
            bookingId,
            status: 'PAYMENT_COMPLETED',
            changedBy: req.user!.userId,
            notes: isMock ? 'Mock payment' : 'Payment verified',
          }
        });
      });

      logger.info('Payment processed', { bookingId, isMock });

      return res.json({ success: true, message: 'Payment successful' });
    }

    throw new AppError('Real payment verification not configured', 501);
  } catch (err) {
    next(err);
  }
});

// Get payment for booking
router.get('/booking/:bookingId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ForbiddenError();

    const payment = await prisma.payment.findUnique({
      where: { bookingId: req.params.bookingId },
      include: { refunds: true },
    });

    if (!payment) throw new NotFoundError('Payment');

    res.json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
});

export default router;
