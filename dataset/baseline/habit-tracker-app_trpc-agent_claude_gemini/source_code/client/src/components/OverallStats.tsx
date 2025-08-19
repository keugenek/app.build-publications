import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { HabitWithStreak } from '../../../server/src/schema';

interface OverallStatsProps {
  habits: HabitWithStreak[];
}

export function OverallStats({ habits }: OverallStatsProps) {
  if (habits.length === 0) return null;

  // Calculate overall statistics
  const totalHabits = habits.length;
  const completedToday = habits.filter((h: HabitWithStreak) => h.is_completed_today).length;
  const totalCompletions = habits.reduce((sum: number, h: HabitWithStreak) => sum + h.total_completions, 0);
  const averageStreak = Math.round(
    habits.reduce((sum: number, h: HabitWithStreak) => sum + h.current_streak, 0) / totalHabits
  );
  const maxStreak = Math.max(...habits.map((h: HabitWithStreak) => h.longest_streak));
  
  // Completion percentage for today
  const completionPercentage = Math.round((completedToday / totalHabits) * 100);

  // Get motivational message based on today's progress
  const getMotivationalMessage = () => {
    if (completionPercentage === 100) return "🎉 Perfect day! All habits completed!";
    if (completionPercentage >= 80) return "🌟 Almost there! Great progress today!";
    if (completionPercentage >= 60) return "💪 Good momentum! Keep it up!";
    if (completionPercentage >= 40) return "🚀 Making progress! You've got this!";
    if (completionPercentage > 0) return "🌱 Every step counts! Keep building!";
    return "✨ Ready to start your day? Let's build those habits!";
  };

  return (
    <Card className="mb-8 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white border-0 shadow-xl">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Today's Progress</h2>
          <p className="text-indigo-100">{getMotivationalMessage()}</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-4 bg-white/20 rounded-lg backdrop-blur-sm">
            <div className="text-3xl font-bold">{completedToday}</div>
            <div className="text-sm opacity-90">Completed Today</div>
          </div>
          
          <div className="text-center p-4 bg-white/20 rounded-lg backdrop-blur-sm">
            <div className="text-3xl font-bold">{totalHabits}</div>
            <div className="text-sm opacity-90">Total Habits</div>
          </div>
          
          <div className="text-center p-4 bg-white/20 rounded-lg backdrop-blur-sm">
            <div className="text-3xl font-bold">{averageStreak}</div>
            <div className="text-sm opacity-90">Avg Streak</div>
          </div>
          
          <div className="text-center p-4 bg-white/20 rounded-lg backdrop-blur-sm">
            <div className="text-3xl font-bold">{maxStreak}</div>
            <div className="text-sm opacity-90">Best Streak</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-lg font-semibold">Daily Progress:</div>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              {completionPercentage}% Complete
            </Badge>
          </div>
          
          <div className="text-sm opacity-90">
            {totalCompletions} total completions all-time
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4">
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
