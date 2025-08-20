import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, HelpCircle, BookOpen, Users, Filter, Eye } from 'lucide-react';
import type { Question, Subject, Topic, CreateQuestionInput, UpdateQuestionInput } from '../../../server/src/schema';

interface QuestionManagerProps {
  questions: Question[];
  setQuestions: (questions: Question[] | ((prev: Question[]) => Question[])) => void;
  subjects: Subject[];
  topics: Topic[];
}

export function QuestionManager({ questions, setQuestions, subjects, topics }: QuestionManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [viewingQuestion, setViewingQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterTopic, setFilterTopic] = useState<string>('all');
  const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);

  const [createFormData, setCreateFormData] = useState<CreateQuestionInput>({
    question_text: '',
    answer_text: '',
    subject_id: 0,
    topic_id: 0
  });

  const [editFormData, setEditFormData] = useState<UpdateQuestionInput>({
    id: 0,
    question_text: '',
    answer_text: '',
    subject_id: 0,
    topic_id: 0
  });

  // Update available topics when subject changes
  useEffect(() => {
    const subjectId = parseInt(filterSubject);
    if (filterSubject === 'all') {
      setAvailableTopics(topics);
      setFilterTopic('all');
    } else {
      const filteredTopics = topics.filter(topic => topic.subject_id === subjectId);
      setAvailableTopics(filteredTopics);
      setFilterTopic('all');
    }
  }, [filterSubject, topics]);

  const filteredQuestions = questions.filter(question => {
    if (filterSubject !== 'all' && question.subject_id !== parseInt(filterSubject)) return false;
    if (filterTopic !== 'all' && question.topic_id !== parseInt(filterTopic)) return false;
    return true;
  });

  const getSubjectName = (subjectId: number) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || 'Unknown Subject';
  };

  const getTopicName = (topicId: number) => {
    const topic = topics.find(t => t.id === topicId);
    return topic?.name || 'Unknown Topic';
  };

  const getTopicsForSubject = (subjectId: number) => {
    return topics.filter(topic => topic.subject_id === subjectId);
  };

  const handleSubjectChange = (subjectId: number, isCreate: boolean = true) => {
    const subjectTopics = getTopicsForSubject(subjectId);
    if (isCreate) {
      setCreateFormData((prev: CreateQuestionInput) => ({ 
        ...prev, 
        subject_id: subjectId,
        topic_id: subjectTopics.length > 0 ? subjectTopics[0].id : 0
      }));
    } else {
      setEditFormData((prev: UpdateQuestionInput) => ({ 
        ...prev, 
        subject_id: subjectId,
        topic_id: subjectTopics.length > 0 ? subjectTopics[0].id : 0
      }));
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.question_text.trim() || !createFormData.answer_text.trim() || 
        createFormData.subject_id === 0 || createFormData.topic_id === 0) return;

    setIsLoading(true);
    try {
      const newQuestion = await trpc.createQuestion.mutate(createFormData);
      setQuestions((prev: Question[]) => [...prev, newQuestion]);
      setCreateFormData({ question_text: '', answer_text: '', subject_id: 0, topic_id: 0 });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.question_text?.trim() || !editFormData.answer_text?.trim()) return;

    setIsLoading(true);
    try {
      const updatedQuestion = await trpc.updateQuestion.mutate(editFormData);
      setQuestions((prev: Question[]) => 
        prev.map(question => question.id === updatedQuestion.id ? updatedQuestion : question)
      );
      setEditingQuestion(null);
    } catch (error) {
      console.error('Failed to update question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (question: Question) => {
    setEditFormData({
      id: question.id,
      question_text: question.question_text,
      answer_text: question.answer_text,
      subject_id: question.subject_id,
      topic_id: question.topic_id
    });
    setEditingQuestion(question);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-purple-600" />
            ❓ Question Management
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Create and manage questions for your quizzes
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2" disabled={subjects.length === 0 || topics.length === 0}>
              <Plus className="h-4 w-4" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Question</DialogTitle>
              <DialogDescription>
                Add a new question with its answer, organized by subject and topic.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Subject *</label>
                  <Select
                    value={createFormData.subject_id.toString()}
                    onValueChange={(value) => handleSubjectChange(parseInt(value), true)}
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
                  <label className="text-sm font-medium mb-2 block">Topic *</label>
                  <Select
                    value={createFormData.topic_id.toString()}
                    onValueChange={(value) =>
                      setCreateFormData((prev: CreateQuestionInput) => ({ 
                        ...prev, 
                        topic_id: parseInt(value) 
                      }))
                    }
                    disabled={createFormData.subject_id === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {getTopicsForSubject(createFormData.subject_id).map((topic: Topic) => (
                        <SelectItem key={topic.id} value={topic.id.toString()}>
                          {topic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Question *</label>
                <Textarea
                  placeholder="Enter your question here..."
                  value={createFormData.question_text}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setCreateFormData((prev: CreateQuestionInput) => ({ ...prev, question_text: e.target.value }))
                  }
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Answer *</label>
                <Textarea
                  placeholder="Enter the answer here..."
                  value={createFormData.answer_text}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setCreateFormData((prev: CreateQuestionInput) => ({ ...prev, answer_text: e.target.value }))
                  }
                  rows={3}
                  required
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
                  disabled={isLoading || !createFormData.question_text.trim() || !createFormData.answer_text.trim() || 
                           createFormData.subject_id === 0 || createFormData.topic_id === 0}
                >
                  {isLoading ? 'Creating...' : 'Create Question'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      {(subjects.length > 0 && topics.length > 0) && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 flex-wrap">
              <Filter className="h-4 w-4 text-gray-500" />
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Subject:</label>
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
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Topic:</label>
                <Select value={filterTopic} onValueChange={setFilterTopic}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Topics</SelectItem>
                    {availableTopics.map((topic: Topic) => (
                      <SelectItem key={topic.id} value={topic.id.toString()}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Badge variant="secondary">
                {filteredQuestions.length} questions
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions List */}
      {subjects.length === 0 || topics.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                {subjects.length === 0 ? (
                  <BookOpen className="h-8 w-8 text-gray-400" />
                ) : (
                  <Users className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">
                  {subjects.length === 0 ? 'No subjects available' : 'No topics available'}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {subjects.length === 0 
                    ? 'You need to create subjects first before adding questions'
                    : 'You need to create topics first before adding questions'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : filteredQuestions.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                <HelpCircle className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">No questions yet</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Start creating questions to build your question bank
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create First Question
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((question: Question) => (
            <Card key={question.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="text-xs bg-blue-50">
                        {getSubjectName(question.subject_id)}
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-green-50">
                        {getTopicName(question.topic_id)}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mb-2">
                      {question.question_text}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      <strong>Answer:</strong> {question.answer_text}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setViewingQuestion(question)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog(question)}
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
                          <AlertDialogTitle>Delete Question</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this question? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                            Delete Question
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-500">
                    Created: {question.created_at.toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Question Dialog */}
      <Dialog open={!!viewingQuestion} onOpenChange={() => setViewingQuestion(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Question Details</DialogTitle>
            {viewingQuestion && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs bg-blue-50">
                  {getSubjectName(viewingQuestion.subject_id)}
                </Badge>
                <Badge variant="outline" className="text-xs bg-green-50">
                  {getTopicName(viewingQuestion.topic_id)}
                </Badge>
              </div>
            )}
          </DialogHeader>
          {viewingQuestion && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Question:</label>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="whitespace-pre-wrap">{viewingQuestion.question_text}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Answer:</label>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="whitespace-pre-wrap">{viewingQuestion.answer_text}</p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setViewingQuestion(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingQuestion} onOpenChange={() => setEditingQuestion(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription>
              Update the question information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateQuestion} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Subject *</label>
                <Select
                  value={editFormData.subject_id?.toString() || ''}
                  onValueChange={(value) => handleSubjectChange(parseInt(value), false)}
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
                <label className="text-sm font-medium mb-2 block">Topic *</label>
                <Select
                  value={editFormData.topic_id?.toString() || ''}
                  onValueChange={(value) =>
                    setEditFormData((prev: UpdateQuestionInput) => ({ 
                      ...prev, 
                      topic_id: parseInt(value) 
                    }))
                  }
                  disabled={!editFormData.subject_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {editFormData.subject_id && getTopicsForSubject(editFormData.subject_id).map((topic: Topic) => (
                      <SelectItem key={topic.id} value={topic.id.toString()}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Question *</label>
              <Textarea
                placeholder="Enter your question here..."
                value={editFormData.question_text || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setEditFormData((prev: UpdateQuestionInput) => ({ ...prev, question_text: e.target.value }))
                }
                rows={3}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Answer *</label>
              <Textarea
                placeholder="Enter the answer here..."
                value={editFormData.answer_text || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setEditFormData((prev: UpdateQuestionInput) => ({ ...prev, answer_text: e.target.value }))
                }
                rows={3}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setEditingQuestion(null)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || !editFormData.question_text?.trim() || !editFormData.answer_text?.trim()}
              >
                {isLoading ? 'Updating...' : 'Update Question'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
