import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import type { HabitWithStreak } from '../../../server/src/schema';

interface HabitCardProps {
  habit: HabitWithStreak;
  onToggle: (habitId: number, currentCompleted: boolean) => Promise<void>;
}

export function HabitCard({ habit, onToggle }: HabitCardProps) {
  // Get streak color based on streak length
  const getStreakColor = (streak: number) => {
    if (streak === 0) return 'bg-gray-100 text-gray-800';
    if (streak < 7) return 'bg-green-100 text-green-800';
    if (streak < 30) return 'bg-blue-100 text-blue-800';
    return 'bg-purple-100 text-purple-800';
  };

  // Get motivational message based on streak
  const getMotivationalMessage = (streak: number) => {
    if (streak === 0) return null;
    if (streak === 1) return "Great start! 🌟";
    if (streak < 7) return "Building momentum! 💪";
    if (streak < 30) return "On fire! 🔥";
    return "Legendary streak! 👑";
  };

  return (
    <Card className={`transition-all hover:shadow-md ${habit.completed_today ? 'habit-completed' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <Checkbox
              checked={habit.completed_today}
              onCheckedChange={() => onToggle(habit.id, habit.completed_today)}
              className="mt-1 h-5 w-5 habit-checkbox focus-ring"
            />
            <div className="flex-1">
              <h3 className={`text-lg font-semibold transition-colors ${
                habit.completed_today ? 'text-green-700' : 'text-gray-900'
              }`}>
                {habit.name}
                {habit.completed_today && <span className="ml-2">✅</span>}
              </h3>
              {habit.description && (
                <p className="text-gray-600 mt-1 text-sm leading-relaxed">
                  {habit.description}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                Created {habit.created_at.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <Badge 
                className={`${getStreakColor(habit.current_streak)} ${
                  habit.current_streak > 0 ? 'streak-pulse' : ''
                }`}
              >
                🔥 {habit.current_streak} {habit.current_streak === 1 ? 'day' : 'days'}
              </Badge>
              {habit.longest_streak > habit.current_streak && (
                <Badge variant="outline" className="text-gray-600">
                  Best: {habit.longest_streak}
                </Badge>
              )}
            </div>
            
            {getMotivationalMessage(habit.current_streak) && (
              <div className="text-right">
                <p className="text-sm text-green-600 font-medium">
                  {getMotivationalMessage(habit.current_streak)}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
