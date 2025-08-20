import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskManager } from '@/components/TaskManager';
import { MoodTracker } from '@/components/MoodTracker';
import { HistoricalView } from '@/components/HistoricalView';

function App() {
  const [activeTab, setActiveTab] = useState('tasks');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Daily Journal
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Track your tasks and mood daily
          </p>
        </header>

        <Card className=" shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Personal Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="mood">Mood Tracker</TabsTrigger>
                <TabsTrigger value="history">Historical View</TabsTrigger>
              </TabsList>
              
              <TabsContent value="tasks" className="mt-4">
                <TaskManager />
              </TabsContent>
              
              <TabsContent value="mood" className="mt-4">
                <MoodTracker />
              </TabsContent>
              
              <TabsContent value="history" className="mt-4">
                <HistoricalView />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
