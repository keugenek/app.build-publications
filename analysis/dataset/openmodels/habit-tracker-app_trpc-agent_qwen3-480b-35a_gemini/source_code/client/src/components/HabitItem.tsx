import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/Badge';
import type { HabitWithStreak } from '../../../server/src/schema';

interface HabitItemProps {
  habit: HabitWithStreak;
  onToggle: (habit: HabitWithStreak) => void;
}

export function HabitItem({ habit, onToggle }: HabitItemProps) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-start space-x-3">
            <Checkbox
              id={`habit-${habit.id}`}
              checked={habit.is_completed_today}
              onCheckedChange={() => onToggle(habit)}
              className="mt-1 h-5 w-5"
            />
            <div className="flex-1">
              <label 
                htmlFor={`habit-${habit.id}`} 
                className={`text-lg font-medium cursor-pointer ${habit.is_completed_today ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-white'}`}
              >
                {habit.name}
              </label>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">
                  🔥 {habit.current_streak} day{habit.current_streak !== 1 ? 's' : ''} streak
                </Badge>
                <Badge variant="outline">
                  🏆 Best: {habit.longest_streak} day{habit.longest_streak !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
