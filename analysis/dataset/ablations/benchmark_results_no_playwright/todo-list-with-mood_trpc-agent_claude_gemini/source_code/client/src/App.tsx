import { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CheckSquare, BarChart3, BookOpen } from 'lucide-react';
import { TodayView } from '@/components/TodayView';
import { HistoricalView } from '@/components/HistoricalView';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  
  const handleDataChange = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-8 w-8 text-indigo-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Daily Journal</h1>
          </div>
          <p className="text-lg text-gray-600">
            Track your daily tasks and mood to discover patterns in your well-being 📝✨
          </p>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="today" className="text-lg py-3">
              <Calendar className="h-5 w-5 mr-2" />
              Today's Entry
            </TabsTrigger>
            <TabsTrigger value="history" className="text-lg py-3">
              <BarChart3 className="h-5 w-5 mr-2" />
              Historical View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-8">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                <CardTitle className="text-2xl flex items-center">
                  <CheckSquare className="h-6 w-6 mr-2" />
                  Today's Focus
                </CardTitle>
                <CardDescription className="text-indigo-100">
                  Manage your daily tasks and log how you're feeling
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <TodayView key={refreshKey} onDataChange={handleDataChange} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-8">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                <CardTitle className="text-2xl flex items-center">
                  <BarChart3 className="h-6 w-6 mr-2" />
                  Your Journey
                </CardTitle>
                <CardDescription className="text-purple-100">
                  Explore your past entries and discover patterns
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <HistoricalView key={refreshKey} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
