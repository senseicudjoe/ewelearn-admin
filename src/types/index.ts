// src/types/index.ts

import { Timestamp } from 'firebase/firestore';

// ═══════════════════════════════════════════════════════════════════
// AUTH TYPES
// ═══════════════════════════════════════════════════════════════════

export type UserRole = 'admin' | 'teacher';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Timestamp;
}

// ═══════════════════════════════════════════════════════════════════
// MODULE TYPES
// ═══════════════════════════════════════════════════════════════════

export interface Module {
  moduleId: string;
  title: string;
  description: string;
  order: number;
  iconUrl: string;
  requiredXP: number;
  estimatedDuration: string;
  isPublished: boolean;
}

export interface ModuleFormData {
  title: string;
  description: string;
  order: number;
  requiredXP: number;
  estimatedDuration: string;
  isPublished: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// LESSON TYPES (Extended with approval workflow)
// ═══════════════════════════════════════════════════════════════════

export type LessonStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export interface Lesson {
  lessonId: string;
  moduleId: string;
  title: string;
  order: number;
  content: string;
  culturalNote: string;
  xpReward: number;
  isPublished: boolean;
  
  // Approval workflow fields
  createdBy: string;           // userId of creator (teacher/admin)
  createdByName?: string;       // display name (populated on fetch)
  status: LessonStatus;
  feedback: string;             // admin comments
  submittedAt?: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;          // admin userId who approved/rejected
}

export interface LessonFormData {
  moduleId: string;
  title: string;
  order: number;
  content: string;
  culturalNote: string;
  xpReward: number;
  isPublished: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// VOCABULARY TYPES
// ═══════════════════════════════════════════════════════════════════

export interface Vocabulary {
  vocabId: string;
  lessonId: string;
  eweWord: string;
  englishTranslation: string;
  pronunciation: string;
  audioUrl: string;
  exampleSentenceEwe: string;
  exampleSentenceEnglish: string;
  exampleAudioUrl: string;
  partOfSpeech: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface VocabularyFormData {
  lessonId: string;
  eweWord: string;
  englishTranslation: string;
  pronunciation: string;
  exampleSentenceEwe: string;
  exampleSentenceEnglish: string;
  partOfSpeech: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// ═══════════════════════════════════════════════════════════════════
// QUIZ TYPES
// ═══════════════════════════════════════════════════════════════════

export type QuestionType = 'multiple_choice' | 'translation' | 'fill_blank' | 'listening';

export interface Question {
  questionId: string;
  questionText: string;
  questionType: QuestionType;
  correctAnswer: string;
  options: string[];       // for multiple choice
  audioUrl: string;        // for listening questions
  points: number;
}

export interface Quiz {
  quizId: string;
  lessonId: string;
  title: string;
  questions: Question[];
  passingScore: number;
}