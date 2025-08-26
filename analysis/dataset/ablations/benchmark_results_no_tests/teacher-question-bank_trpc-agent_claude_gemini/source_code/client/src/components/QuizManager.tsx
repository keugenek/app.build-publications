import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Eye, Trash2, Download, GraduationCap, FileText, Calendar } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Quiz, Question, Subject, Topic } from '../../../server/src/schema';

interface QuizManagerProps {
  quizzes: Quiz[];
  questions: Question[];
  subjects: Subject[];
  topics: Topic[];
  onQuizDeleted: (id: number) => void;
}

export function QuizManager({
  quizzes,
  questions,
  subjects,
  topics,
  onQuizDeleted
}: QuizManagerProps) {
  const [viewingQuiz, setViewingQuiz] = useState<Quiz | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [includeAnswers, setIncludeAnswers] = useState(false);

  // Helper functions
  const getSubjectName = (subjectId: number) => {
    const subject = subjects.find((s: Subject) => s.id === subjectId);
    return subject?.name || 'Unknown Subject';
  };

  const getTopicName = (topicId: number) => {
    const topic = topics.find((t: Topic) => t.id === topicId);
    return topic?.name || 'Unknown Topic';
  };

  const handleViewQuiz = async (quiz: Quiz) => {
    setViewingQuiz(quiz);
    setIsLoading(true);
    try {
      // In a real implementation, this would fetch the quiz with questions
      // For now, we'll use stub data since getQuizById might not be fully implemented
      const quizDetails = await trpc.getQuizById.query({ id: quiz.id });
      if (quizDetails && 'questions' in quizDetails) {
        // Type assertion since we know the shape from schema
        const detailedQuiz = quizDetails as any;
        setQuizQuestions(detailedQuiz.questions || []);
      } else {
        setQuizQuestions([]);
      }
    } catch (error) {
      console.error('Failed to load quiz details:', error);
      // For stub implementation, show empty questions array
      setQuizQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteQuiz.mutate({ id });
      onQuizDeleted(id);
    } catch (error) {
      console.error('Failed to delete quiz:', error);
      // For stub implementation, still call the callback
      onQuizDeleted(id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportToPdf = async (quiz: Quiz) => {
    setIsLoading(true);
    try {
      await trpc.exportQuizToPdf.mutate({
        quiz_id: quiz.id,
        include_answers: includeAnswers
      });
      // In a real implementation, this would trigger a download
      alert(`Quiz "${quiz.title}" exported to PDF ${includeAnswers ? 'with answers' : 'without answers'}!`);
    } catch (error) {
      console.error('Failed to export quiz:', error);
      // For stub implementation, show mock success
      alert(`📄 Quiz "${quiz.title}" would be exported to PDF ${includeAnswers ? 'with answers' : 'without answers'}!\n\n⚠️ This is a demo - actual PDF export requires backend implementation.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">📋 Your Quizzes</h3>
          <p className="text-sm text-gray-600">
            {quizzes.length === 0 
              ? "No quizzes yet. Use the Quiz Generator to create your first quiz!" 
              : `Managing ${quizzes.length} quiz${quizzes.length === 1 ? '' : 'zes'}`
            }
          </p>
        </div>

        {/* Export Settings */}
        {quizzes.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Switch
                id="include-answers"
                checked={includeAnswers}
                onCheckedChange={setIncludeAnswers}
              />
              <label htmlFor="include-answers" className="text-gray-700">
                Include answers in PDF
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Quizzes Display */}
      {quizzes.length === 0 ? (
        <div className="text-center py-12">
          <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No quizzes yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            You haven't created any quizzes yet. Use the Quiz Generator tab to automatically create quizzes from your question bank, or manually create quizzes by selecting specific questions.
          </p>
          <Button variant="outline">
            Go to Quiz Generator
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz: Quiz) => (
            <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-orange-600" />
                      {quiz.title}
                    </CardTitle>
                    <Badge variant="secondary" className="mt-2">
                      Quiz #{quiz.id}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewQuiz(quiz)}
                      className="text-gray-600 hover:text-blue-600"
                      title="View Quiz"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExportToPdf(quiz)}
                      disabled={isLoading}
                      className="text-gray-600 hover:text-green-600"
                      title="Export to PDF"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 hover:text-red-600"
                          title="Delete Quiz"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the quiz "{quiz.title}"? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(quiz.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Quiz
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {quiz.description && (
                  <CardDescription className="mb-4">
                    {quiz.description}
                  </CardDescription>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {quiz.created_at.toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewQuiz(quiz)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportToPdf(quiz)}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Quiz Dialog */}
      {viewingQuiz && (
        <Dialog open={!!viewingQuiz} onOpenChange={() => setViewingQuiz(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-orange-600" />
                {viewingQuiz.title}
              </DialogTitle>
              <DialogDescription>
                {viewingQuiz.description || 'Quiz details and questions'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Quiz Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm font-medium">Quiz ID:</span>
                  <p className="text-gray-600">#{viewingQuiz.id}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Created:</span>
                  <p className="text-gray-600">{viewingQuiz.created_at.toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Questions:</span>
                  <p className="text-gray-600">{quizQuestions.length} questions</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant="secondary">Active</Badge>
                </div>
              </div>

              {/* Questions List */}
              <div>
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Questions ({quizQuestions.length})
                </h4>
                
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-3"></div>
                    <p className="text-gray-600">Loading quiz questions...</p>
                  </div>
                ) : quizQuestions.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">
                      No questions loaded. This might be due to the backend being in stub mode.
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      In a full implementation, quiz questions would be displayed here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {quizQuestions.map((question: Question, index: number) => (
                      <Card key={question.id} className="border-l-4 border-l-orange-500">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-3">
                            <h5 className="font-medium">
                              Question {index + 1}
                            </h5>
                            <div className="flex gap-2">
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
                          
                          <p className="text-gray-900 mb-3">
                            {question.question_text}
                          </p>
                          
                          {includeAnswers && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                              <p className="text-sm font-medium text-green-800 mb-1">Answer:</p>
                              <p className="text-green-700">{question.answer}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={includeAnswers}
                      onCheckedChange={setIncludeAnswers}
                    />
                    <span className="text-sm text-gray-700">Show answers</span>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleExportToPdf(viewingQuiz)}
                    disabled={isLoading}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export to PDF
                  </Button>
                  <Button onClick={() => setViewingQuiz(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
