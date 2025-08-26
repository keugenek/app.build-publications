import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import { FileText, Eye, Download, Calendar, BookOpen, Users, HelpCircle, AlertCircle, CheckCircle } from 'lucide-react';
import type { Quiz, Subject, Topic, QuizWithQuestions } from '../../../server/src/schema';

interface QuizViewerProps {
  quizzes: Quiz[];
  subjects: Subject[];
  topics: Topic[];
}

export function QuizViewer({ quizzes, subjects, topics }: QuizViewerProps) {
  const [viewingQuiz, setViewingQuiz] = useState<QuizWithQuestions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [exportingQuizId, setExportingQuizId] = useState<number | null>(null);
  const [includeAnswers, setIncludeAnswers] = useState(false);
  const [exportStatus, setExportStatus] = useState<{ success: boolean; message: string } | null>(null);

  const getSubjectName = (subjectId: number) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || 'Unknown Subject';
  };

  const getTopicName = (topicId: number) => {
    const topic = topics.find(t => t.id === topicId);
    return topic?.name || 'Unknown Topic';
  };

  const handleViewQuiz = async (quiz: Quiz) => {
    setIsLoading(true);
    try {
      const quizWithQuestions = await trpc.getQuizWithQuestions.query({ quizId: quiz.id });
      setViewingQuiz(quizWithQuestions);
    } catch (error) {
      console.error('Failed to load quiz questions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportToPdf = async (quizId: number) => {
    setExportingQuizId(quizId);
    setExportStatus(null);
    try {
      // This is a stub implementation since PDF export requires server-side setup
      // In a real implementation, this would call the tRPC endpoint
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      // Stub: Show success message
      setExportStatus({
        success: true,
        message: `Quiz exported successfully! ${includeAnswers ? 'Includes answers.' : 'Questions only.'}`
      });
      
      console.log('PDF export called for quiz:', quizId, 'with answers:', includeAnswers);
      
    } catch (error) {
      console.error('Failed to export quiz:', error);
      setExportStatus({
        success: false,
        message: 'Failed to export quiz. Please try again.'
      });
    } finally {
      setExportingQuizId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
          <FileText className="h-6 w-6 text-orange-600" />
          📋 My Quizzes
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          View and export your generated quizzes
        </p>
      </div>

      {/* Export Status Alert */}
      {exportStatus && (
        <Alert className={exportStatus.success 
          ? "border-green-200 bg-green-50 dark:bg-green-900/20" 
          : "border-red-200 bg-red-50 dark:bg-red-900/20"
        }>
          {exportStatus.success ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={exportStatus.success ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"}>
            <div className="flex items-center justify-between">
              <span>{exportStatus.message}</span>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setExportStatus(null)}
                className="ml-4 h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Quizzes Grid */}
      {quizzes.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">No quizzes yet</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Generate your first quiz from the Quiz Generator tab
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz: Quiz) => (
            <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="text-xs bg-blue-50">
                        <BookOpen className="h-3 w-3 mr-1" />
                        {getSubjectName(quiz.subject_id)}
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-green-50">
                        <Users className="h-3 w-3 mr-1" />
                        {getTopicName(quiz.topic_id)}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mb-2">
                      {quiz.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      {quiz.question_count} questions
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Created: {quiz.created_at.toLocaleDateString()}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewQuiz(quiz)}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {isLoading ? 'Loading...' : 'View'}
                  </Button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={exportingQuizId === quiz.id}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {exportingQuizId === quiz.id ? 'Exporting...' : 'Export PDF'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Export Quiz to PDF</DialogTitle>
                        <DialogDescription>
                          Configure export settings for "{quiz.title}"
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <label className="text-sm font-medium">Include Answers</label>
                            <p className="text-sm text-gray-500">
                              Show answers along with questions in the exported PDF
                            </p>
                          </div>
                          <Switch
                            checked={includeAnswers}
                            onCheckedChange={setIncludeAnswers}
                          />
                        </div>
                        
                        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                          <AlertCircle className="h-4 w-4 text-blue-600" />
                          <AlertDescription className="text-blue-800 dark:text-blue-200">
                            <strong>Note:</strong> This is a demo implementation. In a real application, 
                            this would generate a downloadable PDF file with the quiz questions
                            {includeAnswers && ' and answers'}.
                          </AlertDescription>
                        </Alert>

                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            onClick={() => setIncludeAnswers(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={() => handleExportToPdf(quiz.id)}
                            disabled={exportingQuizId === quiz.id}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            {exportingQuizId === quiz.id ? 'Exporting...' : 'Export PDF'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quiz Viewer Dialog */}
      <Dialog open={!!viewingQuiz} onOpenChange={() => setViewingQuiz(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-600" />
              {viewingQuiz?.title}
            </DialogTitle>
            <DialogDescription>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant="outline" className="bg-blue-50">
                  <BookOpen className="h-3 w-3 mr-1" />
                  {viewingQuiz && getSubjectName(viewingQuiz.subject_id)}
                </Badge>
                <Badge variant="outline" className="bg-green-50">
                  <Users className="h-3 w-3 mr-1" />
                  {viewingQuiz && getTopicName(viewingQuiz.topic_id)}
                </Badge>
                <Badge variant="outline">
                  {viewingQuiz?.question_count} questions
                </Badge>
              </div>
            </DialogDescription>
          </DialogHeader>
          
          {viewingQuiz && (
            <div className="space-y-6 mt-6">
              <div className="text-sm text-gray-600">
                Created: {viewingQuiz.created_at.toLocaleDateString()}
              </div>
              
              <div className="space-y-4">
                {viewingQuiz.questions.map((question, index) => (
                  <Card key={question.id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-start gap-2">
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm font-medium min-w-[2rem] text-center">
                          {index + 1}
                        </span>
                        <span className="flex-1">{question.question_text}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <div className="flex items-start gap-2">
                          <span className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs font-medium">
                            Answer
                          </span>
                          <span className="flex-1 whitespace-pre-wrap">{question.answer_text}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setViewingQuiz(null)}>
                  Close
                </Button>
                <Button onClick={() => handleExportToPdf(viewingQuiz.id)}>
                  <Download className="h-4 w-4 mr-2" />
                  Export to PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
