import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { HabitWithStreak } from '../../../server/src/schema';

interface StatsCardProps {
  habits: HabitWithStreak[];
}

export function StatsCard({ habits }: StatsCardProps) {
  const totalHabits = habits.length;
  const totalStreakDays = habits.reduce((sum, habit) => sum + habit.current_streak, 0);
  const longestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.current_streak)) : 0;
  const activeHabits = habits.filter(h => h.current_streak > 0).length;

  const getMotivationalMessage = () => {
    if (totalHabits === 0) return "Ready to start your habit journey? 🚀";
    if (longestStreak === 0) return "Every expert was once a beginner! 🌱";
    if (longestStreak < 7) return "You're building momentum! 💪";
    if (longestStreak < 30) return "Amazing consistency! 🔥";
    if (longestStreak < 100) return "You're a habit master! ⭐";
    return "Legendary dedication! You're unstoppable! 🏆";
  };

  if (totalHabits === 0) {
    return null;
  }

  return (
    <Card className="border-0 shadow-lg mb-6 bg-gradient-to-r from-emerald-50 to-teal-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-emerald-800">
          📊 Your Progress Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">{totalHabits}</div>
            <div className="text-sm text-gray-600">Total Habits</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{activeHabits}</div>
            <div className="text-sm text-gray-600">Active Streaks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{longestStreak}</div>
            <div className="text-sm text-gray-600">Best Streak</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{totalStreakDays}</div>
            <div className="text-sm text-gray-600">Total Days</div>
          </div>
        </div>
        
        <div className="text-center">
          <Badge 
            variant="outline" 
            className="text-base px-4 py-2 bg-white/70 border-emerald-200 text-emerald-700"
          >
            {getMotivationalMessage()}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
