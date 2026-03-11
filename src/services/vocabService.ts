// src/services/vocabService.ts

import { 
    collection, 
    doc, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc,
    query,
    where 
  } from 'firebase/firestore';
  import { db } from '../../firebase.config';
  import type { Vocabulary, VocabularyFormData } from '../types';
  
  const VOCAB_COLLECTION = 'vocabulary';
  
  export const vocabService = {
    // Get all vocabulary for a lesson
    async getByLesson(lessonId: string): Promise<Vocabulary[]> {
      const q = query(
        collection(db, VOCAB_COLLECTION),
        where('lessonId', '==', lessonId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        vocabId: doc.id,
        ...doc.data()
      } as Vocabulary));
    },
  
    // Create vocabulary item
    async create(data: VocabularyFormData): Promise<string> {
      const docRef = await addDoc(collection(db, VOCAB_COLLECTION), {
        ...data,
        audioUrl: '', // Will be filled when audio is uploaded
        exampleAudioUrl: '',
      });
      return docRef.id;
    },
  
    // Update vocabulary item
    async update(vocabId: string, data: Partial<VocabularyFormData>): Promise<void> {
      const docRef = doc(db, VOCAB_COLLECTION, vocabId);
      await updateDoc(docRef, data);
    },
  
    // Delete vocabulary item
    async delete(vocabId: string): Promise<void> {
      const docRef = doc(db, VOCAB_COLLECTION, vocabId);
      await deleteDoc(docRef);
    },
  
    // Batch delete all vocabulary for a lesson
    async deleteByLesson(lessonId: string): Promise<void> {
      const items = await this.getByLesson(lessonId);
      await Promise.all(items.map(item => this.delete(item.vocabId)));
    }
  };