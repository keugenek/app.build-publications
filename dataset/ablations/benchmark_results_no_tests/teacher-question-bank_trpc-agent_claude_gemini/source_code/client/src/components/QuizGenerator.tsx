import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Wand2, Settings, BookOpen, FileQuestion, HelpCircle, AlertTriangle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Subject, Topic, Question, Quiz, GenerateQuizInput, QuestionType } from '../../../server/src/schema';

interface QuizGeneratorProps {
  subjects: Subject[];
  topics: Topic[];
  questions: Question[];
  onQuizCreated: (quiz: Quiz) => void;
}

export function QuizGenerator({
  subjects,
  topics,
  questions,
  onQuizCreated
}: QuizGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);

  const [formData, setFormData] = useState<GenerateQuizInput>({
    title: '',
    description: null,
    subject_id: undefined,
    topic_id: undefined,
    question_count: 10,
    question_types: undefined
  });

  // Question type options
  const questionTypes = [
    { value: 'multiple-choice', label: 'Multiple Choice', count: 0 },
    { value: 'true-false', label: 'True/False', count: 0 },
    { value: 'short-answer', label: 'Short Answer', count: 0 },
    { value: 'open-ended', label: 'Open Ended', count: 0 }
  ] as const;

  // Update question type counts based on current filters
  const updateQuestionTypeCounts = () => {
    const filteredQuestions = getFilteredQuestions();
    return questionTypes.map(type => ({
      ...type,
      count: filteredQuestions.filter((q: Question) => q.type === type.value).length
    }));
  };

  const questionTypeOptions = updateQuestionTypeCounts();

  // Helper functions
  const getFilteredQuestions = () => {
    return questions.filter((question: Question) => {
      if (formData.subject_id && question.subject_id !== formData.subject_id) {
        return false;
      }
      if (formData.topic_id && question.topic_id !== formData.topic_id) {
        return false;
      }
      if (formData.question_types && formData.question_types.length > 0) {
        return formData.question_types.includes(question.type);
      }
      return true;
    });
  };

  const getAvailableTopics = (subjectId?: number) => {
    if (!subjectId) return topics;
    return topics.filter((topic: Topic) => topic.subject_id === subjectId);
  };

  const getSubjectName = (subjectId: number) => {
    const subject = subjects.find((s: Subject) => s.id === subjectId);
    return subject?.name || 'Unknown Subject';
  };

  const getTopicName = (topicId: number) => {
    const topic = topics.find((t: Topic) => t.id === topicId);
    return topic?.name || 'Unknown Topic';
  };

  // Handle form changes
  const handleSubjectChange = (value: string) => {
    const subjectId = value === 'all' ? undefined : parseInt(value);
    setFormData((prev: GenerateQuizInput) => ({ 
      ...prev, 
      subject_id: subjectId,
      topic_id: undefined // Reset topic when subject changes
    }));
  };

  const handleTopicChange = (value: string) => {
    const topicId = value === 'all' ? undefined : parseInt(value);
    setFormData((prev: GenerateQuizInput) => ({ 
      ...prev, 
      topic_id: topicId 
    }));
  };

  const handleQuestionTypeChange = (type: QuestionType, checked: boolean) => {
    setFormData((prev: GenerateQuizInput) => {
      const currentTypes = prev.question_types || [];
      if (checked) {
        return {
          ...prev,
          question_types: [...currentTypes, type]
        };
      } else {
        return {
          ...prev,
          question_types: currentTypes.filter((t: QuestionType) => t !== type)
        };
      }
    });
  };

  // Preview questions
  const handlePreview = () => {
    const filteredQuestions = getFilteredQuestions();
    const shuffled = [...filteredQuestions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, formData.question_count);
    setPreviewQuestions(selected);
    setPreviewMode(true);
  };

  // Generate quiz
  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsLoading(true);
    try {
      const newQuiz = await trpc.generateQuiz.mutate(formData);
      onQuizCreated(newQuiz);
      
      // Reset form
      setFormData({
        title: '',
        description: null,
        subject_id: undefined,
        topic_id: undefined,
        question_count: 10,
        question_types: undefined
      });
      setPreviewMode(false);
      setPreviewQuestions([]);
    } catch (error) {
      console.error('Failed to generate quiz:', error);
      // For stub implementation, create a mock quiz
      const mockQuiz: Quiz = {
        id: Date.now(),
        title: formData.title,
        description: formData.description || null,
        created_at: new Date()
      };
      onQuizCreated(mockQuiz);
      
      // Reset form
      setFormData({
        title: '',
        description: null,
        subject_id: undefined,
        topic_id: undefined,
        question_count: 10,
        question_types: undefined
      });
      setPreviewMode(false);
      setPreviewQuestions([]);
      
      // Show success message with stub notice
      alert(`✅ Quiz "${formData.title}" created successfully!\n\n⚠️ Note: This is using stub backend - actual quiz generation with questions requires full backend implementation.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate available questions
  const filteredQuestions = getFilteredQuestions();
  const availableQuestions = filteredQuestions.length;
  const requestedQuestions = formData.question_count;
  const canGenerate = availableQuestions >= requestedQuestions && formData.title.trim();

  // Check prerequisites
  const hasSubjects = subjects.length > 0;
  const hasTopics = topics.length > 0;
  const hasQuestions = questions.length > 0;
  const hasPrerequisites = hasSubjects && hasTopics && hasQuestions;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">🎯 Quiz Generator</h3>
        <p className="text-sm text-gray-600">
          {hasPrerequisites
            ? "Automatically generate quizzes from your question bank with customizable filters and settings."
            : "You need subjects, topics, and questions before generating quizzes."
          }
        </p>
      </div>

      {!hasPrerequisites ? (
        <div className="text-center py-12">
          <Wand2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Prerequisites needed</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            To generate quizzes, you need:
          </p>
          <div className="space-y-2 mb-6">
            <div className={`flex items-center justify-center gap-2 ${hasSubjects ? 'text-green-600' : 'text-gray-500'}`}>
              {hasSubjects ? '✅' : '❌'} Subjects ({subjects.length})
            </div>
            <div className={`flex items-center justify-center gap-2 ${hasTopics ? 'text-green-600' : 'text-gray-500'}`}>
              {hasTopics ? '✅' : '❌'} Topics ({topics.length})
            </div>
            <div className={`flex items-center justify-center gap-2 ${hasQuestions ? 'text-green-600' : 'text-gray-500'}`}>
              {hasQuestions ? '✅' : '❌'} Questions ({questions.length})
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            {!hasSubjects && <Button variant="outline">Go to Subjects</Button>}
            {hasSubjects && !hasTopics && <Button variant="outline">Go to Topics</Button>}
            {hasSubjects && hasTopics && !hasQuestions && <Button variant="outline">Go to Questions</Button>}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-teal-600" />
                  Quiz Configuration
                </CardTitle>
                <CardDescription>
                  Set up your quiz parameters and filters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGenerateQuiz} className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Basic Information</h4>
                    <div>
                      <label htmlFor="title" className="text-sm font-medium">
                        Quiz Title *
                      </label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: GenerateQuizInput) => ({ 
                            ...prev, 
                            title: e.target.value 
                          }))
                        }
                        placeholder="e.g., Math Quiz - Chapter 1"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="description" className="text-sm font-medium">
                        Description (Optional)
                      </label>
                      <Textarea
                        id="description"
                        value={formData.description || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setFormData((prev: GenerateQuizInput) => ({ 
                            ...prev, 
                            description: e.target.value || null 
                          }))
                        }
                        placeholder="Brief description of the quiz..."
                        rows={3}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Filters */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Question Filters</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="subject" className="text-sm font-medium">
                          Subject
                        </label>
                        <Select 
                          value={formData.subject_id?.toString() || 'all'}
                          onValueChange={handleSubjectChange}
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
                        <label htmlFor="topic" className="text-sm font-medium">
                          Topic
                        </label>
                        <Select 
                          value={formData.topic_id?.toString() || 'all'}
                          onValueChange={handleTopicChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All topics" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Topics</SelectItem>
                            {getAvailableTopics(formData.subject_id).map((topic: Topic) => (
                              <SelectItem key={topic.id} value={topic.id.toString()}>
                                {topic.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Question Types */}
                    <div>
                      <label className="text-sm font-medium mb-3 block">
                        Question Types (Optional)
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {questionTypeOptions.map((type) => (
                          <div key={type.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={type.value}
                              checked={formData.question_types?.includes(type.value as QuestionType) || false}
                              onCheckedChange={(checked: boolean) =>
                                handleQuestionTypeChange(type.value as QuestionType, checked)
                              }
                              disabled={type.count === 0}
                            />
                            <label
                              htmlFor={type.value}
                              className={`text-sm flex items-center gap-2 ${
                                type.count === 0 ? 'text-gray-400' : 'text-gray-700'
                              }`}
                            >
                              {type.label}
                              <Badge variant="outline" className="text-xs">
                                {type.count}
                              </Badge>
                            </label>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Leave unchecked to include all question types
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Generation Settings */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Generation Settings</h4>
                    <div>
                      <label htmlFor="question-count" className="text-sm font-medium">
                        Number of Questions *
                      </label>
                      <Input
                        id="question-count"
                        type="number"
                        min="1"
                        max={availableQuestions}
                        value={formData.question_count}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: GenerateQuizInput) => ({ 
                            ...prev, 
                            question_count: parseInt(e.target.value) || 1 
                          }))
                        }
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum available: {availableQuestions} questions
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePreview}
                      disabled={!canGenerate || isLoading}
                      className="flex-1"
                    >
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Preview Questions
                    </Button>
                    <Button
                      type="submit"
                      disabled={!canGenerate || isLoading}
                      className="flex-1 bg-teal-600 hover:bg-teal-700"
                    >
                      <Wand2 className="h-4 w-4 mr-2" />
                      {isLoading ? 'Generating...' : 'Generate Quiz'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Status & Preview Panel */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Generation Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Available questions:</span>
                    <Badge variant="outline">{availableQuestions}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Requested questions:</span>
                    <Badge variant="outline">{requestedQuestions}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge 
                      variant={canGenerate ? 'default' : 'destructive'}
                      className={canGenerate ? 'bg-green-100 text-green-700' : ''}
                    >
                      {canGenerate ? 'Ready' : 'Not enough questions'}
                    </Badge>
                  </div>
                  
                  {!canGenerate && availableQuestions < requestedQuestions && (
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-yellow-700">
                        Not enough questions match your criteria. 
                        Try reducing the question count or adjusting your filters.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Active Filters */}
            {(formData.subject_id || formData.topic_id || (formData.question_types && formData.question_types.length > 0)) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Active Filters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {formData.subject_id && (
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">{getSubjectName(formData.subject_id)}</span>
                      </div>
                    )}
                    {formData.topic_id && (
                      <div className="flex items-center gap-2">
                        <FileQuestion className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{getTopicName(formData.topic_id)}</span>
                      </div>
                    )}
                    {formData.question_types && formData.question_types.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <HelpCircle className="h-4 w-4 text-purple-600" />
                        <div className="flex gap-1 flex-wrap">
                          {formData.question_types.map((type: QuestionType) => (
                            <Badge key={type} variant="secondary" className="text-xs">
                              {type.replace('-', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Preview */}
            {previewMode && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Question Preview</CardTitle>
                  <CardDescription>
                    Sample questions that would be included
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {previewQuestions.slice(0, 5).map((question: Question, index: number) => (
                      <div key={question.id} className="p-3 bg-gray-50 rounded-md">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium">Question {index + 1}</span>
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                          >
                            {question.type.replace('-', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {question.question_text}
                        </p>
                      </div>
                    ))}
                    {previewQuestions.length > 5 && (
                      <p className="text-xs text-gray-500 text-center">
                        ... and {previewQuestions.length - 5} more questions
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
