import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Separator component removed as it's not used in this component
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, BookOpen, Tag, Calendar } from 'lucide-react';
import { trpc } from '@/utils/trpc';

import type { Subject, CreateSubjectInput, Topic, CreateTopicInput } from '../../../server/src/schema';

export function SubjectManagement() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  // selectedSubject state removed as it's not used
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('subjects');

  // Subject form state
  const [subjectForm, setSubjectForm] = useState<CreateSubjectInput>({
    name: '',
    description: null
  });

  // Topic form state
  const [topicForm, setTopicForm] = useState<CreateTopicInput>({
    name: '',
    description: null,
    subject_id: 0
  });

  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [topicDialogOpen, setTopicDialogOpen] = useState(false);

  // Load subjects
  const loadSubjects = useCallback(async () => {
    try {
      const result = await trpc.getSubjects.query();
      setSubjects(result);
    } catch (error) {
      console.error('Failed to load subjects:', error);
    }
  }, []);

  // Load all topics
  const loadTopics = useCallback(async () => {
    try {
      const result = await trpc.getTopics.query();
      setTopics(result);
    } catch (error) {
      console.error('Failed to load topics:', error);
    }
  }, []);

  // loadTopicsBySubject removed as it's not used in this component

  useEffect(() => {
    loadSubjects();
    loadTopics();
  }, [loadSubjects, loadTopics]);

  // Subject handlers
  const handleSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingSubject) {
        const response = await trpc.updateSubject.mutate({
          id: editingSubject.id,
          ...subjectForm
        });
        setSubjects((prev: Subject[]) => 
          prev.map((s: Subject) => s.id === editingSubject.id ? { ...s, ...response } : s)
        );
      } else {
        const response = await trpc.createSubject.mutate(subjectForm);
        setSubjects((prev: Subject[]) => [...prev, response]);
      }
      resetSubjectForm();
      setSubjectDialogOpen(false);
    } catch (error) {
      console.error('Failed to save subject:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSubject = async (subject: Subject) => {
    try {
      await trpc.deleteSubject.mutate({ id: subject.id });
      setSubjects((prev: Subject[]) => prev.filter((s: Subject) => s.id !== subject.id));
      // Also remove related topics
      setTopics((prev: Topic[]) => prev.filter((t: Topic) => t.subject_id !== subject.id));
    } catch (error) {
      console.error('Failed to delete subject:', error);
    }
  };

  // Topic handlers
  const handleTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingTopic) {
        const response = await trpc.updateTopic.mutate({
          id: editingTopic.id,
          ...topicForm
        });
        setTopics((prev: Topic[]) => 
          prev.map((t: Topic) => t.id === editingTopic.id ? { ...t, ...response } : t)
        );
      } else {
        const response = await trpc.createTopic.mutate(topicForm);
        setTopics((prev: Topic[]) => [...prev, response]);
      }
      resetTopicForm();
      setTopicDialogOpen(false);
    } catch (error) {
      console.error('Failed to save topic:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTopic = async (topic: Topic) => {
    try {
      await trpc.deleteTopic.mutate({ id: topic.id });
      setTopics((prev: Topic[]) => prev.filter((t: Topic) => t.id !== topic.id));
    } catch (error) {
      console.error('Failed to delete topic:', error);
    }
  };

  // Form reset functions
  const resetSubjectForm = () => {
    setSubjectForm({ name: '', description: null });
    setEditingSubject(null);
  };

  const resetTopicForm = () => {
    setTopicForm({ name: '', description: null, subject_id: 0 });
    setEditingTopic(null);
  };

  // Edit handlers
  const startEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setSubjectForm({
      name: subject.name,
      description: subject.description
    });
    setSubjectDialogOpen(true);
  };

  const startEditTopic = (topic: Topic) => {
    setEditingTopic(topic);
    setTopicForm({
      name: topic.name,
      description: topic.description,
      subject_id: topic.subject_id
    });
    setTopicDialogOpen(true);
  };

  const getSubjectName = (subjectId: number): string => {
    const subject = subjects.find((s: Subject) => s.id === subjectId);
    return subject ? subject.name : 'Unknown Subject';
  };

  const getTopicsForSubject = (subjectId: number): Topic[] => {
    return topics.filter((topic: Topic) => topic.subject_id === subjectId);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="subjects" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Subjects ({subjects.length})
          </TabsTrigger>
          <TabsTrigger value="topics" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Topics ({topics.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Subjects</h3>
              <p className="text-sm text-gray-600">Manage your subject categories</p>
            </div>
            <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetSubjectForm} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingSubject ? '✏️ Edit Subject' : '➕ Create New Subject'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingSubject 
                      ? 'Update the subject information below.' 
                      : 'Add a new subject to organize your questions.'
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubjectSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Subject Name</label>
                    <Input
                      value={subjectForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSubjectForm((prev: CreateSubjectInput) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Enter subject name (e.g., Mathematics, Science)"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description (Optional)</label>
                    <Textarea
                      value={subjectForm.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setSubjectForm((prev: CreateSubjectInput) => ({
                          ...prev,
                          description: e.target.value || null
                        }))
                      }
                      placeholder="Brief description of the subject"
                      rows={3}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setSubjectDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Saving...' : editingSubject ? 'Update Subject' : 'Create Subject'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {subjects.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 text-center">
                  No subjects created yet. Add your first subject to get started! 📚
                </p>
                <Badge variant="secondary" className="mt-2">📊 Backend returns stub data</Badge>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {subjects.map((subject: Subject) => {
                const subjectTopics = getTopicsForSubject(subject.id);
                return (
                  <Card key={subject.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-blue-600" />
                            {subject.name}
                          </CardTitle>
                          {subject.description && (
                            <CardDescription className="mt-2">
                              {subject.description}
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEditSubject(subject)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>🗑️ Delete Subject</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{subject.name}"? This will also delete all associated topics and questions. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteSubject(subject)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Created: {subject.created_at.toLocaleDateString()}
                          </div>
                          <Badge variant="secondary">
                            {subjectTopics.length} topic{subjectTopics.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="topics" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Topics</h3>
              <p className="text-sm text-gray-600">Organize questions within subjects</p>
            </div>
            <Dialog open={topicDialogOpen} onOpenChange={setTopicDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={resetTopicForm} 
                  disabled={subjects.length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Topic
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingTopic ? '✏️ Edit Topic' : '➕ Create New Topic'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingTopic 
                      ? 'Update the topic information below.' 
                      : 'Add a new topic under a subject.'
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleTopicSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Subject</label>
                    <Select
                      value={topicForm.subject_id.toString()}
                      onValueChange={(value: string) =>
                        setTopicForm((prev: CreateTopicInput) => ({ ...prev, subject_id: parseInt(value) }))
                      }
                      required
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
                    <label className="text-sm font-medium">Topic Name</label>
                    <Input
                      value={topicForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setTopicForm((prev: CreateTopicInput) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Enter topic name (e.g., Algebra, Geometry)"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description (Optional)</label>
                    <Textarea
                      value={topicForm.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setTopicForm((prev: CreateTopicInput) => ({
                          ...prev,
                          description: e.target.value || null
                        }))
                      }
                      placeholder="Brief description of the topic"
                      rows={3}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setTopicDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Saving...' : editingTopic ? 'Update Topic' : 'Create Topic'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {subjects.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 text-center">
                  Create subjects first to add topics 📝
                </p>
              </CardContent>
            </Card>
          ) : topics.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Tag className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 text-center">
                  No topics created yet. Add your first topic to organize questions! 🏷️
                </p>
                <Badge variant="secondary" className="mt-2">📊 Backend returns stub data</Badge>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {topics.map((topic: Topic) => (
                <Card key={topic.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <Tag className="h-5 w-5 text-green-600" />
                          {topic.name}
                        </CardTitle>
                        <div className="mt-1">
                          <Badge variant="outline" className="text-xs">
                            {getSubjectName(topic.subject_id)}
                          </Badge>
                        </div>
                        {topic.description && (
                          <CardDescription className="mt-2">
                            {topic.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditTopic(topic)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>🗑️ Delete Topic</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{topic.name}"? This will also delete all questions under this topic. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteTopic(topic)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Created: {topic.created_at.toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
