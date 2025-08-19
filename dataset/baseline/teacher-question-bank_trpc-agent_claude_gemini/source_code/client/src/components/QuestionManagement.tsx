import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
// Tabs components removed as they're not used in this component
import { Plus, Edit, Trash2, HelpCircle, Filter, Search, CheckCircle } from 'lucide-react';
import { trpc } from '@/utils/trpc';

import type { Subject, Topic, Question, CreateQuestionInput } from '../../../server/src/schema';

interface QuestionFilters {
  subject_id?: number;
  topic_id?: number;
  difficulty_level?: 'easy' | 'medium' | 'hard';
  search?: string;
}

export function QuestionManagement() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState<QuestionFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  // Question form state
  const [questionForm, setQuestionForm] = useState<CreateQuestionInput>({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    explanation: null,
    difficulty_level: 'medium',
    subject_id: 0,
    topic_id: 0
  });

  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [selectedSubjectTopics, setSelectedSubjectTopics] = useState<Topic[]>([]);

  // Load data
  const loadSubjects = useCallback(async () => {
    try {
      const result = await trpc.getSubjects.query();
      setSubjects(result);
    } catch (error) {
      console.error('Failed to load subjects:', error);
    }
  }, []);

  const loadTopics = useCallback(async () => {
    try {
      const result = await trpc.getTopics.query();
      setTopics(result);
    } catch (error) {
      console.error('Failed to load topics:', error);
    }
  }, []);

  const loadQuestions = useCallback(async () => {
    try {
      const result = await trpc.getQuestions.query();
      setQuestions(result);
      setFilteredQuestions(result);
    } catch (error) {
      console.error('Failed to load questions:', error);
    }
  }, []);

  const loadTopicsForSubject = useCallback(async (subjectId: number) => {
    try {
      const result = await trpc.getTopicsBySubject.query({ subject_id: subjectId });
      setSelectedSubjectTopics(result);
    } catch (error) {
      console.error('Failed to load topics for subject:', error);
      setSelectedSubjectTopics([]);
    }
  }, []);

  useEffect(() => {
    loadSubjects();
    loadTopics();
    loadQuestions();
  }, [loadSubjects, loadTopics, loadQuestions]);

  // Filter questions
  useEffect(() => {
    let filtered = [...questions];

    // Apply subject filter
    if (filters.subject_id) {
      filtered = filtered.filter((q: Question) => q.subject_id === filters.subject_id);
    }

    // Apply topic filter
    if (filters.topic_id) {
      filtered = filtered.filter((q: Question) => q.topic_id === filters.topic_id);
    }

    // Apply difficulty filter
    if (filters.difficulty_level) {
      filtered = filtered.filter((q: Question) => q.difficulty_level === filters.difficulty_level);
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((q: Question) => 
        q.question_text.toLowerCase().includes(searchLower) ||
        q.option_a.toLowerCase().includes(searchLower) ||
        q.option_b.toLowerCase().includes(searchLower) ||
        q.option_c.toLowerCase().includes(searchLower) ||
        q.option_d.toLowerCase().includes(searchLower)
      );
    }

    setFilteredQuestions(filtered);
  }, [questions, filters]);

  // Question handlers
  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingQuestion) {
        const response = await trpc.updateQuestion.mutate({
          id: editingQuestion.id,
          ...questionForm
        });
        setQuestions((prev: Question[]) => 
          prev.map((q: Question) => q.id === editingQuestion.id ? { ...q, ...response } : q)
        );
      } else {
        const response = await trpc.createQuestion.mutate(questionForm);
        setQuestions((prev: Question[]) => [...prev, response]);
      }
      resetQuestionForm();
      setQuestionDialogOpen(false);
    } catch (error) {
      console.error('Failed to save question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteQuestion = async (question: Question) => {
    try {
      await trpc.deleteQuestion.mutate({ id: question.id });
      setQuestions((prev: Question[]) => prev.filter((q: Question) => q.id !== question.id));
    } catch (error) {
      console.error('Failed to delete question:', error);
    }
  };

  const resetQuestionForm = () => {
    setQuestionForm({
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A',
      explanation: null,
      difficulty_level: 'medium',
      subject_id: 0,
      topic_id: 0
    });
    setEditingQuestion(null);
    setSelectedSubjectTopics([]);
  };

  const startEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setQuestionForm({
      question_text: question.question_text,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      correct_answer: question.correct_answer,
      explanation: question.explanation,
      difficulty_level: question.difficulty_level,
      subject_id: question.subject_id,
      topic_id: question.topic_id
    });
    loadTopicsForSubject(question.subject_id);
    setQuestionDialogOpen(true);
  };

  const handleSubjectChange = (subjectId: number) => {
    setQuestionForm((prev: CreateQuestionInput) => ({ ...prev, subject_id: subjectId, topic_id: 0 }));
    loadTopicsForSubject(subjectId);
  };

  const getSubjectName = (subjectId: number): string => {
    const subject = subjects.find((s: Subject) => s.id === subjectId);
    return subject ? subject.name : 'Unknown Subject';
  };

  const getTopicName = (topicId: number): string => {
    const topic = topics.find((t: Topic) => t.id === topicId);
    return topic ? topic.name : 'Unknown Topic';
  };

  const getDifficultyColor = (level: string): string => {
    switch (level) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">Questions ({filteredQuestions.length})</h3>
          <p className="text-sm text-gray-600">Create and manage multiple-choice questions</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {Object.keys(filters).length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {Object.keys(filters).length}
              </Badge>
            )}
          </Button>
          
          <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={resetQuestionForm} 
                disabled={subjects.length === 0}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingQuestion ? '✏️ Edit Question' : '➕ Create New Question'}
                </DialogTitle>
                <DialogDescription>
                  {editingQuestion 
                    ? 'Update the question information below.' 
                    : 'Create a multiple-choice question with four options.'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleQuestionSubmit} className="space-y-4">
                {/* Subject and Topic Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Subject *</label>
                    <Select
                      value={questionForm.subject_id.toString()}
                      onValueChange={(value: string) => handleSubjectChange(parseInt(value))}
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
                    <label className="text-sm font-medium">Topic *</label>
                    <Select
                      value={questionForm.topic_id.toString()}
                      onValueChange={(value: string) =>
                        setQuestionForm((prev: CreateQuestionInput) => ({ ...prev, topic_id: parseInt(value) }))
                      }
                      required
                      disabled={selectedSubjectTopics.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a topic" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedSubjectTopics.map((topic: Topic) => (
                          <SelectItem key={topic.id} value={topic.id.toString()}>
                            {topic.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Question Text */}
                <div>
                  <label className="text-sm font-medium">Question Text *</label>
                  <Textarea
                    value={questionForm.question_text}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setQuestionForm((prev: CreateQuestionInput) => ({ ...prev, question_text: e.target.value }))
                    }
                    placeholder="Enter your question here..."
                    rows={3}
                    required
                  />
                </div>

                {/* Options */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Answer Options *</label>
                  {(['A', 'B', 'C', 'D'] as const).map((option) => (
                    <div key={option} className="flex gap-3 items-center">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value={option} 
                          id={`option-${option}`}
                          checked={questionForm.correct_answer === option}
                          onClick={() => setQuestionForm((prev: CreateQuestionInput) => ({ ...prev, correct_answer: option }))}
                        />
                        <Label htmlFor={`option-${option}`} className="text-sm font-medium">
                          Option {option}
                        </Label>
                      </div>
                      <Input
                        value={questionForm[`option_${option.toLowerCase()}` as keyof CreateQuestionInput] as string}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setQuestionForm((prev: CreateQuestionInput) => ({ 
                            ...prev, 
                            [`option_${option.toLowerCase()}`]: e.target.value 
                          }))
                        }
                        placeholder={`Enter option ${option}`}
                        required
                        className="flex-1"
                      />
                    </div>
                  ))}
                  <p className="text-xs text-gray-500 mt-2">
                    ✅ Click the radio button to mark the correct answer
                  </p>
                </div>

                {/* Difficulty Level */}
                <div>
                  <label className="text-sm font-medium">Difficulty Level *</label>
                  <Select
                    value={questionForm.difficulty_level}
                    onValueChange={(value: 'easy' | 'medium' | 'hard') =>
                      setQuestionForm((prev: CreateQuestionInput) => ({ ...prev, difficulty_level: value }))
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">🟢 Easy</SelectItem>
                      <SelectItem value="medium">🟡 Medium</SelectItem>
                      <SelectItem value="hard">🔴 Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Explanation */}
                <div>
                  <label className="text-sm font-medium">Explanation (Optional)</label>
                  <Textarea
                    value={questionForm.explanation || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setQuestionForm((prev: CreateQuestionInput) => ({
                        ...prev,
                        explanation: e.target.value || null
                      }))
                    }
                    placeholder="Provide an explanation for the correct answer..."
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setQuestionDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : editingQuestion ? 'Update Question' : 'Create Question'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filter Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    value={filters.search || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFilters((prev: QuestionFilters) => ({ ...prev, search: e.target.value || undefined }))
                    }
                    placeholder="Search questions..."
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Subject</label>
                <Select
                  value={filters.subject_id?.toString() || 'all'}
                  onValueChange={(value: string) =>
                    setFilters((prev: QuestionFilters) => ({ 
                      ...prev, 
                      subject_id: value === 'all' ? undefined : parseInt(value),
                      topic_id: value === 'all' ? undefined : prev.topic_id
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All subjects" />
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
              <div>
                <label className="text-sm font-medium">Topic</label>
                <Select
                  value={filters.topic_id?.toString() || 'all'}
                  onValueChange={(value: string) =>
                    setFilters((prev: QuestionFilters) => ({ 
                      ...prev, 
                      topic_id: value === 'all' ? undefined : parseInt(value)
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All topics" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Topics</SelectItem>
                    {topics
                      .filter((topic: Topic) => !filters.subject_id || topic.subject_id === filters.subject_id)
                      .map((topic: Topic) => (
                      <SelectItem key={topic.id} value={topic.id.toString()}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Difficulty</label>
                <Select
                  value={filters.difficulty_level || 'all'}
                  onValueChange={(value: string) =>
                    setFilters((prev: QuestionFilters) => ({ 
                      ...prev, 
                      difficulty_level: value === 'all' ? undefined : value as 'easy' | 'medium' | 'hard'
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All difficulties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Difficulties</SelectItem>
                    <SelectItem value="easy">🟢 Easy</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="hard">🔴 Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {Object.keys(filters).length > 0 && (
              <div className="flex justify-end">
                <Button variant="outline" onClick={clearFilters} size="sm">
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Questions List */}
      {subjects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <HelpCircle className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-center">
              Create subjects and topics first to add questions 📚
            </p>
          </CardContent>
        </Card>
      ) : filteredQuestions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <HelpCircle className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-center">
              {questions.length === 0 
                ? "No questions created yet. Add your first question! ❓" 
                : "No questions match your filters. Try adjusting the criteria. 🔍"
              }
            </p>
            <Badge variant="secondary" className="mt-2">📊 Backend returns stub data</Badge>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredQuestions.map((question: Question) => (
            <Card key={question.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{getSubjectName(question.subject_id)}</Badge>
                      <Badge variant="outline">{getTopicName(question.topic_id)}</Badge>
                      <Badge className={getDifficultyColor(question.difficulty_level)}>
                        {question.difficulty_level}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{question.question_text}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEditQuestion(question)}
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
                          <AlertDialogTitle>🗑️ Delete Question</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this question? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteQuestion(question)}
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
                <div className="space-y-3">
                  {(['A', 'B', 'C', 'D'] as const).map((option) => {
                    const optionText = question[`option_${option.toLowerCase()}` as keyof Question] as string;
                    const isCorrect = question.correct_answer === option;
                    return (
                      <div 
                        key={option} 
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                          )}
                          <span className="font-medium text-sm">{option}.</span>
                        </div>
                        <span className={isCorrect ? 'font-medium text-green-800' : 'text-gray-700'}>
                          {optionText}
                        </span>
                      </div>
                    );
                  })}
                  
                  {question.explanation && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 mb-1">💡 Explanation:</p>
                      <p className="text-sm text-blue-700">{question.explanation}</p>
                    </div>
                  )}
                  
                  <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                    <span>Created: {question.created_at.toLocaleDateString()}</span>
                    <span>Last updated: {question.updated_at.toLocaleDateString()}</span>
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
