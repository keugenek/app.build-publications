import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SubjectManager } from '@/components/SubjectManager';
import { TopicManager } from '@/components/TopicManager';
import { QuestionManager } from '@/components/QuestionManager';
import { QuizGenerator } from '@/components/QuizGenerator';

import { BookOpen, FileQuestion, Layers, PenSquare, Play } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('subjects');

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-indigo-800 mb-2">
            Teacher's Question Bank
          </h1>
          <p className="text-gray-600">
            Manage subjects, topics, questions, and generate quizzes
          </p>
        </header>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Navigation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="subjects" className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  <span className="hidden sm:inline">Subjects</span>
                </TabsTrigger>
                <TabsTrigger value="topics" className="flex items-center gap-2">
                  <PenSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Topics</span>
                </TabsTrigger>
                <TabsTrigger value="questions" className="flex items-center gap-2">
                  <FileQuestion className="h-4 w-4" />
                  <span className="hidden sm:inline">Questions</span>
                </TabsTrigger>
                <TabsTrigger value="generate" className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  <span className="hidden sm:inline">Generate Quiz</span>
                </TabsTrigger>
                <TabsTrigger value="export" className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  <span className="hidden sm:inline">Export Quiz</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="subjects">
            <SubjectManager />
          </TabsContent>
          <TabsContent value="topics">
            <TopicManager />
          </TabsContent>
          <TabsContent value="questions">
            <QuestionManager />
          </TabsContent>
          <TabsContent value="generate">
            <QuizGenerator />
          </TabsContent>
          <TabsContent value="export">
            <QuizGenerator mode="export" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
