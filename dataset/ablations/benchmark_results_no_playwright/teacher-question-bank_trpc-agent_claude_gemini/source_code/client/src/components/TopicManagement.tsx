import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useMemo } from 'react';
import type { Topic, Subject, CreateTopicInput } from '../../../server/src/schema';

interface TopicManagementProps {
  topics: Topic[];
  subjects: Subject[];
  onRefresh: () => Promise<void>;
}

export function TopicManagement({ topics, subjects, onRefresh }: TopicManagementProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [formData, setFormData] = useState<CreateTopicInput>({
    name: '',
    subject_id: 0
  });

  // Create a map of subject names for display
  const subjectMap = useMemo(() => {
    const map = new Map<number, string>();
    subjects.forEach((subject: Subject) => {
      map.set(subject.id, subject.name);
    });
    return map;
  }, [subjects]);

  // Filter topics based on selected subject
  const filteredTopics = useMemo(() => {
    if (selectedSubjectFilter === 'all') {
      return topics;
    }
    return topics.filter((topic: Topic) => topic.subject_id === parseInt(selectedSubjectFilter));
  }, [topics, selectedSubjectFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.subject_id) return;

    try {
      setIsLoading(true);
      if (editingTopic) {
        await trpc.updateTopic.mutate({
          id: editingTopic.id,
          name: formData.name,
          subject_id: formData.subject_id
        });
      } else {
        await trpc.createTopic.mutate(formData);
      }
      
      await onRefresh();
      setFormData({ name: '', subject_id: 0 });
      setIsCreateDialogOpen(false);
      setEditingTopic(null);
    } catch (error) {
      console.error('Failed to save topic:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setIsLoading(true);
      await trpc.deleteTopic.mutate({ id });
      await onRefresh();
    } catch (error) {
      console.error('Failed to delete topic:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (topic: Topic) => {
    setEditingTopic(topic);
    setFormData({ 
      name: topic.name, 
      subject_id: topic.subject_id 
    });
    setIsCreateDialogOpen(true);
  };

  const handleCreateNew = () => {
    setEditingTopic(null);
    setFormData({ name: '', subject_id: 0 });
    setIsCreateDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Manage your topics</h3>
          <p className="text-sm text-gray-600">Organize topics within subjects for better question categorization</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateNew} className="bg-green-600 hover:bg-green-700" disabled={subjects.length === 0}>
              🏷️ Add Topic
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTopic ? '✏️ Edit Topic' : '🏷️ Create New Topic'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  placeholder="Enter topic name (e.g., Algebra, Mechanics)"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateTopicInput) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Select 
                  value={formData.subject_id.toString()} 
                  onValueChange={(value: string) =>
                    setFormData((prev: CreateTopicInput) => ({ ...prev, subject_id: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject: Subject) => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        📖 {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : editingTopic ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter by subject */}
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium">Filter by subject:</span>
        <Select value={selectedSubjectFilter} onValueChange={setSelectedSubjectFilter}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects ({topics.length})</SelectItem>
            {subjects.map((subject: Subject) => {
              const count = topics.filter((topic: Topic) => topic.subject_id === subject.id).length;
              return (
                <SelectItem key={subject.id} value={subject.id.toString()}>
                  📖 {subject.name} ({count})
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {subjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📖</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No subjects available</h3>
          <p className="text-gray-600 mb-4">You need to create subjects first before you can add topics</p>
        </div>
      ) : filteredTopics.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏷️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {selectedSubjectFilter === 'all' ? 'No topics yet' : 'No topics in this subject'}
          </h3>
          <p className="text-gray-600 mb-4">
            {selectedSubjectFilter === 'all' 
              ? 'Start by creating your first topic to categorize your questions'
              : 'Create topics within this subject to better organize your questions'
            }
          </p>
          <Button onClick={handleCreateNew} className="bg-green-600 hover:bg-green-700">
            🏷️ Create First Topic
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTopics.map((topic: Topic) => (
            <Card key={topic.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg text-green-700">
                    🏷️ {topic.name}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    ID: {topic.id}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="mb-3">
                  <Badge variant="outline" className="text-xs">
                    📖 {subjectMap.get(topic.subject_id) || 'Unknown Subject'}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  Created: {topic.created_at.toLocaleDateString()}
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(topic)}
                    disabled={isLoading}
                  >
                    ✏️ Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive" disabled={isLoading}>
                        🗑️ Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Topic</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{topic.name}"? This will also delete all associated questions.
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(topic.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
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
}
