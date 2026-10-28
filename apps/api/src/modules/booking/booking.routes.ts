import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import {
  estimateFare,
  createBooking,
  getBooking,
  getMyBookings,
  cancelBooking,
} from './booking.controller';
import { validate } from '../../middleware/validate';
import { bookingCreateSchema, fareEstimateSchema } from '@drivesafe/shared';

const router = Router();

router.use(authenticate);

router.post('/estimate', validate(fareEstimateSchema), estimateFare);
router.post('/', requireRole('CUSTOMER'), validate(bookingCreateSchema), createBooking);
router.get('/', getMyBookings);
router.get('/:id', getBooking);
router.post('/:id/cancel', cancelBooking);

export default router;
