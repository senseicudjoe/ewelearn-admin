// src/pages/admin/ModulesPage.tsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { moduleService } from '../../services/moduleServices';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Eye, EyeOff, FileText } from 'lucide-react';
import type { Module, ModuleFormData } from '../../types';

export const ModulesPage = () => {
  const navigate = useNavigate();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);


  const [formData, setFormData] = useState<ModuleFormData>({
    title: '',
    description: '',
    order: 1,
    requiredXP: 0,
    estimatedDuration: '',
    isPublished: false,
  });

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    setLoading(true);
    try {
      const data = await moduleService.getAll();
      setModules(data);
    } catch (error) {
      toast.error('Failed to load modules');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingModule) {
        await moduleService.update(editingModule.moduleId, formData);
        toast.success('Module updated successfully');
      } else {
        await moduleService.create(formData);
        toast.success('Module created successfully');
      }
      
      loadModules();
      closeDialog();
    } catch (error) {
      console.error('Failed to save module', error);
      toast.error('Failed to save module');
    }
  };

  const handleEdit = (module: Module) => {
    setEditingModule(module);
    setFormData({
      title: module.title,
      description: module.description,
      order: module.order,
      requiredXP: module.requiredXP,
      estimatedDuration: module.estimatedDuration,
      isPublished: module.isPublished,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (moduleId: string) => {
    try {
      await moduleService.delete(moduleId);
      toast.success('Module deleted successfully');
      loadModules();
    } catch (error) {
      toast.error('Failed to delete module');
    }
  };

  const togglePublished = async (module: Module) => {
    try {
      await moduleService.togglePublished(module.moduleId, !module.isPublished);
      toast.success(`Module ${!module.isPublished ? 'published' : 'unpublished'}`);
      loadModules();
    } catch (error) {
      toast.error('Failed to update module status');
    }
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingModule(null);
    setFormData({
      title: '',
      description: '',
      order: modules.length + 1,
      requiredXP: 0,
      estimatedDuration: '',
      isPublished: false,
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[280px] gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-purple-600" />
        <p className="text-sm font-medium text-slate-500">Loading modules...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Modules</h1>
          <p className="mt-1 text-slate-500">Manage learning modules</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setFormData({ ...formData, order: modules.length + 1 })} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Module
            </Button>
          </DialogTrigger>
          
          <DialogContent className="w-[96vw] max-w-4xl sm:max-w-4xl max-h-[88vh] overflow-hidden p-0">
            <div className="border-b border-slate-200/80 bg-white px-6 py-5">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold tracking-tight text-slate-900">
                  {editingModule ? 'Edit Module' : 'Create New Module'}
                </DialogTitle>
                <DialogDescription className="text-slate-500">
                  {editingModule ? 'Update module details' : 'Add a new learning module'}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="max-h-[calc(88vh-76px)] overflow-y-auto px-6 py-5">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="col-span-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="border-slate-200 focus-visible:ring-purple-500"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={5}
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
                  <Label htmlFor="requiredXP">Required XP</Label>
                  <Input
                    id="requiredXP"
                    type="number"
                    min="0"
                    value={formData.requiredXP}
                    onChange={(e) => setFormData({ ...formData, requiredXP: parseInt(e.target.value) })}
                    required
                    className="border-slate-200 focus-visible:ring-purple-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="duration">Estimated Duration</Label>
                  <Input
                    id="duration"
                    placeholder="e.g., 2 hours"
                    value={formData.estimatedDuration}
                    onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                    required
                    className="border-slate-200 focus-visible:ring-purple-500"
                  />
                </div>

                <div className="md:col-span-2 flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/60 px-4 py-3">
                  <input
                    type="checkbox"
                    id="isPublished"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="isPublished" className="!mb-0">Publish immediately</Label>
                </div>
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={closeDialog} className="border-slate-200 text-slate-700 hover:bg-slate-50">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                    {editingModule ? 'Update' : 'Create'} Module
                  </Button>
                </DialogFooter>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Modules Grid */}
      {modules.length === 0 ? (
        <Card className="border-slate-200/80 shadow-sm">
          <CardContent className="py-14 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
            <p className="text-slate-500">No modules yet. Create your first one.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((module) => (
            <Card
              key={module.moduleId}
              className="border-slate-200/80 shadow-sm transition-all hover:shadow-md hover:border-slate-300/80 h-full flex flex-col"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold text-slate-900">{module.title}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2 text-slate-500 min-h-[2.5rem]">
                      {module.description}
                    </CardDescription>
                  </div>
                  <Badge variant={module.isPublished ? 'default' : 'secondary'} className="shrink-0">
                    {module.isPublished ? 'Published' : 'Draft'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 flex-1 flex flex-col">
                <div className="rounded-lg bg-slate-50/80 px-3 py-2 text-sm text-slate-600 space-y-1">
                  <p>Order: {module.order}</p>
                  <p>Required XP: {module.requiredXP}</p>
                  <p>Duration: {module.estimatedDuration}</p>
                </div>

                <div className="space-y-2 mt-auto">
                  {/*
                    Primary action: drill into this module's lessons.
                    This replaces the old global /lessons list as the entry point.
                  */}
                  <Button
                    size="sm"
                    onClick={() => navigate(`/modules/${module.moduleId}/lessons`)}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Lessons
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(module)}
                      className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => togglePublished(module)}
                      className="border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                      {module.isPublished ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Module?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{module.title}" and all associated lessons.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel variant="outline" size="sm">Cancel</AlertDialogCancel>
                          <AlertDialogAction variant="destructive" size="sm" className="flex-1" onClick={() => handleDelete(module.moduleId)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};