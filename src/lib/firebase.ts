import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';

/**
 * Strips any stray quotes or whitespace from environment values
 */
const sanitizeEnv = (val: string | undefined): string => {
  if (!val) return '';
  const trimmed = val.trim();
  return trimmed.replace(/^["']|["']$/g, '').trim();
};

// Next.js App Router client-side inlining requires direct property access
export const firebaseConfig = {
  apiKey: sanitizeEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: sanitizeEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: sanitizeEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: sanitizeEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: sanitizeEnv(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: sanitizeEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
  measurementId: sanitizeEnv(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID),
};

// Validate that required Firebase client-side variables are present
export const missingFirebaseVars: string[] = [];
if (!firebaseConfig.apiKey) missingFirebaseVars.push('NEXT_PUBLIC_FIREBASE_API_KEY');
if (!firebaseConfig.authDomain) missingFirebaseVars.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
if (!firebaseConfig.projectId) missingFirebaseVars.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
if (!firebaseConfig.appId) missingFirebaseVars.push('NEXT_PUBLIC_FIREBASE_APP_ID');

export const isFirebaseConfigured = missingFirebaseVars.length === 0;

if (!isFirebaseConfigured && typeof window !== 'undefined') {
  console.warn(
    `[Firebase] Missing required environment variables: ${missingFirebaseVars.join(', ')}. ` +
    `Ensure these are defined in .env.local with the NEXT_PUBLIC_ prefix so Next.js inlines them.`
  );
}

// Fallback dummy key to prevent initialization crash if variables are missing
const safeConfig = {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey || 'AIzaSy_dummy_key_for_initialization',
  projectId: firebaseConfig.projectId || 'patchwork-placeholder',
};

// Safe singleton initialization across Client and Server renders
let app: FirebaseApp;
try {
  app = getApps().length > 0 ? getApp() : initializeApp(safeConfig);
} catch (error) {
  console.error('[Firebase] Error initializing Firebase app:', error);
  app = initializeApp(safeConfig, 'patchwork-fallback-app');
}

// Initialize Auth
export const auth: Auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export default app;
