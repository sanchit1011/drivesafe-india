import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../config/prisma';
import { verifyFirebaseToken } from '../../config/firebase';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { UnauthorizedError, AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { config, isDev } from '../../config';
import { AuthRequest } from '../../middleware/auth';

export async function loginWithFirebase(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { idToken } = req.body;

    // Dev mode: accept dev:+91XXXXXXXXXX token format
    let phone: string;
    let firebaseUid: string;

    if (isDev && idToken?.startsWith('dev:')) {
      phone = idToken.replace('dev:', '');
      firebaseUid = `dev-${phone}`;
      logger.debug('Dev auth bypass for phone:', phone);
    } else {
      const decoded = await verifyFirebaseToken(idToken);
      if (!decoded) throw new UnauthorizedError('Invalid Firebase token');
      phone = decoded.phone_number || '';
      firebaseUid = decoded.uid;
      if (!phone) throw new UnauthorizedError('Phone number not found in token');
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { phone },
      include: { profile: true, driver: true }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          firebaseUid,
          profile: {
            create: { fullName: phone }
          }
        },
        include: { profile: true, driver: true }
      });
      logger.info('New user registered', { phone, userId: user.id });
    } else if (user.firebaseUid !== firebaseUid && !isDev) {
      await prisma.user.update({
        where: { id: user.id },
        data: { firebaseUid }
      });
    }

    const tokenPayload = {
      userId: user.id,
      role: user.role,
      phone: user.phone,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    // Save refresh token session
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        deviceInfo: req.headers['user-agent']?.slice(0, 200),
        ipAddress: req.ip,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }
    });

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          phone: user.phone,
          role: user.role,
          profile: user.profile,
          isDriver: !!user.driver,
          driverStatus: user.driver?.status,
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new UnauthorizedError('Refresh token required');

    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: { user: { include: { profile: true, driver: true } } }
    });

    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const payload = verifyRefreshToken(refreshToken);
    
    const newAccessToken = signAccessToken({
      userId: payload.userId,
      role: payload.role,
      phone: payload.phone,
    });

    res.json({
      success: true,
      data: { accessToken: newAccessToken }
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.session.updateMany({
        where: { refreshToken },
        data: { isRevoked: true }
      });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        profile: true,
        driver: {
          include: {
            documents: true,
          }
        }
      }
    });

    if (!user) throw new UnauthorizedError('User not found');

    res.json({
      success: true,
      data: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        profile: user.profile,
        driver: user.driver,
      }
    });
  } catch (err) {
    next(err);
  }
}
