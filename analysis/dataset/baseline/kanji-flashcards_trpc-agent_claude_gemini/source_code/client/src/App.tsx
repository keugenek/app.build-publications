import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
import { StudyDashboard } from '@/components/StudyDashboard';
import { FlashcardReview } from '@/components/FlashcardReview';
import { KanjiLibrary } from '@/components/KanjiLibrary';
import { StatsPanel } from '@/components/StatsPanel';
import type { JLPTLevel, UserStats } from '../../server/src/schema';

function App() {
  const [currentUser] = useState('user123'); // Simple user system for demo
  const [stats, setStats] = useState<UserStats | null>(null);
  const [selectedJLPTLevel, setSelectedJLPTLevel] = useState<JLPTLevel | 'all'>('all');
  const [activeTab, setActiveTab] = useState('dashboard');

  const loadStats = useCallback(async () => {
    try {
      const result = await trpc.getUserStats.query({
        user_id: currentUser,
        ...(selectedJLPTLevel !== 'all' ? { jlpt_level: selectedJLPTLevel } : {})
      });
      setStats(result);
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  }, [currentUser, selectedJLPTLevel]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const getSRSLevelColor = (level: string) => {
    if (level.startsWith('APPRENTICE')) return 'bg-pink-100 text-pink-800';
    if (level.startsWith('GURU')) return 'bg-purple-100 text-purple-800';
    if (level === 'MASTER') return 'bg-blue-100 text-blue-800';
    if (level === 'ENLIGHTENED') return 'bg-yellow-100 text-yellow-800';
    if (level === 'BURNED') return 'bg-gray-100 text-gray-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getSRSLevelName = (level: string) => {
    const names: Record<string, string> = {
      'APPRENTICE_1': 'Apprentice I',
      'APPRENTICE_2': 'Apprentice II', 
      'APPRENTICE_3': 'Apprentice III',
      'APPRENTICE_4': 'Apprentice IV',
      'GURU_1': 'Guru I',
      'GURU_2': 'Guru II',
      'MASTER': 'Master',
      'ENLIGHTENED': 'Enlightened',
      'BURNED': 'Burned'
    };
    return names[level] || level;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
          <div className="mb-4 md:mb-0">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              🈳 Kanji Master
            </h1>
            <p className="text-gray-600 mt-2">Master Japanese Kanji with spaced repetition</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={selectedJLPTLevel} onValueChange={(value) => setSelectedJLPTLevel(value as JLPTLevel | 'all')}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Filter by JLPT" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="N5">N5</SelectItem>
                <SelectItem value="N4">N4</SelectItem>
                <SelectItem value="N3">N3</SelectItem>
                <SelectItem value="N2">N2</SelectItem>
                <SelectItem value="N1">N1</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="text-sm text-gray-600">
              User: <span className="font-mono font-medium">{currentUser}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-700">{stats.total_kanji}</div>
                <div className="text-sm text-blue-600">Total Kanji</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-700">{stats.reviews_due_count}</div>
                <div className="text-sm text-red-600">Reviews Due</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-700">{stats.accuracy_percentage.toFixed(1)}%</div>
                <div className="text-sm text-green-600">Accuracy</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-700">{stats.burned_count}</div>
                <div className="text-sm text-purple-600">Burned</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* SRS Level Distribution */}
        {stats && stats.total_kanji > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">SRS Level Distribution</CardTitle>
              <CardDescription>Your kanji progress across different SRS levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[
                  { level: 'APPRENTICE', count: stats.apprentice_count, color: 'bg-pink-500' },
                  { level: 'GURU', count: stats.guru_count, color: 'bg-purple-500' },
                  { level: 'MASTER', count: stats.master_count, color: 'bg-blue-500' },
                  { level: 'ENLIGHTENED', count: stats.enlightened_count, color: 'bg-yellow-500' },
                  { level: 'BURNED', count: stats.burned_count, color: 'bg-gray-500' }
                ].map(({ level, count, color }) => (
                  <Badge key={level} variant="outline" className="px-3 py-1">
                    <div className={`w-3 h-3 rounded-full ${color} mr-2`}></div>
                    {level}: {count}
                  </Badge>
                ))}
              </div>
              
              <div className="mt-4 space-y-2">
                <Progress 
                  value={stats.total_kanji > 0 ? (stats.burned_count / stats.total_kanji) * 100 : 0} 
                  className="h-2"
                />
                <div className="text-sm text-gray-600 text-center">
                  {stats.burned_count}/{stats.total_kanji} kanji mastered (burned)
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stub Data Warning */}
        <Alert className="mb-8 border-yellow-200 bg-yellow-50">
          <AlertDescription className="text-yellow-800">
            📝 <strong>Development Note:</strong> This app is using stub data from placeholder API handlers. 
            Real data will be available once the backend handlers are implemented.
          </AlertDescription>
        </Alert>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit lg:grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              📊 Dashboard
            </TabsTrigger>
            <TabsTrigger value="review" className="flex items-center gap-2">
              🎴 Review
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              📚 Library
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              📈 Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <StudyDashboard 
              userId={currentUser} 
              jlptLevel={selectedJLPTLevel !== 'all' ? selectedJLPTLevel : undefined}
              getSRSLevelColor={getSRSLevelColor}
              getSRSLevelName={getSRSLevelName}
            />
          </TabsContent>

          <TabsContent value="review">
            <FlashcardReview 
              userId={currentUser}
              getSRSLevelColor={getSRSLevelColor}
              getSRSLevelName={getSRSLevelName}
            />
          </TabsContent>

          <TabsContent value="library">
            <KanjiLibrary 
              userId={currentUser}
              jlptLevel={selectedJLPTLevel !== 'all' ? selectedJLPTLevel : undefined}
              getSRSLevelColor={getSRSLevelColor}
            />
          </TabsContent>

          <TabsContent value="stats">
            <StatsPanel 
              userId={currentUser}
              jlptLevel={selectedJLPTLevel !== 'all' ? selectedJLPTLevel : undefined}
              getSRSLevelColor={getSRSLevelColor}
              getSRSLevelName={getSRSLevelName}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
