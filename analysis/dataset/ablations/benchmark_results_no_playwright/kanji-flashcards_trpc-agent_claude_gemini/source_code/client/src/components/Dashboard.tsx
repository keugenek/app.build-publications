import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Brain, BookOpen, Calendar, TrendingUp, RefreshCw, Clock, Target } from 'lucide-react';
import type { AuthResponse, KanjiWithProgress, ProgressStats } from '../../../server/src/schema';

interface DashboardProps {
  user: AuthResponse['user'];
  dueReviews: KanjiWithProgress[];
  progressStats: ProgressStats[];
  isLoading: boolean;
  onStartReview: () => void;
  onRefresh: () => void;
}

export function Dashboard({ 
  user, 
  dueReviews, 
  progressStats, 
  isLoading, 
  onStartReview, 
  onRefresh 
}: DashboardProps) {
  const totalDueReviews = dueReviews.length;
  const totalLearned = progressStats.reduce((sum, stat) => sum + stat.learned_kanji, 0);
  const totalKanji = progressStats.reduce((sum, stat) => sum + stat.total_kanji, 0);
  const overallProgress = totalKanji > 0 ? (totalLearned / totalKanji) * 100 : 0;

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'N5': return 'bg-green-100 text-green-800';
      case 'N4': return 'bg-blue-100 text-blue-800';
      case 'N3': return 'bg-yellow-100 text-yellow-800';
      case 'N2': return 'bg-orange-100 text-orange-800';
      case 'N1': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSRSLevelInfo = (srsLevel: string) => {
    const levels = {
      'APPRENTICE_1': { name: 'Apprentice I', color: 'bg-pink-100 text-pink-800' },
      'APPRENTICE_2': { name: 'Apprentice II', color: 'bg-pink-100 text-pink-800' },
      'APPRENTICE_3': { name: 'Apprentice III', color: 'bg-pink-100 text-pink-800' },
      'APPRENTICE_4': { name: 'Apprentice IV', color: 'bg-pink-100 text-pink-800' },
      'GURU_1': { name: 'Guru I', color: 'bg-purple-100 text-purple-800' },
      'GURU_2': { name: 'Guru II', color: 'bg-purple-100 text-purple-800' },
      'MASTER': { name: 'Master', color: 'bg-blue-100 text-blue-800' },
      'ENLIGHTENED': { name: 'Enlightened', color: 'bg-yellow-100 text-yellow-800' },
      'BURNED': { name: 'Burned', color: 'bg-gray-100 text-gray-800' }
    };
    return levels[srsLevel as keyof typeof levels] || { name: srsLevel, color: 'bg-gray-100 text-gray-800' };
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Welcome back, {user.username}! 👋</CardTitle>
                <p className="text-gray-600 mt-1">Ready to continue your kanji journey?</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Brain className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalDueReviews}</p>
                <p className="text-sm text-gray-600">Reviews Due</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalLearned}</p>
                <p className="text-sm text-gray-600">Kanji Learned</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overallProgress.toFixed(1)}%</p>
                <p className="text-sm text-gray-600">Overall Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Review Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-red-600" />
            <span>Review Session</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {totalDueReviews > 0 ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                You have <span className="font-semibold text-red-600">{totalDueReviews} kanji</span> ready for review! 
                Keep up your learning momentum. 🔥
              </p>
              <div className="space-y-2">
                <p className="text-sm font-medium">Due for review:</p>
                <div className="flex flex-wrap gap-2">
                  {dueReviews.slice(0, 5).map((review: KanjiWithProgress) => (
                    <div key={review.id} className="flex items-center space-x-2 bg-gray-50 rounded-lg p-2">
                      <span className="text-2xl font-bold">{review.character}</span>
                      <div className="text-xs">
                        <Badge className={getLevelColor(review.jlpt_level)}>
                          {review.jlpt_level}
                        </Badge>
                        {review.user_progress && (
                          <Badge className={`ml-1 ${getSRSLevelInfo(review.user_progress.srs_level).color}`} variant="secondary">
                            {getSRSLevelInfo(review.user_progress.srs_level).name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {dueReviews.length > 5 && (
                    <div className="flex items-center justify-center bg-gray-100 rounded-lg p-2 text-sm text-gray-600">
                      +{dueReviews.length - 5} more
                    </div>
                  )}
                </div>
              </div>
              <Button onClick={onStartReview} size="lg" className="w-full">
                <Brain className="mr-2 h-5 w-5" />
                Start Review Session
              </Button>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-green-100 rounded-full">
                  <Clock className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <p className="text-gray-600 mb-2">🎉 No reviews due right now!</p>
              <p className="text-sm text-gray-500">Check back later or explore new kanji to learn.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* JLPT Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span>JLPT Level Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {progressStats.map((stat: ProgressStats) => (
              <div key={stat.jlpt_level}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <Badge className={getLevelColor(stat.jlpt_level)}>
                      {stat.jlpt_level}
                    </Badge>
                    <span className="font-medium">
                      {stat.learned_kanji} / {stat.total_kanji} kanji
                    </span>
                  </div>
                  <span className="text-sm font-medium">
                    {stat.completion_percentage.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={stat.completion_percentage} 
                  className="h-2" 
                />
                {stat.due_for_review > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {stat.due_for_review} due for review
                  </p>
                )}
                {stat.jlpt_level !== progressStats[progressStats.length - 1]?.jlpt_level && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}
            {progressStats.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                No progress data available. Start learning some kanji!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
