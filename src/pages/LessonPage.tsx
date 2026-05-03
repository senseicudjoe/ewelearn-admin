// src/pages/LessonsPage.tsx - ENHANCED with Vocabulary & Quiz Management
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { lessonService } from '../services/lessonService';
import { moduleService } from '../services/moduleServices';
import { vocabService } from '../services/vocabService';
import { quizService } from '../services/quizService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Edit, Eye, Clock, CheckCircle, XCircle, AlertCircle, Trash2, ArrowLeft } from 'lucide-react';
import type { Lesson, LessonFormData, Module, Vocabulary, VocabularyFormData, Question, QuestionType } from '../types';

export const LessonsPage = () => {
  const { currentUser, isAdmin } = useAuth();
  // When this page is mounted under /modules/:moduleId/lessons, scopedModuleId
  // is set and the page shows only that module's lessons. On the teacher's
  // flat /lessons route it's undefined and the page falls back to the
  // all-mine / all-lessons behavior.
  const { moduleId: scopedModuleId } = useParams<{ moduleId: string }>();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewingLesson, setViewingLesson] = useState<Lesson | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null);

  // Lesson form data. moduleId is seeded from the URL when we're scoped to a
  // specific module, so "Create Lesson" opens with the right module already
  // selected — even on first render before the user has interacted.
  const [formData, setFormData] = useState<LessonFormData>(() => ({
    moduleId: scopedModuleId ?? '',
    title: '',
    order: 1,
    content: '',
    culturalNote: '',
    xpReward: 50,
    isPublished: false,
  }));

  // Vocabulary state
  const [vocabularyItems, setVocabularyItems] = useState<Vocabulary[]>([]);
  const [vocabForm, setVocabForm] = useState<VocabularyFormData>({
    lessonId: '',
    eweWord: '',
    englishTranslation: '',
    pronunciation: '',
    exampleSentenceEwe: '',
    exampleSentenceEnglish: '',
    partOfSpeech: '',
    difficulty: 'easy',
  });
  const [editingVocabIndex, setEditingVocabIndex] = useState<number | null>(null);

  // Quiz state
  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionForm, setQuestionForm] = useState<Question>({
    questionId: '',
    questionText: '',
    questionType: 'multiple_choice',
    correctAnswer: '',
    options: ['', '', '', ''],
    audioUrl: '',
    points: 10,
  });
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, isAdmin, scopedModuleId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // When scoped to a module, use the server-side filter. For teachers on
      // /lessons we keep the existing getByTeacher call; admins should only
      // ever land here via /modules/:moduleId/lessons.
      const lessonsPromise = scopedModuleId
        ? lessonService.getByModule(scopedModuleId)
        : isAdmin
          ? lessonService.getAll()
          : lessonService.getByTeacher(currentUser!.uid);

      const [modulesData, lessonsData] = await Promise.all([
        moduleService.getAll(),
        lessonsPromise,
      ]);
      setModules(modulesData);
      setLessons(lessonsData);
    } catch (error) {
      // Log the real error so missing Firestore indexes (common for the
      // getByModule / getByStatus composite queries) are visible in the
      // console with the index-creation URL Firestore provides.
      console.error('Failed to load lessons data', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // The module we're scoped to (or undefined on the flat teacher view).
  const scopedModule = useMemo(
    () => (scopedModuleId ? modules.find(m => m.moduleId === scopedModuleId) : undefined),
    [scopedModuleId, modules]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let lessonId: string;

      if (editingLesson) {
        // Update existing lesson
        await lessonService.update(editingLesson.lessonId, {
          ...formData,
          ...(isAdmin
            ? {}
            : {
                // Teacher edits count as a resubmission, so move it back
                // into the admin review queue and clear prior rejection metadata.
                status: 'pending',
                feedback: '',
                reviewedAt: null,
                reviewedBy: null,
              }),
        });
        lessonId = editingLesson.lessonId;
        toast.success('Lesson updated and resubmitted for review');
      } else {
        // Create new lesson
        lessonId = await lessonService.create(formData, currentUser!.uid, isAdmin);
        toast.success(isAdmin ? 'Lesson created successfully' : 'Lesson submitted for review');
      }

      // Save vocabulary items.
      // Uses a diff-based saveAll: existing docs keep their Firestore IDs,
      // only genuinely new rows (temp_* ids) get fresh IDs, and rows the
      // user removed from the list get deleted. Empty list + editing lesson
      // still needs to clear Firestore, so call saveAll unconditionally on edit.
      if (editingLesson || vocabularyItems.length > 0) {
        const saved = await vocabService.saveAll(lessonId, vocabularyItems);
        // Sync local state so any follow-up save (without closing the dialog)
        // sees the real IDs instead of temp_* again.
        setVocabularyItems(saved);
      }

      // Save quiz
      if (questions.length > 0) {
        const existingQuiz = editingLesson 
          ? await quizService.getByLesson(lessonId)
          : null;

        if (existingQuiz) {
          await quizService.update(existingQuiz.quizId, quizTitle || formData.title + ' Quiz', questions);
        } else {
          await quizService.create(lessonId, quizTitle || formData.title + ' Quiz', questions);
        }
      }
      
      loadData();
      closeDialog();
    } catch (error) {
      toast.error('Failed to save lesson');
    }
  };

  const handleEdit = async (lesson: Lesson) => {
    if (!isAdmin && lesson.status === 'approved') {
      toast.error('Approved lessons cannot be edited');
      return;
    }

    setEditingLesson(lesson);
    setFormData({
      moduleId: lesson.moduleId,
      title: lesson.title,
      order: lesson.order,
      content: lesson.content,
      culturalNote: lesson.culturalNote,
      xpReward: lesson.xpReward,
      isPublished: lesson.isPublished,
    });

    // Load existing vocabulary
    const vocab = await vocabService.getByLesson(lesson.lessonId);
    setVocabularyItems(vocab);

    // Load existing quiz
    const quiz = await quizService.getByLesson(lesson.lessonId);
    if (quiz) {
      setQuizTitle(quiz.title);
      setQuestions(quiz.questions);
    }

    setDialogOpen(true);
  };

  const handleDeleteLesson = async (lesson: Lesson) => {
    if (!isAdmin) return;

    setDeletingLessonId(lesson.lessonId);
    try {
      const existingQuiz = await quizService.getByLesson(lesson.lessonId);
      if (existingQuiz) {
        await quizService.delete(existingQuiz.quizId);
      }

      await vocabService.deleteByLesson(lesson.lessonId);
      await lessonService.delete(lesson.lessonId);

      toast.success('Lesson deleted');

      if (viewingLesson?.lessonId === lesson.lessonId) setViewingLesson(null);
      if (editingLesson?.lessonId === lesson.lessonId) closeDialog();

      await loadData();
    } catch (error) {
      console.error('Failed to delete lesson', error);
      toast.error('Failed to delete lesson');
    } finally {
      setDeletingLessonId(null);
    }
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingLesson(null);
    setViewingLesson(null);
    setActiveTab('details');
    setFormData({
      // When scoped to a module, new lessons default to that module so the
      // user doesn't have to pick it (and can't accidentally file it elsewhere).
      moduleId: scopedModuleId ?? '',
      title: '',
      order: 1,
      content: '',
      culturalNote: '',
      xpReward: 50,
      isPublished: false,
    });
    setVocabularyItems([]);
    setQuestions([]);
    setQuizTitle('');
    resetVocabForm();
    resetQuestionForm();
  };

  // ═══ Vocabulary Functions ═══════════════════════════════════════════════

  const resetVocabForm = () => {
    setVocabForm({
      lessonId: '',
      eweWord: '',
      englishTranslation: '',
      pronunciation: '',
      exampleSentenceEwe: '',
      exampleSentenceEnglish: '',
      partOfSpeech: '',
      difficulty: 'easy',
    });
    setEditingVocabIndex(null);
  };

  const addVocabularyItem = () => {
    if (!vocabForm.eweWord || !vocabForm.englishTranslation) {
      toast.error('Ewe word and English translation are required');
      return;
    }

    if (editingVocabIndex !== null) {
      // Update existing
      const updated = [...vocabularyItems];
      updated[editingVocabIndex] = { ...vocabForm, vocabId: updated[editingVocabIndex].vocabId || `temp_${Date.now()}` } as Vocabulary;
      setVocabularyItems(updated);
    } else {
      // Add new
      setVocabularyItems([...vocabularyItems, { ...vocabForm, vocabId: `temp_${Date.now()}` } as Vocabulary]);
    }

    resetVocabForm();
  };

  const editVocabularyItem = (index: number) => {
    setVocabForm(vocabularyItems[index]);
    setEditingVocabIndex(index);
  };

  const deleteVocabularyItem = (index: number) => {
    setVocabularyItems(vocabularyItems.filter((_, i) => i !== index));
  };

  // ═══ Quiz Functions ══════════════════════════════════════════════════════

  const resetQuestionForm = () => {
    setQuestionForm({
      questionId: '',
      questionText: '',
      questionType: 'multiple_choice',
      correctAnswer: '',
      options: ['', '', '', ''],
      audioUrl: '',
      points: 10,
    });
    setEditingQuestionIndex(null);
  };

  const addQuestion = () => {
    if (!questionForm.questionText || !questionForm.correctAnswer) {
      toast.error('Question text and correct answer are required');
      return;
    }

    // Preserve questionId when editing so downstream references
    // (analytics, progress, per-question metadata) stay linked.
    // Only mint a new id for genuinely new questions.
    const existingId =
      editingQuestionIndex !== null
        ? questions[editingQuestionIndex].questionId
        : '';
    const question = {
      ...questionForm,
      questionId: existingId || `q_${Date.now()}`,
    };

    if (editingQuestionIndex !== null) {
      const updated = [...questions];
      updated[editingQuestionIndex] = question;
      setQuestions(updated);
    } else {
      setQuestions([...questions, question]);
    }

    resetQuestionForm();
  };

  const editQuestion = (index: number) => {
    setQuestionForm(questions[index]);
    setEditingQuestionIndex(index);
  };

  const deleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[280px] gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-purple-600" />
        <p className="text-sm font-medium text-slate-500">Loading lessons...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          {scopedModuleId && (
            // Back link only shows on the module-scoped view so admins can
            // get back to the module index. Teachers on /lessons don't need it.
            <Link
              to="/modules"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Modules
            </Link>
          )}
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {scopedModuleId
              ? (scopedModule?.title ?? 'Module') + ' — Lessons'
              : isAdmin
                ? 'All Lessons'
                : 'My Lessons'}
          </h1>
          <p className="mt-1 text-slate-500">
            {scopedModuleId
              ? 'Lessons belonging to this module'
              : isAdmin
                ? 'Manage all lessons in the system'
                : 'Create and manage your lessons'}
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Lesson
            </Button>
          </DialogTrigger>
          
          <DialogContent className="flex max-h-[92vh] w-[96vw] max-w-6xl flex-col overflow-hidden p-0 sm:max-w-6xl">
            <div className="border-b border-slate-200/80 bg-white px-6 py-5">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold tracking-tight text-slate-900">
                  {editingLesson ? 'Edit Lesson' : 'Create New Lesson'}
                </DialogTitle>
                <DialogDescription className="text-slate-500">
                  Fill in lesson details, add vocabulary, and create quiz questions.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 rounded-xl bg-slate-100/80 p-1">
                  <TabsTrigger value="details">Lesson Details</TabsTrigger>
                  <TabsTrigger value="vocabulary">Vocabulary ({vocabularyItems.length})</TabsTrigger>
                  <TabsTrigger value="quiz">Quiz ({questions.length})</TabsTrigger>
                </TabsList>

                {/* LESSON DETAILS TAB */}
                <TabsContent value="details" className="space-y-4 mt-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="col-span-2">
                      <Label htmlFor="module">Module *</Label>
                      <Select
                        value={formData.moduleId}
                        onValueChange={(value) => setFormData({ ...formData, moduleId: value })}
                        // When viewing a single module's lessons, lock the module
                        // so new/edited lessons can't silently be reassigned elsewhere.
                        disabled={!!scopedModuleId}
                      >
                        <SelectTrigger className="border-slate-200 focus:ring-purple-500">
                          <SelectValue placeholder="Select a module" />
                        </SelectTrigger>
                        <SelectContent>
                          {modules.map((module) => (
                            <SelectItem key={module.moduleId} value={module.moduleId}>
                              {module.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {scopedModuleId && (
                        <p className="mt-1 text-xs text-slate-500">
                          This lesson will live under the current module.
                        </p>
                      )}
                    </div>

                  <div className="col-span-2">
                    <Label htmlFor="title">Lesson Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Basic Greetings"
                      required
                      className="border-slate-200 focus-visible:ring-purple-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="order">Order</Label>
                    <Input
                      id="order"
                      type="number"
                      min="1"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                      required
                      className="border-slate-200 focus-visible:ring-purple-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="xpReward">XP Reward</Label>
                    <Input
                      id="xpReward"
                      type="number"
                      min="0"
                      value={formData.xpReward}
                      onChange={(e) => setFormData({ ...formData, xpReward: parseInt(e.target.value) })}
                      required
                      className="border-slate-200 focus-visible:ring-purple-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="content">Lesson Content *</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={10}
                      placeholder="Enter the main lesson content here..."
                      required
                      className="border-slate-200 focus-visible:ring-purple-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="culturalNote">Cultural Note</Label>
                    <Textarea
                      id="culturalNote"
                      value={formData.culturalNote}
                      onChange={(e) => setFormData({ ...formData, culturalNote: e.target.value })}
                      rows={5}
                      placeholder="Optional: Add cultural context"
                      className="border-slate-200 focus-visible:ring-purple-500"
                    />
                  </div>

                  {isAdmin && (
                    <div className="col-span-2 flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/60 px-4 py-3">
                      <input
                        type="checkbox"
                        id="isPublished"
                        checked={formData.isPublished}
                        onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="isPublished" className="!mb-0">Publish immediately</Label>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* VOCABULARY TAB */}
              <TabsContent value="vocabulary" className="space-y-4 mt-5">
                <Card className="border-slate-200/80 shadow-sm">
                  <CardHeader className="border-b border-slate-100">
                    <CardTitle className="text-base">Add Vocabulary Item</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Ewe Word *</Label>
                        <Input
                          value={vocabForm.eweWord}
                          onChange={(e) => setVocabForm({ ...vocabForm, eweWord: e.target.value })}
                          placeholder="e.g., Akpe"
                          className="border-slate-200 focus-visible:ring-purple-500"
                        />
                      </div>
                      <div>
                        <Label>English Translation *</Label>
                        <Input
                          value={vocabForm.englishTranslation}
                          onChange={(e) => setVocabForm({ ...vocabForm, englishTranslation: e.target.value })}
                          placeholder="e.g., Thank you"
                          className="border-slate-200 focus-visible:ring-purple-500"
                        />
                      </div>
                      <div>
                        <Label>Pronunciation</Label>
                        <Input
                          value={vocabForm.pronunciation}
                          onChange={(e) => setVocabForm({ ...vocabForm, pronunciation: e.target.value })}
                          placeholder="e.g., ah-kpeh"
                          className="border-slate-200 focus-visible:ring-purple-500"
                        />
                      </div>
                      <div>
                        <Label>Part of Speech</Label>
                        <Select value={vocabForm.partOfSpeech} onValueChange={(value) => setVocabForm({ ...vocabForm, partOfSpeech: value })}>
                          <SelectTrigger className="border-slate-200 focus:ring-purple-500">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="noun">Noun</SelectItem>
                            <SelectItem value="verb">Verb</SelectItem>
                            <SelectItem value="adjective">Adjective</SelectItem>
                            <SelectItem value="adverb">Adverb</SelectItem>
                            <SelectItem value="phrase">Phrase</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label>Example Sentence (Ewe)</Label>
                        <Input
                          value={vocabForm.exampleSentenceEwe}
                          onChange={(e) => setVocabForm({ ...vocabForm, exampleSentenceEwe: e.target.value })}
                          className="border-slate-200 focus-visible:ring-purple-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Example Sentence (English)</Label>
                        <Input
                          value={vocabForm.exampleSentenceEnglish}
                          onChange={(e) => setVocabForm({ ...vocabForm, exampleSentenceEnglish: e.target.value })}
                          className="border-slate-200 focus-visible:ring-purple-500"
                        />
                      </div>
                      <div>
                        <Label>Difficulty</Label>
                        <Select value={vocabForm.difficulty} onValueChange={(value: any) => setVocabForm({ ...vocabForm, difficulty: value })}>
                          <SelectTrigger className="border-slate-200 focus:ring-purple-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {editingVocabIndex !== null && (
                        <Button type="button" variant="outline" onClick={resetVocabForm} className="border-slate-200 text-slate-700 hover:bg-slate-50">
                          Cancel
                        </Button>
                      )}
                      <Button type="button" onClick={addVocabularyItem} className="bg-purple-600 hover:bg-purple-700">
                        {editingVocabIndex !== null ? 'Update' : 'Add'} Vocabulary
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Vocabulary List */}
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-900">Added Vocabulary ({vocabularyItems.length})</h4>
                  {vocabularyItems.length === 0 ? (
                    <p className="text-sm text-slate-500">No vocabulary items yet</p>
                  ) : (
                    vocabularyItems.map((item, index) => (
                      <Card key={index} className="border-slate-200/80 shadow-sm">
                        <CardContent className="py-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium">{item.eweWord} → {item.englishTranslation}</div>
                              <div className="text-sm text-slate-500">
                                {item.pronunciation && `[${item.pronunciation}]`}
                                {item.partOfSpeech && ` • ${item.partOfSpeech}`}
                                {` • ${item.difficulty}`}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => editVocabularyItem(index)} className="border-slate-200 text-slate-700 hover:bg-slate-50">
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteVocabularyItem(index)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

                {/* QUIZ TAB */}
                <TabsContent value="quiz" className="space-y-4 mt-5">
                  <div className="space-y-4">
                    <div>
                      <Label>Quiz Title (optional)</Label>
                      <Input
                        value={quizTitle}
                        onChange={(e) => setQuizTitle(e.target.value)}
                        placeholder="Defaults to: [Lesson Title] Quiz"
                        className="border-slate-200 focus-visible:ring-purple-500"
                      />
                    </div>

                  <Card className="border-slate-200/80 shadow-sm">
                    <CardHeader className="border-b border-slate-100">
                      <CardTitle className="text-base">Add Question</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <Label>Question Text *</Label>
                          <Textarea
                            value={questionForm.questionText}
                            onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                            rows={3}
                            placeholder="e.g., What does 'Akpe' mean in English?"
                            className="border-slate-200 focus-visible:ring-purple-500"
                          />
                        </div>

                        <div>
                          <Label>Question Type</Label>
                          <Select 
                            value={questionForm.questionType} 
                            onValueChange={(value: QuestionType) => setQuestionForm({ ...questionForm, questionType: value })}
                          >
                            <SelectTrigger className="border-slate-200 focus:ring-purple-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                              <SelectItem value="translation">Translation</SelectItem>
                              <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Points</Label>
                          <Input
                            type="number"
                            min="1"
                            value={questionForm.points}
                            onChange={(e) => setQuestionForm({ ...questionForm, points: parseInt(e.target.value) })}
                          />
                        </div>

                        {questionForm.questionType === 'multiple_choice' && (
                          <>
                            <div className="col-span-2">
                              <Label>Options (4 required)</Label>
                              {[0, 1, 2, 3].map((i) => (
                                <Input
                                  key={i}
                                  className="mt-2"
                                  value={questionForm.options[i]}
                                  onChange={(e) => {
                                    const newOptions = [...questionForm.options];
                                    newOptions[i] = e.target.value;
                                    setQuestionForm({ ...questionForm, options: newOptions });
                                  }}
                                  placeholder={`Option ${i + 1}`}
                                />
                              ))}
                            </div>
                          </>
                        )}

                        <div className="col-span-2">
                          <Label>Correct Answer *</Label>
                          <Input
                            value={questionForm.correctAnswer}
                            onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                            placeholder="Enter the correct answer"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {editingQuestionIndex !== null && (
                          <Button type="button" variant="outline" onClick={resetQuestionForm}>
                            Cancel
                          </Button>
                        )}
                        <Button type="button" onClick={addQuestion}>
                          {editingQuestionIndex !== null ? 'Update' : 'Add'} Question
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Questions List */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Quiz Questions ({questions.length})</h4>
                    {questions.length === 0 ? (
                      <p className="text-sm text-gray-500">No questions yet</p>
                    ) : (
                      questions.map((q, index) => (
                        <Card key={index}>
                          <CardContent className="py-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium">Q{index + 1}: {q.questionText}</div>
                                <div className="text-sm text-gray-600">
                                  Type: {q.questionType} • Answer: {q.correctAnswer} • {q.points} pts
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => editQuestion(index)}>
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => deleteQuestion(index)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="border-t border-slate-200/80 bg-white px-6 py-4">
              <DialogFooter className="m-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeDialog}
                  className="border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmit} className="bg-purple-600 hover:bg-purple-700">
                  {editingLesson ? 'Update Lesson' : 'Create Lesson'}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lessons List (unchanged) */}
      {lessons.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">No lessons yet. Create your first one!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {lessons.map((lesson) => (
            <Card key={lesson.lessonId}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{lesson.title}</CardTitle>
                      {getStatusBadge(lesson.status)}
                    </div>
                    <CardDescription className="mt-2">
                      Module: {modules.find(m => m.moduleId === lesson.moduleId)?.title || 'Unknown'}
                      {isAdmin && ` • Created by ${lesson.createdByName}`}
                      {lesson.submittedAt && ` • Submitted ${lesson.submittedAt.toDate().toLocaleDateString()}`}
                    </CardDescription>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setViewingLesson(lesson)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>

                    {(isAdmin || lesson.status !== 'approved') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(lesson)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    )}

                    {isAdmin && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={deletingLessonId === lesson.lessonId}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete lesson?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{lesson.title}" and all associated vocabulary and quiz data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel variant="outline" size="sm">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleDeleteLesson(lesson)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </CardHeader>

              {lesson.status === 'rejected' && lesson.feedback && (
                <CardContent>
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Feedback:</strong> {lesson.feedback}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* View Lesson Dialog (unchanged) */}
      <Dialog open={!!viewingLesson} onOpenChange={() => setViewingLesson(null)}>
        <DialogContent className="w-[96vw] max-w-4xl sm:max-w-4xl max-h-[88vh] overflow-hidden p-0">
          <div className="border-b border-slate-200/80 bg-white px-6 py-5">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold tracking-tight text-slate-900">
                {viewingLesson?.title}
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="max-h-[calc(88vh-76px)] overflow-y-auto px-6 py-5 space-y-5">
            <div>
              <h4 className="font-semibold mb-2 text-slate-900">Content</h4>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4">
                <p className="text-sm whitespace-pre-wrap text-slate-700">{viewingLesson?.content}</p>
              </div>
            </div>

            {viewingLesson?.culturalNote && (
              <div>
                <h4 className="font-semibold mb-2 text-slate-900">Cultural Note</h4>
                <div className="rounded-xl border border-purple-200/60 bg-purple-50/80 p-4">
                  <p className="text-sm whitespace-pre-wrap text-slate-700">{viewingLesson?.culturalNote}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">Status:</span>
              {viewingLesson && getStatusBadge(viewingLesson.status)}
            </div>

            <DialogFooter>
              <Button onClick={() => setViewingLesson(null)} className="bg-purple-600 hover:bg-purple-700">
                Close
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};