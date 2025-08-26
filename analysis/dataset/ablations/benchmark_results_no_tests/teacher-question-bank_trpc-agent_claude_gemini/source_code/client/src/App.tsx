import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen, FileQuestion, GraduationCap, Plus } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Subject, Topic, Question, Quiz } from '../../server/src/schema';

// Import components
import { SubjectManager } from './components/SubjectManager';
import { TopicManager } from './components/TopicManager';
import { QuestionManager } from './components/QuestionManager';
import { QuizManager } from './components/QuizManager';
import { QuizGenerator } from './components/QuizGenerator';

function App() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
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
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data. Using stub implementation.');
      // Since backend is stub, show empty arrays
      setSubjects([]);
      setTopics([]);
      setQuestions([]);
      setQuizzes([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Callback functions to update data after mutations
  const handleSubjectCreated = useCallback((newSubject: Subject) => {
    setSubjects((prev: Subject[]) => [...prev, newSubject]);
  }, []);

  const handleSubjectUpdated = useCallback((updatedSubject: Subject) => {
    setSubjects((prev: Subject[]) => 
      prev.map((subject: Subject) => 
        subject.id === updatedSubject.id ? updatedSubject : subject
      )
    );
  }, []);

  const handleSubjectDeleted = useCallback((deletedId: number) => {
    setSubjects((prev: Subject[]) => prev.filter((subject: Subject) => subject.id !== deletedId));
    // Also remove related topics and questions
    setTopics((prev: Topic[]) => prev.filter((topic: Topic) => topic.subject_id !== deletedId));
    setQuestions((prev: Question[]) => prev.filter((question: Question) => question.subject_id !== deletedId));
  }, []);

  const handleTopicCreated = useCallback((newTopic: Topic) => {
    setTopics((prev: Topic[]) => [...prev, newTopic]);
  }, []);

  const handleTopicUpdated = useCallback((updatedTopic: Topic) => {
    setTopics((prev: Topic[]) => 
      prev.map((topic: Topic) => 
        topic.id === updatedTopic.id ? updatedTopic : topic
      )
    );
  }, []);

  const handleTopicDeleted = useCallback((deletedId: number) => {
    setTopics((prev: Topic[]) => prev.filter((topic: Topic) => topic.id !== deletedId));
    // Also remove related questions
    setQuestions((prev: Question[]) => prev.filter((question: Question) => question.topic_id !== deletedId));
  }, []);

  const handleQuestionCreated = useCallback((newQuestion: Question) => {
    setQuestions((prev: Question[]) => [...prev, newQuestion]);
  }, []);

  const handleQuestionUpdated = useCallback((updatedQuestion: Question) => {
    setQuestions((prev: Question[]) => 
      prev.map((question: Question) => 
        question.id === updatedQuestion.id ? updatedQuestion : question
      )
    );
  }, []);

  const handleQuestionDeleted = useCallback((deletedId: number) => {
    setQuestions((prev: Question[]) => prev.filter((question: Question) => question.id !== deletedId));
  }, []);

  const handleQuizCreated = useCallback((newQuiz: Quiz) => {
    setQuizzes((prev: Quiz[]) => [...prev, newQuiz]);
  }, []);

  const handleQuizDeleted = useCallback((deletedId: number) => {
    setQuizzes((prev: Quiz[]) => prev.filter((quiz: Quiz) => quiz.id !== deletedId));
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Question Bank System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="h-10 w-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">📚 Question Bank System</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create, organize, and manage your teaching materials with ease. 
            Generate quizzes automatically and export them to PDF format.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertDescription className="text-orange-800">
              ⚠️ {error} Some features may not work as expected until the backend is fully implemented.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="subjects" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl mx-auto bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="subjects" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Subjects
            </TabsTrigger>
            <TabsTrigger value="topics" className="flex items-center gap-2">
              <FileQuestion className="h-4 w-4" />
              Topics
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Questions
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Quizzes
            </TabsTrigger>
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Generate
            </TabsTrigger>
          </TabsList>

          {/* Subject Management */}
          <TabsContent value="subjects">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Subject Management
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Create and organize your teaching subjects
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <SubjectManager
                  subjects={subjects}
                  onSubjectCreated={handleSubjectCreated}
                  onSubjectUpdated={handleSubjectUpdated}
                  onSubjectDeleted={handleSubjectDeleted}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Topic Management */}
          <TabsContent value="topics">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <FileQuestion className="h-5 w-5" />
                  Topic Management
                </CardTitle>
                <CardDescription className="text-green-100">
                  Organize topics within your subjects
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <TopicManager
                  subjects={subjects}
                  topics={topics}
                  onTopicCreated={handleTopicCreated}
                  onTopicUpdated={handleTopicUpdated}
                  onTopicDeleted={handleTopicDeleted}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Question Management */}
          <TabsContent value="questions">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Question Management
                </CardTitle>
                <CardDescription className="text-purple-100">
                  Create and manage your question bank
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <QuestionManager
                  subjects={subjects}
                  topics={topics}
                  questions={questions}
                  onQuestionCreated={handleQuestionCreated}
                  onQuestionUpdated={handleQuestionUpdated}
                  onQuestionDeleted={handleQuestionDeleted}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quiz Management */}
          <TabsContent value="quizzes">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Quiz Management
                </CardTitle>
                <CardDescription className="text-orange-100">
                  View and manage your created quizzes
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <QuizManager
                  quizzes={quizzes}
                  questions={questions}
                  subjects={subjects}
                  topics={topics}
                  onQuizDeleted={handleQuizDeleted}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quiz Generation */}
          <TabsContent value="generate">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Quiz Generator
                </CardTitle>
                <CardDescription className="text-teal-100">
                  Automatically generate quizzes from your question bank
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <QuizGenerator
                  subjects={subjects}
                  topics={topics}
                  questions={questions}
                  onQuizCreated={handleQuizCreated}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
