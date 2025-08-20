import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import { Plus, Edit, Trash2, BookOpen, Users, HelpCircle } from 'lucide-react';
import type { Subject, CreateSubjectInput, UpdateSubjectInput } from '../../../server/src/schema';

interface SubjectManagerProps {
  subjects: Subject[];
  setSubjects: (subjects: Subject[] | ((prev: Subject[]) => Subject[])) => void;
  getTopicCount: (subjectId: number) => number;
  getQuestionCount: (subjectId: number) => number;
}

export function SubjectManager({ subjects, setSubjects, getTopicCount, getQuestionCount }: SubjectManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [createFormData, setCreateFormData] = useState<CreateSubjectInput>({
    name: '',
    description: null
  });

  const [editFormData, setEditFormData] = useState<UpdateSubjectInput>({
    id: 0,
    name: '',
    description: null
  });

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.name.trim()) return;

    setIsLoading(true);
    try {
      const newSubject = await trpc.createSubject.mutate(createFormData);
      setSubjects((prev: Subject[]) => [...prev, newSubject]);
      setCreateFormData({ name: '', description: null });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create subject:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.name?.trim()) return;

    setIsLoading(true);
    try {
      const updatedSubject = await trpc.updateSubject.mutate(editFormData);
      setSubjects((prev: Subject[]) => 
        prev.map(subject => subject.id === updatedSubject.id ? updatedSubject : subject)
      );
      setEditingSubject(null);
    } catch (error) {
      console.error('Failed to update subject:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (subject: Subject) => {
    setEditFormData({
      id: subject.id,
      name: subject.name,
      description: subject.description
    });
    setEditingSubject(subject);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            📚 Subject Management
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Create and organize subjects for your question bank
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Subject</DialogTitle>
              <DialogDescription>
                Add a new subject to organize your questions and topics.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Subject Name *</label>
                <Input
                  placeholder="e.g., Mathematics, Science, History"
                  value={createFormData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateSubjectInput) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
                <Textarea
                  placeholder="Brief description of what this subject covers..."
                  value={createFormData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setCreateFormData((prev: CreateSubjectInput) => ({
                      ...prev,
                      description: e.target.value || null
                    }))
                  }
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || !createFormData.name.trim()}>
                  {isLoading ? 'Creating...' : 'Create Subject'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Subjects Grid */}
      {subjects.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                <BookOpen className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">No subjects yet</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Start by creating your first subject to organize your questions
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create First Subject
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject: Subject) => (
            <Card key={subject.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      {subject.name}
                    </CardTitle>
                    {subject.description && (
                      <CardDescription className="line-clamp-2">
                        {subject.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog(subject)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Subject</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{subject.name}"? This will also delete all related topics and questions. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                            Delete Subject
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-green-600" />
                    <span className="text-gray-600">Topics:</span>
                    <span className="font-semibold">{getTopicCount(subject.id)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <HelpCircle className="h-4 w-4 text-purple-600" />
                    <span className="text-gray-600">Questions:</span>
                    <span className="font-semibold">{getQuestionCount(subject.id)}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-500">
                    Created: {subject.created_at.toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingSubject} onOpenChange={() => setEditingSubject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogDescription>
              Update the subject information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSubject} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Subject Name *</label>
              <Input
                placeholder="e.g., Mathematics, Science, History"
                value={editFormData.name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditFormData((prev: UpdateSubjectInput) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
              <Textarea
                placeholder="Brief description of what this subject covers..."
                value={editFormData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setEditFormData((prev: UpdateSubjectInput) => ({
                    ...prev,
                    description: e.target.value || null
                  }))
                }
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setEditingSubject(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !editFormData.name?.trim()}>
                {isLoading ? 'Updating...' : 'Update Subject'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
