// src/pages/admin/ModulesPage.tsx

import { useEffect, useState } from 'react';
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
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import type { Module, ModuleFormData } from '../../types';

export const ModulesPage = () => {
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
          <h1 className="text-3xl font-bold">Modules</h1>
          <p className="text-gray-600 mt-1">Manage learning modules</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setFormData({ ...formData, order: modules.length + 1 })}>
              <Plus className="w-4 h-4 mr-2" />
              Create Module
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingModule ? 'Edit Module' : 'Create New Module'}</DialogTitle>
              <DialogDescription>
                {editingModule ? 'Update module details' : 'Add a new learning module'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
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
                  <Label htmlFor="requiredXP">Required XP</Label>
                  <Input
                    id="requiredXP"
                    type="number"
                    min="0"
                    value={formData.requiredXP}
                    onChange={(e) => setFormData({ ...formData, requiredXP: parseInt(e.target.value) })}
                    required
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="duration">Estimated Duration</Label>
                  <Input
                    id="duration"
                    placeholder="e.g., 2 hours"
                    value={formData.estimatedDuration}
                    onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                    required
                  />
                </div>

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
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingModule ? 'Update' : 'Create'} Module
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Modules Grid */}
      {modules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">No modules yet. Create your first one!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <Card key={module.moduleId} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {module.description}
                    </CardDescription>
                  </div>
                  <Badge variant={module.isPublished ? 'default' : 'secondary'}>
                    {module.isPublished ? 'Published' : 'Draft'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Order: {module.order}</p>
                  <p>Required XP: {module.requiredXP}</p>
                  <p>Duration: {module.estimatedDuration}</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(module)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => togglePublished(module)}
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};