import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Trophy, 
  Clock, 
  TrendingUp, 
  Target,
  Calendar
} from 'lucide-react';
import type { ProgressSummary, KanjiWithProgress, JlptLevel } from '../../../server/src/schema';

interface ProgressDashboardProps {
  progressSummary: ProgressSummary[];
  dueReviews: KanjiWithProgress[];
  onStartStudy: (level: JlptLevel) => void;
  onStartReview: () => void;
}

export function ProgressDashboard({
  progressSummary,
  dueReviews,
  onStartStudy,
  onStartReview
}: ProgressDashboardProps) {
  const totalLearned = progressSummary.reduce((sum, summary) => sum + summary.learned_kanji, 0);
  const totalKanji = progressSummary.reduce((sum, summary) => sum + summary.total_kanji, 0);
  const overallProgress = totalKanji > 0 ? (totalLearned / totalKanji) * 100 : 0;

  // Calculate streak and other stats (mock data since backend is stub)
  const mockStats = {
    currentStreak: 7,
    reviewsToday: 15,
    weeklyGoal: 50,
    weeklyProgress: 32
  };

  const getLevelColor = (level: JlptLevel) => {
    const colors = {
      'N5': 'bg-green-100 text-green-800 border-green-200',
      'N4': 'bg-blue-100 text-blue-800 border-blue-200',
      'N3': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'N2': 'bg-orange-100 text-orange-800 border-orange-200',
      'N1': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[level];
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Progress</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {totalLearned}
            </div>
            <p className="text-xs text-gray-500">
              of {totalKanji} kanji ({overallProgress.toFixed(1)}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {mockStats.currentStreak}
            </div>
            <p className="text-xs text-gray-500">
              days in a row 🔥
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Reviews</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {dueReviews.length}
            </div>
            <p className="text-xs text-gray-500">
              kanji waiting
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Goal</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {mockStats.weeklyProgress}
            </div>
            <p className="text-xs text-gray-500">
              of {mockStats.weeklyGoal} reviews
            </p>
            <Progress 
              value={(mockStats.weeklyProgress / mockStats.weeklyGoal) * 100} 
              className="mt-2 h-1"
            />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {dueReviews.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Clock className="w-5 h-5" />
              Reviews Due Now!
            </CardTitle>
            <CardDescription>
              You have {dueReviews.length} kanji ready for review. Keep your streak going!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={onStartReview}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Start Review Session
            </Button>
          </CardContent>
        </Card>
      )}

      {/* JLPT Level Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            JLPT Level Progress
          </CardTitle>
          <CardDescription>
            Your progress across all Japanese Language Proficiency Test levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {progressSummary.map((summary) => (
              <div 
                key={summary.jlpt_level}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Badge className={getLevelColor(summary.jlpt_level)}>
                    {summary.jlpt_level}
                  </Badge>
                  <div>
                    <div className="font-medium">
                      {summary.learned_kanji} / {summary.total_kanji} kanji
                    </div>
                    <div className="text-sm text-gray-500">
                      {summary.progress_percentage.toFixed(1)}% complete
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-32">
                    <Progress 
                      value={summary.progress_percentage} 
                      className="h-2"
                    />
                  </div>
                  <Button
                    onClick={() => onStartStudy(summary.jlpt_level)}
                    variant="outline"
                    size="sm"
                  >
                    Study
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Completed 15 reviews</span>
              <span className="text-gray-400">• 2 hours ago</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Started studying N4 level</span>
              <span className="text-gray-400">• Yesterday</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-600">Reached 7-day streak!</span>
              <span className="text-gray-400">• 2 days ago</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-gray-600">Learned 20 new kanji</span>
              <span className="text-gray-400">• 3 days ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
