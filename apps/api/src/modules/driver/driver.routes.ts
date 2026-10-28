import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import {
  getDriverProfile,
  updateAvailability,
  updateLocation,
  getDriverBookings,
  acceptBooking,
  updateBookingStatus,
  getEarnings,
} from './driver.controller';

const router = Router();

router.use(authenticate, requireRole('DRIVER', 'ADMIN'));

router.get('/profile', getDriverProfile);
router.patch('/availability', updateAvailability);
router.post('/location', updateLocation);
router.get('/bookings', getDriverBookings);
router.post('/bookings/:bookingId/accept', acceptBooking);
router.patch('/bookings/:bookingId/status', updateBookingStatus);
router.get('/earnings', getEarnings);

export default router;
