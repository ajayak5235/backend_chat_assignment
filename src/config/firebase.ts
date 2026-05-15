import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

export const initializeFirebase = () => {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  }

  return admin.firestore();
};

export const getFirestore = (): FirebaseFirestore.Firestore => {
  return admin.firestore();
};
