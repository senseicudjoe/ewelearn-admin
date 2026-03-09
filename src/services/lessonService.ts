// src/services/lessonService.ts

import { 
    collection, 
    doc, 
    getDocs, 
    getDoc,
    addDoc, 
    updateDoc, 
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp 
  } from 'firebase/firestore';
  import { db } from '../../firebase.config';
  import type { Lesson, LessonFormData, LessonStatus } from '../types';
  
  const LESSONS_COLLECTION = 'lessons';
  const USERS_COLLECTION = 'users';
  
  export const lessonService = {
    // Get all lessons (admin view)
    async getAll(): Promise<Lesson[]> {
      const q = query(collection(db, LESSONS_COLLECTION), orderBy('order'));
      const snapshot = await getDocs(q);
      return await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const createdByName = await this._getUserName(data.createdBy);
          return {
            lessonId: docSnap.id,
            createdByName,
            ...data
          } as Lesson;
        })
      );
    },
  
    // Get lessons by status
    async getByStatus(status: LessonStatus): Promise<Lesson[]> {
      const q = query(
        collection(db, LESSONS_COLLECTION),
        where('status', '==', status),
        orderBy('submittedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const createdByName = await this._getUserName(data.createdBy);
          return {
            lessonId: docSnap.id,
            createdByName,
            ...data
          } as Lesson;
        })
      );
    },
  
    // Get lessons by teacher (teacher view)
    async getByTeacher(teacherId: string): Promise<Lesson[]> {
      const q = query(
        collection(db, LESSONS_COLLECTION),
        where('createdBy', '==', teacherId),
        orderBy('submittedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => ({
        lessonId: docSnap.id,
        ...docSnap.data()
      } as Lesson));
    },
  
    // Get lessons by module
    async getByModule(moduleId: string): Promise<Lesson[]> {
      const q = query(
        collection(db, LESSONS_COLLECTION),
        where('moduleId', '==', moduleId),
        orderBy('order')
      );
      const snapshot = await getDocs(q);
      return await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const createdByName = await this._getUserName(data.createdBy);
          return {
            lessonId: docSnap.id,
            createdByName,
            ...data
          } as Lesson;
        })
      );
    },
  
    // Get single lesson
    async getById(lessonId: string): Promise<Lesson | null> {
      const docRef = doc(db, LESSONS_COLLECTION, lessonId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) return null;
      
      const data = docSnap.data();
      const createdByName = await this._getUserName(data.createdBy);
  
      return {
        lessonId: docSnap.id,
        createdByName,
        ...data
      } as Lesson;
    },
  
    // Create lesson (teacher submits for approval, admin can publish directly)
    async create(data: LessonFormData, createdBy: string, isAdmin: boolean): Promise<string> {
      const lessonData = {
        ...data,
        createdBy,
        status: isAdmin ? 'approved' : 'pending' as LessonStatus,
        feedback: '',
        submittedAt: Timestamp.now(),
      };
  
      const docRef = await addDoc(collection(db, LESSONS_COLLECTION), lessonData);
      return docRef.id;
    },
  
    // Update lesson (teachers can only update pending/rejected, admins can update any)
    async update(lessonId: string, data: Partial<LessonFormData>): Promise<void> {
      const docRef = doc(db, LESSONS_COLLECTION, lessonId);
      await updateDoc(docRef, {
        ...data,
        submittedAt: Timestamp.now() // Update submission timestamp
      });
    },
  
    // Approve lesson (admin only)
    async approve(lessonId: string, reviewedBy: string): Promise<void> {
      const docRef = doc(db, LESSONS_COLLECTION, lessonId);
      await updateDoc(docRef, {
        status: 'approved',
        reviewedAt: Timestamp.now(),
        reviewedBy,
        isPublished: true, // Auto-publish on approval
      });
    },
  
    // Reject lesson (admin only)
    async reject(lessonId: string, feedback: string, reviewedBy: string): Promise<void> {
      const docRef = doc(db, LESSONS_COLLECTION, lessonId);
      await updateDoc(docRef, {
        status: 'rejected',
        feedback,
        reviewedAt: Timestamp.now(),
        reviewedBy,
      });
    },
  
    // Delete lesson
    async delete(lessonId: string): Promise<void> {
      const docRef = doc(db, LESSONS_COLLECTION, lessonId);
      await deleteDoc(docRef);
    },
  
    // Helper: Get user's display name
    async _getUserName(userId: string): Promise<string> {
      try {
        const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
        return userDoc.exists() ? userDoc.data().displayName : 'Unknown';
      } catch {
        return 'Unknown';
      }
    }
  };