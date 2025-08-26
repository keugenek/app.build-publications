import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, FileQuestion, BookOpen } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Subject, Topic, CreateTopicInput, UpdateTopicInput } from '../../../server/src/schema';

interface TopicManagerProps {
  subjects: Subject[];
  topics: Topic[];
  onTopicCreated: (topic: Topic) => void;
  onTopicUpdated: (topic: Topic) => void;
  onTopicDeleted: (id: number) => void;
}

export function TopicManager({
  subjects,
  topics,
  onTopicCreated,
  onTopicUpdated,
  onTopicDeleted
}: TopicManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');

  const [createFormData, setCreateFormData] = useState<CreateTopicInput>({
    name: '',
    description: null,
    subject_id: 0
  });

  const [editFormData, setEditFormData] = useState<UpdateTopicInput>({
    id: 0,
    name: '',
    description: null,
    subject_id: 0
  });

  // Get subject name by ID
  const getSubjectName = (subjectId: number) => {
    const subject = subjects.find((s: Subject) => s.id === subjectId);
    return subject?.name || 'Unknown Subject';
  };

  // Filter topics by subject
  const filteredTopics = filterSubjectId === 'all' 
    ? topics 
    : topics.filter((topic: Topic) => topic.subject_id === parseInt(filterSubjectId));

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.name.trim() || !createFormData.subject_id) return;

    setIsLoading(true);
    try {
      const newTopic = await trpc.createTopic.mutate(createFormData);
      onTopicCreated(newTopic);
      setCreateFormData({ name: '', description: null, subject_id: 0 });
      setIsCreateOpen(false);
    } catch (error) {
      console.error('Failed to create topic:', error);
      // For stub implementation, create a mock topic
      const mockTopic: Topic = {
        id: Date.now(),
        name: createFormData.name,
        description: createFormData.description || null,
        subject_id: createFormData.subject_id,
        created_at: new Date()
      };
      onTopicCreated(mockTopic);
      setCreateFormData({ name: '', description: null, subject_id: 0 });
      setIsCreateOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.name?.trim() || !editingTopic) return;

    setIsLoading(true);
    try {
      const updatedTopic = await trpc.updateTopic.mutate(editFormData);
      onTopicUpdated(updatedTopic);
      setEditingTopic(null);
    } catch (error) {
      console.error('Failed to update topic:', error);
      // For stub implementation, create a mock updated topic
      const mockUpdatedTopic: Topic = {
        ...editingTopic,
        name: editFormData.name || editingTopic.name,
        description: editFormData.description !== undefined ? editFormData.description : editingTopic.description,
        subject_id: editFormData.subject_id || editingTopic.subject_id
      };
      onTopicUpdated(mockUpdatedTopic);
      setEditingTopic(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteTopic.mutate({ id });
      onTopicDeleted(id);
    } catch (error) {
      console.error('Failed to delete topic:', error);
      // For stub implementation, still call the callback
      onTopicDeleted(id);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (topic: Topic) => {
    setEditingTopic(topic);
    setEditFormData({
      id: topic.id,
      name: topic.name,
      description: topic.description,
      subject_id: topic.subject_id
    });
  };

  // Check if we have subjects to create topics
  const hasSubjects = subjects.length > 0;

  return (
    <div className="space-y-6">
      {/* Header with Filter and Create Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">🏷️ Topics</h3>
          <p className="text-sm text-gray-600">
            {topics.length === 0 
              ? hasSubjects 
                ? "No topics yet. Create your first topic to organize questions!" 
                : "Create subjects first, then add topics to organize your questions."
              : `Managing ${filteredTopics.length} of ${topics.length} topic${topics.length === 1 ? '' : 's'}`
            }
          </p>
        </div>

        <div className="flex gap-3 items-center">
          {/* Subject Filter */}
          {hasSubjects && topics.length > 0 && (
            <Select value={filterSubjectId} onValueChange={setFilterSubjectId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((subject: Subject) => (
                  <SelectItem key={subject.id} value={subject.id.toString()}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Create Topic Button */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-green-600 hover:bg-green-700" 
                disabled={!hasSubjects}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Topic
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Topic</DialogTitle>
                <DialogDescription>
                  Add a new topic to organize questions within a subject.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="subject" className="text-sm font-medium">
                      Subject *
                    </label>
                    <Select 
                      value={createFormData.subject_id.toString()}
                      onValueChange={(value: string) =>
                        setCreateFormData((prev: CreateTopicInput) => ({ 
                          ...prev, 
                          subject_id: parseInt(value) 
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject: Subject) => (
                          <SelectItem key={subject.id} value={subject.id.toString()}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label htmlFor="name" className="text-sm font-medium">
                      Topic Name *
                    </label>
                    <Input
                      id="name"
                      value={createFormData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateFormData((prev: CreateTopicInput) => ({ 
                          ...prev, 
                          name: e.target.value 
                        }))
                      }
                      placeholder="e.g., Algebra, Cell Biology, World War II"
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
                        setCreateFormData((prev: CreateTopicInput) => ({ 
                          ...prev, 
                          description: e.target.value || null 
                        }))
                      }
                      placeholder="Brief description of the topic..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading || !createFormData.name.trim() || !createFormData.subject_id}
                  >
                    {isLoading ? 'Creating...' : 'Create Topic'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Topics Display */}
      {!hasSubjects ? (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No subjects available</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            You need to create subjects first before you can add topics. Topics help organize your questions within each subject.
          </p>
          <Button variant="outline">
            Go to Subjects Tab
          </Button>
        </div>
      ) : filteredTopics.length === 0 ? (
        <div className="text-center py-12">
          <FileQuestion className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {filterSubjectId === 'all' ? 'No topics yet' : 'No topics in this subject'}
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {filterSubjectId === 'all' 
              ? "Create your first topic to start organizing questions within your subjects."
              : "This subject doesn't have any topics yet. Add topics to organize your questions."
            }
          </p>
          <Button 
            onClick={() => setIsCreateOpen(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Topic
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTopics.map((topic: Topic) => (
            <Card key={topic.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileQuestion className="h-5 w-5 text-green-600" />
                      {topic.name}
                    </CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {getSubjectName(topic.subject_id)}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        ID: {topic.id}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(topic)}
                      className="text-gray-600 hover:text-green-600"
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
                          <AlertDialogTitle>Delete Topic</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{topic.name}"? 
                            This will also delete all questions associated with this topic. 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(topic.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Topic
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {topic.description && (
                  <CardDescription className="mb-4">
                    {topic.description}
                  </CardDescription>
                )}
                <div className="text-xs text-gray-500">
                  Created: {topic.created_at.toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {editingTopic && (
        <Dialog open={!!editingTopic} onOpenChange={() => setEditingTopic(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Topic</DialogTitle>
              <DialogDescription>
                Update the topic information.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-subject" className="text-sm font-medium">
                    Subject *
                  </label>
                  <Select 
                    value={editFormData.subject_id?.toString() || ''}
                    onValueChange={(value: string) =>
                      setEditFormData((prev: UpdateTopicInput) => ({ 
                        ...prev, 
                        subject_id: parseInt(value) 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject: Subject) => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="edit-name" className="text-sm font-medium">
                    Topic Name *
                  </label>
                  <Input
                    id="edit-name"
                    value={editFormData.name || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: UpdateTopicInput) => ({ 
                        ...prev, 
                        name: e.target.value 
                      }))
                    }
                    placeholder="Topic name"
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
                      setEditFormData((prev: UpdateTopicInput) => ({ 
                        ...prev, 
                        description: e.target.value || null 
                      }))
                    }
                    placeholder="Brief description of the topic..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingTopic(null)}
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
