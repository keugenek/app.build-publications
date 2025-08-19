import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Wand2, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { trpc } from '@/utils/trpc';

import type { Subject, Topic, GenerateQuizInput, Quiz } from '../../../server/src/schema';

interface QuizFormData {
  title: string;
  description: string | null;
  subject_ids: number[];
  topic_ids: number[];
  question_count: number;
  difficulty_levels: ('easy' | 'medium' | 'hard')[];
}

export function QuizGeneration() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<Quiz | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState<QuizFormData>({
    title: '',
    description: null,
    subject_ids: [],
    topic_ids: [],
    question_count: 10,
    difficulty_levels: ['medium']
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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

  useEffect(() => {
    loadSubjects();
    loadTopics();
  }, [loadSubjects, loadTopics]);

  // Get topics for selected subjects
  const getAvailableTopics = (): Topic[] => {
    if (formData.subject_ids.length === 0) return [];
    return topics.filter((topic: Topic) => formData.subject_ids.includes(topic.subject_id));
  };

  // Form handlers
  const handleSubjectToggle = (subjectId: number, checked: boolean) => {
    if (checked) {
      setFormData((prev: QuizFormData) => ({
        ...prev,
        subject_ids: [...prev.subject_ids, subjectId]
      }));
    } else {
      setFormData((prev: QuizFormData) => ({
        ...prev,
        subject_ids: prev.subject_ids.filter((id: number) => id !== subjectId),
        // Remove topics from deselected subject
        topic_ids: prev.topic_ids.filter((topicId: number) => {
          const topic = topics.find((t: Topic) => t.id === topicId);
          return topic ? topic.subject_id !== subjectId : false;
        })
      }));
    }
  };

  const handleTopicToggle = (topicId: number, checked: boolean) => {
    if (checked) {
      setFormData((prev: QuizFormData) => ({
        ...prev,
        topic_ids: [...prev.topic_ids, topicId]
      }));
    } else {
      setFormData((prev: QuizFormData) => ({
        ...prev,
        topic_ids: prev.topic_ids.filter((id: number) => id !== topicId)
      }));
    }
  };

  const handleDifficultyToggle = (difficulty: 'easy' | 'medium' | 'hard', checked: boolean) => {
    if (checked) {
      setFormData((prev: QuizFormData) => ({
        ...prev,
        difficulty_levels: [...prev.difficulty_levels, difficulty]
      }));
    } else {
      setFormData((prev: QuizFormData) => ({
        ...prev,
        difficulty_levels: prev.difficulty_levels.filter((d: string) => d !== difficulty)
      }));
    }
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Quiz title is required';
    }

    if (formData.subject_ids.length === 0) {
      newErrors.subjects = 'At least one subject must be selected';
    }

    if (formData.question_count < 1 || formData.question_count > 100) {
      newErrors.question_count = 'Question count must be between 1 and 100';
    }

    if (formData.difficulty_levels.length === 0) {
      newErrors.difficulty = 'At least one difficulty level must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setShowSuccess(false);
    
    try {
      const quizInput: GenerateQuizInput = {
        title: formData.title,
        description: formData.description || null,
        subject_ids: formData.subject_ids,
        topic_ids: formData.topic_ids.length > 0 ? formData.topic_ids : undefined,
        question_count: formData.question_count,
        difficulty_levels: formData.difficulty_levels.length > 0 ? formData.difficulty_levels : undefined
      };

      const response = await trpc.generateQuiz.mutate(quizInput);
      setGeneratedQuiz(response);
      setShowSuccess(true);
      
      // Reset form
      setFormData({
        title: '',
        description: null,
        subject_ids: [],
        topic_ids: [],
        question_count: 10,
        difficulty_levels: ['medium']
      });

      // Scroll to success message
      setTimeout(() => {
        const successElement = document.getElementById('quiz-success');
        if (successElement) {
          successElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);

    } catch (error) {
      console.error('Failed to generate quiz:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (level: string): string => {
    switch (level) {
      case 'easy': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'hard': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSubjectName = (subjectId: number): string => {
    const subject = subjects.find((s: Subject) => s.id === subjectId);
    return subject ? subject.name : 'Unknown Subject';
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {showSuccess && generatedQuiz && (
        <Alert id="quiz-success" className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            🎉 Quiz "{generatedQuiz.title}" has been successfully generated! 
            You can view and manage it in the Quiz Management section.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-purple-600" />
            Generate New Quiz
          </CardTitle>
          <CardDescription>
            Create a customized quiz by selecting subjects, topics, and difficulty levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerateQuiz} className="space-y-6">
            {/* Quiz Basic Info */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">📝 Quiz Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Quiz Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: QuizFormData) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Enter quiz title (e.g., Math Quiz - Chapter 1)"
                    className={errors.title ? 'border-red-300' : ''}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600 mt-1">{errors.title}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="question_count">Number of Questions *</Label>
                  <Input
                    id="question_count"
                    type="number"
                    value={formData.question_count}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: QuizFormData) => ({ ...prev, question_count: parseInt(e.target.value) || 1 }))
                    }
                    min="1"
                    max="100"
                    className={errors.question_count ? 'border-red-300' : ''}
                  />
                  {errors.question_count && (
                    <p className="text-sm text-red-600 mt-1">{errors.question_count}</p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: QuizFormData) => ({ ...prev, description: e.target.value || null }))
                  }
                  placeholder="Brief description of the quiz..."
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            {/* Subject Selection */}
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">📚 Subject Selection *</h4>
                <p className="text-sm text-gray-600">Choose which subjects to include in your quiz</p>
                {errors.subjects && (
                  <p className="text-sm text-red-600 mt-1">{errors.subjects}</p>
                )}
              </div>
              
              {subjects.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No subjects available. Please create subjects first in the Subject Management section.
                    <Badge variant="secondary" className="ml-2">📊 Backend returns stub data</Badge>
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {subjects.map((subject: Subject) => (
                    <div key={subject.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                      <Checkbox
                        id={`subject-${subject.id}`}
                        checked={formData.subject_ids.includes(subject.id)}
                        onCheckedChange={(checked: boolean) => handleSubjectToggle(subject.id, checked)}
                      />
                      <Label htmlFor={`subject-${subject.id}`} className="flex-1 cursor-pointer">
                        <div>
                          <p className="font-medium">{subject.name}</p>
                          {subject.description && (
                            <p className="text-xs text-gray-600 mt-1">{subject.description}</p>
                          )}
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Topic Selection */}
            {formData.subject_ids.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">🏷️ Topic Selection (Optional)</h4>
                    <p className="text-sm text-gray-600">
                      Narrow down to specific topics. Leave empty to include all topics from selected subjects.
                    </p>
                  </div>
                  
                  {getAvailableTopics().length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No topics available for selected subjects. Questions will be selected from all topics in the chosen subjects.
                        <Badge variant="secondary" className="ml-2">📊 Backend returns stub data</Badge>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {getAvailableTopics().map((topic: Topic) => (
                        <div key={topic.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                          <Checkbox
                            id={`topic-${topic.id}`}
                            checked={formData.topic_ids.includes(topic.id)}
                            onCheckedChange={(checked: boolean) => handleTopicToggle(topic.id, checked)}
                          />
                          <Label htmlFor={`topic-${topic.id}`} className="flex-1 cursor-pointer">
                            <div>
                              <p className="font-medium">{topic.name}</p>
                              <p className="text-xs text-gray-500">
                                {getSubjectName(topic.subject_id)}
                              </p>
                              {topic.description && (
                                <p className="text-xs text-gray-600 mt-1">{topic.description}</p>
                              )}
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <Separator />

            {/* Difficulty Selection */}
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">⚡ Difficulty Levels *</h4>
                <p className="text-sm text-gray-600">Select which difficulty levels to include</p>
                {errors.difficulty && (
                  <p className="text-sm text-red-600 mt-1">{errors.difficulty}</p>
                )}
              </div>
              
              <div className="flex flex-wrap gap-4">
                {[
                  { value: 'easy', label: '🟢 Easy', description: 'Basic concepts and straightforward questions' },
                  { value: 'medium', label: '🟡 Medium', description: 'Moderate difficulty with some complexity' },
                  { value: 'hard', label: '🔴 Hard', description: 'Advanced concepts and challenging questions' }
                ].map((difficulty) => (
                  <div key={difficulty.value} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 flex-1 min-w-0">
                    <Checkbox
                      id={`difficulty-${difficulty.value}`}
                      checked={formData.difficulty_levels.includes(difficulty.value as 'easy' | 'medium' | 'hard')}
                      onCheckedChange={(checked: boolean) => 
                        handleDifficultyToggle(difficulty.value as 'easy' | 'medium' | 'hard', checked)
                      }
                    />
                    <Label htmlFor={`difficulty-${difficulty.value}`} className="flex-1 cursor-pointer">
                      <div>
                        <p className={`font-medium ${getDifficultyColor(difficulty.value)}`}>
                          {difficulty.label}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {difficulty.description}
                        </p>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Quiz Summary */}
            {formData.subject_ids.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3">📊 Quiz Preview</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Quiz Title:</span>
                    <span className="font-medium text-blue-900">{formData.title || 'Untitled Quiz'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Questions:</span>
                    <span className="font-medium text-blue-900">{formData.question_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Subjects:</span>
                    <span className="font-medium text-blue-900">{formData.subject_ids.length} selected</span>
                  </div>
                  {formData.topic_ids.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-blue-700">Topics:</span>
                      <span className="font-medium text-blue-900">{formData.topic_ids.length} selected</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-blue-700">Difficulty Levels:</span>
                    <span className="font-medium text-blue-900">
                      {formData.difficulty_levels.map((d: string) => 
                        d === 'easy' ? '🟢' : d === 'medium' ? '🟡' : '🔴'
                      ).join(' ')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isLoading || subjects.length === 0} 
                className="bg-purple-600 hover:bg-purple-700 min-w-[200px]"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Wand2 className="h-4 w-4" />
                    Generate Quiz
                  </div>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Loading Progress */}
      {isLoading && (
        <Card>
          <CardContent className="py-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center">
                <FileText className="h-8 w-8 text-purple-600 animate-pulse" />
              </div>
              <div className="space-y-2">
                <p className="font-medium">🔄 Generating your quiz...</p>
                <p className="text-sm text-gray-600">This may take a few moments</p>
                <Progress value={75} className="w-full max-w-md mx-auto" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
