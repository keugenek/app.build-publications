import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
import type { WellnessTrend } from '../../../server/src/schema';

interface WellnessTrendsProps {
  userId: string;
}

export function WellnessTrends({ userId }: WellnessTrendsProps) {
  const [trends, setTrends] = useState<WellnessTrend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<string>('30');

  const loadTrends = useCallback(async () => {
    try {
      setIsLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange));

      const result = await trpc.getWellnessTrends.query({
        user_id: userId,
        start_date: startDate,
        end_date: endDate,
        limit: parseInt(timeRange)
      });
      setTrends(result);
    } catch (error) {
      console.error('Failed to load wellness trends:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, timeRange]);

  useEffect(() => {
    loadTrends();
  }, [loadTrends]);

  const calculateTrendStats = () => {
    if (trends.length === 0) return null;

    const avgScore = trends.reduce((sum, trend) => sum + trend.wellness_score, 0) / trends.length;
    const avgSleep = trends.reduce((sum, trend) => sum + trend.sleep_hours, 0) / trends.length;
    const avgStress = trends.reduce((sum, trend) => sum + trend.stress_level, 0) / trends.length;
    const avgCaffeine = trends.reduce((sum, trend) => sum + trend.caffeine_intake, 0) / trends.length;
    const avgAlcohol = trends.reduce((sum, trend) => sum + trend.alcohol_intake, 0) / trends.length;

    // Calculate trend direction (comparing first half vs second half)
    const midPoint = Math.floor(trends.length / 2);
    const firstHalf = trends.slice(0, midPoint);
    const secondHalf = trends.slice(midPoint);

    const firstHalfAvg = firstHalf.reduce((sum, trend) => sum + trend.wellness_score, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, trend) => sum + trend.wellness_score, 0) / secondHalf.length;
    const trendDirection = secondHalfAvg - firstHalfAvg;

    return {
      avgScore: Math.round(avgScore),
      avgSleep: Math.round(avgSleep * 10) / 10,
      avgStress: Math.round(avgStress * 10) / 10,
      avgCaffeine: Math.round(avgCaffeine),
      avgAlcohol: Math.round(avgAlcohol * 10) / 10,
      trendDirection
    };
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getTrendIcon = (direction: number): string => {
    if (direction > 5) return '📈';
    if (direction < -5) return '📉';
    return '➡️';
  };

  const getTrendText = (direction: number): string => {
    if (direction > 5) return 'Improving';
    if (direction < -5) return 'Declining';
    return 'Stable';
  };

  const getTrendColor = (direction: number): string => {
    if (direction > 5) return 'text-green-600';
    if (direction < -5) return 'text-red-600';
    return 'text-gray-600';
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading wellness trends...</p>
      </div>
    );
  }

  const stats = calculateTrendStats();

  if (!stats || trends.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No trend data available</h3>
        <p className="text-gray-500 mb-4">Add more wellness entries to see trends and patterns!</p>
        <Button onClick={loadTrends} variant="outline">
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-700">Wellness Trends</h3>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 2 weeks</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadTrends} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* Trend Overview */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="text-center">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={`text-lg font-bold py-1 px-3 ${getScoreColor(stats.avgScore)}`}>
              {stats.avgScore}/100
            </Badge>
            <div className={`text-sm mt-2 font-medium ${getTrendColor(stats.trendDirection)}`}>
              {getTrendIcon(stats.trendDirection)} {getTrendText(stats.trendDirection)}
            </div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Average Sleep</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.avgSleep}h</div>
            <div className="text-sm text-gray-500 mt-1">
              {stats.avgSleep >= 7 && stats.avgSleep <= 9 ? '✅ Optimal range' : '⚠️ Outside optimal 7-9h'}
            </div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Average Stress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.avgStress}/10</div>
            <div className="text-sm text-gray-500 mt-1">
              {stats.avgStress <= 5 ? '😌 Good level' : '😰 High stress'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="text-center">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">☕ Average Caffeine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-amber-600">{stats.avgCaffeine}mg/day</div>
            <div className="text-sm text-gray-500 mt-1">
              {stats.avgCaffeine <= 400 ? '✅ Within safe limit' : '⚠️ Above 400mg limit'}
            </div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">🍷 Average Alcohol</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-red-600">{stats.avgAlcohol} drinks/day</div>
            <div className="text-sm text-gray-500 mt-1">
              {stats.avgAlcohol <= 1 ? '✅ Moderate level' : '⚠️ Above moderate level'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Simple Visual Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-gray-600">Score Trend ({timeRange} days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {trends.slice(0, 10).map((trend: WellnessTrend, index: number) => {
              const date = new Date(trend.date);
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <div key={index} className="flex items-center justify-between p-2 rounded bg-gray-50">
                  <div className="text-sm">
                    <div className={`font-medium ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                      {isToday ? 'Today' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span>😴 {trend.sleep_hours}h</span>
                    <span>😰 {trend.stress_level}</span>
                    <Badge className={`${getScoreColor(trend.wellness_score)} text-xs`}>
                      {trend.wellness_score}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
          {trends.length > 10 && (
            <div className="text-center mt-4 text-sm text-gray-500">
              Showing recent 10 entries of {trends.length} total
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2">
        <CardHeader>
          <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
            💡 Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {stats.avgSleep < 7 && (
              <div className="text-amber-700">
                💤 Consider getting more sleep - you're averaging {stats.avgSleep}h but 7-9h is optimal
              </div>
            )}
            {stats.avgStress > 7 && (
              <div className="text-red-700">
                😰 Your stress levels are high (avg {stats.avgStress}/10) - consider stress management techniques
              </div>
            )}
            {stats.avgCaffeine > 300 && (
              <div className="text-orange-700">
                ☕ High caffeine intake ({stats.avgCaffeine}mg/day) - consider reducing for better sleep
              </div>
            )}
            {stats.trendDirection > 5 && (
              <div className="text-green-700">
                📈 Great progress! Your wellness score is improving over time
              </div>
            )}
            {stats.trendDirection < -5 && (
              <div className="text-red-700">
                📉 Your wellness score is declining - consider adjusting your habits
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
