import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { HabitManagement } from '@/components/HabitManagement';
import { useState, useEffect } from 'react';
import { trpc } from '@/utils/trpc';
import type { HabitWithStreak } from '../../../server/src/schema';

interface HabitCardProps {
  habit: HabitWithStreak;
  onTrackingUpdate: () => void;
  onHabitDeleted: () => void;
  isLoading: boolean;
}

export function HabitCard({ habit, onTrackingUpdate, onHabitDeleted, isLoading }: HabitCardProps) {
  const [todayCompleted, setTodayCompleted] = useState(false);
  const [checkingProgress, setCheckingProgress] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  // Load today's progress for this habit
  useEffect(() => {
    const loadTodayProgress = async () => {
      try {
        const progress = await trpc.getHabitProgress.query({
          habit_id: habit.id,
          start_date: today,
          end_date: today
        });
        
        // Check if there's a tracking entry for today
        const todayEntry = progress.find(p => 
          p.date.toISOString().split('T')[0] === today
        );
        setTodayCompleted(todayEntry?.completed || false);
      } catch (error) {
        console.error('Failed to load today\'s progress:', error);
      }
    };

    loadTodayProgress();
  }, [habit.id, today]);

  const handleTrackHabit = async (completed: boolean) => {
    setCheckingProgress(true);
    try {
      await trpc.trackHabit.mutate({
        habit_id: habit.id,
        date: today,
        completed: completed
      });
      
      setTodayCompleted(completed);
      onTrackingUpdate();
    } catch (error) {
      console.error('Failed to track habit:', error);
    } finally {
      setCheckingProgress(false);
    }
  };

  const getStreakEmoji = (streak: number) => {
    if (streak === 0) return '🌱';
    if (streak < 7) return '🔥';
    if (streak < 30) return '⚡';
    if (streak < 100) return '💎';
    return '🏆';
  };

  const getStreakColor = (streak: number) => {
    if (streak === 0) return 'bg-gray-100 text-gray-700';
    if (streak < 7) return 'bg-orange-100 text-orange-700';
    if (streak < 30) return 'bg-blue-100 text-blue-700';
    if (streak < 100) return 'bg-purple-100 text-purple-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  const getStreakMessage = (streak: number) => {
    if (streak === 0) return 'Start your journey!';
    if (streak === 1) return 'Great start!';
    if (streak < 7) return 'Building momentum!';
    if (streak < 30) return 'On fire! 🔥';
    if (streak < 100) return 'Incredible dedication!';
    return 'Legendary streak! 🎉';
  };

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 habit-card-gradient">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 mr-4">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold text-gray-800">
                {habit.name}
              </h3>
              <Badge 
                className={`${getStreakColor(habit.current_streak)} border-0 streak-badge ${
                  habit.current_streak >= 7 ? 'pulse-glow' : ''
                } ${habit.current_streak >= 100 ? 'celebrate-animation' : ''}`}
              >
                {getStreakEmoji(habit.current_streak)} {habit.current_streak} day{habit.current_streak !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            {habit.description && (
              <p className="text-gray-600 mb-3">
                💭 {habit.description}
              </p>
            )}
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>📅 Started {habit.created_at.toLocaleDateString()}</span>
              <span>•</span>
              <span className="text-indigo-600 font-medium">
                {getStreakMessage(habit.current_streak)}
              </span>
            </div>
            
            <HabitManagement 
              habit={habit}
              onHabitUpdated={onTrackingUpdate}
              onHabitDeleted={onHabitDeleted}
            />
          </div>
          
          <Separator orientation="vertical" className="h-20 mx-4" />
          
          <div className="text-center min-w-[140px]">
            <p className="text-sm font-medium text-gray-700 mb-3">
              {todayCompleted ? '✅ Completed today!' : '📋 Mark as done'}
            </p>
            
            <div className="flex flex-col items-center gap-2">
              <Switch
                checked={todayCompleted}
                onCheckedChange={handleTrackHabit}
                disabled={isLoading || checkingProgress}
                className="data-[state=checked]:bg-green-500 habit-switch"
              />
              
              {checkingProgress && (
                <p className="text-xs text-gray-500">Updating...</p>
              )}
              
              {todayCompleted && (
                <div className="text-2xl animate-bounce">🎉</div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
