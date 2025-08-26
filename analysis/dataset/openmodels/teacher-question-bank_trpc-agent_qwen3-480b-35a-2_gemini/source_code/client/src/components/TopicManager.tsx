import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Topic, CreateTopicInput, UpdateTopicInput, Subject } from '../../../server/src/schema';

export function TopicManager() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
  const [formData, setFormData] = useState<{ name: string; subject_id: number | null }>({ 
    name: '', 
    subject_id: null 
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadTopics = useCallback(async () => {
    try {
      const result = await trpc.getTopics.query();
      setTopics(result);
    } catch (err) {
      console.error('Failed to load topics:', err);
      // Since backend is not implemented, we'll use sample data
      const sampleTopics: Topic[] = [
        {
          id: 1,
          name: "Algebra",
          subject_id: 1,
          created_at: new Date()
        },
        {
          id: 2,
          name: "Calculus",
          subject_id: 1,
          created_at: new Date()
        },
        {
          id: 3,
          name: "Biology",
          subject_id: 2,
          created_at: new Date()
        }
      ];
      setTopics(sampleTopics);
      setError('Backend not available. Showing sample data.');
    }
  }, []);

  const loadSubjects = useCallback(async () => {
    try {
      const result = await trpc.getSubjects.query();
      setSubjects(result);
    } catch (err) {
      console.error('Failed to load subjects:', err);
      // Since backend is not implemented, we'll use sample data
      const sampleSubjects: Subject[] = [
        {
          id: 1,
          name: "Mathematics",
          created_at: new Date()
        },
        {
          id: 2,
          name: "Science",
          created_at: new Date()
        },
        {
          id: 3,
          name: "History",
          created_at: new Date()
        }
      ];
      setSubjects(sampleSubjects);
    }
  }, []);

  useEffect(() => {
    loadTopics();
    loadSubjects();
  }, [loadTopics, loadSubjects]);

  const handleCreate = () => {
    setIsEditing(false);
    setCurrentTopic(null);
    setFormData({ name: '', subject_id: null });
    setIsDialogOpen(true);
  };

  const handleEdit = (topic: Topic) => {
    setIsEditing(true);
    setCurrentTopic(topic);
    setFormData({ 
      name: topic.name, 
      subject_id: topic.subject_id 
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteTopic.mutate(id);
      await loadTopics();
    } catch (err) {
      console.error('Failed to delete topic:', err);
      setError('Failed to delete topic');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!formData.subject_id) {
        setError('Please select a subject');
        setIsLoading(false);
        return;
      }

      if (isEditing && currentTopic) {
        const updateData: UpdateTopicInput = {
          id: currentTopic.id,
          name: formData.name || undefined,
          subject_id: formData.subject_id || undefined
        };
        await trpc.updateTopic.mutate(updateData);
      } else {
        const createData: CreateTopicInput = {
          name: formData.name,
          subject_id: formData.subject_id!
        };
        await trpc.createTopic.mutate(createData);
      }
      
      await loadTopics();
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Failed to save topic:', err);
      setError('Failed to save topic');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Topic Management</CardTitle>
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Topic
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topics.map((topic) => {
                  const subject = subjects.find(s => s.id === topic.subject_id);
                  return (
                    <TableRow key={topic.id}>
                      <TableCell className="font-medium">{topic.name}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          {subject?.name || 'Unknown'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {topic.created_at.toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(topic)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(topic.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {topics.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500">
                      No topics found. Add your first topic!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Topic' : 'Create New Topic'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Topic Name
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter topic name"
                required
              />
            </div>
            
            <div>
              <label htmlFor="subject" className="block text-sm font-medium mb-1">
                Subject
              </label>
              <Select
                value={formData.subject_id ? formData.subject_id.toString() : undefined}
                onValueChange={(value) => setFormData({ ...formData, subject_id: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
