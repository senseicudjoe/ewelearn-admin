// src/pages/admin/DashboardPage.tsx

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {moduleService} from '../../services/moduleServices';
import { lessonService } from '../../services/lessonService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  BookOpen, 
  FileText, 
  Clock, 
  CheckCircle,
  XCircle,
  ArrowRight
} from 'lucide-react';
import type { Module, Lesson } from '../../types';

export const DashboardPage = () => {
  const { currentUser, isAdmin } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [pendingLessons, setPendingLessons] = useState<Lesson[]>([]);
  const [myLessons, setMyLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [currentUser]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const [modulesData, pendingData] = await Promise.all([
          moduleService.getAll(),
          lessonService.getByStatus('pending')
        ]);
        setModules(modulesData);
        setPendingLessons(pendingData);
      } else {
        // Teacher view
        const lessons = await lessonService.getByTeacher(currentUser!.uid);
        setMyLessons(lessons);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[280px] gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-purple-600" />
        <p className="text-sm font-medium text-slate-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="border-b border-slate-200/80 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Welcome back, {currentUser?.displayName?.split(' ')[0]}
        </h1>
        <p className="mt-1 text-slate-500">
          {isAdmin ? 'Manage your learning platform' : 'Create and manage your lessons'}
        </p>
      </div>

      {/* Admin Dashboard */}
      {isAdmin && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card className="border-slate-200/80 shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Total Modules</CardTitle>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                  <BookOpen className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-slate-900">{modules.length}</div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Pending Review</CardTitle>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                  <Clock className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-amber-700">{pendingLessons.length}</div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Published Modules</CardTitle>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-emerald-700">{modules.filter(m => m.isPublished).length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Lessons */}
          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-900">Lessons Awaiting Review</CardTitle>
                  <CardDescription className="text-slate-500">Submitted by teachers, pending your approval</CardDescription>
                </div>
                <Link to="/pending">
                  <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 hover:bg-slate-50">
                    View All
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {pendingLessons.length === 0 ? (
                <p className="text-slate-500 text-center py-10 text-sm">No lessons pending review</p>
              ) : (
                <div className="space-y-2">
                  {pendingLessons.slice(0, 5).map((lesson) => (
                    <div
                      key={lesson.lessonId}
                      className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900 truncate">{lesson.title}</h4>
                        <p className="text-sm text-slate-500 mt-0.5">
                          By {lesson.createdByName} · {lesson.submittedAt?.toDate().toLocaleDateString()}
                        </p>
                      </div>
                      <Link to="/pending">
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 ml-3">Review</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Modules */}
          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-900">Recent Modules</CardTitle>
                <Link to="/modules">
                  <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 hover:bg-slate-50">
                    Manage Modules
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modules.slice(0, 4).map((module) => (
                  <div
                    key={module.moduleId}
                    className="rounded-xl border border-slate-200/80 p-4 transition-all hover:border-purple-300/80 hover:bg-purple-50/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900">{module.title}</h4>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{module.description}</p>
                      </div>
                      <Badge variant={module.isPublished ? "default" : "secondary"} className="shrink-0">
                        {module.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Teacher Dashboard */}
      {!isAdmin && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card className="border-slate-200/80 shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Total Lessons</CardTitle>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <FileText className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-slate-900">{myLessons.length}</div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Approved</CardTitle>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-emerald-700">{myLessons.filter(l => l.status === 'approved').length}</div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Pending</CardTitle>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                  <Clock className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-amber-700">{myLessons.filter(l => l.status === 'pending').length}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-900">My Lessons</CardTitle>
                  <CardDescription className="text-slate-500">Manage all your created lessons</CardDescription>
                </div>
                <Link to="/lessons">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <FileText className="w-4 h-4 mr-2" />
                    Create New Lesson
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {myLessons.length === 0 ? (
                <div className="text-center py-14 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No lessons yet</h3>
                  <p className="text-slate-500 mb-5 text-sm">Get started by creating your first lesson</p>
                  <Link to="/lessons">
                    <Button className="bg-purple-600 hover:bg-purple-700">Create Lesson</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {myLessons.slice(0, 5).map((lesson) => (
                    <div
                      key={lesson.lessonId}
                      className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900 truncate">{lesson.title}</h4>
                        <p className="text-sm text-slate-500 mt-0.5">Submitted {lesson.submittedAt?.toDate().toLocaleDateString()}</p>
                      </div>
                      <Badge
                        variant={
                          lesson.status === 'approved' ? 'default' :
                          lesson.status === 'rejected' ? 'destructive' :
                          'secondary'
                        }
                        className="shrink-0 ml-3"
                      >
                        {lesson.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};