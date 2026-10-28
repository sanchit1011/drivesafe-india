import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import prisma from '../../config/prisma';
import { AuthRequest } from '../../middleware/auth';
import { Response, NextFunction } from 'express';
import { NotFoundError, ForbiddenError } from '../../utils/errors';

const router = Router();
router.use(authenticate);

// Get profile
router.get('/profile', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ForbiddenError();
    const profile = await prisma.userProfile.findUnique({ where: { userId: req.user.userId } });
    if (!profile) throw new NotFoundError('Profile');
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
});

// Update profile
router.patch('/profile', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ForbiddenError();
    const profile = await prisma.userProfile.update({
      where: { userId: req.user.userId },
      data: req.body,
    });
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
});

// Get vehicles
router.get('/vehicles', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ForbiddenError();
    const vehicles = await prisma.vehicle.findMany({ where: { userId: req.user.userId } });
    res.json({ success: true, data: vehicles });
  } catch (err) { next(err); }
});

// Add vehicle
router.post('/vehicles', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ForbiddenError();
    const vehicle = await prisma.vehicle.create({
      data: { ...req.body, userId: req.user.userId }
    });
    res.status(201).json({ success: true, data: vehicle });
  } catch (err) { next(err); }
});

// Delete vehicle
router.delete('/vehicles/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ForbiddenError();
    const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!vehicle) throw new NotFoundError('Vehicle');
    if (vehicle.userId !== req.user.userId) throw new ForbiddenError();
    await prisma.vehicle.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// Get saved addresses
router.get('/addresses', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ForbiddenError();
    const addresses = await prisma.savedAddress.findMany({ where: { userId: req.user.userId } });
    res.json({ success: true, data: addresses });
  } catch (err) { next(err); }
});

// Add address
router.post('/addresses', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ForbiddenError();
    const address = await prisma.savedAddress.create({
      data: { ...req.body, userId: req.user.userId }
    });
    res.status(201).json({ success: true, data: address });
  } catch (err) { next(err); }
});

// Get notifications
router.get('/notifications', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ForbiddenError();
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    res.json({ success: true, data: notifications });
  } catch (err) { next(err); }
});

// Mark notification read
router.patch('/notifications/:id/read', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ForbiddenError();
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user.userId },
      data: { isRead: true },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
