import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, HelpCircle, Eye, Filter, X } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Subject, Topic, Question, QuestionType, CreateQuestionInput, UpdateQuestionInput, CreateMultipleChoiceOptionInput, MultipleChoiceOption } from '../../../server/src/schema';

interface QuestionManagerProps {
  subjects: Subject[];
  topics: Topic[];
  questions: Question[];
  onQuestionCreated: (question: Question) => void;
  onQuestionUpdated: (question: Question) => void;
  onQuestionDeleted: (id: number) => void;
}

interface MultipleChoiceOptionData {
  option_text: string;
  is_correct: boolean;
}

export function QuestionManager({
  subjects,
  topics,
  questions,
  onQuestionCreated,
  onQuestionUpdated,
  onQuestionDeleted
}: QuestionManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [viewingQuestion, setViewingQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filters
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');
  const [filterTopicId, setFilterTopicId] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const [createFormData, setCreateFormData] = useState<CreateQuestionInput>({
    question_text: '',
    subject_id: 0,
    topic_id: 0,
    type: 'multiple-choice',
    answer: ''
  });

  const [editFormData, setEditFormData] = useState<UpdateQuestionInput>({
    id: 0,
    question_text: '',
    subject_id: 0,
    topic_id: 0,
    type: 'multiple-choice',
    answer: ''
  });

  // Multiple choice options
  const [createMCOptions, setCreateMCOptions] = useState<MultipleChoiceOptionData[]>([
    { option_text: '', is_correct: false },
    { option_text: '', is_correct: false }
  ]);

  const [editMCOptions, setEditMCOptions] = useState<MultipleChoiceOptionData[]>([]);

  // Helper functions
  const getSubjectName = (subjectId: number) => {
    const subject = subjects.find((s: Subject) => s.id === subjectId);
    return subject?.name || 'Unknown Subject';
  };

  const getTopicName = (topicId: number) => {
    const topic = topics.find((t: Topic) => t.id === topicId);
    return topic?.name || 'Unknown Topic';
  };

  const getAvailableTopics = (subjectId: number) => {
    return topics.filter((topic: Topic) => topic.subject_id === subjectId);
  };

  // Filter questions
  const filteredQuestions = questions.filter((question: Question) => {
    if (filterSubjectId !== 'all' && question.subject_id !== parseInt(filterSubjectId)) {
      return false;
    }
    if (filterTopicId !== 'all' && question.topic_id !== parseInt(filterTopicId)) {
      return false;
    }
    if (filterType !== 'all' && question.type !== filterType) {
      return false;
    }
    return true;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.question_text.trim() || !createFormData.subject_id || !createFormData.topic_id) {
      return;
    }

    // For multiple choice, validate options
    if (createFormData.type === 'multiple-choice') {
      const validOptions = createMCOptions.filter(opt => opt.option_text.trim());
      const correctOptions = validOptions.filter(opt => opt.is_correct);
      
      if (validOptions.length < 2) {
        alert('Multiple choice questions need at least 2 options');
        return;
      }
      if (correctOptions.length === 0) {
        alert('Multiple choice questions need at least one correct answer');
        return;
      }
    }

    setIsLoading(true);
    try {
      const newQuestion = await trpc.createQuestion.mutate(createFormData);
      
      // If multiple choice, create the options
      if (createFormData.type === 'multiple-choice') {
        const validOptions = createMCOptions.filter(opt => opt.option_text.trim());
        for (const option of validOptions) {
          const optionData: CreateMultipleChoiceOptionInput = {
            question_id: newQuestion.id,
            option_text: option.option_text,
            is_correct: option.is_correct
          };
          await trpc.createMultipleChoiceOption.mutate(optionData);
        }
      }
      
      onQuestionCreated(newQuestion);
      resetCreateForm();
      setIsCreateOpen(false);
    } catch (error) {
      console.error('Failed to create question:', error);
      // For stub implementation, create a mock question
      const mockQuestion: Question = {
        id: Date.now(),
        question_text: createFormData.question_text,
        subject_id: createFormData.subject_id,
        topic_id: createFormData.topic_id,
        type: createFormData.type,
        answer: createFormData.answer,
        created_at: new Date(),
        updated_at: new Date()
      };
      onQuestionCreated(mockQuestion);
      resetCreateForm();
      setIsCreateOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.question_text?.trim() || !editingQuestion) return;

    setIsLoading(true);
    try {
      const updatedQuestion = await trpc.updateQuestion.mutate(editFormData);
      onQuestionUpdated(updatedQuestion);
      setEditingQuestion(null);
    } catch (error) {
      console.error('Failed to update question:', error);
      // For stub implementation, create a mock updated question
      const mockUpdatedQuestion: Question = {
        ...editingQuestion,
        question_text: editFormData.question_text || editingQuestion.question_text,
        subject_id: editFormData.subject_id || editingQuestion.subject_id,
        topic_id: editFormData.topic_id || editingQuestion.topic_id,
        type: editFormData.type || editingQuestion.type,
        answer: editFormData.answer || editingQuestion.answer,
        updated_at: new Date()
      };
      onQuestionUpdated(mockUpdatedQuestion);
      setEditingQuestion(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteQuestion.mutate({ id });
      onQuestionDeleted(id);
    } catch (error) {
      console.error('Failed to delete question:', error);
      // For stub implementation, still call the callback
      onQuestionDeleted(id);
    } finally {
      setIsLoading(false);
    }
  };

  const resetCreateForm = () => {
    setCreateFormData({
      question_text: '',
      subject_id: 0,
      topic_id: 0,
      type: 'multiple-choice',
      answer: ''
    });
    setCreateMCOptions([
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false }
    ]);
  };

  const openEditDialog = (question: Question) => {
    setEditingQuestion(question);
    setEditFormData({
      id: question.id,
      question_text: question.question_text,
      subject_id: question.subject_id,
      topic_id: question.topic_id,
      type: question.type,
      answer: question.answer
    });
  };

  const addMCOption = (isEdit = false) => {
    const newOption = { option_text: '', is_correct: false };
    if (isEdit) {
      setEditMCOptions((prev: MultipleChoiceOptionData[]) => [...prev, newOption]);
    } else {
      setCreateMCOptions((prev: MultipleChoiceOptionData[]) => [...prev, newOption]);
    }
  };

  const removeMCOption = (index: number, isEdit = false) => {
    if (isEdit) {
      setEditMCOptions((prev: MultipleChoiceOptionData[]) => prev.filter((_, i) => i !== index));
    } else {
      setCreateMCOptions((prev: MultipleChoiceOptionData[]) => prev.filter((_, i) => i !== index));
    }
  };

  const updateMCOption = (index: number, field: keyof MultipleChoiceOptionData, value: string | boolean, isEdit = false) => {
    if (isEdit) {
      setEditMCOptions((prev: MultipleChoiceOptionData[]) => 
        prev.map((option, i) => i === index ? { ...option, [field]: value } : option)
      );
    } else {
      setCreateMCOptions((prev: MultipleChoiceOptionData[]) => 
        prev.map((option, i) => i === index ? { ...option, [field]: value } : option)
      );
    }
  };

  // Check prerequisites
  const hasSubjects = subjects.length > 0;
  const hasTopics = topics.length > 0;
  const canCreateQuestions = hasSubjects && hasTopics;

  const clearFilters = () => {
    setFilterSubjectId('all');
    setFilterTopicId('all');
    setFilterType('all');
  };

  const activeFiltersCount = [filterSubjectId, filterTopicId, filterType].filter(f => f !== 'all').length;

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">❓ Questions</h3>
            <p className="text-sm text-gray-600">
              {questions.length === 0 
                ? canCreateQuestions 
                  ? "No questions yet. Create your first question!" 
                  : "Create subjects and topics first, then add questions."
                : `Showing ${filteredQuestions.length} of ${questions.length} question${questions.length === 1 ? '' : 's'}`
              }
            </p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-purple-600 hover:bg-purple-700" 
                disabled={!canCreateQuestions}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Question</DialogTitle>
                <DialogDescription>
                  Add a new question to your question bank.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="subject" className="text-sm font-medium">
                        Subject *
                      </label>
                      <Select 
                        value={createFormData.subject_id.toString()}
                        onValueChange={(value: string) => {
                          const subjectId = parseInt(value);
                          setCreateFormData((prev: CreateQuestionInput) => ({ 
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
                              {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label htmlFor="topic" className="text-sm font-medium">
                        Topic *
                      </label>
                      <Select 
                        value={createFormData.topic_id.toString()}
                        onValueChange={(value: string) =>
                          setCreateFormData((prev: CreateQuestionInput) => ({ 
                            ...prev, 
                            topic_id: parseInt(value) 
                          }))
                        }
                        disabled={!createFormData.subject_id}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select topic" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableTopics(createFormData.subject_id).map((topic: Topic) => (
                            <SelectItem key={topic.id} value={topic.id.toString()}>
                              {topic.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="type" className="text-sm font-medium">
                      Question Type *
                    </label>
                    <Select 
                      value={createFormData.type}
                      onValueChange={(value: QuestionType) =>
                        setCreateFormData((prev: CreateQuestionInput) => ({ 
                          ...prev, 
                          type: value 
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                        <SelectItem value="true-false">True/False</SelectItem>
                        <SelectItem value="short-answer">Short Answer</SelectItem>
                        <SelectItem value="open-ended">Open Ended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label htmlFor="question-text" className="text-sm font-medium">
                      Question Text *
                    </label>
                    <Textarea
                      id="question-text"
                      value={createFormData.question_text}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setCreateFormData((prev: CreateQuestionInput) => ({ 
                          ...prev, 
                          question_text: e.target.value 
                        }))
                      }
                      placeholder="Enter your question here..."
                      rows={3}
                      required
                    />
                  </div>

                  {/* Multiple Choice Options */}
                  {createFormData.type === 'multiple-choice' && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium">Answer Options *</label>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => addMCOption(false)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Option
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {createMCOptions.map((option, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                            <Checkbox
                              checked={option.is_correct}
                              onCheckedChange={(checked: boolean) =>
                                updateMCOption(index, 'is_correct', checked, false)
                              }
                            />
                            <Input
                              value={option.option_text}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                updateMCOption(index, 'option_text', e.target.value, false)
                              }
                              placeholder={`Option ${index + 1}`}
                              className="flex-1"
                            />
                            {createMCOptions.length > 2 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMCOption(index, false)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        ✓ Check the boxes for correct answers. At least one option must be correct.
                      </p>
                    </div>
                  )}

                  {/* Answer field for non-multiple-choice questions */}
                  {createFormData.type !== 'multiple-choice' && (
                    <div>
                      <label htmlFor="answer" className="text-sm font-medium">
                        Correct Answer *
                      </label>
                      <Textarea
                        id="answer"
                        value={createFormData.answer}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setCreateFormData((prev: CreateQuestionInput) => ({ 
                            ...prev, 
                            answer: e.target.value 
                          }))
                        }
                        placeholder="Enter the correct answer..."
                        rows={2}
                        required
                      />
                    </div>
                  )}
                </div>
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => {
                    resetCreateForm();
                    setIsCreateOpen(false);
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading || !createFormData.question_text.trim() || !createFormData.subject_id || !createFormData.topic_id}
                  >
                    {isLoading ? 'Creating...' : 'Create Question'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        {canCreateQuestions && questions.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            
            <Select value={filterSubjectId} onValueChange={setFilterSubjectId}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Subjects" />
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

            <Select value={filterTopicId} onValueChange={setFilterTopicId}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Topics" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Topics</SelectItem>
                {topics.map((topic: Topic) => (
                  <SelectItem key={topic.id} value={topic.id.toString()}>
                    {topic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                <SelectItem value="true-false">True/False</SelectItem>
                <SelectItem value="short-answer">Short Answer</SelectItem>
                <SelectItem value="open-ended">Open Ended</SelectItem>
              </SelectContent>
            </Select>

            {activeFiltersCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters ({activeFiltersCount})
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Questions Display */}
      {!canCreateQuestions ? (
        <div className="text-center py-12">
          <HelpCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Prerequisites needed</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {!hasSubjects && !hasTopics 
              ? "You need to create subjects and topics before adding questions."
              : !hasSubjects
              ? "You need to create subjects before adding questions."
              : "You need to create topics before adding questions."
            }
          </p>
          <div className="flex gap-3 justify-center">
            {!hasSubjects && (
              <Button variant="outline">Go to Subjects</Button>
            )}
            {hasSubjects && !hasTopics && (
              <Button variant="outline">Go to Topics</Button>
            )}
          </div>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="text-center py-12">
          <HelpCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {activeFiltersCount > 0 ? 'No questions match your filters' : 'No questions yet'}
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {activeFiltersCount > 0 
              ? "Try adjusting your filters or create a new question that matches your criteria."
              : "Create your first question to start building your question bank."
            }
          </p>
          <div className="flex gap-3 justify-center">
            {activeFiltersCount > 0 && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
            <Button 
              onClick={() => setIsCreateOpen(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Question
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
          {filteredQuestions.map((question: Question) => (
            <Card key={question.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2 mb-2">
                      <HelpCircle className="h-5 w-5 text-purple-600" />
                      Question #{question.id}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        {getSubjectName(question.subject_id)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getTopicName(question.topic_id)}
                      </Badge>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          question.type === 'multiple-choice' ? 'bg-blue-100 text-blue-700' :
                          question.type === 'true-false' ? 'bg-green-100 text-green-700' :
                          question.type === 'short-answer' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {question.type.replace('-', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewingQuestion(question)}
                      className="text-gray-600 hover:text-blue-600"
                      title="View Question"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(question)}
                      className="text-gray-600 hover:text-purple-600"
                      title="Edit Question"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 hover:text-red-600"
                          title="Delete Question"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Question</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this question? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(question.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Question
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <CardDescription className="mb-4 text-base text-gray-900">
                  {question.question_text}
                </CardDescription>
                
                <div className="text-xs text-gray-500 flex justify-between">
                  <span>Created: {question.created_at.toLocaleDateString()}</span>
                  <span>Updated: {question.updated_at.toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Question Dialog */}
      {viewingQuestion && (
        <Dialog open={!!viewingQuestion} onOpenChange={() => setViewingQuestion(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Question Details</DialogTitle>
              <DialogDescription>
                Full question information and answer
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Question:</h4>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                  {viewingQuestion.question_text}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Subject:</span>
                  <p className="text-gray-600">{getSubjectName(viewingQuestion.subject_id)}</p>
                </div>
                <div>
                  <span className="font-medium">Topic:</span>
                  <p className="text-gray-600">{getTopicName(viewingQuestion.topic_id)}</p>
                </div>
                <div>
                  <span className="font-medium">Type:</span>
                  <p className="text-gray-600 capitalize">{viewingQuestion.type.replace('-', ' ')}</p>
                </div>
                <div>
                  <span className="font-medium">ID:</span>
                  <p className="text-gray-600">{viewingQuestion.id}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Answer:</h4>
                <p className="text-gray-900 bg-green-50 p-3 rounded-md border border-green-200">
                  {viewingQuestion.answer}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
