import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth';
import {
  getDashboardStats,
  listUsers,
  listDrivers,
  verifyDriver,
  listBookings,
  manualAssignDriver,
} from './admin.controller';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/users', listUsers);
router.get('/drivers', listDrivers);
router.patch('/drivers/:driverId/verify', verifyDriver);
router.get('/bookings', listBookings);
router.post('/bookings/:bookingId/assign', manualAssignDriver);

export default router;
