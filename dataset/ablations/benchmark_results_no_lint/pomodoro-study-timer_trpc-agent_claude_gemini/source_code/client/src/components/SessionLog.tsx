import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar, TrendingUp, RefreshCw } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { SessionLog as SessionLogType } from '../../../server/src/schema';

export function SessionLog() {
  const [todaySummary, setTodaySummary] = useState<SessionLogType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadTodayStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const summary = await trpc.getDailySessionSummary.query(today);
      setTodaySummary(summary);
    } catch (error) {
      console.error('Failed to load session stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodayStats();
  }, [loadTodayStats]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTotalSessions = (summary: SessionLogType) => {
    return summary.work_sessions_count + summary.break_sessions_count;
  };

  const getTotalMinutes = (summary: SessionLogType) => {
    return summary.total_work_minutes + summary.total_break_minutes;
  };

  const formatDuration = (minutes: number) => {
    if (minutes === 0) return '0 min';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const getMotivationalMessage = (summary: SessionLogType) => {
    const workSessions = summary.work_sessions_count;
    
    if (workSessions === 0) {
      return "🌱 Ready to start your first session today?";
    } else if (workSessions < 4) {
      return `🔥 Great start! ${workSessions} session${workSessions > 1 ? 's' : ''} completed today.`;
    } else if (workSessions < 8) {
      return `⭐ Excellent focus! ${workSessions} sessions completed today.`;
    } else {
      return `🏆 Outstanding productivity! ${workSessions} sessions - you're on fire!`;
    }
  };

  if (isLoading && !todaySummary) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm shadow-xl">
        <CardContent className="flex justify-center items-center h-32">
          <div className="text-gray-500">Loading session stats...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            📊 Session Statistics
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={loadTodayStats}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {todaySummary ? (
          <>
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                {formatDate(todaySummary.date)}
              </div>
              <p className="text-lg font-medium text-gray-700">
                {getMotivationalMessage(todaySummary)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-indigo-600">
                  {todaySummary.work_sessions_count}
                </div>
                <div className="text-sm text-gray-600">🍅 Work Sessions</div>
                <Badge variant="secondary" className="text-xs">
                  {formatDuration(todaySummary.total_work_minutes)}
                </Badge>
              </div>

              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-green-600">
                  {todaySummary.break_sessions_count}
                </div>
                <div className="text-sm text-gray-600">☕ Break Sessions</div>
                <Badge variant="secondary" className="text-xs">
                  {formatDuration(todaySummary.total_break_minutes)}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Sessions</span>
                <Badge variant="outline">{getTotalSessions(todaySummary)}</Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Time</span>
                <Badge variant="outline">{formatDuration(getTotalMinutes(todaySummary))}</Badge>
              </div>

              {todaySummary.work_sessions_count > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Avg Work Session</span>
                  <Badge variant="outline">
                    {formatDuration(Math.round(todaySummary.total_work_minutes / todaySummary.work_sessions_count))}
                  </Badge>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-800">Progress Insights</span>
              </div>
              <div className="text-sm text-indigo-700 space-y-1">
                {todaySummary.work_sessions_count === 0 ? (
                  <p>Start your first Pomodoro session to build momentum! 🚀</p>
                ) : todaySummary.work_sessions_count < 4 ? (
                  <p>Try to complete 4 work sessions for a productive day 🎯</p>
                ) : (
                  <p>You're having a highly productive day! Keep up the great work! 🌟</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500">
            No session data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
