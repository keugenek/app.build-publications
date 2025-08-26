import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Question, CreateQuestionInput, UpdateQuestionInput, Subject, Topic } from '../../../server/src/schema';

export function QuestionManager() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<Topic[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState<{
    text: string;
    type: string;
    correct_answer: string;
    subject_id: number | null;
    topic_id: number | null;
  }>({ 
    text: '', 
    type: 'Multiple Choice', 
    correct_answer: '', 
    subject_id: null, 
    topic_id: null 
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadQuestions = useCallback(async () => {
    try {
      const result = await trpc.getQuestions.query();
      setQuestions(result);
    } catch (err) {
      console.error('Failed to load questions:', err);
      // Since backend is not implemented, we'll use sample data
      const sampleQuestions: Question[] = [
        {
          id: 1,
          text: "What is the capital of France?",
          type: "Multiple Choice",
          correct_answer: "Paris",
          subject_id: 1,
          topic_id: 1,
          created_at: new Date()
        },
        {
          id: 2,
          text: "Solve for x: 2x + 5 = 15",
          type: "Open Ended",
          correct_answer: "x = 5",
          subject_id: 1,
          topic_id: 2,
          created_at: new Date()
        }
      ];
      setQuestions(sampleQuestions);
      setError('Backend not available. Showing sample data.');
    }
  }, []);

  const loadSubjects = useCallback(async () => {
    try {
      const result = await trpc.getSubjects.query();
      setSubjects(result);
    } catch (err) {
      console.error('Failed to load subjects:', err);
      setError('Failed to load subjects');
    }
  }, []);

  const loadTopics = useCallback(async () => {
    try {
      const result = await trpc.getTopics.query();
      setTopics(result);
    } catch (err) {
      console.error('Failed to load topics:', err);
      setError('Failed to load topics');
    }
  }, []);

  useEffect(() => {
    loadQuestions();
    loadSubjects();
    loadTopics();
  }, [loadQuestions, loadSubjects, loadTopics]);

  useEffect(() => {
    if (formData.subject_id) {
      setFilteredTopics(topics.filter(topic => topic.subject_id === formData.subject_id));
    } else {
      setFilteredTopics([]);
    }
  }, [formData.subject_id, topics]);

  const handleCreate = () => {
    setIsEditing(false);
    setCurrentQuestion(null);
    setFormData({ 
      text: '', 
      type: 'Multiple Choice', 
      correct_answer: '', 
      subject_id: null, 
      topic_id: null 
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (question: Question) => {
    setIsEditing(true);
    setCurrentQuestion(question);
    setFormData({ 
      text: question.text, 
      type: question.type, 
      correct_answer: question.correct_answer, 
      subject_id: question.subject_id, 
      topic_id: question.topic_id 
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteQuestion.mutate(id);
      await loadQuestions();
    } catch (err) {
      console.error('Failed to delete question:', err);
      setError('Failed to delete question');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!formData.subject_id || !formData.topic_id) {
        setError('Please select both subject and topic');
        setIsLoading(false);
        return;
      }

      if (isEditing && currentQuestion) {
        const updateData: UpdateQuestionInput = {
          id: currentQuestion.id,
          text: formData.text || undefined,
          type: formData.type as "Multiple Choice" | "Open Ended" | undefined,
          correct_answer: formData.correct_answer || undefined,
          subject_id: formData.subject_id || undefined,
          topic_id: formData.topic_id || undefined
        };
        await trpc.updateQuestion.mutate(updateData);
      } else {
        const createData: CreateQuestionInput = {
          text: formData.text,
          type: formData.type as "Multiple Choice" | "Open Ended",
          correct_answer: formData.correct_answer,
          subject_id: formData.subject_id!,
          topic_id: formData.topic_id!
        };
        await trpc.createQuestion.mutate(createData);
      }
      
      await loadQuestions();
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Failed to save question:', err);
      setError('Failed to save question');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Question Management</CardTitle>
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Question
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
                  <TableHead>Question</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((question) => {
                  const subject = subjects.find(s => s.id === question.subject_id);
                  const topic = topics.find(t => t.id === question.topic_id);
                  return (
                    <TableRow key={question.id}>
                      <TableCell className="max-w-xs truncate font-medium">
                        {question.text}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                          {question.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          {subject?.name || 'Unknown'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          {topic?.name || 'Unknown'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {question.created_at.toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(question)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(question.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {questions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500">
                      No questions found. Add your first question!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Question' : 'Create New Question'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="text" className="block text-sm font-medium mb-1">
                Question Text
              </label>
              <Textarea
                id="text"
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                placeholder="Enter your question"
                required
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="type" className="block text-sm font-medium mb-1">
                  Question Type
                </label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select question type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Multiple Choice">Multiple Choice</SelectItem>
                    <SelectItem value="Open Ended">Open Ended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label htmlFor="correct_answer" className="block text-sm font-medium mb-1">
                  Correct Answer
                </label>
                <Input
                  id="correct_answer"
                  value={formData.correct_answer}
                  onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                  placeholder="Enter correct answer"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-1">
                  Subject
                </label>
                <Select
                  value={formData.subject_id ? formData.subject_id.toString() : undefined}
                  onValueChange={(value) => {
                    const subjectId = parseInt(value);
                    setFormData({ 
                      ...formData, 
                      subject_id: subjectId,
                      topic_id: null // Reset topic when subject changes
                    });
                  }}
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
              
              <div>
                <label htmlFor="topic" className="block text-sm font-medium mb-1">
                  Topic
                </label>
                <Select
                  value={formData.topic_id ? formData.topic_id.toString() : undefined}
                  onValueChange={(value) => setFormData({ ...formData, topic_id: parseInt(value) })}
                  disabled={!formData.subject_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTopics.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id.toString()}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
