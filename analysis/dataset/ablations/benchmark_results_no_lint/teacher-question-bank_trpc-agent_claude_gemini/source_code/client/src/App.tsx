import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { BookOpen, HelpCircle, FileText, Download, Plus, Users, Target } from 'lucide-react';
import { SubjectManager } from '@/components/SubjectManager';
import { TopicManager } from '@/components/TopicManager';
import { QuestionManager } from '@/components/QuestionManager';
import { QuizGenerator } from '@/components/QuizGenerator';
import { QuizViewer } from '@/components/QuizViewer';
// Using type-only import for better TypeScript compliance
import type { Subject, Topic, Question, Quiz } from '../../server/src/schema';

function App() {
  // State for tracking data
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [subjectsData, topicsData, questionsData, quizzesData] = await Promise.all([
        trpc.getSubjects.query(),
        trpc.getTopics.query(),
        trpc.getQuestions.query(),
        trpc.getQuizzes.query()
      ]);
      setSubjects(subjectsData);
      setTopics(topicsData);
      setQuestions(questionsData);
      setQuizzes(quizzesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Helper functions to get counts
  const getTopicCount = (subjectId: number) => {
    return topics.filter(topic => topic.subject_id === subjectId).length;
  };

  const getQuestionCount = (subjectId?: number, topicId?: number) => {
    return questions.filter(q => {
      if (subjectId && topicId) return q.subject_id === subjectId && q.topic_id === topicId;
      if (subjectId) return q.subject_id === subjectId;
      return true;
    }).length;
  };

  const getQuizCount = () => quizzes.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-600 text-white rounded-lg">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                📚 Question Bank System
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Create, organize, and generate quizzes for your students
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="subjects" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Subjects
            </TabsTrigger>
            <TabsTrigger value="topics" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Topics
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Questions
            </TabsTrigger>
            <TabsTrigger value="quiz-generator" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Generate Quiz
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              My Quizzes
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
                  <BookOpen className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-700">{subjects.length}</div>
                  <p className="text-xs text-blue-600 mt-1">
                    Active learning areas
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Topics</CardTitle>
                  <Users className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700">{topics.length}</div>
                  <p className="text-xs text-green-600 mt-1">
                    Organized categories
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
                  <HelpCircle className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-700">{questions.length}</div>
                  <p className="text-xs text-purple-600 mt-1">
                    Ready for quizzes
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Generated Quizzes</CardTitle>
                  <FileText className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-700">{getQuizCount()}</div>
                  <p className="text-xs text-orange-600 mt-1">
                    Available for export
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    Recent Subjects
                  </CardTitle>
                  <CardDescription>Your latest created subjects</CardDescription>
                </CardHeader>
                <CardContent>
                  {subjects.length === 0 ? (
                    <p className="text-gray-500 text-sm">No subjects yet. Create your first subject!</p>
                  ) : (
                    <div className="space-y-3">
                      {subjects.slice(-3).reverse().map((subject: Subject) => (
                        <div key={subject.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{subject.name}</p>
                            <p className="text-xs text-gray-500">
                              {getTopicCount(subject.id)} topics • {getQuestionCount(subject.id)} questions
                            </p>
                          </div>
                          <div className="text-xs text-gray-400">
                            {subject.created_at.toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-600" />
                    Recent Quizzes
                  </CardTitle>
                  <CardDescription>Your latest generated quizzes</CardDescription>
                </CardHeader>
                <CardContent>
                  {quizzes.length === 0 ? (
                    <p className="text-gray-500 text-sm">No quizzes yet. Generate your first quiz!</p>
                  ) : (
                    <div className="space-y-3">
                      {quizzes.slice(-3).reverse().map((quiz: Quiz) => (
                        <div key={quiz.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{quiz.title}</p>
                            <p className="text-xs text-gray-500">
                              {quiz.question_count} questions
                            </p>
                          </div>
                          <div className="text-xs text-gray-400">
                            {quiz.created_at.toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>🚀 Quick Actions</CardTitle>
                <CardDescription>Jump into the most common tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Button 
                    onClick={() => setActiveTab('subjects')}
                    className="flex items-center gap-2 h-auto p-4 flex-col bg-blue-600 hover:bg-blue-700"
                  >
                    <BookOpen className="h-6 w-6" />
                    <span>Create Subject</span>
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('topics')}
                    variant="outline"
                    className="flex items-center gap-2 h-auto p-4 flex-col"
                  >
                    <Users className="h-6 w-6" />
                    <span>Add Topics</span>
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('questions')}
                    variant="outline"
                    className="flex items-center gap-2 h-auto p-4 flex-col"
                  >
                    <HelpCircle className="h-6 w-6" />
                    <span>Add Questions</span>
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('quiz-generator')}
                    variant="outline"
                    className="flex items-center gap-2 h-auto p-4 flex-col"
                  >
                    <Plus className="h-6 w-6" />
                    <span>Generate Quiz</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subject Management Tab */}
          <TabsContent value="subjects">
            <SubjectManager 
              subjects={subjects} 
              setSubjects={setSubjects}
              getTopicCount={getTopicCount}
              getQuestionCount={getQuestionCount}
            />
          </TabsContent>

          {/* Topic Management Tab */}
          <TabsContent value="topics">
            <TopicManager 
              topics={topics} 
              setTopics={setTopics}
              subjects={subjects}
              getQuestionCount={getQuestionCount}
            />
          </TabsContent>

          {/* Question Management Tab */}
          <TabsContent value="questions">
            <QuestionManager 
              questions={questions} 
              setQuestions={setQuestions}
              subjects={subjects}
              topics={topics}
            />
          </TabsContent>

          {/* Quiz Generator Tab */}
          <TabsContent value="quiz-generator">
            <QuizGenerator 
              subjects={subjects}
              topics={topics}
              setQuizzes={setQuizzes}
              onQuizGenerated={() => setActiveTab('quizzes')}
            />
          </TabsContent>

          {/* Quiz Viewer Tab */}
          <TabsContent value="quizzes">
            <QuizViewer 
              quizzes={quizzes}
              subjects={subjects}
              topics={topics}
            />
          </TabsContent>
        </Tabs>

        {isLoading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <p className="text-lg">Loading...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
