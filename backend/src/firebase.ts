import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getMessaging, Messaging } from 'firebase-admin/messaging';
import { env } from '@/config/env';
import { logger } from '@/common/logger/logger';

export let auth: Auth;
export let messaging: Messaging;

export const initFirebase = () => {
  try {
    // If we have explicit credentials in the env, use them
    if (env.FCM_PROJECT_ID && env.FCM_CLIENT_EMAIL && env.FCM_PRIVATE_KEY) {
      initializeApp({
        credential: cert({
          projectId: env.FCM_PROJECT_ID,
          clientEmail: env.FCM_CLIENT_EMAIL,
          // Ensure literal \n characters are parsed into real newlines
          privateKey: env.FCM_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      // Fallback to application default
      initializeApp({
        credential: applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID || '445958363031',
      });
    }
    
    auth = getAuth();
    messaging = getMessaging();
    logger.info('Firebase Admin initialized successfully');
  } catch (error) {
    logger.error({ error }, 'Firebase Admin initialization error');
  }
};
