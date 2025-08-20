import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState, useMemo } from 'react';
import type { Quiz, Subject, Topic, Question, CreateQuizInput, GenerateQuizInput, QuizWithQuestions } from '../../../server/src/schema';

interface QuizManagementProps {
  quizzes: Quiz[];
  subjects: Subject[];
  topics: Topic[];
  questions: Question[];
  onRefresh: () => Promise<void>;
}

export function QuizManagement({ quizzes, subjects, topics, questions, onRefresh }: QuizManagementProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'generate'>('generate');
  
  // Manual creation state
  const [manualFormData, setManualFormData] = useState<CreateQuizInput>({
    title: '',
    question_ids: []
  });
  
  // Auto generation state
  const [generateFormData, setGenerateFormData] = useState<GenerateQuizInput>({
    title: '',
    subject_ids: [],
    topic_ids: [],
    limit: 10
  });

  // Quiz viewing state
  const [viewingQuiz, setViewingQuiz] = useState<QuizWithQuestions | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

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

  // Filter questions based on selected subjects/topics for manual creation
  const filteredQuestionsForManual = useMemo(() => {
    return questions.filter((question: Question) => {
      if (generateFormData.subject_ids && generateFormData.subject_ids.length > 0) {
        if (!generateFormData.subject_ids.includes(question.subject_id)) return false;
      }
      if (generateFormData.topic_ids && generateFormData.topic_ids.length > 0) {
        if (!generateFormData.topic_ids.includes(question.topic_id)) return false;
      }
      return true;
    });
  }, [questions, generateFormData.subject_ids, generateFormData.topic_ids]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualFormData.title.trim() || manualFormData.question_ids.length === 0) return;

    try {
      setIsLoading(true);
      await trpc.createQuiz.mutate(manualFormData);
      await onRefresh();
      setManualFormData({ title: '', question_ids: [] });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create quiz:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generateFormData.title.trim()) return;

    try {
      setIsLoading(true);
      await trpc.generateQuiz.mutate(generateFormData);
      await onRefresh();
      setGenerateFormData({ title: '', subject_ids: [], topic_ids: [], limit: 10 });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to generate quiz:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setIsLoading(true);
      await trpc.deleteQuiz.mutate({ id });
      await onRefresh();
    } catch (error) {
      console.error('Failed to delete quiz:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewQuiz = async (quizId: number) => {
    try {
      setIsLoading(true);
      const quizData = await trpc.getQuizWithQuestions.query({ id: quizId });
      setViewingQuiz(quizData);
      setIsViewDialogOpen(true);
    } catch (error) {
      console.error('Failed to load quiz details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportQuiz = async (quizId: number) => {
    try {
      setIsLoading(true);
      const exportData = await trpc.exportQuiz.query({ id: quizId });
      
      // Create and download text file
      const blob = new Blob([exportData], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quiz-${quizId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export quiz:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setManualFormData({ title: '', question_ids: [] });
    setGenerateFormData({ title: '', subject_ids: [], topic_ids: [], limit: 10 });
    setActiveTab('generate');
    setIsCreateDialogOpen(true);
  };

  const toggleQuestionSelection = (questionId: number, checked: boolean) => {
    setManualFormData((prev: CreateQuizInput) => ({
      ...prev,
      question_ids: checked 
        ? [...prev.question_ids, questionId]
        : prev.question_ids.filter((id: number) => id !== questionId)
    }));
  };

  const toggleSubjectSelection = (subjectId: number, checked: boolean) => {
    setGenerateFormData((prev: GenerateQuizInput) => ({
      ...prev,
      subject_ids: checked
        ? [...(prev.subject_ids || []), subjectId]
        : (prev.subject_ids || []).filter((id: number) => id !== subjectId)
    }));
  };

  const toggleTopicSelection = (topicId: number, checked: boolean) => {
    setGenerateFormData((prev: GenerateQuizInput) => ({
      ...prev,
      topic_ids: checked
        ? [...(prev.topic_ids || []), topicId]
        : (prev.topic_ids || []).filter((id: number) => id !== topicId)
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Manage your quizzes</h3>
          <p className="text-sm text-gray-600">Create quizzes from your question bank and export them for use</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateNew} className="bg-indigo-600 hover:bg-indigo-700" disabled={questions.length === 0}>
              📝 Create Quiz
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>📝 Create New Quiz</DialogTitle>
            </DialogHeader>
            
            <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'manual' | 'generate')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="generate">🎲 Auto Generate</TabsTrigger>
                <TabsTrigger value="manual">✋ Manual Selection</TabsTrigger>
              </TabsList>
              
              <TabsContent value="generate" className="space-y-4">
                <form onSubmit={handleGenerateSubmit} className="space-y-4">
                  <div>
                    <Input
                      placeholder="Quiz title (e.g., Math Quiz - Chapter 1)"
                      value={generateFormData.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setGenerateFormData((prev: GenerateQuizInput) => ({ ...prev, title: e.target.value }))
                      }
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Select Subjects (optional)</h4>
                      <div className="max-h-32 overflow-y-auto space-y-2 border rounded p-2">
                        {subjects.map((subject: Subject) => (
                          <div key={subject.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`subject-${subject.id}`}
                              checked={(generateFormData.subject_ids || []).includes(subject.id)}
                              onCheckedChange={(checked: boolean) => toggleSubjectSelection(subject.id, checked)}
                            />
                            <label htmlFor={`subject-${subject.id}`} className="text-sm">
                              📖 {subject.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Select Topics (optional)</h4>
                      <div className="max-h-32 overflow-y-auto space-y-2 border rounded p-2">
                        {topics.map((topic: Topic) => (
                          <div key={topic.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`topic-${topic.id}`}
                              checked={(generateFormData.topic_ids || []).includes(topic.id)}
                              onCheckedChange={(checked: boolean) => toggleTopicSelection(topic.id, checked)}
                            />
                            <label htmlFor={`topic-${topic.id}`} className="text-sm">
                              🏷️ {topic.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Input
                      type="number"
                      placeholder="Maximum number of questions"
                      value={generateFormData.limit || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setGenerateFormData((prev: GenerateQuizInput) => ({ ...prev, limit: parseInt(e.target.value) || undefined }))
                      }
                      min="1"
                      max={questions.length}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Generating...' : 'Generate Quiz'}
                    </Button>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="manual" className="space-y-4">
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div>
                    <Input
                      placeholder="Quiz title"
                      value={manualFormData.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setManualFormData((prev: CreateQuizInput) => ({ ...prev, title: e.target.value }))
                      }
                      required
                    />
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Select Questions ({manualFormData.question_ids.length} selected)</h4>
                    <div className="max-h-64 overflow-y-auto space-y-2 border rounded p-2">
                      {filteredQuestionsForManual.map((question: Question) => (
                        <div key={question.id} className="flex items-start space-x-2 p-2 border rounded">
                          <Checkbox
                            id={`question-${question.id}`}
                            checked={manualFormData.question_ids.includes(question.id)}
                            onCheckedChange={(checked: boolean) => toggleQuestionSelection(question.id, checked)}
                          />
                          <div className="flex-1">
                            <label htmlFor={`question-${question.id}`} className="text-sm cursor-pointer">
                              {question.text}
                            </label>
                            <div className="flex space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                📖 {subjectMap.get(question.subject_id)}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                🏷️ {topicMap.get(question.topic_id)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading || manualFormData.question_ids.length === 0}>
                      {isLoading ? 'Creating...' : 'Create Quiz'}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">❓</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No questions available</h3>
          <p className="text-gray-600 mb-4">You need to create questions first before you can generate quizzes</p>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes yet</h3>
          <p className="text-gray-600 mb-4">Start by creating your first quiz from your question bank</p>
          <Button onClick={handleCreateNew} className="bg-indigo-600 hover:bg-indigo-700">
            📝 Create First Quiz
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz: Quiz) => (
            <Card key={quiz.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg text-indigo-700">
                    📝 {quiz.title}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    ID: {quiz.id}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm text-gray-600 mb-4">
                  Created: {quiz.created_at.toLocaleDateString()}
                </div>
                <div className="flex flex-col space-y-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewQuiz(quiz.id)}
                    disabled={isLoading}
                  >
                    👁️ View Quiz
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExportQuiz(quiz.id)}
                    disabled={isLoading}
                  >
                    💾 Export
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive" disabled={isLoading}>
                        🗑️ Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{quiz.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(quiz.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quiz View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>📝 {viewingQuiz?.title}</DialogTitle>
          </DialogHeader>
          {viewingQuiz && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Badge variant="outline">
                  {viewingQuiz.questions.length} Question{viewingQuiz.questions.length !== 1 ? 's' : ''}
                </Badge>
                <div className="text-sm text-gray-600">
                  Created: {viewingQuiz.created_at.toLocaleDateString()}
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                {viewingQuiz.questions.map((question: Question, index: number) => (
                  <div key={question.id} className="border rounded p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">Question {index + 1}:</span>
                      <div className="flex space-x-2">
                        <Badge variant="outline" className="text-xs">
                          📖 {subjectMap.get(question.subject_id)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          🏷️ {topicMap.get(question.topic_id)}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-gray-800">{question.text}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => viewingQuiz && handleExportQuiz(viewingQuiz.id)}
                  disabled={isLoading}
                >
                  💾 Export Quiz
                </Button>
                <Button onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
