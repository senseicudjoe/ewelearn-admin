// src/services/moduleService.ts

import { 
    collection, 
    doc, 
    getDocs, 
    getDoc,
    addDoc, 
    updateDoc, 
    deleteDoc,
    query,
    orderBy,
    Timestamp 
  } from 'firebase/firestore';
  import { db } from '../../firebase.config';
  import type { Module, ModuleFormData } from '../types';
  
  const MODULES_COLLECTION = 'modules';
  
  export const moduleService = {
    // Get all modules
    async getAll(): Promise<Module[]> {
      const q = query(collection(db, MODULES_COLLECTION), orderBy('order'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        moduleId: doc.id,
        ...doc.data()
      } as Module));
    },
  
    // Get single module
    async getById(moduleId: string): Promise<Module | null> {
      const docRef = doc(db, MODULES_COLLECTION, moduleId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) return null;
      
      return {
        moduleId: docSnap.id,
        ...docSnap.data()
      } as Module;
    },
  
    // Create module
    async create(data: ModuleFormData): Promise<string> {
      const docRef = await addDoc(collection(db, MODULES_COLLECTION), {
        ...data,
        iconUrl: '', // Can be updated later with file upload
      });
      return docRef.id;
    },
  
    // Update module
    async update(moduleId: string, data: Partial<ModuleFormData>): Promise<void> {
      const docRef = doc(db, MODULES_COLLECTION, moduleId);
      await updateDoc(docRef, data);
    },
  
    // Delete module
    async delete(moduleId: string): Promise<void> {
      const docRef = doc(db, MODULES_COLLECTION, moduleId);
      await deleteDoc(docRef);
    },
  
    // Toggle published status
    async togglePublished(moduleId: string, isPublished: boolean): Promise<void> {
      const docRef = doc(db, MODULES_COLLECTION, moduleId);
      await updateDoc(docRef, { isPublished });
    }
  };