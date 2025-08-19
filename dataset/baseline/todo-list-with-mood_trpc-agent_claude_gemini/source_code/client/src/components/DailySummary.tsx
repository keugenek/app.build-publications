import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar, TrendingUp, CheckCircle, Heart, BarChart3 } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { DailySummary as DailySummaryType, Task } from '../../../server/src/schema';

interface DailySummaryProps {
  summaries: DailySummaryType[];
  onRefresh: () => Promise<void>;
}

const MOOD_CONFIG = {
  1: { emoji: '😢', label: 'Very Bad', color: 'bg-red-500' },
  2: { emoji: '😔', label: 'Bad', color: 'bg-orange-500' },
  3: { emoji: '😐', label: 'Neutral', color: 'bg-yellow-500' },
  4: { emoji: '😊', label: 'Good', color: 'bg-green-500' },
  5: { emoji: '😃', label: 'Very Good', color: 'bg-blue-500' },
} as const;

export function DailySummary({ summaries, onRefresh }: DailySummaryProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDateSearch = async () => {
    if (!selectedDate) return;
    
    setIsLoading(true);
    try {
      await trpc.getDailySummary.query({ date: selectedDate });
      await onRefresh();
    } catch (error) {
      console.error('Failed to fetch daily summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate some statistics
  const totalDays = summaries.length;
  const averageMood = summaries.length > 0 
    ? summaries.reduce((sum: number, summary: DailySummaryType) => 
        sum + (summary.mood_entry?.mood_rating || 0), 0
      ) / summaries.filter((s: DailySummaryType) => s.mood_entry).length
    : 0;
  
  const totalTasks = summaries.reduce((sum: number, summary: DailySummaryType) => 
    sum + summary.total_tasks, 0
  );
  const totalCompleted = summaries.reduce((sum: number, summary: DailySummaryType) => 
    sum + summary.completed_tasks_count, 0
  );
  const completionRate = totalTasks > 0 ? (totalCompleted / totalTasks) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Search by Date */}
      <div className="flex gap-2">
        <Input
          type="date"
          value={selectedDate}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedDate(e.target.value)}
          className="max-w-xs"
        />
        <Button 
          onClick={handleDateSearch}
          disabled={!selectedDate || isLoading}
          variant="outline"
        >
          {isLoading ? 'Loading...' : 'Search'}
        </Button>
      </div>

      {/* Statistics Overview */}
      {summaries.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4 text-center">
              <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-900">{totalDays}</div>
              <div className="text-sm text-blue-700">Days Tracked</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-900">{completionRate.toFixed(0)}%</div>
              <div className="text-sm text-green-700">Task Completion</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4 text-center">
              <BarChart3 className="w-6 h-6 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-purple-900">{totalCompleted}</div>
              <div className="text-sm text-purple-700">Tasks Completed</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-pink-50 to-pink-100 border-pink-200">
            <CardContent className="p-4 text-center">
              <Heart className="w-6 h-6 mx-auto mb-2 text-pink-600" />
              <div className="text-2xl font-bold text-pink-900">
                {averageMood > 0 ? averageMood.toFixed(1) : '—'}
              </div>
              <div className="text-sm text-pink-700">Avg Mood</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Daily Summaries List */}
      {summaries.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No summaries yet</h3>
          <p>Start creating tasks and logging your mood to see daily summaries! 📊</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-700 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Daily Summaries ({summaries.length})
          </h3>
          {summaries.map((summary: DailySummaryType) => (
            <DailySummaryCard key={summary.date.toISOString()} summary={summary} />
          ))}
        </div>
      )}
    </div>
  );
}

interface DailySummaryCardProps {
  summary: DailySummaryType;
}

function DailySummaryCard({ summary }: DailySummaryCardProps) {
  const completionRate = summary.total_tasks > 0 
    ? (summary.completed_tasks_count / summary.total_tasks) * 100 
    : 0;

  const moodConfig = summary.mood_entry 
    ? MOOD_CONFIG[summary.mood_entry.mood_rating as keyof typeof MOOD_CONFIG]
    : null;

  return (
    <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-medium text-gray-900">
              {summary.date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            <p className="text-sm text-gray-600">
              {summary.date.toDateString() === new Date().toDateString() ? 'Today' : 
               summary.date.toDateString() === new Date(Date.now() - 86400000).toDateString() ? 'Yesterday' :
               ''}
            </p>
          </div>
          {moodConfig && (
            <div className="flex items-center gap-2">
              <div className="text-xl">{moodConfig.emoji}</div>
              <Badge className={`${moodConfig.color} text-white`}>
                {moodConfig.label}
              </Badge>
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Tasks Summary */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">
                Tasks: {summary.completed_tasks_count}/{summary.total_tasks}
              </span>
              {completionRate > 0 && (
                <Badge variant="outline" className="text-xs">
                  {completionRate.toFixed(0)}%
                </Badge>
              )}
            </div>
            
            {summary.completed_tasks.length > 0 && (
              <div className="ml-6">
                <p className="text-xs text-gray-600 mb-1">Completed:</p>
                <div className="space-y-1">
                  {summary.completed_tasks.slice(0, 3).map((task: Task) => (
                    <div key={task.id} className="text-xs text-gray-700 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span className="truncate">{task.title}</span>
                    </div>
                  ))}
                  {summary.completed_tasks.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{summary.completed_tasks.length - 3} more tasks
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mood Note */}
          {summary.mood_entry?.note && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-600" />
                <span className="text-sm font-medium">Note</span>
              </div>
              <div className="ml-6">
                <p className="text-sm text-gray-700 italic">
                  "{summary.mood_entry.note}"
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {summary.total_tasks > 0 && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
