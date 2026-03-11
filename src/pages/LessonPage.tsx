// src/pages/LessonsPage.tsx - ENHANCED with Vocabulary & Quiz Management
import { useEffect, useState } from 'react';
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
import { toast } from 'sonner';
import { Plus, Edit, Eye, Clock, CheckCircle, XCircle, AlertCircle, Trash2 } from 'lucide-react';
import type { Lesson, LessonFormData, Module, Vocabulary, VocabularyFormData, Question, QuestionType } from '../types';

export const LessonsPage = () => {
  const { currentUser, isAdmin } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewingLesson, setViewingLesson] = useState<Lesson | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState('details');

  // Lesson form data
  const [formData, setFormData] = useState<LessonFormData>({
    moduleId: '',
    title: '',
    order: 1,
    content: '',
    culturalNote: '',
    xpReward: 50,
    isPublished: false,
  });

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
  }, [currentUser, isAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [modulesData, lessonsData] = await Promise.all([
        moduleService.getAll(),
        isAdmin 
          ? lessonService.getAll()
          : lessonService.getByTeacher(currentUser!.uid)
      ]);
      setModules(modulesData);
      setLessons(lessonsData);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let lessonId: string;

      if (editingLesson) {
        // Update existing lesson
        await lessonService.update(editingLesson.lessonId, formData);
        lessonId = editingLesson.lessonId;
        toast.success('Lesson updated and resubmitted for review');
      } else {
        // Create new lesson
        lessonId = await lessonService.create(formData, currentUser!.uid, isAdmin);
        toast.success(isAdmin ? 'Lesson created successfully' : 'Lesson submitted for review');
      }

      // Save vocabulary items
      if (vocabularyItems.length > 0) {
        // Delete existing vocabulary for this lesson (if editing)
        if (editingLesson) {
          await vocabService.deleteByLesson(lessonId);
        }

        // Create new vocabulary items
        await Promise.all(
          vocabularyItems.map(item => 
            vocabService.create({ ...item, lessonId })
          )
        );
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

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingLesson(null);
    setViewingLesson(null);
    setActiveTab('details');
    setFormData({
      moduleId: '',
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

    const question = { ...questionForm, questionId: `q_${Date.now()}` };

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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {isAdmin ? 'All Lessons' : 'My Lessons'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isAdmin ? 'Manage all lessons in the system' : 'Create and manage your lessons'}
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Lesson
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLesson ? 'Edit Lesson' : 'Create New Lesson'}</DialogTitle>
              <DialogDescription>
                Fill in lesson details, add vocabulary, and create quiz questions
              </DialogDescription>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Lesson Details</TabsTrigger>
                <TabsTrigger value="vocabulary">Vocabulary ({vocabularyItems.length})</TabsTrigger>
                <TabsTrigger value="quiz">Quiz ({questions.length})</TabsTrigger>
              </TabsList>

              {/* LESSON DETAILS TAB */}
              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="module">Module *</Label>
                    <Select value={formData.moduleId} onValueChange={(value) => setFormData({ ...formData, moduleId: value })}>
                      <SelectTrigger>
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
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="title">Lesson Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Basic Greetings"
                      required
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
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="content">Lesson Content *</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={6}
                      placeholder="Enter the main lesson content here..."
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="culturalNote">Cultural Note</Label>
                    <Textarea
                      id="culturalNote"
                      value={formData.culturalNote}
                      onChange={(e) => setFormData({ ...formData, culturalNote: e.target.value })}
                      rows={3}
                      placeholder="Optional: Add cultural context"
                    />
                  </div>

                  {isAdmin && (
                    <div className="col-span-2 flex items-center gap-2">
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
              <TabsContent value="vocabulary" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Add Vocabulary Item</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Ewe Word *</Label>
                        <Input
                          value={vocabForm.eweWord}
                          onChange={(e) => setVocabForm({ ...vocabForm, eweWord: e.target.value })}
                          placeholder="e.g., Akpe"
                        />
                      </div>
                      <div>
                        <Label>English Translation *</Label>
                        <Input
                          value={vocabForm.englishTranslation}
                          onChange={(e) => setVocabForm({ ...vocabForm, englishTranslation: e.target.value })}
                          placeholder="e.g., Thank you"
                        />
                      </div>
                      <div>
                        <Label>Pronunciation</Label>
                        <Input
                          value={vocabForm.pronunciation}
                          onChange={(e) => setVocabForm({ ...vocabForm, pronunciation: e.target.value })}
                          placeholder="e.g., ah-kpeh"
                        />
                      </div>
                      <div>
                        <Label>Part of Speech</Label>
                        <Select value={vocabForm.partOfSpeech} onValueChange={(value) => setVocabForm({ ...vocabForm, partOfSpeech: value })}>
                          <SelectTrigger>
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
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Example Sentence (English)</Label>
                        <Input
                          value={vocabForm.exampleSentenceEnglish}
                          onChange={(e) => setVocabForm({ ...vocabForm, exampleSentenceEnglish: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Difficulty</Label>
                        <Select value={vocabForm.difficulty} onValueChange={(value: any) => setVocabForm({ ...vocabForm, difficulty: value })}>
                          <SelectTrigger>
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
                        <Button type="button" variant="outline" onClick={resetVocabForm}>
                          Cancel
                        </Button>
                      )}
                      <Button type="button" onClick={addVocabularyItem}>
                        {editingVocabIndex !== null ? 'Update' : 'Add'} Vocabulary
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Vocabulary List */}
                <div className="space-y-2">
                  <h4 className="font-medium">Added Vocabulary ({vocabularyItems.length})</h4>
                  {vocabularyItems.length === 0 ? (
                    <p className="text-sm text-gray-500">No vocabulary items yet</p>
                  ) : (
                    vocabularyItems.map((item, index) => (
                      <Card key={index}>
                        <CardContent className="py-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium">{item.eweWord} → {item.englishTranslation}</div>
                              <div className="text-sm text-gray-600">
                                {item.pronunciation && `[${item.pronunciation}]`}
                                {item.partOfSpeech && ` • ${item.partOfSpeech}`}
                                {` • ${item.difficulty}`}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => editVocabularyItem(index)}>
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
              <TabsContent value="quiz" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div>
                    <Label>Quiz Title (optional)</Label>
                    <Input
                      value={quizTitle}
                      onChange={(e) => setQuizTitle(e.target.value)}
                      placeholder="Defaults to: [Lesson Title] Quiz"
                    />
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Add Question</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <Label>Question Text *</Label>
                          <Textarea
                            value={questionForm.questionText}
                            onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                            rows={2}
                            placeholder="e.g., What does 'Akpe' mean in English?"
                          />
                        </div>

                        <div>
                          <Label>Question Type</Label>
                          <Select 
                            value={questionForm.questionType} 
                            onValueChange={(value: QuestionType) => setQuestionForm({ ...questionForm, questionType: value })}
                          >
                            <SelectTrigger>
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

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingLesson ? 'Update Lesson' : 'Create Lesson'}
              </Button>
            </DialogFooter>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingLesson?.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Content</h4>
              <p className="text-sm whitespace-pre-wrap">{viewingLesson?.content}</p>
            </div>

            {viewingLesson?.culturalNote && (
              <div>
                <h4 className="font-semibold mb-2">Cultural Note</h4>
                <p className="text-sm whitespace-pre-wrap">{viewingLesson.culturalNote}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <strong>Status:</strong>
              {viewingLesson && getStatusBadge(viewingLesson.status)}
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setViewingLesson(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};