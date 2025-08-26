import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { useState, useEffect } from 'react';
import { Plus, Zap, BookOpen, Users, HelpCircle, AlertCircle, CheckCircle } from 'lucide-react';
import type { Subject, Topic, Quiz, GenerateQuizInput } from '../../../server/src/schema';

interface QuizGeneratorProps {
  subjects: Subject[];
  topics: Topic[];
  setQuizzes: (quizzes: Quiz[] | ((prev: Quiz[]) => Quiz[])) => void;
  onQuizGenerated: () => void;
}

export function QuizGenerator({ subjects, topics, setQuizzes, onQuizGenerated }: QuizGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
  const [availableQuestionCount, setAvailableQuestionCount] = useState(0);
  const [generatedQuiz, setGeneratedQuiz] = useState<Quiz | null>(null);

  const [formData, setFormData] = useState<GenerateQuizInput>({
    title: '',
    subject_id: 0,
    topic_id: 0,
    question_count: 5
  });

  // Update available topics when subject changes
  useEffect(() => {
    if (formData.subject_id === 0) {
      setAvailableTopics([]);
      setAvailableQuestionCount(0);
      return;
    }

    const filteredTopics = topics.filter(topic => topic.subject_id === formData.subject_id);
    setAvailableTopics(filteredTopics);
    
    // Reset topic if current selection is not valid for new subject
    if (formData.topic_id !== 0 && !filteredTopics.find(t => t.id === formData.topic_id)) {
      setFormData(prev => ({ ...prev, topic_id: 0 }));
    }
  }, [formData.subject_id, topics]);

  // Get available question count when topic changes
  useEffect(() => {
    const getQuestionCount = async () => {
      if (formData.topic_id === 0) {
        setAvailableQuestionCount(0);
        return;
      }

      try {
        const questions = await trpc.getQuestionsByTopic.query({ topicId: formData.topic_id });
        setAvailableQuestionCount(questions.length);
      } catch (error) {
        console.error('Failed to get question count:', error);
        setAvailableQuestionCount(0);
      }
    };

    getQuestionCount();
  }, [formData.topic_id]);

  const getSubjectName = (subjectId: number) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || '';
  };

  const getTopicName = (topicId: number) => {
    const topic = topics.find(t => t.id === topicId);
    return topic?.name || '';
  };

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || formData.subject_id === 0 || formData.topic_id === 0 || 
        formData.question_count <= 0 || formData.question_count > availableQuestionCount) {
      return;
    }

    setIsLoading(true);
    try {
      const newQuiz = await trpc.generateQuiz.mutate(formData);
      setQuizzes((prev: Quiz[]) => [...prev, newQuiz]);
      setGeneratedQuiz(newQuiz);
      setFormData({ title: '', subject_id: 0, topic_id: 0, question_count: 5 });
    } catch (error) {
      console.error('Failed to generate quiz:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.title.trim() && formData.subject_id !== 0 && formData.topic_id !== 0 && 
                     formData.question_count > 0 && formData.question_count <= availableQuestionCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
          <Plus className="h-6 w-6 text-orange-600" />
          🚀 Quiz Generator
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Automatically generate quizzes from your question bank
        </p>
      </div>

      {/* Success Alert */}
      {generatedQuiz && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <div className="flex items-center justify-between">
              <span>
                Quiz "{generatedQuiz.title}" generated successfully with {generatedQuiz.question_count} questions!
              </span>
              <Button 
                size="sm" 
                onClick={() => {
                  onQuizGenerated();
                  setGeneratedQuiz(null);
                }}
                className="ml-4"
              >
                View Quiz
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quiz Generator Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-600" />
                Generate New Quiz
              </CardTitle>
              <CardDescription>
                Select a subject, topic, and number of questions to create a quiz
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subjects.length === 0 || topics.length === 0 ? (
                <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800 dark:text-orange-200">
                    {subjects.length === 0 
                      ? 'You need to create subjects first before generating quizzes.'
                      : 'You need to create topics and questions before generating quizzes.'
                    }
                  </AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={handleGenerateQuiz} className="space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Quiz Title *</label>
                    <Input
                      placeholder="e.g., Math Quiz Chapter 1, History Test"
                      value={formData.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: GenerateQuizInput) => ({ ...prev, title: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Subject *</label>
                      <Select
                        value={formData.subject_id.toString()}
                        onValueChange={(value) =>
                          setFormData((prev: GenerateQuizInput) => ({ 
                            ...prev, 
                            subject_id: parseInt(value),
                            topic_id: 0 // Reset topic when subject changes
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subject: Subject) => (
                            <SelectItem key={subject.id} value={subject.id.toString()}>
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4" />
                                {subject.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Topic *</label>
                      <Select
                        value={formData.topic_id.toString()}
                        onValueChange={(value) =>
                          setFormData((prev: GenerateQuizInput) => ({ 
                            ...prev, 
                            topic_id: parseInt(value) 
                          }))
                        }
                        disabled={formData.subject_id === 0 || availableTopics.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a topic" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTopics.map((topic: Topic) => (
                            <SelectItem key={topic.id} value={topic.id.toString()}>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                {topic.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.subject_id !== 0 && availableTopics.length === 0 && (
                        <p className="text-xs text-orange-600 mt-1">
                          No topics available for this subject
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Number of Questions *
                      {availableQuestionCount > 0 && (
                        <span className="text-gray-500 font-normal">
                          (Max: {availableQuestionCount})
                        </span>
                      )}
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max={availableQuestionCount}
                      placeholder="5"
                      value={formData.question_count}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: GenerateQuizInput) => ({ 
                          ...prev, 
                          question_count: parseInt(e.target.value) || 0 
                        }))
                      }
                      required
                      disabled={availableQuestionCount === 0}
                    />
                    {formData.topic_id !== 0 && availableQuestionCount === 0 && (
                      <p className="text-xs text-red-600 mt-1">
                        No questions available for this topic
                      </p>
                    )}
                    {formData.question_count > availableQuestionCount && availableQuestionCount > 0 && (
                      <p className="text-xs text-red-600 mt-1">
                        Cannot exceed {availableQuestionCount} questions
                      </p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isLoading || !isFormValid}
                    className="w-full flex items-center gap-2"
                  >
                    <Zap className="h-4 w-4" />
                    {isLoading ? 'Generating Quiz...' : 'Generate Quiz'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-blue-600" />
                Quiz Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.subject_id !== 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Selected Subject:</label>
                  <Badge variant="outline" className="ml-2 bg-blue-50">
                    {getSubjectName(formData.subject_id)}
                  </Badge>
                </div>
              )}

              {formData.topic_id !== 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Selected Topic:</label>
                  <Badge variant="outline" className="ml-2 bg-green-50">
                    {getTopicName(formData.topic_id)}
                  </Badge>
                </div>
              )}

              {availableQuestionCount > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Available Questions:</label>
                  <Badge variant="outline" className="ml-2 bg-purple-50">
                    {availableQuestionCount}
                  </Badge>
                </div>
              )}

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">💡 Tips:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Choose a descriptive title for your quiz</li>
                  <li>• Select the subject and topic carefully</li>
                  <li>• Questions are randomly selected</li>
                  <li>• You can export quizzes to PDF later</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">📊 Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{subjects.length}</div>
                  <div className="text-xs text-gray-500">Subjects</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{topics.length}</div>
                  <div className="text-xs text-gray-500">Topics</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
