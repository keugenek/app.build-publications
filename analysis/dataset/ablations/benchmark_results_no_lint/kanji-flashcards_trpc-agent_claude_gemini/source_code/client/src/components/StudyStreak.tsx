import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Flame, Trophy, Target } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  achieved: boolean;
  progress?: number;
  target?: number;
}

interface StudyStreakProps {
  currentStreak: number;
  longestStreak: number;
  studyDays: number[];
  achievements: Achievement[];
}

export function StudyStreak({ 
  currentStreak, 
  longestStreak, 
  studyDays,
  achievements 
}: StudyStreakProps) {
  // Generate calendar for current month
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  
  const calendarDays = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  
  // Add days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const hasStudied = studyDays.includes(day);
    const isToday = day === today.getDate();
    calendarDays.push({ day, hasStudied, isToday });
  }

  return (
    <div className="space-y-6">
      {/* Streak Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-hover">
          <CardContent className="p-6 text-center">
            <Flame className="mx-auto h-8 w-8 text-orange-500 mb-2" />
            <div className="text-2xl font-bold text-orange-600">{currentStreak}</div>
            <div className="text-sm text-gray-600">Current Streak</div>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardContent className="p-6 text-center">
            <Trophy className="mx-auto h-8 w-8 text-yellow-500 mb-2" />
            <div className="text-2xl font-bold text-yellow-600">{longestStreak}</div>
            <div className="text-sm text-gray-600">Longest Streak</div>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardContent className="p-6 text-center">
            <Calendar className="mx-auto h-8 w-8 text-blue-500 mb-2" />
            <div className="text-2xl font-bold text-blue-600">{studyDays.length}</div>
            <div className="text-sm text-gray-600">Days This Month</div>
          </CardContent>
        </Card>
      </div>

      {/* Study Calendar */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Study Calendar - {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
                {day}
              </div>
            ))}
            
            {calendarDays.map((dayData, index) => (
              <div
                key={index}
                className={`aspect-square flex items-center justify-center text-sm rounded-lg ${
                  dayData
                    ? dayData.isToday
                      ? dayData.hasStudied
                        ? 'bg-green-500 text-white ring-2 ring-blue-400'
                        : 'bg-blue-100 text-blue-700 ring-2 ring-blue-400'
                      : dayData.hasStudied
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : ''
                }`}
              >
                {dayData?.day}
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Studied</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-100 border border-blue-400 rounded"></div>
              <span>Today</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
              <span>Not studied</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Trophy className="mr-2 h-5 w-5" />
            Achievements
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  achievement.achieved
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <achievement.icon 
                      className={`h-5 w-5 ${
                        achievement.achieved ? 'text-green-600' : 'text-gray-400'
                      }`} 
                    />
                    <span className={`font-medium ${
                      achievement.achieved ? 'text-green-800' : 'text-gray-700'
                    }`}>
                      {achievement.title}
                    </span>
                  </div>
                  {achievement.achieved && (
                    <Badge className="bg-green-100 text-green-800">✓</Badge>
                  )}
                </div>
                
                <p className={`text-sm ${
                  achievement.achieved ? 'text-green-700' : 'text-gray-600'
                }`}>
                  {achievement.description}
                </p>
                
                {!achievement.achieved && achievement.progress !== undefined && achievement.target && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{achievement.progress}/{achievement.target}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full progress-smooth"
                        style={{ width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
