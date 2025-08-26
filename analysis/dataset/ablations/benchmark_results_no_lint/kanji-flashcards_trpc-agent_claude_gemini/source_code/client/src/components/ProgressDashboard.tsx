import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Clock, Target, BookOpen, Award, Flame, Calendar } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { StudyStreak } from './StudyStreak';
import type { KanjiWithProgress, JlptLevel } from '../../../server/src/schema';

// STUB DATA - Would be removed with real backend implementation
const STUB_USER_PROGRESS: KanjiWithProgress[] = [
  {
    id: 1,
    character: '水',
    meaning: 'Water',
    kun_reading: 'みず',
    on_reading: 'スイ',
    romaji: 'mizu / sui',
    jlpt_level: 'N5' as JlptLevel,
    created_at: new Date(),
    progress: {
      id: 1,
      user_id: 'demo-user',
      kanji_id: 1,
      correct_count: 8,
      incorrect_count: 2,
      current_interval: 15,
      ease_factor: 2.8,
      next_review_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      last_reviewed_at: new Date(Date.now() - 86400000),
      created_at: new Date()
    }
  },
  {
    id: 2,
    character: '火',
    meaning: 'Fire',
    kun_reading: 'ひ',
    on_reading: 'カ',
    romaji: 'hi / ka',
    jlpt_level: 'N5' as JlptLevel,
    created_at: new Date(),
    progress: {
      id: 2,
      user_id: 'demo-user',
      kanji_id: 2,
      correct_count: 5,
      incorrect_count: 4,
      current_interval: 3,
      ease_factor: 2.2,
      next_review_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      last_reviewed_at: new Date(Date.now() - 2 * 86400000),
      created_at: new Date()
    }
  },
  {
    id: 3,
    character: '木',
    meaning: 'Tree, Wood',
    kun_reading: 'き',
    on_reading: 'モク',
    romaji: 'ki / moku',
    jlpt_level: 'N5' as JlptLevel,
    created_at: new Date(),
    progress: {
      id: 3,
      user_id: 'demo-user',
      kanji_id: 3,
      correct_count: 12,
      incorrect_count: 1,
      current_interval: 30,
      ease_factor: 3.1,
      next_review_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      last_reviewed_at: new Date(Date.now() - 5 * 86400000),
      created_at: new Date()
    }
  },
  {
    id: 4,
    character: '金',
    meaning: 'Gold, Money, Metal',
    kun_reading: 'きん、かね',
    on_reading: 'キン',
    romaji: 'kin, kane / kin',
    jlpt_level: 'N4' as JlptLevel,
    created_at: new Date(),
    progress: {
      id: 4,
      user_id: 'demo-user',
      kanji_id: 4,
      correct_count: 3,
      incorrect_count: 6,
      current_interval: 1,
      ease_factor: 1.8,
      next_review_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
      last_reviewed_at: new Date(Date.now() - 12 * 60 * 60 * 1000),
      created_at: new Date()
    }
  }
];

interface LevelStats {
  level: JlptLevel;
  totalKanji: number;
  studiedKanji: number;
  masteredKanji: number; // >80% accuracy
  averageAccuracy: number;
  dueForReview: number;
}

interface OverallStats {
  totalStudied: number;
  totalReviews: number;
  averageAccuracy: number;
  currentStreak: number;
  masteredKanji: number;
  dueToday: number;
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType; 
  trend?: 'up' | 'down'; 
  trendValue?: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend && trendValue && (
              <div className={`flex items-center text-xs ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className={`h-3 w-3 mr-1 ${trend === 'down' ? 'rotate-180' : ''}`} />
                {trendValue}
              </div>
            )}
          </div>
          <Icon className="h-8 w-8 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  );
}

function LevelProgressCard({ stats }: { stats: LevelStats }) {
  const progressPercentage = stats.totalKanji > 0 ? (stats.studiedKanji / stats.totalKanji) * 100 : 0;
  const masteredPercentage = stats.studiedKanji > 0 ? (stats.masteredKanji / stats.studiedKanji) * 100 : 0;
  
  const getLevelColor = (level: JlptLevel) => {
    const colors = {
      N5: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
      N4: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
      N3: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
      N2: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
      N1: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' }
    };
    return colors[level];
  };

  const colorScheme = getLevelColor(stats.level);

  return (
    <Card className={`${colorScheme.bg} ${colorScheme.border} border-2`}>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className={`text-lg ${colorScheme.text}`}>
            JLPT {stats.level}
          </CardTitle>
          {stats.dueForReview > 0 && (
            <Badge variant="secondary" className="bg-red-100 text-red-700">
              {stats.dueForReview} due
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{stats.studiedKanji} / {stats.totalKanji} kanji</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Mastery Rate</div>
            <div className="font-semibold">{masteredPercentage.toFixed(0)}%</div>
          </div>
          <div>
            <div className="text-gray-600">Accuracy</div>
            <div className="font-semibold">{stats.averageAccuracy.toFixed(0)}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentKanjiList({ kanjiList }: { kanjiList: KanjiWithProgress[] }) {
  const getAccuracy = (progress: NonNullable<KanjiWithProgress['progress']>) => {
    const total = progress.correct_count + progress.incorrect_count;
    return total > 0 ? (progress.correct_count / total) * 100 : 0;
  };

  const getMasteryLevel = (accuracy: number, interval: number) => {
    if (accuracy >= 90 && interval >= 14) return { label: 'Mastered', color: 'bg-green-100 text-green-800' };
    if (accuracy >= 70 && interval >= 7) return { label: 'Good', color: 'bg-blue-100 text-blue-800' };
    if (accuracy >= 50) return { label: 'Learning', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Struggling', color: 'bg-red-100 text-red-800' };
  };

  const sortedKanji = kanjiList
    .filter(k => k.progress)
    .sort((a, b) => {
      const aDate = a.progress?.last_reviewed_at?.getTime() || 0;
      const bDate = b.progress?.last_reviewed_at?.getTime() || 0;
      return bDate - aDate;
    })
    .slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="mr-2 h-5 w-5" />
          Recently Studied
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedKanji.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent study sessions</p>
          ) : (
            sortedKanji.map((kanji) => {
              if (!kanji.progress) return null;
              
              const accuracy = getAccuracy(kanji.progress);
              const mastery = getMasteryLevel(accuracy, kanji.progress.current_interval);
              
              return (
                <div key={kanji.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{kanji.character}</div>
                    <div>
                      <div className="font-medium">{kanji.meaning}</div>
                      <div className="text-sm text-gray-600">
                        {accuracy.toFixed(0)}% accuracy • {kanji.progress.current_interval} day interval
                      </div>
                    </div>
                  </div>
                  <Badge className={mastery.color}>
                    {mastery.label}
                  </Badge>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ProgressDashboard() {
  const [currentUser] = useState('demo-user'); // In real app, this would come from auth
  const [userProgress, setUserProgress] = useState<KanjiWithProgress[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats>({
    totalStudied: 0,
    totalReviews: 0,
    averageAccuracy: 0,
    currentStreak: 0,
    masteredKanji: 0,
    dueToday: 0
  });
  const [levelStats, setLevelStats] = useState<LevelStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadUserProgress = useCallback(async () => {
    setIsLoading(true);
    try {
      // NOTE: Using stub data since backend handlers are placeholders
      // In real implementation, this would be:
      // const result = await trpc.getUserProgress.query({ userId: currentUser });
      
      console.log('Backend handlers are placeholder implementations - using stub data');
      setUserProgress(STUB_USER_PROGRESS);
    } catch (error) {
      console.error('Failed to load user progress:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Calculate statistics from progress data
  useEffect(() => {
    if (userProgress.length === 0) return;

    const progressData = userProgress.filter(k => k.progress);
    const totalReviews = progressData.reduce((sum, k) => 
      sum + (k.progress?.correct_count || 0) + (k.progress?.incorrect_count || 0), 0
    );
    const totalCorrect = progressData.reduce((sum, k) => sum + (k.progress?.correct_count || 0), 0);
    const averageAccuracy = totalReviews > 0 ? (totalCorrect / totalReviews) * 100 : 0;
    
    const masteredKanji = progressData.filter(k => {
      if (!k.progress) return false;
      const total = k.progress.correct_count + k.progress.incorrect_count;
      const accuracy = total > 0 ? (k.progress.correct_count / total) * 100 : 0;
      return accuracy >= 80 && k.progress.current_interval >= 14;
    }).length;

    const dueToday = progressData.filter(k => 
      k.progress && k.progress.next_review_date <= new Date()
    ).length;

    setOverallStats({
      totalStudied: progressData.length,
      totalReviews,
      averageAccuracy,
      currentStreak: 7, // Stub data
      masteredKanji,
      dueToday
    });

    // Calculate level statistics
    const levels: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
    const levelStatsData: LevelStats[] = levels.map(level => {
      const levelKanji = userProgress.filter(k => k.jlpt_level === level);
      const levelProgress = levelKanji.filter(k => k.progress);
      
      const levelTotalReviews = levelProgress.reduce((sum, k) => 
        sum + (k.progress?.correct_count || 0) + (k.progress?.incorrect_count || 0), 0
      );
      const levelCorrect = levelProgress.reduce((sum, k) => sum + (k.progress?.correct_count || 0), 0);
      const levelAccuracy = levelTotalReviews > 0 ? (levelCorrect / levelTotalReviews) * 100 : 0;
      
      const levelMastered = levelProgress.filter(k => {
        if (!k.progress) return false;
        const total = k.progress.correct_count + k.progress.incorrect_count;
        const accuracy = total > 0 ? (k.progress.correct_count / total) * 100 : 0;
        return accuracy >= 80 && k.progress.current_interval >= 14;
      }).length;

      const dueForReview = levelProgress.filter(k => 
        k.progress && k.progress.next_review_date <= new Date()
      ).length;

      return {
        level,
        totalKanji: levelKanji.length,
        studiedKanji: levelProgress.length,
        masteredKanji: levelMastered,
        averageAccuracy: levelAccuracy,
        dueForReview
      };
    }).filter(stats => stats.totalKanji > 0);

    setLevelStats(levelStatsData);
  }, [userProgress]);

  // Load progress on mount
  useEffect(() => {
    loadUserProgress();
  }, [loadUserProgress]);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-lg text-gray-600">Loading your progress...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Studied"
          value={overallStats.totalStudied}
          icon={BookOpen}
          trend="up"
          trendValue="+5 this week"
        />
        <StatCard
          title="Total Reviews"
          value={overallStats.totalReviews}
          icon={BarChart3}
          trend="up"
          trendValue="+23 this week"
        />
        <StatCard
          title="Average Accuracy"
          value={`${overallStats.averageAccuracy.toFixed(0)}%`}
          icon={Target}
          trend="up"
          trendValue="+2% this week"
        />
        <StatCard
          title="Current Streak"
          value={`${overallStats.currentStreak} days 🔥`}
          icon={TrendingUp}
        />
        <StatCard
          title="Mastered Kanji"
          value={overallStats.masteredKanji}
          icon={Award}
          trend="up"
          trendValue="+3 this week"
        />
        <StatCard
          title="Due Today"
          value={overallStats.dueToday}
          icon={Clock}
        />
      </div>

      <Tabs defaultValue="levels" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="levels">Progress by Level</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          <TabsTrigger value="streak">Study Streak</TabsTrigger>
        </TabsList>

        <TabsContent value="levels" className="space-y-4">
          {levelStats.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No progress yet</h3>
                <p className="text-gray-600">Start studying some kanji to see your progress here!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {levelStats.map((stats: LevelStats) => (
                <LevelProgressCard key={stats.level} stats={stats} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent">
          <RecentKanjiList kanjiList={userProgress} />
        </TabsContent>

        <TabsContent value="streak">
          <StudyStreak
            currentStreak={overallStats.currentStreak}
            longestStreak={14}
            studyDays={[1, 3, 5, 7, 8, 10, 12, 15, 17, 20, 22, 24, 26]}
            achievements={[
              {
                id: 'first_kanji',
                title: 'First Steps',
                description: 'Study your first kanji',
                icon: BookOpen,
                achieved: true
              },
              {
                id: 'week_streak',
                title: 'Week Warrior',
                description: 'Study for 7 days in a row',
                icon: Flame,
                achieved: true
              },
              {
                id: 'month_streak',
                title: 'Monthly Master',
                description: 'Study for 30 days in a row',
                icon: Calendar,
                achieved: false,
                progress: overallStats.currentStreak,
                target: 30
              },
              {
                id: 'hundred_reviews',
                title: 'Century Scholar',
                description: 'Complete 100 reviews',
                icon: Target,
                achieved: overallStats.totalReviews >= 100,
                progress: Math.min(overallStats.totalReviews, 100),
                target: 100
              }
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
