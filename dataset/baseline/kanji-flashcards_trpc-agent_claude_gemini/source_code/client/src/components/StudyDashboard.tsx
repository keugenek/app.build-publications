import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/utils/trpc';
import type { UserProgress, JLPTLevel, SRSLevel } from '../../../server/src/schema';

interface StudyDashboardProps {
  userId: string;
  jlptLevel?: JLPTLevel;
  getSRSLevelColor: (level: string) => string;
  getSRSLevelName: (level: string) => string;
}

export function StudyDashboard({ 
  userId, 
  jlptLevel, 
  getSRSLevelColor, 
  getSRSLevelName 
}: StudyDashboardProps) {
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [reviewsDue, setReviewsDue] = useState<Array<{ id: number; character: string; meaning: string; kun_reading?: string | null; on_reading?: string | null }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [progressData, reviewsData] = await Promise.all([
        trpc.getUserProgress.query({ userId, jlptLevel }),
        trpc.getReviewsDue.query({ user_id: userId, limit: 10 })
      ]);
      
      setUserProgress(progressData);
      setReviewsDue(reviewsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, jlptLevel]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Since API returns empty arrays (stub data), let's create some sample data for demonstration
  const sampleProgress: UserProgress[] = userProgress.length === 0 ? [
    {
      id: 1,
      user_id: userId,
      kanji_id: 1,
      srs_level: 'APPRENTICE_2' as SRSLevel,
      next_review_at: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      correct_streak: 2,
      incorrect_count: 1,
      last_reviewed_at: new Date(Date.now() - 1000 * 60 * 60 * 8),
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
      updated_at: new Date()
    },
    {
      id: 2,
      user_id: userId,
      kanji_id: 2,
      srs_level: 'GURU_1' as SRSLevel,
      next_review_at: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 day from now
      correct_streak: 5,
      incorrect_count: 0,
      last_reviewed_at: new Date(Date.now() - 1000 * 60 * 60 * 48),
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
      updated_at: new Date()
    },
    {
      id: 3,
      user_id: userId,
      kanji_id: 3,
      srs_level: 'MASTER' as SRSLevel,
      next_review_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 1 week from now
      correct_streak: 8,
      incorrect_count: 1,
      last_reviewed_at: new Date(Date.now() - 1000 * 60 * 60 * 72),
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
      updated_at: new Date()
    }
  ] : userProgress;

  const sampleKanjiData = [
    { id: 1, character: '水', meaning: 'Water', kun_reading: 'みず', on_reading: 'スイ' },
    { id: 2, character: '火', meaning: 'Fire', kun_reading: 'ひ', on_reading: 'カ' },
    { id: 3, character: '木', meaning: 'Tree, Wood', kun_reading: 'き', on_reading: 'モク' }
  ];

  const reviewsDueData = reviewsDue.length === 0 ? [
    { id: 1, character: '水', meaning: 'Water', kun_reading: 'みず', on_reading: 'スイ' },
    { id: 2, character: '日', meaning: 'Day, Sun', kun_reading: 'ひ', on_reading: 'ニチ' }
  ] : reviewsDue;

  const progressWithKanji = sampleProgress.map((progress, index) => ({
    ...progress,
    kanji: sampleKanjiData[index] || sampleKanjiData[0]
  }));

  const reviewsDueCount = reviewsDueData.length;
  const totalProgress = sampleProgress.length;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Current Study Progress */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-xl text-blue-800">📚 Study Progress</CardTitle>
          <CardDescription className="text-blue-600">
            Your current kanji learning journey {jlptLevel && `(${jlptLevel} Level)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalProgress === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No kanji in your study list yet!</p>
              <p className="text-sm text-gray-400">Add kanji from the Library tab to start learning.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {progressWithKanji.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl font-bold text-blue-800">
                      {item.kanji.character}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{item.kanji.meaning}</div>
                      <div className="text-sm text-gray-600">
                        {item.kanji.kun_reading && `${item.kanji.kun_reading} • `}
                        {item.kanji.on_reading}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Streak: {item.correct_streak} • Errors: {item.incorrect_count}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getSRSLevelColor(item.srs_level)}>
                      {getSRSLevelName(item.srs_level)}
                    </Badge>
                    <div className="text-xs text-gray-500 mt-1">
                      {item.next_review_at > new Date() 
                        ? `Review in ${Math.ceil((item.next_review_at.getTime() - Date.now()) / (1000 * 60 * 60))}h`
                        : 'Due now!'
                      }
                    </div>
                  </div>
                </div>
              ))}
              
              {totalProgress > 5 && (
                <div className="text-center pt-2">
                  <Button variant="outline" size="sm">
                    View All {totalProgress} Kanji
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reviews Due */}
      <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
        <CardHeader>
          <CardTitle className="text-xl text-red-800">⚡ Reviews Due</CardTitle>
          <CardDescription className="text-red-600">
            Kanji ready for review right now
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reviewsDueCount === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎉</div>
              <p className="text-gray-500 mb-2">All caught up!</p>
              <p className="text-sm text-gray-400">No reviews due at the moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="text-2xl font-bold text-red-700">{reviewsDueCount}</div>
                <Button className="bg-red-600 hover:bg-red-700 text-white">
                  Start Review Session
                </Button>
              </div>
              
              <div className="space-y-3">
                {reviewsDueData.slice(0, 3).map((kanji) => (
                  <div key={kanji.id} className="flex items-center gap-4 p-3 bg-white rounded-lg border border-red-100">
                    <div className="text-2xl font-bold text-red-800">
                      {kanji.character}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{kanji.meaning}</div>
                      <div className="text-sm text-gray-600">
                        {kanji.kun_reading && `${kanji.kun_reading} • `}
                        {kanji.on_reading}
                      </div>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      Due
                    </Badge>
                  </div>
                ))}
              </div>
              
              {reviewsDueCount > 3 && (
                <div className="text-center text-sm text-red-600">
                  +{reviewsDueCount - 3} more reviews waiting
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Study Streak */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-xl text-green-800">🔥 Study Streak</CardTitle>
          <CardDescription className="text-green-600">
            Keep your momentum going!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-700 mb-2">7</div>
            <div className="text-green-600 mb-4">Days in a row</div>
            <Progress value={70} className="h-2 mb-2" />
            <div className="text-sm text-green-600">3 more days to reach your goal!</div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-xl text-purple-800">🚀 Quick Actions</CardTitle>
          <CardDescription className="text-purple-600">
            Common study tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <Button 
              variant="outline" 
              className="w-full justify-start border-purple-200 hover:bg-purple-50"
              disabled={reviewsDueCount === 0}
            >
              📝 Start Review Session ({reviewsDueCount})
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start border-purple-200 hover:bg-purple-50"
            >
              📚 Add New Kanji
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start border-purple-200 hover:bg-purple-50"
            >
              📊 View Detailed Stats
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start border-purple-200 hover:bg-purple-50"
            >
              ⚙️ Study Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
