import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, CalendarDays, TrendingUp } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { DailyEntry, Mood } from '../../../server/src/schema';

const moodEmojis: Record<Mood, string> = {
  'very_sad': '😢',
  'sad': '😞',
  'neutral': '😐',
  'happy': '😊',
  'very_happy': '😄'
};

const moodLabels: Record<Mood, string> = {
  'very_sad': 'Very Sad',
  'sad': 'Sad',
  'neutral': 'Neutral',
  'happy': 'Happy',
  'very_happy': 'Very Happy'
};

export function HistoryView() {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const dateRange = startDate && endDate ? {
        start_date: new Date(startDate),
        end_date: new Date(endDate)
      } : undefined;
      
      const result = await trpc.getDailyEntries.query(dateRange);
      setEntries(result);
    } catch (error) {
      console.error('Failed to load entries:', error);
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleDateFilter = () => {
    loadEntries();
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  const getMoodStats = () => {
    if (entries.length === 0) return null;

    const moodCounts = entries.reduce((acc, entry) => {
      if (entry.mood) {
        acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      }
      return acc;
    }, {} as Record<Mood, number>);

    const mostCommonMood = Object.entries(moodCounts).reduce((a, b) => 
      moodCounts[a[0] as Mood] > moodCounts[b[0] as Mood] ? a : b
    )?.[0] as Mood | undefined;

    return {
      totalWithMood: Object.values(moodCounts).reduce((sum, count) => sum + count, 0),
      mostCommon: mostCommonMood,
      counts: moodCounts
    };
  };

  const moodStats = getMoodStats();

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your journal history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Filter by Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
              />
            </div>
            <Button onClick={handleDateFilter}>
              Apply Filter
            </Button>
            {(startDate || endDate) && (
              <Button variant="outline" onClick={clearDateFilter}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mood Statistics */}
      {moodStats && moodStats.totalWithMood > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Mood Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Most Common Mood</h4>
                {moodStats.mostCommon && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{moodEmojis[moodStats.mostCommon]}</span>
                    <span className="font-medium">{moodLabels[moodStats.mostCommon]}</span>
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-medium mb-2">Mood Distribution</h4>
                <div className="space-y-2">
                  {Object.entries(moodStats.counts).map(([mood, count]) => (
                    <div key={mood} className="flex items-center gap-2 text-sm">
                      <span>{moodEmojis[mood as Mood]}</span>
                      <span className="flex-1">{moodLabels[mood as Mood]}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entries List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            Journal Entries ({entries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📖</div>
              <p className="text-gray-500 text-lg mb-2">No journal entries found</p>
              <p className="text-gray-400">
                {startDate || endDate 
                  ? 'Try adjusting your date filter or create some entries!'
                  : 'Start writing in your journal to see your history here!'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {entry.date.toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Created {entry.created_at.toLocaleString()}
                      </p>
                    </div>
                    {entry.mood && (
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{moodEmojis[entry.mood]}</span>
                        <span className="text-sm font-medium">{moodLabels[entry.mood]}</span>
                      </div>
                    )}
                  </div>

                  {entry.notes && (
                    <>
                      <Separator className="my-3" />
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-1">Notes</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {entry.notes}
                        </p>
                      </div>
                    </>
                  )}

                  {!entry.mood && !entry.notes && (
                    <p className="text-gray-400 text-sm italic">
                      No mood or notes recorded for this day
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
