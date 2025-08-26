import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { WeeklyTrends as WeeklyTrendsType } from '../../../server/src/schema';

export function WeeklyTrends() {
  const [trendsData, setTrendsData] = useState<WeeklyTrendsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState<string>('');

  const loadTrends = useCallback(async (weekStart?: string) => {
    try {
      setIsLoading(true);
      const result = await trpc.getWeeklyTrends.query(weekStart ? { start_date: weekStart } : undefined);
      setTrendsData(result);
    } catch (error) {
      console.error('Failed to load weekly trends:', error);
      setTrendsData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Get current week start (Monday)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysToMonday);
    const weekStart = monday.toISOString().split('T')[0];
    
    setCurrentWeekStart(weekStart);
    loadTrends(weekStart);
  }, [loadTrends]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const current = new Date(currentWeekStart);
    const offset = direction === 'prev' ? -7 : 7;
    current.setDate(current.getDate() + offset);
    const newWeekStart = current.toISOString().split('T')[0];
    
    setCurrentWeekStart(newWeekStart);
    loadTrends(newWeekStart);
  };

  const SimpleChart = ({ data, color, title, unit, emoji }: {
    data: number[];
    color: string;
    title: string;
    unit: string;
    emoji: string;
  }) => {
    const maxValue = Math.max(...data, 1);
    const average = data.reduce((sum, val) => sum + val, 0) / data.length;

    return (
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
        <CardHeader className={`bg-gradient-to-r ${color} text-white pb-3`}>
          <CardTitle className="text-lg flex items-center gap-2">
            {emoji} {title}
          </CardTitle>
          <CardDescription className="text-blue-100">
            Weekly average: {average.toFixed(1)} {unit}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Chart bars */}
            <div className="flex items-end justify-between h-32 bg-gray-50 p-2 rounded">
              {data.map((value, index) => {
                const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
                const day = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index];
                
                return (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div className="flex items-end h-24 w-full justify-center mb-1">
                      <div
                        className={`w-6 bg-gradient-to-t ${color.replace('from-', 'from-').replace('to-', 'to-')} rounded-t transition-all hover:opacity-80`}
                        style={{ height: `${height}%` }}
                        title={`${day}: ${value} ${unit}`}
                      />
                    </div>
                    <div className="text-xs text-gray-600 font-medium">{day}</div>
                    <div className="text-xs text-gray-500">{value}</div>
                  </div>
                );
              })}
            </div>
            
            {/* Statistics */}
            <div className="flex justify-between text-sm">
              <Badge variant="outline">
                Min: {Math.min(...data).toFixed(1)} {unit}
              </Badge>
              <Badge variant="outline">
                Max: {Math.max(...data).toFixed(1)} {unit}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading weekly trends...</p>
        </div>
      </div>
    );
  }

  if (!trendsData || trendsData.dates.length === 0) {
    return (
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur text-center py-12">
        <CardContent>
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Weekly Data</h3>
          <p className="text-gray-500">
            Log activities for at least a few days to see your weekly trends here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatWeekRange = (startDate: string) => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">📈 Weekly Trends</CardTitle>
              <CardDescription>
                Week of {formatWeekRange(currentWeekStart)}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigateWeek('prev')}
                className="hover:bg-blue-50"
              >
                ← Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigateWeek('next')}
                className="hover:bg-blue-50"
              >
                Next →
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleChart
          data={trendsData.sleep_duration}
          color="from-blue-500 to-cyan-500"
          title="Sleep Duration"
          unit="hours"
          emoji="😴"
        />
        
        <SimpleChart
          data={trendsData.work_hours}
          color="from-green-500 to-emerald-500"
          title="Work Hours"
          unit="hours"
          emoji="💼"
        />
        
        <SimpleChart
          data={trendsData.social_time}
          color="from-purple-500 to-pink-500"
          title="Social Time"
          unit="hours"
          emoji="👥"
        />
        
        <SimpleChart
          data={trendsData.screen_time}
          color="from-orange-500 to-red-500"
          title="Screen Time"
          unit="hours"
          emoji="📱"
        />
      </div>

      {/* Emotional Energy Chart */}
      <SimpleChart
        data={trendsData.emotional_energy}
        color="from-yellow-400 to-orange-500"
        title="Emotional Energy"
        unit="/ 10"
        emoji="🌟"
      />

      {/* Weekly Insights */}
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <CardTitle>🔍 Weekly Insights</CardTitle>
          <CardDescription className="text-indigo-100">
            Key patterns and observations
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: 'Sleep Pattern',
                value: trendsData.sleep_duration.reduce((sum, val) => sum + val, 0) / trendsData.sleep_duration.length,
                unit: 'avg hours',
                emoji: '😴',
                status: 'Good'
              },
              {
                title: 'Work Consistency',
                value: Math.max(...trendsData.work_hours) - Math.min(...trendsData.work_hours),
                unit: 'hours range',
                emoji: '💼',
                status: 'Variable'
              },
              {
                title: 'Social Balance',
                value: trendsData.social_time.reduce((sum, val) => sum + val, 0) / trendsData.social_time.length,
                unit: 'avg hours',
                emoji: '👥',
                status: 'Balanced'
              },
              {
                title: 'Digital Wellness',
                value: trendsData.screen_time.reduce((sum, val) => sum + val, 0) / trendsData.screen_time.length,
                unit: 'avg hours',
                emoji: '📱',
                status: 'Monitor'
              }
            ].map((insight, index) => (
              <div key={index} className="text-center p-4 bg-gradient-to-b from-gray-50 to-white rounded-lg border">
                <div className="text-2xl mb-2">{insight.emoji}</div>
                <div className="text-lg font-semibold text-gray-900">
                  {insight.value.toFixed(1)}
                </div>
                <div className="text-xs text-gray-600 mb-1">{insight.unit}</div>
                <div className="text-sm font-medium text-gray-700">{insight.title}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-gray-800 mb-2">📝 Weekly Summary</h4>
            <p className="text-sm text-gray-700 leading-relaxed">
              This week you averaged{' '}
              <strong>{(trendsData.sleep_duration.reduce((sum, val) => sum + val, 0) / trendsData.sleep_duration.length).toFixed(1)} hours</strong> of sleep,{' '}
              <strong>{(trendsData.work_hours.reduce((sum, val) => sum + val, 0) / trendsData.work_hours.length).toFixed(1)} hours</strong> of work, and{' '}
              <strong>{(trendsData.social_time.reduce((sum, val) => sum + val, 0) / trendsData.social_time.length).toFixed(1)} hours</strong> of social time.
              Your emotional energy averaged{' '}
              <strong>{(trendsData.emotional_energy.reduce((sum, val) => sum + val, 0) / trendsData.emotional_energy.length).toFixed(1)}/10</strong>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
