// src/pages/admin/PendingReviewPage.tsx

import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { lessonService } from '../../services/lessonService';
import { moduleService } from '../../services/moduleServices';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Separator } from '../../components/ui/separator';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, User, Calendar } from 'lucide-react';
import type { Lesson, Module } from '../../types';

export const PendingReviewPage = () => {
  const { currentUser } = useAuth();
  const [pendingLessons, setPendingLessons] = useState<Lesson[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lessonsData, modulesData] = await Promise.all([
        lessonService.getByStatus('pending'),
        moduleService.getAll()
      ]);
      setPendingLessons(lessonsData);
      setModules(modulesData);
    } catch (error) {
      toast.error('Failed to load pending lessons');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (lesson: Lesson) => {
    setActionLoading(true);
    try {
      await lessonService.approve(lesson.lessonId, currentUser!.uid);
      toast.success('Lesson Approved');
      loadData();
      setSelectedLesson(null);
    } catch (error) {
      toast.error('Failed to approve lesson');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (lesson: Lesson) => {
    if (!feedback.trim()) {
      toast.error('Feedback Required');
      return;
    }

    setActionLoading(true);
    try {
      await lessonService.reject(lesson.lessonId, feedback, currentUser!.uid);
      toast.success('Lesson Rejected');
      loadData();
      setSelectedLesson(null);
      setFeedback('');
    } catch (error) {
      toast.error('Failed to reject lesson');
    } finally {
      setActionLoading(false);
    }
  };

  const openReviewDialog = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setFeedback('');
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
      <div>
        <h1 className="text-3xl font-bold">Pending Review</h1>
        <p className="text-gray-600 mt-1">
          Review and approve lessons submitted by teachers
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Awaiting Review
            </CardTitle>
            <Clock className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {pendingLessons.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Lessons */}
      {pendingLessons.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              All Caught Up!
            </h3>
            <p className="text-gray-600">
              No lessons waiting for review
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingLessons.map((lesson) => {
            const module = modules.find(m => m.moduleId === lesson.moduleId);
            return (
              <Card key={lesson.lessonId} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">{lesson.title}</CardTitle>
                        <Badge variant="secondary">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      </div>
                      <CardDescription className="mt-2 space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>Submitted by {lesson.createdByName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{lesson.submittedAt?.toDate().toLocaleDateString()}</span>
                        </div>
                        {module && (
                          <div className="text-sm">
                            Module: <strong>{module.title}</strong>
                          </div>
                        )}
                      </CardDescription>
                    </div>

                    <Button onClick={() => openReviewDialog(lesson)}>
                      Review
                    </Button>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Content Preview:</p>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {lesson.content}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Order: {lesson.order}</span>
                      <span>XP Reward: {lesson.xpReward}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={!!selectedLesson} onOpenChange={() => setSelectedLesson(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Lesson: {selectedLesson?.title}</DialogTitle>
            <DialogDescription>
              Submitted by {selectedLesson?.createdByName} on{' '}
              {selectedLesson?.submittedAt?.toDate().toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Lesson Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Module:</span>{' '}
                {modules.find(m => m.moduleId === selectedLesson?.moduleId)?.title}
              </div>
              <div>
                <span className="font-medium">Order:</span> {selectedLesson?.order}
              </div>
              <div>
                <span className="font-medium">XP Reward:</span> {selectedLesson?.xpReward}
              </div>
              <div>
                <span className="font-medium">Publish Status:</span>{' '}
                {selectedLesson?.isPublished ? 'Yes' : 'No'}
              </div>
            </div>

            <Separator />

            {/* Content */}
            <div>
              <h4 className="font-semibold mb-2">Lesson Content</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap">
                  {selectedLesson?.content}
                </p>
              </div>
            </div>

            {/* Cultural Note */}
            {selectedLesson?.culturalNote && (
              <div>
                <h4 className="font-semibold mb-2">Cultural Note</h4>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedLesson.culturalNote}
                  </p>
                </div>
              </div>
            )}

            <Separator />

            {/* Feedback (for rejection) */}
            <div>
              <Label htmlFor="feedback">Feedback (required for rejection)</Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                placeholder="Provide constructive feedback for the teacher..."
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedLesson(null)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedLesson && handleReject(selectedLesson)}
              disabled={actionLoading || !feedback.trim()}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={() => selectedLesson && handleApprove(selectedLesson)}
              disabled={actionLoading}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve & Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};