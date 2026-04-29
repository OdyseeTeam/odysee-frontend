// @if process.env.FLOSS_BUILD!='true'
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID,
  FIREBASE_VAPID_KEY,
} from 'config';
// @endif

let _firebaseConfig: any = {};
let _vapidKey = '';

// @if process.env.FLOSS_BUILD!='true'
_firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
  measurementId: FIREBASE_MEASUREMENT_ID,
};
_vapidKey = FIREBASE_VAPID_KEY;
// @endif

export const firebaseConfig = _firebaseConfig;
export const vapidKey = _vapidKey;
