import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { DailyConspiracyLevel, GetConspiracyLevelsByDateRangeInput } from '../../../server/src/schema';

export function ConspiracyHistory() {
  const [conspiracyLevels, setConspiracyLevels] = useState<DailyConspiracyLevel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{
    start_date: string;
    end_date: string;
  }>({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end_date: new Date().toISOString().split('T')[0] // Today
  });

  const loadConspiracyLevels = useCallback(async () => {
    setIsLoading(true);
    try {
      const input: GetConspiracyLevelsByDateRangeInput = {
        start_date: new Date(dateRange.start_date),
        end_date: new Date(dateRange.end_date)
      };
      
      const data = await trpc.getConspiracyLevelsByDateRange.query(input);
      setConspiracyLevels(data);
    } catch (error) {
      console.error('Failed to load conspiracy levels:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadConspiracyLevels();
  }, [loadConspiracyLevels]);

  const getThreatLevel = (score: number): { level: string; color: string; emoji: string } => {
    if (score === 0) return { level: 'Suspiciously Calm', color: 'bg-gray-500', emoji: '😴' };
    if (score <= 10) return { level: 'Mildly Sus', color: 'bg-green-500', emoji: '🤔' };
    if (score <= 25) return { level: 'Plotting Something', color: 'bg-yellow-500', emoji: '😼' };
    if (score <= 50) return { level: 'Definitely Scheming', color: 'bg-orange-500', emoji: '😾' };
    if (score <= 75) return { level: 'Full Conspiracy Mode', color: 'bg-red-500', emoji: '🙀' };
    return { level: 'WORLD DOMINATION IMMINENT', color: 'bg-purple-500', emoji: '😈' };
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const totalScore = conspiracyLevels.reduce(
    (sum: number, level: DailyConspiracyLevel) => sum + level.total_conspiracy_score,
    0
  );

  const totalActivities = conspiracyLevels.reduce(
    (sum: number, level: DailyConspiracyLevel) => sum + level.activity_count,
    0
  );

  const averageScore = conspiracyLevels.length > 0 ? Math.round(totalScore / conspiracyLevels.length) : 0;
  const maxScore = Math.max(...conspiracyLevels.map((level: DailyConspiracyLevel) => level.total_conspiracy_score), 0);

  return (
    <Card className="border-2 border-purple-200 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📊 Conspiracy Level History
        </CardTitle>
        <CardDescription>
          Track the evolution of your cat's world domination plans
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Date Range Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={dateRange.start_date}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setDateRange((prev) => ({ ...prev, start_date: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={dateRange.end_date}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setDateRange((prev) => ({ ...prev, end_date: e.target.value }))
              }
            />
          </div>

          <div className="flex items-end">
            <Button 
              onClick={loadConspiracyLevels} 
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? '📊 Loading...' : '🔍 Load Data'}
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        {conspiracyLevels.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-purple-50 rounded-lg border text-center">
                <p className="text-2xl font-bold text-purple-800">{conspiracyLevels.length}</p>
                <p className="text-sm text-purple-600">Days Tracked</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border text-center">
                <p className="text-2xl font-bold text-blue-800">{totalActivities}</p>
                <p className="text-sm text-blue-600">Total Activities</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border text-center">
                <p className="text-2xl font-bold text-orange-800">{averageScore}</p>
                <p className="text-sm text-orange-600">Avg Daily Score</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border text-center">
                <p className="text-2xl font-bold text-red-800">{maxScore}</p>
                <p className="text-sm text-red-600">Highest Daily Score</p>
              </div>
            </div>

            <Separator className="mb-6" />
          </>
        )}

        {/* Conspiracy Levels List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📊</div>
            <p>Loading conspiracy data...</p>
          </div>
        ) : conspiracyLevels.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">📅</div>
            <p>No conspiracy levels found for the selected date range.</p>
            <p className="text-sm mt-2">
              Try extending the date range or log some activities to generate conspiracy data.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {conspiracyLevels
              .sort((a: DailyConspiracyLevel, b: DailyConspiracyLevel) => 
                new Date(b.date).getTime() - new Date(a.date).getTime()
              )
              .map((level: DailyConspiracyLevel, index: number) => {
                const threat = getThreatLevel(level.total_conspiracy_score);
                
                return (
                  <div key={level.id}>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{threat.emoji}</div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {formatDate(level.date)}
                            </h3>
                            <Badge className={`${threat.color} text-white`}>
                              {threat.level}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-purple-800">
                            {level.total_conspiracy_score}
                          </p>
                          <p className="text-sm text-gray-600">
                            {level.activity_count} activities
                          </p>
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className={`${threat.color} h-2 rounded-full transition-all duration-300`}
                          style={{
                            width: `${Math.min((level.total_conspiracy_score / maxScore) * 100, 100)}%`
                          }}
                        ></div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          Last updated: {level.updated_at.toLocaleString()}
                        </span>
                        <span>
                          Score: {level.total_conspiracy_score} / {maxScore} max
                        </span>
                      </div>
                    </div>
                    {index < conspiracyLevels.length - 1 && <Separator className="my-2" />}
                  </div>
                );
              })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
