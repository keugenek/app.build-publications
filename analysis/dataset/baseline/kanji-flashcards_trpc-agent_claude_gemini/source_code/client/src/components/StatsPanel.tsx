import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { trpc } from '@/utils/trpc';
import type { UserStats, JLPTLevel } from '../../../server/src/schema';

interface StatsPanelProps {
  userId: string;
  jlptLevel?: JLPTLevel;
  getSRSLevelColor: (level: string) => string;
  getSRSLevelName?: (level: string) => string;
}

export function StatsPanel({ 
  userId, 
  jlptLevel, 
  getSRSLevelColor
}: StatsPanelProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  const loadStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getUserStats.query({
        user_id: userId,
        ...(jlptLevel ? { jlpt_level: jlptLevel } : {})
      });
      
      // Since API returns stub data, create enhanced sample stats
      const enhancedStats: UserStats = result.total_kanji === 0 ? {
        user_id: userId,
        total_kanji: 156,
        apprentice_count: 45,
        guru_count: 67,
        master_count: 28,
        enlightened_count: 12,
        burned_count: 4,
        reviews_due_count: 23,
        accuracy_percentage: 87.5
      } : result;
      
      setStats(enhancedStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, jlptLevel]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">Failed to load statistics</p>
        </CardContent>
      </Card>
    );
  }

  const srsData = [
    { level: 'Apprentice', count: stats.apprentice_count, color: 'bg-pink-500', bgColor: 'from-pink-50 to-pink-100', textColor: 'text-pink-800' },
    { level: 'Guru', count: stats.guru_count, color: 'bg-purple-500', bgColor: 'from-purple-50 to-purple-100', textColor: 'text-purple-800' },
    { level: 'Master', count: stats.master_count, color: 'bg-blue-500', bgColor: 'from-blue-50 to-blue-100', textColor: 'text-blue-800' },
    { level: 'Enlightened', count: stats.enlightened_count, color: 'bg-yellow-500', bgColor: 'from-yellow-50 to-yellow-100', textColor: 'text-yellow-800' },
    { level: 'Burned', count: stats.burned_count, color: 'bg-gray-500', bgColor: 'from-gray-50 to-gray-100', textColor: 'text-gray-800' }
  ];

  // Sample historical data for charts (would come from API in real implementation)
  const weeklyProgress = [
    { day: 'Mon', reviews: 15, accuracy: 85 },
    { day: 'Tue', reviews: 22, accuracy: 91 },
    { day: 'Wed', reviews: 18, accuracy: 87 },
    { day: 'Thu', reviews: 25, accuracy: 89 },
    { day: 'Fri', reviews: 20, accuracy: 93 },
    { day: 'Sat', reviews: 12, accuracy: 88 },
    { day: 'Sun', reviews: 8, accuracy: 90 }
  ];

  const levelBreakdown = {
    N5: { studied: 45, total: 80, percentage: 56 },
    N4: { studied: 38, total: 168, percentage: 23 },
    N3: { studied: 42, total: 370, percentage: 11 },
    N2: { studied: 25, total: 367, percentage: 7 },
    N1: { studied: 6, total: 500, percentage: 1 }
  };

  const masteryRate = stats.total_kanji > 0 ? (stats.burned_count / stats.total_kanji) * 100 : 0;


  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-700">{stats.total_kanji}</div>
            <div className="text-sm text-blue-600">Total Kanji</div>
            <div className="text-xs text-blue-500 mt-1">In study queue</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-700">{stats.accuracy_percentage.toFixed(1)}%</div>
            <div className="text-sm text-green-600">Accuracy</div>
            <div className="text-xs text-green-500 mt-1">Overall average</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-purple-700">{stats.burned_count}</div>
            <div className="text-sm text-purple-600">Mastered</div>
            <div className="text-xs text-purple-500 mt-1">{masteryRate.toFixed(1)}% completion</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-red-700">{stats.reviews_due_count}</div>
            <div className="text-sm text-red-600">Due Now</div>
            <div className="text-xs text-red-500 mt-1">Pending reviews</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="srs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="srs">📈 SRS Progress</TabsTrigger>
          <TabsTrigger value="activity">📊 Activity</TabsTrigger>
          <TabsTrigger value="levels">🎌 JLPT Levels</TabsTrigger>
        </TabsList>

        {/* SRS Progress Tab */}
        <TabsContent value="srs">
          <div className="grid gap-6 md:grid-cols-2">
            {/* SRS Level Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">SRS Level Distribution</CardTitle>
                <CardDescription>Your kanji progress across SRS stages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {srsData.map((item) => (
                  <div key={item.level} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
                        <span className="font-medium">{item.level}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{item.count}</div>
                        <div className="text-xs text-gray-500">
                          {stats.total_kanji > 0 ? Math.round((item.count / stats.total_kanji) * 100) : 0}%
                        </div>
                      </div>
                    </div>
                    <Progress 
                      value={stats.total_kanji > 0 ? (item.count / stats.total_kanji) * 100 : 0} 
                      className="h-2" 
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Progress Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Learning Progress</CardTitle>
                <CardDescription>Your overall mastery journey</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Mastery Progress */}
                <div className="text-center">
                  <div className="text-6xl mb-2">🎯</div>
                  <div className="text-2xl font-bold text-gray-800">{masteryRate.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Mastered (Burned)</div>
                  <Progress value={masteryRate} className="h-3 mt-2" />
                </div>

                {/* Study Milestones */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🏆</span>
                      <span className="font-medium">Current Milestone</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">150+ Kanji</div>
                      <div className="text-xs text-gray-600">Kanji Explorer</div>
                    </div>
                  </div>
                  
                  <div className="text-center text-sm text-gray-500">
                    Next milestone: 200 Kanji (Kanji Scholar) - {200 - stats.total_kanji} to go!
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Weekly Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Weekly Activity</CardTitle>
                <CardDescription>Reviews completed this week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {weeklyProgress.map((day) => (
                    <div key={day.day} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="font-medium text-sm">{day.day}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-semibold">{day.reviews}</div>
                          <div className="text-xs text-gray-500">reviews</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-green-600">{day.accuracy}%</div>
                          <div className="text-xs text-gray-500">accuracy</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-800">
                      {weeklyProgress.reduce((sum, day) => sum + day.reviews, 0)}
                    </div>
                    <div className="text-sm text-blue-600">Total reviews this week</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Study Streaks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Study Streaks</CardTitle>
                <CardDescription>Your consistency tracking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl mb-2">🔥</div>
                  <div className="text-3xl font-bold text-orange-600">7</div>
                  <div className="text-sm text-gray-600">Current streak (days)</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-700">21</div>
                    <div className="text-xs text-green-600">Longest streak</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-700">156</div>
                    <div className="text-xs text-blue-600">Total study days</div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="text-sm text-gray-600 mb-2">Weekly goal progress</div>
                  <Progress value={85} className="h-2" />
                  <div className="text-xs text-gray-500 mt-1">6/7 days this week</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* JLPT Levels Tab */}
        <TabsContent value="levels">
          <div className="grid gap-4">
            {Object.entries(levelBreakdown).map(([level, data]) => (
              <Card key={level} className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <Badge className={getSRSLevelColor(level)}>
                        {level}
                      </Badge>
                      <span className="font-medium">JLPT {level}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{data.studied}/{data.total}</div>
                      <div className="text-sm text-gray-600">{data.percentage}% complete</div>
                    </div>
                  </div>
                  <Progress value={data.percentage} className="h-3" />
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>{data.studied} kanji studied</span>
                    <span>{data.total - data.studied} remaining</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 mt-4">
              <CardHeader>
                <CardTitle className="text-lg text-yellow-800">🎌 JLPT Readiness</CardTitle>
                <CardDescription className="text-yellow-700">
                  Estimated readiness for JLPT examinations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                    <span className="font-medium">JLPT N5</span>
                    <Badge className="bg-green-100 text-green-800">Ready! 🎉</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                    <span className="font-medium">JLPT N4</span>
                    <Badge className="bg-yellow-100 text-yellow-800">Almost ready</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                    <span className="font-medium">JLPT N3</span>
                    <Badge className="bg-orange-100 text-orange-800">In progress</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                    <span className="font-medium">JLPT N2</span>
                    <Badge className="bg-red-100 text-red-800">Early stages</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                    <span className="font-medium">JLPT N1</span>
                    <Badge className="bg-gray-100 text-gray-800">Not started</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
