import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TaskManager } from '@/components/TaskManager';
import { MoodTracker } from '@/components/MoodTracker';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Heart, AlertCircle } from 'lucide-react';
import type { DailyEntry } from '../../../server/src/schema';

interface TodayViewProps {
  onDataChange: () => void;
}

export function TodayView({ onDataChange }: TodayViewProps) {
  const [todayEntry, setTodayEntry] = useState<DailyEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  const loadTodayEntry = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const entry = await trpc.getDailyEntry.query({ date: today });
      setTodayEntry(entry);
    } catch (err) {
      console.error('Failed to load today\'s entry:', err);
      setError('Failed to load today\'s data. Please try refreshing the page.');
    } finally {
      setIsLoading(false);
    }
  }, [today]);

  useEffect(() => {
    loadTodayEntry();
  }, [loadTodayEntry]);

  const handleTaskChange = useCallback(() => {
    loadTodayEntry();
    onDataChange();
  }, [loadTodayEntry, onDataChange]);

  const handleMoodChange = useCallback(() => {
    loadTodayEntry();
    onDataChange();
  }, [loadTodayEntry, onDataChange]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading today's entry...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      {/* Date Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-2">
          <Calendar className="h-5 w-5 text-indigo-600 mr-2" />
          <h2 className="text-2xl font-semibold text-gray-900">
            {formatDate(new Date())}
          </h2>
        </div>
        <p className="text-gray-600">How are you doing today? 🌟</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Tasks Section */}
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-xl text-blue-900 flex items-center">
              📝 Today's Tasks
            </CardTitle>
            <CardDescription className="text-blue-700">
              What do you want to accomplish today?
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <TaskManager 
              tasks={todayEntry?.tasks || []} 
              onTaskChange={handleTaskChange}
            />
          </CardContent>
        </Card>

        {/* Mood Section */}
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="bg-pink-50">
            <CardTitle className="text-xl text-pink-900 flex items-center">
              <Heart className="h-5 w-5 mr-2" />
              How are you feeling?
            </CardTitle>
            <CardDescription className="text-pink-700">
              Rate your mood and add a note about your day
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <MoodTracker 
              date={today}
              currentMoodEntry={todayEntry?.mood_entry || null}
              onMoodChange={handleMoodChange}
            />
          </CardContent>
        </Card>
      </div>

      {/* Daily Summary */}
      {todayEntry && (todayEntry.tasks.length > 0 || todayEntry.mood_entry) && (
        <>
          <Separator className="my-8" />
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-xl text-green-900">Today's Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Task Progress</h4>
                  {todayEntry.tasks.length === 0 ? (
                    <p className="text-gray-600">No tasks created yet</p>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-700 mb-2">
                        {todayEntry.tasks.filter(t => t.completed).length} of {todayEntry.tasks.length} tasks completed
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${todayEntry.tasks.length > 0 ? (todayEntry.tasks.filter(t => t.completed).length / todayEntry.tasks.length) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Mood</h4>
                  {!todayEntry.mood_entry ? (
                    <p className="text-gray-600">No mood logged yet</p>
                  ) : (
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">
                        {['😢', '😕', '😐', '😊', '😁'][todayEntry.mood_entry.mood_score - 1]}
                      </span>
                      <span className="text-gray-700">
                        {['Very Bad', 'Bad', 'Okay', 'Good', 'Very Good'][todayEntry.mood_entry.mood_score - 1]}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
