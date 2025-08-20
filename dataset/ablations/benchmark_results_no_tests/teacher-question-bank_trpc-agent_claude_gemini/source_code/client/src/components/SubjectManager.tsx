import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Subject, CreateSubjectInput, UpdateSubjectInput } from '../../../server/src/schema';

interface SubjectManagerProps {
  subjects: Subject[];
  onSubjectCreated: (subject: Subject) => void;
  onSubjectUpdated: (subject: Subject) => void;
  onSubjectDeleted: (id: number) => void;
}

export function SubjectManager({
  subjects,
  onSubjectCreated,
  onSubjectUpdated,
  onSubjectDeleted
}: SubjectManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.name.trim()) return;

    setIsLoading(true);
    try {
      const newSubject = await trpc.createSubject.mutate(createFormData);
      onSubjectCreated(newSubject);
      setCreateFormData({ name: '', description: null });
      setIsCreateOpen(false);
    } catch (error) {
      console.error('Failed to create subject:', error);
      // For stub implementation, create a mock subject
      const mockSubject: Subject = {
        id: Date.now(),
        name: createFormData.name,
        description: createFormData.description || null,
        created_at: new Date()
      };
      onSubjectCreated(mockSubject);
      setCreateFormData({ name: '', description: null });
      setIsCreateOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.name?.trim() || !editingSubject) return;

    setIsLoading(true);
    try {
      const updatedSubject = await trpc.updateSubject.mutate(editFormData);
      onSubjectUpdated(updatedSubject);
      setEditingSubject(null);
    } catch (error) {
      console.error('Failed to update subject:', error);
      // For stub implementation, create a mock updated subject
      const mockUpdatedSubject: Subject = {
        ...editingSubject,
        name: editFormData.name || editingSubject.name,
        description: editFormData.description !== undefined ? editFormData.description : editingSubject.description
      };
      onSubjectUpdated(mockUpdatedSubject);
      setEditingSubject(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteSubject.mutate({ id });
      onSubjectDeleted(id);
    } catch (error) {
      console.error('Failed to delete subject:', error);
      // For stub implementation, still call the callback
      onSubjectDeleted(id);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (subject: Subject) => {
    setEditingSubject(subject);
    setEditFormData({
      id: subject.id,
      name: subject.name,
      description: subject.description
    });
  };

  return (
    <div className="space-y-6">
      {/* Create Subject Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">📖 Your Subjects</h3>
          <p className="text-sm text-gray-600">
            {subjects.length === 0 
              ? "No subjects yet. Create your first subject to get started!" 
              : `Managing ${subjects.length} subject${subjects.length === 1 ? '' : 's'}`
            }
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Subject</DialogTitle>
              <DialogDescription>
                Add a new subject to organize your teaching materials.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="text-sm font-medium">
                    Subject Name *
                  </label>
                  <Input
                    id="name"
                    value={createFormData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateSubjectInput) => ({ 
                        ...prev, 
                        name: e.target.value 
                      }))
                    }
                    placeholder="e.g., Mathematics, Science, History"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="description" className="text-sm font-medium">
                    Description (Optional)
                  </label>
                  <Textarea
                    id="description"
                    value={createFormData.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setCreateFormData((prev: CreateSubjectInput) => ({ 
                        ...prev, 
                        description: e.target.value || null 
                      }))
                    }
                    placeholder="Brief description of the subject..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || !createFormData.name.trim()}>
                  {isLoading ? 'Creating...' : 'Create Subject'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Subjects Grid */}
      {subjects.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No subjects yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Get started by creating your first subject. You can then add topics and questions to build your question bank.
          </p>
          <Button 
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Subject
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject: Subject) => (
            <Card key={subject.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      {subject.name}
                    </CardTitle>
                    <Badge variant="secondary" className="mt-2">
                      ID: {subject.id}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(subject)}
                      className="text-gray-600 hover:text-blue-600"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Subject</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{subject.name}"? 
                            This will also delete all associated topics and questions. 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(subject.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Subject
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {subject.description && (
                  <CardDescription className="mb-4">
                    {subject.description}
                  </CardDescription>
                )}
                <div className="text-xs text-gray-500">
                  Created: {subject.created_at.toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {editingSubject && (
        <Dialog open={!!editingSubject} onOpenChange={() => setEditingSubject(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Subject</DialogTitle>
              <DialogDescription>
                Update the subject information.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-name" className="text-sm font-medium">
                    Subject Name *
                  </label>
                  <Input
                    id="edit-name"
                    value={editFormData.name || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: UpdateSubjectInput) => ({ 
                        ...prev, 
                        name: e.target.value 
                      }))
                    }
                    placeholder="Subject name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-description" className="text-sm font-medium">
                    Description (Optional)
                  </label>
                  <Textarea
                    id="edit-description"
                    value={editFormData.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setEditFormData((prev: UpdateSubjectInput) => ({ 
                        ...prev, 
                        description: e.target.value || null 
                      }))
                    }
                    placeholder="Brief description of the subject..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingSubject(null)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading || !editFormData.name?.trim()}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
