import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
// Tabs components removed as they're not used in this component
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
// Separator component removed as it's not used
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  Eye, 
  Download, 
  Trash2, 
  Calendar, 
  HelpCircle, 
  CheckCircle, 
  Clock,
  Printer,
  // Share and Settings removed as they're not used
} from 'lucide-react';
import { trpc } from '@/utils/trpc';

import type { Quiz, QuizWithQuestions, Subject, Topic } from '../../../server/src/schema';

export function QuizManagement() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizWithQuestions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeAnswers: false,
    includeExplanations: true
  });

  // Load data
  const loadQuizzes = useCallback(async () => {
    try {
      const result = await trpc.getQuizzes.query();
      setQuizzes(result);
    } catch (error) {
      console.error('Failed to load quizzes:', error);
    }
  }, []);

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
    loadQuizzes();
    loadSubjects();
    loadTopics();
  }, [loadQuizzes, loadSubjects, loadTopics]);

  // View quiz details
  const viewQuizDetails = async (quiz: Quiz) => {
    setIsLoading(true);
    try {
      const quizDetails = await trpc.getQuizById.query({ id: quiz.id });
      setSelectedQuiz(quizDetails);
      setViewDialogOpen(true);
    } catch (error) {
      console.error('Failed to load quiz details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete quiz
  const handleDeleteQuiz = async (quiz: Quiz) => {
    try {
      await trpc.deleteQuiz.mutate({ id: quiz.id });
      setQuizzes((prev: Quiz[]) => prev.filter((q: Quiz) => q.id !== quiz.id));
    } catch (error) {
      console.error('Failed to delete quiz:', error);
    }
  };

  // Export quiz
  const handleExportQuiz = async (quiz: Quiz) => {
    setIsLoading(true);
    try {
      const response = await trpc.exportQuiz.mutate({ 
        quiz_id: quiz.id, 
        include_answers: exportOptions.includeAnswers 
      });
      
      // In a real implementation, this would trigger a PDF download
      console.log('Export response:', response);
      
      // Simulate file download for demo
      const blob = new Blob([`Quiz: ${quiz.title}\nGenerated on: ${new Date().toLocaleString()}\n\nThis is a placeholder for the actual PDF export functionality.`], { 
        type: 'text/plain' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${quiz.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      
      setExportDialogOpen(false);
    } catch (error) {
      console.error('Failed to export quiz:', error);
    } finally {
      setIsLoading(false);
    }
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

  const formatTimeEstimate = (questionCount: number): string => {
    const estimatedMinutes = Math.ceil(questionCount * 1.5); // 1.5 minutes per question
    return `~${estimatedMinutes} min`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Generated Quizzes ({quizzes.length})</h3>
          <p className="text-sm text-gray-600">View, export, and manage your created quizzes</p>
        </div>
      </div>

      {/* Quizzes List */}
      {quizzes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes yet</h3>
            <p className="text-gray-500 text-center mb-4">
              Generate your first quiz in the Quiz Generation section to get started! 🎯
            </p>
            <Badge variant="secondary">📊 Backend returns stub data</Badge>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {quizzes.map((quiz: Quiz) => (
            <Card key={quiz.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-orange-600" />
                      {quiz.title}
                    </CardTitle>
                    {quiz.description && (
                      <CardDescription className="mt-2">
                        {quiz.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewQuizDetails(quiz)}
                      disabled={isLoading}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Printer className="h-5 w-5 text-blue-600" />
                            Export Quiz: {quiz.title}
                          </DialogTitle>
                          <DialogDescription>
                            Configure your export settings and download the quiz as a PDF file.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="include-answers">Include answer key</Label>
                            <Switch
                              id="include-answers"
                              checked={exportOptions.includeAnswers}
                              onCheckedChange={(checked: boolean) => 
                                setExportOptions((prev) => ({ ...prev, includeAnswers: checked }))
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="include-explanations">Include explanations</Label>
                            <Switch
                              id="include-explanations"
                              checked={exportOptions.includeExplanations}
                              onCheckedChange={(checked: boolean) => 
                                setExportOptions((prev) => ({ ...prev, includeExplanations: checked }))
                              }
                            />
                          </div>
                          <Alert>
                            <Printer className="h-4 w-4" />
                            <AlertDescription>
                              📄 The quiz will be exported as a formatted PDF document suitable for printing and distribution.
                            </AlertDescription>
                          </Alert>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                          <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={() => handleExportQuiz(quiz)}
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {isLoading ? 'Exporting...' : 'Export PDF'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>🗑️ Delete Quiz</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{quiz.title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteQuiz(quiz)}
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Created: {quiz.created_at.toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <HelpCircle className="h-4 w-4" />
                      Questions: 0 {/* Will be populated when backend returns real data */}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Duration: ~0 min {/* Will be calculated when backend returns real data */}
                    </div>
                  </div>
                  <Badge variant="secondary">📊 Stub Data</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quiz Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-600" />
              {selectedQuiz?.title || 'Quiz Details'}
            </DialogTitle>
            <DialogDescription>
              Review the complete quiz content and question details
            </DialogDescription>
          </DialogHeader>
          
          {selectedQuiz && (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-6">
                {/* Quiz Information */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-3">📊 Quiz Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700 font-medium">Title:</span>
                      <p className="text-blue-900">{selectedQuiz.title}</p>
                    </div>
                    {selectedQuiz.description && (
                      <div>
                        <span className="text-blue-700 font-medium">Description:</span>
                        <p className="text-blue-900">{selectedQuiz.description}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-blue-700 font-medium">Created:</span>
                      <p className="text-blue-900">{selectedQuiz.created_at.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Total Questions:</span>
                      <p className="text-blue-900">{selectedQuiz.questions.length}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Estimated Duration:</span>
                      <p className="text-blue-900">{formatTimeEstimate(selectedQuiz.questions.length)}</p>
                    </div>
                  </div>
                </div>

                {/* Questions List */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">📝 Questions</h4>
                  
                  {selectedQuiz.questions.length === 0 ? (
                    <Alert>
                      <HelpCircle className="h-4 w-4" />
                      <AlertDescription>
                        No questions found in this quiz. This is likely due to the backend returning stub data.
                        <Badge variant="secondary" className="ml-2">📊 Stub Data</Badge>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    selectedQuiz.questions.map((question, index) => (
                      <Card key={question.id} className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-base">
                              Question {index + 1}
                            </CardTitle>
                            <div className="flex gap-2">
                              <Badge variant="outline">{getSubjectName(question.subject_id)}</Badge>
                              <Badge variant="outline">{getTopicName(question.topic_id)}</Badge>
                              <Badge className={getDifficultyColor(question.difficulty_level)}>
                                {question.difficulty_level}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <p className="text-gray-900 font-medium">{question.question_text}</p>
                            
                            {/* Options */}
                            <div className="space-y-2">
                              {(['A', 'B', 'C', 'D'] as const).map((option) => {
                                const optionText = question[`option_${option.toLowerCase()}` as keyof typeof question] as string;
                                const isCorrect = question.correct_answer === option;
                                return (
                                  <div 
                                    key={option} 
                                    className={`flex items-center gap-3 p-2 rounded border ${
                                      isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      {isCorrect ? (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                                      )}
                                      <span className="font-medium text-sm">{option}.</span>
                                    </div>
                                    <span className={isCorrect ? 'font-medium text-green-800' : 'text-gray-700'}>
                                      {optionText}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                            
                            {question.explanation && (
                              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                                <p className="text-sm font-medium text-blue-800 mb-1">💡 Explanation:</p>
                                <p className="text-sm text-blue-700">{question.explanation}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
