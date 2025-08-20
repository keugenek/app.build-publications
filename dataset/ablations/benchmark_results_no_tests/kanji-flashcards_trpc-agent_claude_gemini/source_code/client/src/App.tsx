import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { KanjiFlashcards } from '@/components/KanjiFlashcards';
import { ProgressDashboard } from '@/components/ProgressDashboard';
import { LevelSelector } from '@/components/LevelSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, BarChart3, RefreshCw } from 'lucide-react';
import type { 
  KanjiWithProgress, 
  ProgressSummary, 
  JlptLevel 
} from '../../server/src/schema';

// Mock user ID for demo purposes - in a real app this would come from authentication
const DEMO_USER_ID = 'demo-user-123';

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'study' | 'review'>('dashboard');
  const [selectedLevel, setSelectedLevel] = useState<JlptLevel>('N5');
  const [kanjiData, setKanjiData] = useState<KanjiWithProgress[]>([]);
  const [progressSummary, setProgressSummary] = useState<ProgressSummary[]>([]);
  const [dueReviews, setDueReviews] = useState<KanjiWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load progress summary for all levels
  const loadProgressSummary = useCallback(async () => {
    try {
      const summary = await trpc.getProgressSummary.query({
        userId: DEMO_USER_ID
      });
      setProgressSummary(summary);
    } catch (error) {
      console.error('Failed to load progress summary:', error);
      // Using mock data since handlers are stubs
      const mockSummary: ProgressSummary[] = [
        { jlpt_level: 'N5', total_kanji: 103, learned_kanji: 25, progress_percentage: 24.3 },
        { jlpt_level: 'N4', total_kanji: 181, learned_kanji: 12, progress_percentage: 6.6 },
        { jlpt_level: 'N3', total_kanji: 367, learned_kanji: 3, progress_percentage: 0.8 },
        { jlpt_level: 'N2', total_kanji: 415, learned_kanji: 0, progress_percentage: 0 },
        { jlpt_level: 'N1', total_kanji: 1034, learned_kanji: 0, progress_percentage: 0 }
      ];
      setProgressSummary(mockSummary);
    }
  }, []);

  // Load kanji for selected level
  const loadKanjiByLevel = useCallback(async (level: JlptLevel) => {
    setIsLoading(true);
    try {
      const kanji = await trpc.getKanjiByLevel.query({
        jlpt_level: level,
        user_id: DEMO_USER_ID
      });
      setKanjiData(kanji);
    } catch (error) {
      console.error('Failed to load kanji:', error);
      // Using mock data since handlers are stubs
      const mockKanji: KanjiWithProgress[] = generateMockKanji(level);
      setKanjiData(mockKanji);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load due reviews
  const loadDueReviews = useCallback(async () => {
    try {
      const reviews = await trpc.getDueReviews.query({
        userId: DEMO_USER_ID
      });
      setDueReviews(reviews);
    } catch (error) {
      console.error('Failed to load due reviews:', error);
      // Mock some due reviews
      const mockReviews: KanjiWithProgress[] = [
        {
          id: 1, character: '水', meaning: 'water', on_reading: 'スイ', kun_reading: 'みず',
          jlpt_level: 'N5', created_at: new Date(),
          progress: { is_learned: true, review_count: 3, last_reviewed: new Date(), next_review: new Date() }
        },
        {
          id: 2, character: '火', meaning: 'fire', on_reading: 'カ', kun_reading: 'ひ',
          jlpt_level: 'N5', created_at: new Date(),
          progress: { is_learned: true, review_count: 2, last_reviewed: new Date(), next_review: new Date() }
        }
      ];
      setDueReviews(mockReviews);
    }
  }, []);

  useEffect(() => {
    loadProgressSummary();
    loadDueReviews();
  }, [loadProgressSummary, loadDueReviews]);

  useEffect(() => {
    if (currentView === 'study') {
      loadKanjiByLevel(selectedLevel);
    }
  }, [currentView, selectedLevel, loadKanjiByLevel]);

  // Handle progress updates
  const handleProgressUpdate = async (kanjiId: number, isLearned: boolean) => {
    try {
      await trpc.updateUserProgress.mutate({
        user_id: DEMO_USER_ID,
        kanji_id: kanjiId,
        is_learned: isLearned,
        review_count: isLearned ? 1 : 0,
        last_reviewed: new Date(),
        next_review: isLearned ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null // Next day
      });

      // Update local state
      setKanjiData((prev: KanjiWithProgress[]) =>
        prev.map((kanji: KanjiWithProgress) =>
          kanji.id === kanjiId
            ? {
                ...kanji,
                progress: {
                  is_learned: isLearned,
                  review_count: isLearned ? (kanji.progress?.review_count || 0) + 1 : 0,
                  last_reviewed: new Date(),
                  next_review: isLearned ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null
                }
              }
            : kanji
        )
      );

      // Refresh progress summary
      loadProgressSummary();
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const currentLevelSummary = progressSummary.find((summary: ProgressSummary) => summary.jlpt_level === selectedLevel);
  const totalDueReviews = dueReviews.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-900 mb-2">
            🈵 Kanji Learning Studio
          </h1>
          <p className="text-gray-600">Master Japanese Kanji with Spaced Repetition</p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center gap-4 mb-8">
          <Button
            variant={currentView === 'dashboard' ? 'default' : 'outline'}
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </Button>
          <Button
            variant={currentView === 'study' ? 'default' : 'outline'}
            onClick={() => setCurrentView('study')}
            className="flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Study Mode
          </Button>
          <Button
            variant={currentView === 'review' ? 'default' : 'outline'}
            onClick={() => setCurrentView('review')}
            className="flex items-center gap-2"
            disabled={totalDueReviews === 0}
          >
            <RefreshCw className="w-4 h-4" />
            Reviews {totalDueReviews > 0 && <Badge variant="destructive">{totalDueReviews}</Badge>}
          </Button>
        </div>

        {/* Dashboard View */}
        {currentView === 'dashboard' && (
          <ProgressDashboard
            progressSummary={progressSummary}
            dueReviews={dueReviews}
            onStartStudy={(level: JlptLevel) => {
              setSelectedLevel(level);
              setCurrentView('study');
            }}
            onStartReview={() => setCurrentView('review')}
          />
        )}

        {/* Study Mode View */}
        {currentView === 'study' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <LevelSelector
                selectedLevel={selectedLevel}
                onLevelChange={setSelectedLevel}
              />
              {currentLevelSummary && (
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-indigo-600">
                        {currentLevelSummary.learned_kanji} / {currentLevelSummary.total_kanji}
                      </div>
                      <div className="text-sm text-gray-500">
                        {currentLevelSummary.progress_percentage.toFixed(1)}% Complete
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <KanjiFlashcards
              kanji={kanjiData}
              onProgressUpdate={handleProgressUpdate}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Review Mode View */}
        {currentView === 'review' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  Review Session
                </CardTitle>
                <CardDescription>
                  {totalDueReviews} kanji due for review
                </CardDescription>
              </CardHeader>
            </Card>

            <KanjiFlashcards
              kanji={dueReviews}
              onProgressUpdate={handleProgressUpdate}
              isLoading={false}
              isReviewMode
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Mock data generator for demonstration
function generateMockKanji(level: JlptLevel): KanjiWithProgress[] {
  const kanjiByLevel = {
    N5: [
      { char: '水', meaning: 'water', on: 'スイ', kun: 'みず' },
      { char: '火', meaning: 'fire', on: 'カ', kun: 'ひ' },
      { char: '木', meaning: 'tree, wood', on: 'モク', kun: 'き' },
      { char: '金', meaning: 'gold, money', on: 'キン', kun: 'かね' },
      { char: '土', meaning: 'earth, soil', on: 'ド', kun: 'つち' },
      { char: '人', meaning: 'person', on: 'ジン', kun: 'ひと' },
      { char: '大', meaning: 'big', on: 'ダイ', kun: 'おお' },
      { char: '小', meaning: 'small', on: 'ショウ', kun: 'ちい' },
    ],
    N4: [
      { char: '考', meaning: 'think', on: 'コウ', kun: 'かんが' },
      { char: '始', meaning: 'begin', on: 'シ', kun: 'はじ' },
      { char: '終', meaning: 'end', on: 'シュウ', kun: 'お' },
      { char: '重', meaning: 'heavy', on: 'ジュウ', kun: 'おも' },
    ],
    N3: [
      { char: '議', meaning: 'deliberation', on: 'ギ', kun: null },
      { char: '確', meaning: 'certain', on: 'カク', kun: 'たし' },
      { char: '容', meaning: 'contain', on: 'ヨウ', kun: null },
    ],
    N2: [
      { char: '継', meaning: 'inherit', on: 'ケイ', kun: 'つ' },
      { char: '維', meaning: 'maintain', on: 'イ', kun: null },
    ],
    N1: [
      { char: '憂', meaning: 'melancholy', on: 'ユウ', kun: 'うれ' },
      { char: '慎', meaning: 'prudent', on: 'シン', kun: 'つつし' },
    ]
  };

  const levelKanji = kanjiByLevel[level] || kanjiByLevel.N5;
  
  return levelKanji.map((kanji, index) => ({
    id: index + 1,
    character: kanji.char,
    meaning: kanji.meaning,
    on_reading: kanji.on,
    kun_reading: kanji.kun,
    jlpt_level: level,
    created_at: new Date(),
    progress: Math.random() > 0.7 ? {
      is_learned: Math.random() > 0.5,
      review_count: Math.floor(Math.random() * 5),
      last_reviewed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      next_review: Math.random() > 0.5 ? new Date(Date.now() + Math.random() * 3 * 24 * 60 * 60 * 1000) : null
    } : null
  }));
}

export default App;
