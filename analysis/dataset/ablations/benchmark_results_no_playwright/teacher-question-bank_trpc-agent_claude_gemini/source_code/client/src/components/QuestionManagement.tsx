import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useMemo } from 'react';
import type { Question, Subject, Topic, CreateQuestionInput } from '../../../server/src/schema';

interface QuestionManagementProps {
  questions: Question[];
  subjects: Subject[];
  topics: Topic[];
  onRefresh: () => Promise<void>;
}

export function QuestionManagement({ questions, subjects, topics, onRefresh }: QuestionManagementProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>('all');
  const [formData, setFormData] = useState<CreateQuestionInput>({
    text: '',
    subject_id: 0,
    topic_id: 0
  });

  // Create maps for display
  const subjectMap = useMemo(() => {
    const map = new Map<number, string>();
    subjects.forEach((subject: Subject) => {
      map.set(subject.id, subject.name);
    });
    return map;
  }, [subjects]);

  const topicMap = useMemo(() => {
    const map = new Map<number, string>();
    topics.forEach((topic: Topic) => {
      map.set(topic.id, topic.name);
    });
    return map;
  }, [topics]);

  // Filter topics based on selected subject in form
  const availableTopics = useMemo(() => {
    if (!formData.subject_id) return [];
    return topics.filter((topic: Topic) => topic.subject_id === formData.subject_id);
  }, [topics, formData.subject_id]);

  // Filter topics for the filter dropdown
  const filterTopics = useMemo(() => {
    if (selectedSubjectFilter === 'all') return topics;
    return topics.filter((topic: Topic) => topic.subject_id === parseInt(selectedSubjectFilter));
  }, [topics, selectedSubjectFilter]);

  // Filter questions based on selected filters
  const filteredQuestions = useMemo(() => {
    let filtered = questions;
    
    if (selectedSubjectFilter !== 'all') {
      filtered = filtered.filter((question: Question) => question.subject_id === parseInt(selectedSubjectFilter));
    }
    
    if (selectedTopicFilter !== 'all') {
      filtered = filtered.filter((question: Question) => question.topic_id === parseInt(selectedTopicFilter));
    }
    
    return filtered;
  }, [questions, selectedSubjectFilter, selectedTopicFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.text.trim() || !formData.subject_id || !formData.topic_id) return;

    try {
      setIsLoading(true);
      if (editingQuestion) {
        await trpc.updateQuestion.mutate({
          id: editingQuestion.id,
          text: formData.text,
          subject_id: formData.subject_id,
          topic_id: formData.topic_id
        });
      } else {
        await trpc.createQuestion.mutate(formData);
      }
      
      await onRefresh();
      setFormData({ text: '', subject_id: 0, topic_id: 0 });
      setIsCreateDialogOpen(false);
      setEditingQuestion(null);
    } catch (error) {
      console.error('Failed to save question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setIsLoading(true);
      await trpc.deleteQuestion.mutate({ id });
      await onRefresh();
    } catch (error) {
      console.error('Failed to delete question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setFormData({ 
      text: question.text, 
      subject_id: question.subject_id,
      topic_id: question.topic_id
    });
    setIsCreateDialogOpen(true);
  };

  const handleCreateNew = () => {
    setEditingQuestion(null);
    setFormData({ text: '', subject_id: 0, topic_id: 0 });
    setIsCreateDialogOpen(true);
  };

  const handleSubjectFilterChange = (value: string) => {
    setSelectedSubjectFilter(value);
    setSelectedTopicFilter('all'); // Reset topic filter when subject changes
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Manage your questions</h3>
          <p className="text-sm text-gray-600">Create and organize questions by subject and topic</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateNew} className="bg-purple-600 hover:bg-purple-700" disabled={subjects.length === 0 || topics.length === 0}>
              ❓ Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingQuestion ? '✏️ Edit Question' : '❓ Create New Question'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Textarea
                  placeholder="Enter your question text here..."
                  value={formData.text}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateQuestionInput) => ({ ...prev, text: e.target.value }))
                  }
                  rows={4}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Select 
                    value={formData.subject_id.toString()} 
                    onValueChange={(value: string) => {
                      const subjectId = parseInt(value);
                      setFormData((prev: CreateQuestionInput) => ({ 
                        ...prev, 
                        subject_id: subjectId,
                        topic_id: 0 // Reset topic when subject changes
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
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
                <div>
                  <Select 
                    value={formData.topic_id.toString()} 
                    onValueChange={(value: string) =>
                      setFormData((prev: CreateQuestionInput) => ({ ...prev, topic_id: parseInt(value) }))
                    }
                    disabled={!formData.subject_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTopics.map((topic: Topic) => (
                        <SelectItem key={topic.id} value={topic.id.toString()}>
                          🏷️ {topic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                  {isLoading ? 'Saving...' : editingQuestion ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 flex-wrap gap-2">
        <span className="text-sm font-medium">Filters:</span>
        <Select value={selectedSubjectFilter} onValueChange={handleSubjectFilterChange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects ({questions.length})</SelectItem>
            {subjects.map((subject: Subject) => {
              const count = questions.filter((question: Question) => question.subject_id === subject.id).length;
              return (
                <SelectItem key={subject.id} value={subject.id.toString()}>
                  📖 {subject.name} ({count})
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <Select value={selectedTopicFilter} onValueChange={setSelectedTopicFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Topics</SelectItem>
            {filterTopics.map((topic: Topic) => {
              const count = questions.filter((question: Question) => question.topic_id === topic.id).length;
              return (
                <SelectItem key={topic.id} value={topic.id.toString()}>
                  🏷️ {topic.name} ({count})
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {subjects.length === 0 || topics.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Prerequisites missing</h3>
          <p className="text-gray-600 mb-4">
            You need to create subjects and topics first before you can add questions
          </p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">❓</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
          <p className="text-gray-600 mb-4">
            {selectedSubjectFilter === 'all' && selectedTopicFilter === 'all'
              ? 'Start by creating your first question'
              : 'No questions match the selected filters'
            }
          </p>
          <Button onClick={handleCreateNew} className="bg-purple-600 hover:bg-purple-700">
            ❓ Create First Question
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredQuestions.map((question: Question) => (
            <Card key={question.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      📖 {subjectMap.get(question.subject_id) || 'Unknown Subject'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      🏷️ {topicMap.get(question.topic_id) || 'Unknown Topic'}
                    </Badge>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    ID: {question.id}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="mb-4">
                  <p className="text-gray-800 leading-relaxed">{question.text}</p>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Created: {question.created_at.toLocaleDateString()}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(question)}
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
                          <AlertDialogTitle>Delete Question</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this question? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(question.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
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
}
