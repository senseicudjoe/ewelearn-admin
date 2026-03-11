// src/pages/LessonsPage.tsx

import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { lessonService } from '../services/lessonService';
import { moduleService } from '../services/moduleServices';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import { toast } from 'sonner';
import { Plus, Edit, Eye, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { Lesson, LessonFormData, Module } from '../types';

export const LessonsPage = () => {
  const { currentUser, isAdmin } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewingLesson, setViewingLesson] = useState<Lesson | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const [formData, setFormData] = useState<LessonFormData>({
    moduleId: '',
    title: '',
    order: 1,
    content: '',
    culturalNote: '',
    xpReward: 50,
    isPublished: false,
  });

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
      if (editingLesson) {
        await lessonService.update(editingLesson.lessonId, formData);
        toast.success('Lesson updated and resubmitted for review');
      } else {
        await lessonService.create(formData, currentUser!.uid, isAdmin);
        toast.success(isAdmin ? 'Lesson created and published' : 'Lesson submitted for review');
      }
      
      loadData();
      closeDialog();
    } catch (error) {
      toast.error('Failed to save lesson');
    }
  };

  const handleEdit = (lesson: Lesson) => {
    // Teachers can only edit pending/rejected lessons
    if (!isAdmin && lesson.status === 'approved') {
      toast.error('Cannot edit approved lessons');
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
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingLesson(null);
    setViewingLesson(null);
    setFormData({
      moduleId: '',
      title: '',
      order: 1,
      content: '',
      culturalNote: '',
      xpReward: 50,
      isPublished: false,
    });
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
          
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLesson ? 'Edit Lesson' : 'Create New Lesson'}</DialogTitle>
              <DialogDescription>
                {editingLesson 
                  ? 'Update lesson details and resubmit for review' 
                  : isAdmin
                    ? 'Create and publish a new lesson'
                    : 'Create a new lesson and submit for admin approval'
                }
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                    placeholder="Optional: Add cultural context or interesting facts"
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

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingLesson ? 'Update & Resubmit' : isAdmin ? 'Create & Publish' : 'Submit for Review'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lessons List */}
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
                      <strong>Feedback from admin:</strong> {lesson.feedback}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* View Lesson Dialog */}
      <Dialog open={!!viewingLesson} onOpenChange={() => setViewingLesson(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingLesson?.title}</DialogTitle>
            <DialogDescription>
              Order: {viewingLesson?.order} • XP Reward: {viewingLesson?.xpReward}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Lesson Content</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {viewingLesson?.content}
              </p>
            </div>

            {viewingLesson?.culturalNote && (
              <div>
                <h4 className="font-semibold mb-2">Cultural Note</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {viewingLesson.culturalNote}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <strong>Status:</strong>
              {viewingLesson && getStatusBadge(viewingLesson.status)}
            </div>

            {viewingLesson?.feedback && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Admin Feedback:</strong> {viewingLesson.feedback}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setViewingLesson(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};