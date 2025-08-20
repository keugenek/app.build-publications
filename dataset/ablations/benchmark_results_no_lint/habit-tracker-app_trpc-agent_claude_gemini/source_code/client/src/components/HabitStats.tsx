import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, Calendar, Award } from 'lucide-react';
import type { HabitWithStreak } from '../../../server/src/schema';

interface HabitStatsProps {
  habits: HabitWithStreak[];
}

export function HabitStats({ habits }: HabitStatsProps) {
  // Calculate overall statistics
  const totalHabits = habits.length;
  const activeHabits = habits.filter(h => h.current_streak > 0).length;
  const totalStreakDays = habits.reduce((sum, h) => sum + h.current_streak, 0);
  const longestStreak = Math.max(...habits.map(h => h.current_streak), 0);
  const averageStreak = totalHabits > 0 ? Math.round(totalStreakDays / totalHabits) : 0;
  
  // Get completed today count
  const completedToday = habits.filter(habit => {
    if (!habit.last_completed) return false;
    const today = new Date();
    const completed = new Date(habit.last_completed);
    return (
      completed.getDate() === today.getDate() &&
      completed.getMonth() === today.getMonth() &&
      completed.getFullYear() === today.getFullYear()
    );
  }).length;

  if (totalHabits === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {/* Total Habits */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Target className="h-6 w-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-700">{totalHabits}</div>
          <div className="text-sm text-blue-600">Total Habits</div>
        </CardContent>
      </Card>

      {/* Completed Today */}
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Calendar className="h-6 w-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-700">
            {completedToday}/{totalHabits}
          </div>
          <div className="text-sm text-green-600">Today's Progress</div>
        </CardContent>
      </Card>

      {/* Longest Streak */}
      <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Award className="h-6 w-6 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-orange-700">{longestStreak}</div>
          <div className="text-sm text-orange-600">Longest Streak</div>
        </CardContent>
      </Card>

      {/* Active Streaks */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <TrendingUp className="h-6 w-6 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-700">{activeHabits}</div>
          <div className="text-sm text-purple-600">Active Streaks</div>
        </CardContent>
      </Card>
    </div>
  );
}
