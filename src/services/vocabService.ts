// src/services/vocabService.ts

import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    writeBatch
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
    },

    /**
     * Diff-based save for a lesson's vocabulary.
     *
     * Preserves Firestore document IDs for vocab items that already existed,
     * so they don't get torn down and recreated on every edit.
     *
     * Rules applied per submitted item:
     *   - vocabId is missing OR starts with "temp_"  → create (addDoc generates a real id)
     *   - vocabId matches an existing Firestore doc → update in place
     *   - existing Firestore docs whose id is NOT in the submitted list → delete
     *
     * Writes are performed in a single writeBatch so the whole save is atomic.
     */
    async saveAll(
      lessonId: string,
      items: (Vocabulary | (VocabularyFormData & { vocabId?: string }))[]
    ): Promise<Vocabulary[]> {
      const colRef = collection(db, VOCAB_COLLECTION);

      // 1. Load current docs for this lesson so we know what to delete.
      const existing = await this.getByLesson(lessonId);
      const existingIds = new Set(existing.map(v => v.vocabId));

      const batch = writeBatch(db);
      const submittedIds = new Set<string>();
      const result: Vocabulary[] = [];

      // Build a Firestore payload from an item, excluding the in-memory-only vocabId.
      const toPayload = (item: Vocabulary | (VocabularyFormData & { vocabId?: string })) => {
        const v = item as Vocabulary;
        return {
          lessonId,
          eweWord: v.eweWord,
          englishTranslation: v.englishTranslation,
          pronunciation: v.pronunciation,
          exampleSentenceEwe: v.exampleSentenceEwe,
          exampleSentenceEnglish: v.exampleSentenceEnglish,
          partOfSpeech: v.partOfSpeech,
          difficulty: v.difficulty,
          audioUrl: v.audioUrl ?? '',
          exampleAudioUrl: v.exampleAudioUrl ?? '',
        };
      };

      // 2. Upsert each submitted item.
      for (const item of items) {
        const currentId = (item as Vocabulary).vocabId;
        const isNew = !currentId || currentId.startsWith('temp_');
        const payload = toPayload(item);

        if (isNew || !existingIds.has(currentId)) {
          // New row, or client-side id that no longer exists in Firestore
          // (e.g. deleted in another tab). Pre-allocate an id so we can use
          // writeBatch.set instead of addDoc.
          const newRef = doc(colRef);
          batch.set(newRef, payload);
          submittedIds.add(newRef.id);
          result.push({ ...payload, vocabId: newRef.id });
        } else {
          batch.update(doc(colRef, currentId), payload);
          submittedIds.add(currentId);
          result.push({ ...payload, vocabId: currentId });
        }
      }

      // 3. Delete any existing docs the user removed from the list.
      for (const id of existingIds) {
        if (!submittedIds.has(id)) {
          batch.delete(doc(colRef, id));
        }
      }

      await batch.commit();
      return result;
    }
  };