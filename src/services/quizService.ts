// src/services/quizService.ts

import { 
    collection, 
    doc, 
    getDocs, 
    getDoc,
    addDoc, 
    updateDoc, 
    deleteDoc,
    query,
    where 
  } from 'firebase/firestore';
  import { db } from '../../firebase.config';
  import type { Quiz, Question } from '../types';
  
  const QUIZ_COLLECTION = 'quizzes';
  
  export const quizService = {
    // Get quiz for a lesson
    async getByLesson(lessonId: string): Promise<Quiz | null> {
      const q = query(
        collection(db, QUIZ_COLLECTION),
        where('lessonId', '==', lessonId)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return {
        quizId: doc.id,
        ...doc.data()
      } as Quiz;
    },
  
    // Create quiz
    async create(lessonId: string, title: string, questions: Question[]): Promise<string> {
      const docRef = await addDoc(collection(db, QUIZ_COLLECTION), {
        lessonId,
        title,
        questions,
        passingScore: 70,
      });
      return docRef.id;
    },
  
    // Update quiz
    async update(quizId: string, title: string, questions: Question[]): Promise<void> {
      const docRef = doc(db, QUIZ_COLLECTION, quizId);
      await updateDoc(docRef, { title, questions });
    },
  
    // Delete quiz
    async delete(quizId: string): Promise<void> {
      const docRef = doc(db, QUIZ_COLLECTION, quizId);
      await deleteDoc(docRef);
    }
  };