import * as admin from 'firebase-admin';
import { config, isDev } from './index';
import { logger } from '../utils/logger';

let firebaseApp: admin.app.App | null = null;

export function initFirebase(): void {
  if (firebaseApp) return;

  if (isDev && config.DEV_BYPASS_AUTH) {
    logger.info('🔧 Firebase: dev bypass mode enabled (no real Firebase)');
    return;
  }

  if (!config.FIREBASE_PROJECT_ID) {
    logger.warn('⚠️  Firebase not configured. Set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL');
    return;
  }

  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.FIREBASE_PROJECT_ID,
        privateKey: config.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: config.FIREBASE_CLIENT_EMAIL,
      }),
    });
    logger.info('✅ Firebase Admin initialized');
  } catch (err) {
    logger.error('❌ Firebase Admin initialization failed', err);
  }
}

export async function verifyFirebaseToken(idToken: string): Promise<admin.auth.DecodedIdToken | null> {
  if (isDev && config.DEV_BYPASS_AUTH) {
    // In dev bypass mode, accept any token that starts with 'dev:'
    if (idToken.startsWith('dev:')) {
      const phone = idToken.replace('dev:', '');
      return {
        uid: `dev-uid-${phone}`,
        phone_number: phone,
        iss: 'dev',
        aud: 'dev',
        auth_time: Math.floor(Date.now() / 1000),
        sub: `dev-uid-${phone}`,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        firebase: { sign_in_provider: 'phone', identities: {} },
      } as unknown as admin.auth.DecodedIdToken;
    }
  }

  if (!firebaseApp) {
    logger.error('Firebase not initialized - cannot verify token');
    return null;
  }

  try {
    return await admin.auth().verifyIdToken(idToken);
  } catch (err) {
    logger.error('Firebase token verification failed', err);
    return null;
  }
}
