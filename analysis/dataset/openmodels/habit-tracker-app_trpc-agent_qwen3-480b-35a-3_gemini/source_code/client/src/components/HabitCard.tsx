import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HabitCompletionTracker } from '@/components/HabitCompletionTracker';
import type { HabitWithStreak } from '../../../server/src/schema';

interface HabitCardProps {
  habit: HabitWithStreak;
  onCompletionChange: () => void;
}

export function HabitCard({ habit, onCompletionChange }: HabitCardProps) {
  return (
    <Card className="flex flex-col h-full habit-card transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{habit.name}</CardTitle>
            {habit.description && (
              <CardDescription className="mt-1 text-sm">
                {habit.description}
              </CardDescription>
            )}
          </div>
          <Badge variant="secondary" className="ml-2 text-xs">
            {new Date(habit.created_at).toLocaleDateString()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-center justify-between">
          <HabitCompletionTracker habit={habit} onCompletionChange={onCompletionChange} />
          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Current Streak
            </div>
            <div className="text-xl font-bold text-green-500">{habit.current_streak} days</div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">Longest Streak</span>
            <Badge className="streak-badge">
              {habit.longest_streak} days
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
