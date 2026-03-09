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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {currentUser?.displayName?.split(' ')[0]}!
        </h1>
        <p className="text-gray-600 mt-1">
          {isAdmin ? 'Manage your learning platform' : 'Create and manage your lessons'}
        </p>
      </div>

      {/* Admin Dashboard */}
      {isAdmin && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Modules
                </CardTitle>
                <BookOpen className="w-4 h-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{modules.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Pending Review
                </CardTitle>
                <Clock className="w-4 h-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {pendingLessons.length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Published Modules
                </CardTitle>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {modules.filter(m => m.isPublished).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Lessons */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lessons Awaiting Review</CardTitle>
                  <CardDescription>
                    Lessons submitted by teachers pending your approval
                  </CardDescription>
                </div>
                <Link to="/pending">
                  <Button variant="outline" size="sm">
                    View All
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {pendingLessons.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No lessons pending review
                </p>
              ) : (
                <div className="space-y-3">
                  {pendingLessons.slice(0, 5).map((lesson) => (
                    <div
                      key={lesson.lessonId}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{lesson.title}</h4>
                        <p className="text-sm text-gray-500">
                          By {lesson.createdByName} • {lesson.submittedAt?.toDate().toLocaleDateString()}
                        </p>
                      </div>
                      <Link to="/pending">
                        <Button size="sm">Review</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Modules */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Modules</CardTitle>
                <Link to="/modules">
                  <Button variant="outline" size="sm">
                    Manage Modules
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modules.slice(0, 4).map((module) => (
                  <div
                    key={module.moduleId}
                    className="border rounded-lg p-4 hover:border-purple-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{module.title}</h4>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {module.description}
                        </p>
                      </div>
                      <Badge variant={module.isPublished ? "default" : "secondary"}>
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
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Lessons
                </CardTitle>
                <FileText className="w-4 h-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{myLessons.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Approved
                </CardTitle>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {myLessons.filter(l => l.status === 'approved').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Pending
                </CardTitle>
                <Clock className="w-4 h-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {myLessons.filter(l => l.status === 'pending').length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* My Lessons */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>My Lessons</CardTitle>
                  <CardDescription>Manage all your created lessons</CardDescription>
                </div>
                <Link to="/lessons">
                  <Button>
                    <FileText className="w-4 h-4 mr-2" />
                    Create New Lesson
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {myLessons.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No lessons yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Get started by creating your first lesson
                  </p>
                  <Link to="/lessons">
                    <Button>Create Lesson</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {myLessons.slice(0, 5).map((lesson) => (
                    <div
                      key={lesson.lessonId}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{lesson.title}</h4>
                        <p className="text-sm text-gray-500">
                          Submitted {lesson.submittedAt?.toDate().toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant={
                          lesson.status === 'approved' ? 'default' :
                          lesson.status === 'rejected' ? 'destructive' :
                          'secondary'
                        }
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