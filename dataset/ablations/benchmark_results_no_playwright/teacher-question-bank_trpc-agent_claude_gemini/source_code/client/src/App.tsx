import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SubjectManagement } from '@/components/SubjectManagement';
import { TopicManagement } from '@/components/TopicManagement';
import { QuestionManagement } from '@/components/QuestionManagement';
import { QuizManagement } from '@/components/QuizManagement';
import { trpc } from '@/utils/trpc';
import { useEffect, useState } from 'react';
import type { Subject, Topic, Question, Quiz } from '../../server/src/schema';

function App() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all data on component mount
  useEffect(() => {
    const loadData = async () => {
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
    };

    loadData();
  }, []);

  const refreshSubjects = async () => {
    try {
      const data = await trpc.getSubjects.query();
      setSubjects(data);
    } catch (error) {
      console.error('Failed to refresh subjects:', error);
    }
  };

  const refreshTopics = async () => {
    try {
      const data = await trpc.getTopics.query();
      setTopics(data);
    } catch (error) {
      console.error('Failed to refresh topics:', error);
    }
  };

  const refreshQuestions = async () => {
    try {
      const data = await trpc.getQuestions.query();
      setQuestions(data);
    } catch (error) {
      console.error('Failed to refresh questions:', error);
    }
  };

  const refreshQuizzes = async () => {
    try {
      const data = await trpc.getQuizzes.query();
      setQuizzes(data);
    } catch (error) {
      console.error('Failed to refresh quizzes:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium">Loading...</div>
          <div className="text-sm text-gray-500 mt-2">Setting up your question bank</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📚 Question Bank System</h1>
          <p className="text-lg text-gray-600">Manage subjects, topics, questions, and create quizzes with ease</p>
        </div>

        <Tabs defaultValue="subjects" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="subjects" className="text-sm font-medium">
              📖 Subjects ({subjects.length})
            </TabsTrigger>
            <TabsTrigger value="topics" className="text-sm font-medium">
              🏷️ Topics ({topics.length})
            </TabsTrigger>
            <TabsTrigger value="questions" className="text-sm font-medium">
              ❓ Questions ({questions.length})
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="text-sm font-medium">
              📝 Quizzes ({quizzes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subjects">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  📖 Subject Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SubjectManagement
                  subjects={subjects}
                  onRefresh={refreshSubjects}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="topics">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  🏷️ Topic Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TopicManagement
                  topics={topics}
                  subjects={subjects}
                  onRefresh={refreshTopics}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  ❓ Question Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QuestionManagement
                  questions={questions}
                  subjects={subjects}
                  topics={topics}
                  onRefresh={refreshQuestions}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quizzes">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  📝 Quiz Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QuizManagement
                  quizzes={quizzes}
                  subjects={subjects}
                  topics={topics}
                  questions={questions}
                  onRefresh={refreshQuizzes}
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
