// src/services/authService.ts

import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../firebase.config';
import type { UserRole } from '../types';

/**
 * Creates a new teacher or admin account.
 * Only admins should be able to call this in the UI.
 */
export const createUser = async (
  email: string,
  password: string,
  displayName: string,
  role: UserRole
): Promise<void> => {
  // Create auth user
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const { uid } = userCredential.user;

  // Create Firestore document with role
  await setDoc(doc(db, 'users', uid), {
    email,
    displayName,
    role,
    createdAt: Timestamp.now(),
  });
};

/**
 * Note: For production, you'd want to create users via Firebase Admin SDK
 * on the backend, or use Firebase Functions. This direct client-side approach
 * works for a student project but has limitations:
 * - The newly created user is automatically signed in
 * - You'd need to sign back in as admin afterwards
 *
 * Better approach: Cloud Function triggered by admin action
 */