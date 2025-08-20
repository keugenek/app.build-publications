import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { HabitWithStreak } from '../../../server/src/schema';

interface HabitStatsProps {
  habits: HabitWithStreak[];
}

export function HabitStats({ habits }: HabitStatsProps) {
  const totalHabits = habits.length;
  const completedToday = habits.filter((h: HabitWithStreak) => h.completed_today).length;
  const bestStreak = Math.max(...habits.map((h: HabitWithStreak) => h.longest_streak), 0);
  const activeStreaks = habits.filter((h: HabitWithStreak) => h.current_streak > 0).length;
  const completionRate = totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0;
  const totalStreakDays = habits.reduce((sum: number, h: HabitWithStreak) => sum + h.current_streak, 0);

  // Calculate streak distribution
  const streakRanges = {
    '0 days': habits.filter((h: HabitWithStreak) => h.current_streak === 0).length,
    '1-6 days': habits.filter((h: HabitWithStreak) => h.current_streak >= 1 && h.current_streak <= 6).length,
    '1-4 weeks': habits.filter((h: HabitWithStreak) => h.current_streak >= 7 && h.current_streak <= 29).length,
    '30+ days': habits.filter((h: HabitWithStreak) => h.current_streak >= 30).length,
  };

  if (totalHabits === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            📊 Today's Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Daily Completion Rate
              </span>
              <span className="text-sm font-bold text-blue-600">
                {completedToday}/{totalHabits} ({Math.round(completionRate)}%)
              </span>
            </div>
            <Progress value={completionRate} className="h-2" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalHabits}</div>
                <div className="text-xs text-gray-600">Total Habits</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{completedToday}</div>
                <div className="text-xs text-gray-600">Done Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{activeStreaks}</div>
                <div className="text-xs text-gray-600">Active Streaks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{bestStreak}</div>
                <div className="text-xs text-gray-600">Best Streak</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Streak Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔥 Streak Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(streakRanges).map(([range, count]) => (
              <div key={range} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{range}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${totalHabits > 0 ? (count / totalHabits) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-6">{count}</span>
                </div>
              </div>
            ))}
          </div>
          
          {totalStreakDays > 0 && (
            <div className="mt-6 pt-4 border-t">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  🎯 Total Active Streak Days: {totalStreakDays}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Keep going! Every day counts toward building lasting habits.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
