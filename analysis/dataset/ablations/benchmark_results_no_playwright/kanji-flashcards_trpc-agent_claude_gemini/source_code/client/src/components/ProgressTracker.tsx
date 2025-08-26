import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Target, Clock, Calendar, RefreshCw } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { ProgressStats, ReviewHistory } from '../../../server/src/schema';

interface ProgressTrackerProps {
  progressStats: ProgressStats[];
  userId: number;
  isLoading: boolean;
}

export function ProgressTracker({ progressStats, userId, isLoading }: ProgressTrackerProps) {
  const [reviewHistory, setReviewHistory] = useState<ReviewHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

  const loadReviewHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const history = await trpc.getReviewHistory.query({
        userId,
        limit: 50
      });
      setReviewHistory(history);
    } catch (error) {
      console.error('Failed to load review history:', error);
    } finally {
      setHistoryLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (activeTab === 'history' && reviewHistory.length === 0) {
      loadReviewHistory();
    }
  }, [activeTab, reviewHistory.length, loadReviewHistory]);

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

  const totalLearned = progressStats.reduce((sum, stat) => sum + stat.learned_kanji, 0);
  const totalKanji = progressStats.reduce((sum, stat) => sum + stat.total_kanji, 0);
  const overallProgress = totalKanji > 0 ? (totalLearned / totalKanji) * 100 : 0;

  // Calculate review statistics
  const todayReviews = reviewHistory.filter(review => {
    const reviewDate = new Date(review.created_at);
    const today = new Date();
    return reviewDate.toDateString() === today.toDateString();
  });

  const correctToday = todayReviews.filter(r => r.result === 'CORRECT').length;
  const accuracyToday = todayReviews.length > 0 ? (correctToday / todayReviews.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <span>Learning Progress Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">{totalLearned}</div>
              <div className="text-sm text-gray-600">Kanji Learned</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">{overallProgress.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Overall Progress</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">{todayReviews.length}</div>
              <div className="text-sm text-gray-600">Reviews Today</div>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Total Progress</span>
              <span>{totalLearned} / {totalKanji} kanji</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>JLPT Levels</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Review History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* JLPT Level Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-green-600" />
                <span>JLPT Level Breakdown</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, index) => (
                    <div key={index} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-2 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {progressStats.map((stat: ProgressStats) => (
                    <div key={stat.jlpt_level} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Badge className={getLevelColor(stat.jlpt_level)} variant="secondary">
                            {stat.jlpt_level}
                          </Badge>
                          <div>
                            <div className="font-medium">
                              {stat.learned_kanji} / {stat.total_kanji} kanji
                            </div>
                            <div className="text-sm text-gray-500">
                              {stat.due_for_review > 0 && (
                                <span className="text-orange-600">
                                  {stat.due_for_review} due for review
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{stat.completion_percentage.toFixed(1)}%</div>
                          <div className="text-xs text-gray-500">Complete</div>
                        </div>
                      </div>
                      
                      <Progress value={stat.completion_percentage} className="h-2" />
                      
                      <div className="grid grid-cols-3 gap-4 text-center text-sm">
                        <div className="bg-blue-50 rounded-lg p-2">
                          <div className="font-semibold text-blue-600">{stat.total_kanji}</div>
                          <div className="text-blue-800">Total</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-2">
                          <div className="font-semibold text-green-600">{stat.learned_kanji}</div>
                          <div className="text-green-800">Learned</div>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-2">
                          <div className="font-semibold text-orange-600">{stat.due_for_review}</div>
                          <div className="text-orange-800">Due</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {progressStats.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No progress data available yet.</p>
                      <p className="text-sm">Start learning some kanji to see your progress!</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {/* Today's Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{todayReviews.length}</p>
                    <p className="text-sm text-gray-600">Reviews Today</p>
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
                    <p className="text-2xl font-bold">{accuracyToday.toFixed(1)}%</p>
                    <p className="text-sm text-gray-600">Accuracy Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Review History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <span>Recent Reviews</span>
                </CardTitle>
                <Button variant="outline" size="sm" onClick={loadReviewHistory} disabled={historyLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${historyLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, index) => (
                    <div key={index} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : reviewHistory.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {reviewHistory.map((review: ReviewHistory) => (
                    <div key={review.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          review.result === 'CORRECT' ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <div>
                          <div className="font-medium">Kanji #{review.kanji_id}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()} at{' '}
                            {new Date(review.created_at).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={review.result === 'CORRECT' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {review.result}
                        </Badge>
                        <Badge 
                          className={getSRSLevelInfo(review.previous_srs_level).color} 
                          variant="secondary"
                        >
                          {getSRSLevelInfo(review.previous_srs_level).name}
                        </Badge>
                        <span className="text-gray-400">→</span>
                        <Badge 
                          className={getSRSLevelInfo(review.new_srs_level).color} 
                          variant="secondary"
                        >
                          {getSRSLevelInfo(review.new_srs_level).name}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No review history yet.</p>
                  <p className="text-sm">Complete some reviews to see your progress!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
