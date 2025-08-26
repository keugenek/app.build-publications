import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import { Plus, Edit, Trash2, Users, HelpCircle, BookOpen, Filter } from 'lucide-react';
import type { Topic, Subject, CreateTopicInput, UpdateTopicInput } from '../../../server/src/schema';

interface TopicManagerProps {
  topics: Topic[];
  setTopics: (topics: Topic[] | ((prev: Topic[]) => Topic[])) => void;
  subjects: Subject[];
  getQuestionCount: (subjectId?: number, topicId?: number) => number;
}

export function TopicManager({ topics, setTopics, subjects, getQuestionCount }: TopicManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filterSubject, setFilterSubject] = useState<string>('all');

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

  const filteredTopics = filterSubject === 'all' 
    ? topics 
    : topics.filter(topic => topic.subject_id === parseInt(filterSubject));

  const getSubjectName = (subjectId: number) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || 'Unknown Subject';
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.name.trim() || createFormData.subject_id === 0) return;

    setIsLoading(true);
    try {
      const newTopic = await trpc.createTopic.mutate(createFormData);
      setTopics((prev: Topic[]) => [...prev, newTopic]);
      setCreateFormData({ name: '', description: null, subject_id: 0 });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create topic:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.name?.trim()) return;

    setIsLoading(true);
    try {
      const updatedTopic = await trpc.updateTopic.mutate(editFormData);
      setTopics((prev: Topic[]) => 
        prev.map(topic => topic.id === updatedTopic.id ? updatedTopic : topic)
      );
      setEditingTopic(null);
    } catch (error) {
      console.error('Failed to update topic:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (topic: Topic) => {
    setEditFormData({
      id: topic.id,
      name: topic.name,
      description: topic.description,
      subject_id: topic.subject_id
    });
    setEditingTopic(topic);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-green-600" />
            🎯 Topic Management
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Organize topics within subjects to categorize your questions
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2" disabled={subjects.length === 0}>
              <Plus className="h-4 w-4" />
              Add Topic
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Topic</DialogTitle>
              <DialogDescription>
                Add a new topic under a subject to organize your questions.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTopic} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Subject *</label>
                <Select
                  value={createFormData.subject_id.toString()}
                  onValueChange={(value) =>
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
                <label className="text-sm font-medium mb-2 block">Topic Name *</label>
                <Input
                  placeholder="e.g., Algebra, Biology, World War II"
                  value={createFormData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateTopicInput) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
                <Textarea
                  placeholder="Brief description of what this topic covers..."
                  value={createFormData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setCreateFormData((prev: CreateTopicInput) => ({
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
                <Button 
                  type="submit" 
                  disabled={isLoading || !createFormData.name.trim() || createFormData.subject_id === 0}
                >
                  {isLoading ? 'Creating...' : 'Create Topic'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      {subjects.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Filter className="h-4 w-4 text-gray-500" />
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Filter by Subject:</label>
                <Select value={filterSubject} onValueChange={setFilterSubject}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
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
              </div>
              {filterSubject !== 'all' && (
                <Badge variant="secondary">
                  {filteredTopics.length} topics
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Topics Grid */}
      {subjects.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                <BookOpen className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">No subjects available</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  You need to create subjects first before adding topics
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : filteredTopics.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">
                  {filterSubject === 'all' ? 'No topics yet' : 'No topics in this subject'}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {filterSubject === 'all' 
                    ? 'Start by creating your first topic under a subject'
                    : 'This subject doesn\'t have any topics yet'
                  }
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create First Topic
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTopics.map((topic: Topic) => (
            <Card key={topic.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {getSubjectName(topic.subject_id)}
                      </Badge>
                    </div>
                    <CardTitle className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-green-600" />
                      {topic.name}
                    </CardTitle>
                    {topic.description && (
                      <CardDescription className="line-clamp-2">
                        {topic.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog(topic)}
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
                          <AlertDialogTitle>Delete Topic</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{topic.name}"? This will also delete all related questions. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                            Delete Topic
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm mb-4">
                  <HelpCircle className="h-4 w-4 text-purple-600" />
                  <span className="text-gray-600">Questions:</span>
                  <span className="font-semibold">{getQuestionCount(topic.subject_id, topic.id)}</span>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-500">
                    Created: {topic.created_at.toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingTopic} onOpenChange={() => setEditingTopic(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Topic</DialogTitle>
            <DialogDescription>
              Update the topic information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateTopic} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Subject *</label>
              <Select
                value={editFormData.subject_id?.toString() || ''}
                onValueChange={(value) =>
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
              <label className="text-sm font-medium mb-2 block">Topic Name *</label>
              <Input
                placeholder="e.g., Algebra, Biology, World War II"
                value={editFormData.name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditFormData((prev: UpdateTopicInput) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
              <Textarea
                placeholder="Brief description of what this topic covers..."
                value={editFormData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setEditFormData((prev: UpdateTopicInput) => ({
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
                onClick={() => setEditingTopic(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !editFormData.name?.trim()}>
                {isLoading ? 'Updating...' : 'Update Topic'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
