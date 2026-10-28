import { initializeApp, getApps } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Only init if we have required config
const hasFirebaseConfig = firebaseConfig.apiKey && firebaseConfig.projectId;

let auth: ReturnType<typeof getAuth> | null = null;

if (hasFirebaseConfig && getApps().length === 0) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
}

export { auth };

export const DEV_MODE = import.meta.env.VITE_DEV_AUTH === 'true' || !hasFirebaseConfig;

// In dev mode: skip Firebase, use dev token format
export async function sendPhoneOtp(
  phone: string,
  recaptchaContainerId: string
): Promise<ConfirmationResult | { devMode: true; phone: string }> {
  if (DEV_MODE) {
    console.log('[DEV] OTP sent to', phone, '— use 123456');
    return { devMode: true, phone };
  }

  if (!auth) throw new Error('Firebase not configured');

  const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
    size: 'invisible',
  });

  return signInWithPhoneNumber(auth, phone, recaptchaVerifier);
}

export async function verifyOtp(
  confirmation: ConfirmationResult | { devMode: true; phone: string },
  otp: string,
  devOtp = '123456'
): Promise<string> {
  if ('devMode' in confirmation) {
    if (otp !== devOtp) throw new Error('Invalid OTP. Use ' + devOtp + ' in dev mode.');
    return `dev:${confirmation.phone}`;
  }

  const result = await confirmation.confirm(otp);
  return result.user.getIdToken();
}
