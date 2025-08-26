import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, HelpCircle, FileText, Settings } from 'lucide-react';

// Import feature components
import { SubjectManagement } from '@/components/SubjectManagement';
import { QuestionManagement } from '@/components/QuestionManagement';
import { QuizGeneration } from '@/components/QuizGeneration';
import { QuizManagement } from '@/components/QuizManagement';

function App() {
  const [activeTab, setActiveTab] = useState('questions');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <BookOpen className="h-10 w-10 text-blue-600" />
            📚 Question Bank System
          </h1>
          <p className="text-gray-600 text-lg">
            Manage questions, subjects, topics and create engaging quizzes for your students
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold text-gray-800">0</span>
                <Badge variant="secondary" className="ml-auto">📊 Stub Data</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold text-gray-800">0</span>
                <Badge variant="secondary" className="ml-auto">📊 Stub Data</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Generated Quizzes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                <span className="text-2xl font-bold text-gray-800">0</span>
                <Badge variant="secondary" className="ml-auto">📊 Stub Data</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Topics Available</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-orange-600" />
                <span className="text-2xl font-bold text-gray-800">0</span>
                <Badge variant="secondary" className="ml-auto">📊 Stub Data</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="questions" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Questions
            </TabsTrigger>
            <TabsTrigger value="subjects" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Subjects & Topics
            </TabsTrigger>
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Generate Quiz
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Manage Quizzes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-blue-600" />
                  Question Management
                </CardTitle>
                <CardDescription>
                  Create, view, edit, and delete multiple-choice questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QuestionManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-green-600" />
                  Subject & Topic Management
                </CardTitle>
                <CardDescription>
                  Organize your questions by subjects and topics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SubjectManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="generate" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  Quiz Generation
                </CardTitle>
                <CardDescription>
                  Generate customized quizzes from your question bank
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QuizGeneration />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quizzes" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-orange-600" />
                  Quiz Management
                </CardTitle>
                <CardDescription>
                  View, export, and manage your generated quizzes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QuizManagement />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>📚 Question Bank System - Empowering educators with efficient quiz management</p>
          <Badge variant="outline" className="mt-2">
            ⚠️ Note: Backend uses stub data - actual database integration needed
          </Badge>
        </div>
      </div>
    </div>
  );
}

export default App;
