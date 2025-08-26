import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronDown, ChevronUp, Filter, Heart, CheckSquare, AlertCircle } from 'lucide-react';
import type { DailyEntry, GetHistoricalEntriesInput } from '../../../server/src/schema';

export function HistoricalView() {
  const [historicalEntries, setHistoricalEntries] = useState<DailyEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  
  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const loadHistoricalEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const queryData: GetHistoricalEntriesInput = {
        limit: 30 // Load last 30 entries by default
      };
      
      if (startDate) queryData.start_date = startDate;
      if (endDate) queryData.end_date = endDate;
      
      const entries = await trpc.getHistoricalEntries.query(queryData);
      setHistoricalEntries(entries);
    } catch (err) {
      console.error('Failed to load historical entries:', err);
      setError('Failed to load historical data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadHistoricalEntries();
  }, [loadHistoricalEntries]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadHistoricalEntries();
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  const toggleEntryExpansion = (dateString: string) => {
    setExpandedEntry(expandedEntry === dateString ? null : dateString);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDateString = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getMoodEmoji = (moodScore: number) => {
    const emojis = ['😢', '😕', '😐', '😊', '😁'];
    return emojis[moodScore - 1] || '😐';
  };

  const getMoodLabel = (moodScore: number) => {
    const labels = ['Very Bad', 'Bad', 'Okay', 'Good', 'Very Good'];
    return labels[moodScore - 1] || 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your journal history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Filter Section */}
      <Card className="border-purple-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filter Entries
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        
        {showFilters && (
          <CardContent>
            <form onSubmit={handleFilterSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" className="bg-purple-500 hover:bg-purple-600">
                  Apply Filters
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Historical Entries */}
      <div className="space-y-4">
        {historicalEntries.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No entries found</h3>
            <p className="text-gray-500">
              {startDate || endDate 
                ? "Try adjusting your date filters or start logging your daily activities!"
                : "Start logging your daily tasks and mood to see your history here!"
              }
            </p>
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-600 mb-4">
              Showing {historicalEntries.length} entries
              {(startDate || endDate) && (
                <span className="ml-2">
                  {startDate && `from ${new Date(startDate).toLocaleDateString()}`}
                  {startDate && endDate && ' '}
                  {endDate && `to ${new Date(endDate).toLocaleDateString()}`}
                </span>
              )}
            </div>

            {historicalEntries.map((entry: DailyEntry) => {
              const dateString = getDateString(entry.date);
              const isExpanded = expandedEntry === dateString;
              const completedTasks = entry.tasks.filter(t => t.completed).length;
              
              return (
                <Card key={dateString} className="hover:shadow-lg transition-all duration-200">
                  <CardHeader 
                    className="cursor-pointer"
                    onClick={() => toggleEntryExpansion(dateString)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Calendar className="h-5 w-5 text-purple-500" />
                        <div>
                          <CardTitle className="text-lg">
                            {formatDate(entry.date)}
                          </CardTitle>
                          <div className="flex items-center gap-4 mt-1">
                            {/* Task Summary */}
                            <div className="flex items-center text-sm text-gray-600">
                              <CheckSquare className="h-4 w-4 mr-1" />
                              {entry.tasks.length === 0 ? (
                                'No tasks'
                              ) : (
                                <>
                                  {completedTasks}/{entry.tasks.length} tasks completed
                                  {completedTasks === entry.tasks.length && entry.tasks.length > 0 && (
                                    <span className="ml-1">✨</span>
                                  )}
                                </>
                              )}
                            </div>
                            
                            {/* Mood Summary */}
                            {entry.mood_entry && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Heart className="h-4 w-4 mr-1" />
                                <span className="mr-1">{getMoodEmoji(entry.mood_entry.mood_score)}</span>
                                {getMoodLabel(entry.mood_entry.mood_score)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        {completedTasks === entry.tasks.length && entry.tasks.length > 0 && (
                          <Badge variant="default" className="mr-2 bg-green-500">
                            All Done!
                          </Badge>
                        )}
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="pt-0">
                      <div className="grid lg:grid-cols-2 gap-6">
                        {/* Tasks Detail */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <CheckSquare className="h-4 w-4 mr-2" />
                            Tasks ({entry.tasks.length})
                          </h4>
                          {entry.tasks.length === 0 ? (
                            <p className="text-gray-500 italic">No tasks for this day</p>
                          ) : (
                            <div className="space-y-2">
                              {entry.tasks
                                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                                .map((task) => (
                                  <div 
                                    key={task.id}
                                    className={`p-3 rounded-lg border ${
                                      task.completed 
                                        ? 'bg-green-50 border-green-200' 
                                        : 'bg-gray-50 border-gray-200'
                                    }`}
                                  >
                                    <div className="flex items-start gap-2">
                                      <div className={`mt-1 ${task.completed ? 'text-green-600' : 'text-gray-400'}`}>
                                        {task.completed ? '✓' : '○'}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-sm ${
                                          task.completed 
                                            ? 'line-through text-gray-600' 
                                            : 'text-gray-900'
                                        }`}>
                                          {task.description}
                                        </p>
                                        {task.completed && task.completed_at && (
                                          <p className="text-xs text-green-600 mt-1">
                                            Completed: {new Date(task.completed_at).toLocaleTimeString('en-US', {
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>

                        {/* Mood Detail */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <Heart className="h-4 w-4 mr-2" />
                            Mood
                          </h4>
                          {!entry.mood_entry ? (
                            <p className="text-gray-500 italic">No mood logged for this day</p>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg border border-pink-200">
                                <span className="text-3xl">{getMoodEmoji(entry.mood_entry.mood_score)}</span>
                                <div>
                                  <p className="font-medium text-pink-900">
                                    {getMoodLabel(entry.mood_entry.mood_score)}
                                  </p>
                                  <p className="text-sm text-pink-700">
                                    Logged: {new Date(entry.mood_entry.created_at).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>
                              
                              {entry.mood_entry.note && (
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                  <p className="text-sm text-gray-700 italic">
                                    "{entry.mood_entry.note}"
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </>
        )}
      </div>

      {/* Load More Button (if needed in the future) */}
      {historicalEntries.length >= 30 && (
        <div className="text-center pt-4">
          <p className="text-sm text-gray-500">
            Showing the last 30 entries. Use date filters to view specific periods.
          </p>
        </div>
      )}
    </div>
  );
}
