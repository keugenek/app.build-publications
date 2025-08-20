import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Flame, Trash2, Edit3 } from 'lucide-react';
import { useState } from 'react';
import type { HabitWithStreak } from '../../../server/src/schema';

interface HabitCardProps {
  habit: HabitWithStreak;
  onCheckIn: (habitId: number) => Promise<void>;
  onDelete?: (habitId: number) => Promise<void>;
  isCheckingIn: boolean;
}

export function HabitCard({ habit, onCheckIn, onDelete, isCheckingIn }: HabitCardProps) {
  const [showActions, setShowActions] = useState(false);

  // Check if habit was completed today
  const isCompletedToday = (lastCompleted: Date | null) => {
    if (!lastCompleted) return false;
    const today = new Date();
    const completed = new Date(lastCompleted);
    return (
      completed.getDate() === today.getDate() &&
      completed.getMonth() === today.getMonth() &&
      completed.getFullYear() === today.getFullYear()
    );
  };

  const completedToday = isCompletedToday(habit.last_completed);

  // Get motivation message based on streak
  const getMotivationMessage = (streak: number) => {
    if (streak === 0) return "Start your journey! 🌱";
    if (streak < 3) return `Getting started! ${streak} day${streak > 1 ? 's' : ''} 💪`;
    if (streak < 7) return `Building momentum! ${streak} days strong! 🚀`;
    if (streak < 14) return `Great progress! ${streak} days streak! ⭐`;
    if (streak < 30) return `Amazing consistency! ${streak} days! 🔥`;
    if (streak < 60) return `Incredible! ${streak} days of dedication! 🏆`;
    if (streak < 100) return `You're unstoppable! ${streak} days! 🎯`;
    return `Legendary habit master! ${streak} days! 👑`;
  };

  // Get streak color based on length
  const getStreakColor = (streak: number) => {
    if (streak === 0) return 'text-gray-400';
    if (streak < 7) return 'text-orange-500';
    if (streak < 30) return 'text-red-500';
    if (streak < 100) return 'text-purple-500';
    return 'text-yellow-500';
  };

  const handleCheckIn = async () => {
    await onCheckIn(habit.id);
  };

  return (
    <Card 
      className={`border-2 card-shadow-hover habit-card-glow transition-all duration-300 ${
        completedToday 
          ? 'border-green-300 bg-gradient-to-r from-green-50 to-emerald-50' 
          : 'border-purple-200 bg-gradient-to-r from-white to-purple-50'
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-gray-800 leading-tight">{habit.name}</h2>
              {completedToday && (
                <Badge className="bg-green-500 text-white celebration">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Done Today!
                </Badge>
              )}
              
              {/* Milestone badges */}
              {habit.current_streak >= 7 && habit.current_streak < 30 && (
                <Badge variant="outline" className="border-orange-300 text-orange-600">
                  Week+
                </Badge>
              )}
              {habit.current_streak >= 30 && habit.current_streak < 100 && (
                <Badge variant="outline" className="border-purple-300 text-purple-600">
                  Month+
                </Badge>
              )}
              {habit.current_streak >= 100 && (
                <Badge variant="outline" className="border-yellow-400 text-yellow-600 milestone-celebration">
                  💯 Century!
                </Badge>
              )}
            </div>
            
            {habit.description && (
              <p className="text-gray-600 mb-3 text-sm leading-relaxed">{habit.description}</p>
            )}
            
            {/* Streak Information */}
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-2">
                <Flame className={`h-5 w-5 ${habit.current_streak > 0 ? `${getStreakColor(habit.current_streak)} streak-flame` : 'text-gray-300'}`} />
                <span className="font-semibold text-lg">
                  {habit.current_streak} day{habit.current_streak !== 1 ? 's' : ''}
                </span>
                {habit.current_streak > 0 && (
                  <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded-full">
                    streak
                  </span>
                )}
              </div>
              
              {habit.last_completed && (
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <span>Last:</span>
                  <span className="font-medium">
                    {new Date(habit.last_completed).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Motivation Message */}
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-3 mb-3">
              <p className="text-sm font-medium text-purple-700">
                {getMotivationMessage(habit.current_streak)}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="ml-4 flex flex-col gap-2">
            {/* Check-in Button */}
            <Button
              onClick={handleCheckIn}
              disabled={completedToday || isCheckingIn}
              size="sm"
              className={`${
                completedToday
                  ? 'bg-green-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
              } text-white px-4 py-2 transition-all duration-200`}
            >
              {isCheckingIn ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  Checking...
                </>
              ) : completedToday ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Done!
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Check In
                </>
              )}
            </Button>

            {/* Additional Actions (shown on hover) */}
            {showActions && onDelete && (
              <div className="flex gap-1 opacity-0 animate-in fade-in duration-200">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                  onClick={() => onDelete(habit.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <Separator />
        
        {/* Progress Footer */}
        <div className="mt-4 pt-4">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600">
              Started: {new Date(habit.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
            
            <div className="flex items-center gap-2">
              {habit.current_streak > 0 ? (
                <span className="font-medium text-orange-600 flex items-center gap-1">
                  <Flame className="h-3 w-3" />
                  {habit.current_streak} day streak!
                </span>
              ) : (
                <span className="text-gray-500">Ready to start! 🚀</span>
              )}
            </div>
          </div>
          
          {/* Progress bar visualization */}
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full progress-fill transition-all duration-800 ${
                  habit.current_streak === 0 
                    ? 'w-0' 
                    : habit.current_streak < 7 
                      ? 'bg-gradient-to-r from-orange-300 to-orange-500' 
                      : habit.current_streak < 30 
                        ? 'bg-gradient-to-r from-red-400 to-red-600' 
                        : 'bg-gradient-to-r from-purple-400 to-purple-600'
                }`}
                style={{ 
                  width: habit.current_streak === 0 ? '0%' : `${Math.min(100, (habit.current_streak / 30) * 100)}%` 
                }}
              ></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
