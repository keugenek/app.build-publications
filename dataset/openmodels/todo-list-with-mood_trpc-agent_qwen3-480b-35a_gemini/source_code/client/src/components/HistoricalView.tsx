import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { cn } from './utils';
import { trpc } from '@/utils/trpc';
import type { HistoricalViewEntry } from '../../../server/src/schema';

const MOOD_COLORS = [
  'bg-red-500',
  'bg-orange-500',
  'bg-yellow-500',
  'bg-lime-500',
  'bg-green-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-cyan-500',
  'bg-blue-500',
  'bg-purple-500',
];

export function HistoricalView() {
  const [historicalData, setHistoricalData] = useState<HistoricalViewEntry[]>([]);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const loadHistoricalData = useCallback(async () => {
    try {
      const result = await trpc.getHistoricalView.query();
      setHistoricalData(result);
    } catch (error) {
      console.error('Failed to load historical data:', error);
    }
  }, []);

  useEffect(() => {
    loadHistoricalData();
  }, [loadHistoricalData]);

  // Filter data by date range
  const filteredData = historicalData
    .filter(entry => {
      const entryDate = new Date(entry.date);
      if (dateRange.from && entryDate < dateRange.from) return false;
      if (dateRange.to && entryDate > dateRange.to) return false;
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate average mood
  const validMoodEntries = historicalData
    .filter(entry => entry.mood_level !== null)
    .map(entry => entry.mood_level as number);
  
  const averageMood = validMoodEntries.length > 0 
    ? (validMoodEntries.reduce((sum, mood) => sum + mood, 0) / validMoodEntries.length).toFixed(1)
    : 'N/A';

  // Calculate task completion rate
  const totalTasks = historicalData.reduce((sum, entry) => sum + entry.total_tasks, 0);
  const totalCompleted = historicalData.reduce((sum, entry) => sum + entry.tasks_completed, 0);
  const overallCompletionRate = totalTasks > 0 
    ? Math.round((totalCompleted / totalTasks) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Historical View</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          See how your mood and task completion correlate over time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Average Mood</div>
            <div className="text-2xl font-bold mt-1">
              {averageMood !== 'N/A' ? (
                <span className="flex items-center">
                  <span className="mr-2">{averageMood}/10</span>
                  <div className={`w-4 h-4 rounded-full ${
                    MOOD_COLORS[Math.round(parseFloat(averageMood)) - 1] || 'bg-gray-500'
                  }`} />
                </span>
              ) : (
                'N/A'
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Tasks Completed</div>
            <div className="text-2xl font-bold mt-1">
              {totalCompleted} / {totalTasks}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</div>
            <div className="text-2xl font-bold mt-1">
              {overallCompletionRate}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Mood & Task Completion Over Time</CardTitle>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? format(dateRange.from, "MMM dd, yyyy") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !dateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.to ? format(dateRange.to, "MMM dd, yyyy") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Mood</th>
                    <th className="text-left py-2">Tasks</th>
                    <th className="text-left py-2">Completion</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((entry, index) => {
                    const moodLevel = entry.mood_level;
                    const moodInfo = moodLevel !== null 
                      ? { value: moodLevel, label: ['Awful', 'Bad', 'Okay', 'Good', 'Great', 'Excellent', 'Amazing', 'Fantastic', 'Wonderful', 'Incredible'][moodLevel - 1] }
                      : null;
                    
                    return (
                      <tr key={index} className="border-b">
                        <td className="py-3">
                          {format(new Date(entry.date), "MMM dd, yyyy")}
                        </td>
                        <td className="py-3">
                          {moodInfo ? (
                            <div className="flex items-center">
                              <span className="mr-2">{moodInfo.label}</span>
                              <div className={`w-4 h-4 rounded-full ${
                                MOOD_COLORS[moodInfo.value - 1] || 'bg-gray-500'
                              }`} />
                            </div>
                          ) : (
                            <span className="text-gray-500">N/A</span>
                          )}
                        </td>
                        <td className="py-3">
                          {entry.tasks_completed} / {entry.total_tasks}
                        </td>
                        <td className="py-3">
                          {entry.total_tasks > 0 
                            ? `${Math.round((entry.tasks_completed / entry.total_tasks) * 100)}%` 
                            : '0%'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <p className="text-gray-500">No historical data available for the selected date range.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {historicalData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {[...historicalData]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10)
                .map((entry, index) => {
                  const moodLevel = entry.mood_level;
                  const moodInfo = moodLevel !== null 
                    ? { value: moodLevel, label: ['Awful', 'Bad', 'Okay', 'Good', 'Great', 'Excellent', 'Amazing', 'Fantastic', 'Wonderful', 'Incredible'][moodLevel - 1] }
                    : null;
                  
                  return (
                    <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between">
                        <div className="font-medium">
                          {format(new Date(entry.date), "MMMM d, yyyy")}
                        </div>
                        <div className="flex items-center space-x-2">
                          {moodInfo ? (
                            <>
                              <span className="text-sm">{moodInfo.label}</span>
                              <div className={`w-4 h-4 rounded-full ${
                                MOOD_COLORS[moodInfo.value - 1] || 'bg-gray-500'
                              }`} />
                            </>
                          ) : (
                            <span className="text-sm text-gray-500">No mood data</span>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between text-sm">
                        <span>
                          Tasks: {entry.tasks_completed} / {entry.total_tasks} completed
                        </span>
                        <span>
                          {entry.total_tasks > 0 
                            ? `${Math.round((entry.tasks_completed / entry.total_tasks) * 100)}%` 
                            : '0%'} completion
                        </span>
                      </div>
                      {entry.notes && (
                        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                          {entry.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
