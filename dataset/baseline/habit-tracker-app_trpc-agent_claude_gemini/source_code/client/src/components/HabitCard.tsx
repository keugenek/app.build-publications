import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { HabitStats } from './HabitStats';
import type { HabitWithStreak } from '../../../server/src/schema';

interface HabitCardProps {
  habit: HabitWithStreak;
  onToggleCompletion: (habitId: number, isCompleted: boolean) => Promise<void>;
  onDelete: (habitId: number) => Promise<void>;
}

export function HabitCard({ habit, onToggleCompletion, onDelete }: HabitCardProps) {
  const handleToggleCompletion = () => {
    onToggleCompletion(habit.id, habit.is_completed_today);
  };

  const handleDelete = () => {
    onDelete(habit.id);
  };

  return (
    <Card className="hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm border-2 hover:border-indigo-200 transform hover:-translate-y-1">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 leading-tight mb-1">
              {habit.name}
            </CardTitle>
            {habit.description && (
              <CardDescription className="text-sm text-gray-600 leading-relaxed">
                {habit.description}
              </CardDescription>
            )}
          </div>
          
          {/* Delete Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <span className="text-lg">🗑️</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <span className="text-red-500">⚠️</span>
                  Delete Habit
                </AlertDialogTitle>
                <AlertDialogDescription className="text-base">
                  Are you sure you want to delete <strong>"{habit.name}"</strong>? 
                  <br />
                  <br />
                  This will permanently remove:
                  <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                    <li>The habit itself</li>
                    <li>All {habit.total_completions} completion records</li>
                    <li>Your {habit.longest_streak}-day best streak</li>
                  </ul>
                  <br />
                  <span className="text-red-600 font-medium">This action cannot be undone.</span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                >
                  Delete Forever
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <HabitStats habit={habit} />
      </CardContent>

      <Separator className="opacity-50" />

      <CardFooter className="pt-4">
        <Button
          onClick={handleToggleCompletion}
          className={`w-full transition-all duration-200 font-medium ${
            habit.is_completed_today
              ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-green-200'
              : 'bg-gray-50 hover:bg-indigo-50 text-gray-700 border-2 border-gray-200 hover:border-indigo-300 hover:text-indigo-700'
          }`}
          variant={habit.is_completed_today ? 'default' : 'outline'}
        >
          {habit.is_completed_today ? (
            <span className="flex items-center justify-center gap-2">
              <span className="text-lg">✅</span>
              Completed Today!
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span className="text-lg">⭕</span>
              Mark as Done
            </span>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
