import { Badge } from '@/components/ui/badge';
import type { HabitWithStreak } from '../../../server/src/schema';

interface HabitStatsProps {
  habit: HabitWithStreak;
}

export function HabitStats({ habit }: HabitStatsProps) {
  // Get streak badge color based on current streak
  const getStreakBadgeVariant = (streak: number) => {
    if (streak === 0) return 'secondary';
    if (streak < 7) return 'default';
    if (streak < 30) return 'default';
    return 'default';
  };

  // Get motivational message based on streak
  const getStreakMessage = (streak: number) => {
    if (streak === 0) return '🌱 Ready to start';
    if (streak === 1) return '🚀 Great start!';
    if (streak < 7) return `🔥 Building momentum`;
    if (streak < 30) return `⭐ Strong habit forming`;
    if (streak < 100) return `💎 Incredible dedication`;
    return `🏆 Habit master`;
  };

  return (
    <>
      {/* Streak Information Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border">
          <div className="text-2xl font-bold text-indigo-600">
            {habit.current_streak}
          </div>
          <div className="text-xs text-gray-600 font-medium">Current Streak</div>
        </div>
        <div className="text-center p-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border">
          <div className="text-2xl font-bold text-amber-600">
            {habit.longest_streak}
          </div>
          <div className="text-xs text-gray-600 font-medium">Best Streak</div>
        </div>
      </div>

      {/* Total Completions and Streak Badge */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-600">
          <span className="font-medium">{habit.total_completions}</span> total completions
        </div>
        <Badge variant={getStreakBadgeVariant(habit.current_streak)}>
          {habit.current_streak === 0 ? '🌱 Start' : `🔥 ${habit.current_streak} days`}
        </Badge>
      </div>

      {/* Motivational Message */}
      <div className="text-center">
        <p className="text-xs text-gray-500 italic">
          {getStreakMessage(habit.current_streak)}
        </p>
      </div>
    </>
  );
}
