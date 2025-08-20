import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, BookOpen, RotateCcw, BarChart3, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { KanjiWithProgress, JlptLevel, AnswerFlashcardInput } from '../../server/src/schema';
import { ProgressDashboard } from '@/components/ProgressDashboard';
import { KanjiManager } from '@/components/KanjiManager';

// STUB DATA - Used because backend handlers are placeholders
// This would be removed once real backend implementation is complete
const STUB_KANJI_DATA: KanjiWithProgress[] = [
  {
    id: 1,
    character: '水',
    meaning: 'Water',
    kun_reading: 'みず',
    on_reading: 'スイ',
    romaji: 'mizu / sui',
    jlpt_level: 'N5' as JlptLevel,
    created_at: new Date(),
    progress: null
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
      id: 1,
      user_id: 'demo-user',
      kanji_id: 2,
      correct_count: 3,
      incorrect_count: 1,
      current_interval: 4,
      ease_factor: 2.5,
      next_review_date: new Date(),
      last_reviewed_at: new Date(Date.now() - 86400000),
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
    progress: null
  },
  {
    id: 4,
    character: '金',
    meaning: 'Gold, Money, Metal',
    kun_reading: 'きん、かね',
    on_reading: 'キン',
    romaji: 'kin, kane / kin',
    jlpt_level: 'N5' as JlptLevel,
    created_at: new Date(),
    progress: {
      id: 2,
      user_id: 'demo-user',
      kanji_id: 4,
      correct_count: 1,
      incorrect_count: 2,
      current_interval: 1,
      ease_factor: 2.1,
      next_review_date: new Date(),
      last_reviewed_at: new Date(Date.now() - 3600000),
      created_at: new Date()
    }
  }
];

interface FlashcardProps {
  kanji: KanjiWithProgress;
  onAnswer: (isCorrect: boolean) => void;
  isLoading: boolean;
}

function Flashcard({ kanji, onAnswer, isLoading }: FlashcardProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);

  // Reset state when kanji changes
  useEffect(() => {
    setIsRevealed(false);
    setHasAnswered(false);
  }, [kanji.id]);

  const handleReveal = () => {
    setIsRevealed(true);
  };

  const handleAnswer = (isCorrect: boolean) => {
    setHasAnswered(true);
    onAnswer(isCorrect);
  };

  const getJlptColor = (level: JlptLevel): string => {
    const colors = {
      N5: 'bg-green-100 text-green-800 border-green-200',
      N4: 'bg-blue-100 text-blue-800 border-blue-200',
      N3: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      N2: 'bg-orange-100 text-orange-800 border-orange-200',
      N1: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[level];
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-between items-center mb-4">
          <Badge className={`${getJlptColor(kanji.jlpt_level)} font-medium`}>
            {kanji.jlpt_level}
          </Badge>
          {kanji.progress && (
            <div className="text-sm text-gray-600">
              ✅ {kanji.progress.correct_count} | ❌ {kanji.progress.incorrect_count}
            </div>
          )}
        </div>
        <div className="text-8xl kanji-display py-8 bg-gray-50 rounded-lg">
          {kanji.character}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {!isRevealed ? (
          <div className="text-center">
            <Button 
              onClick={handleReveal} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 text-lg"
            >
              <BookOpen className="mr-2 h-5 w-5" />
              Reveal Answer
            </Button>
          </div>
        ) : (
          <div className="space-y-6 flashcard-reveal">
            {/* Meaning */}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Meaning</h3>
              <p className="text-2xl font-medium text-gray-900">{kanji.meaning}</p>
            </div>

            {/* Readings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(kanji.kun_reading || kanji.on_reading) && (
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-700 mb-2">Readings</h4>
                  {kanji.kun_reading && (
                    <div className="mb-1">
                      <span className="text-xs text-blue-600">Kun:</span>
                      <span className="ml-1 text-lg">{kanji.kun_reading}</span>
                    </div>
                  )}
                  {kanji.on_reading && (
                    <div>
                      <span className="text-xs text-blue-600">On:</span>
                      <span className="ml-1 text-lg">{kanji.on_reading}</span>
                    </div>
                  )}
                </div>
              )}
              
              {kanji.romaji && (
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-green-700 mb-2">Romaji</h4>
                  <p className="text-lg">{kanji.romaji}</p>
                </div>
              )}
            </div>

            {/* Answer buttons */}
            {!hasAnswered && (
              <div className="flex gap-4 justify-center pt-4">
                <Button
                  onClick={() => handleAnswer(false)}
                  variant="destructive"
                  disabled={isLoading}
                  className="px-8 py-3 text-lg"
                >
                  ❌ Incorrect
                </Button>
                <Button
                  onClick={() => handleAnswer(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                  disabled={isLoading}
                >
                  ✅ Correct
                </Button>
              </div>
            )}

            {hasAnswered && (
              <div className="text-center text-green-600 font-medium">
                Answer recorded! Loading next card... 📚
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ProgressStatsProps {
  dueCount: number;
  totalStudied: number;
  studyStreak: number;
}

function ProgressStats({ dueCount, totalStudied, studyStreak }: ProgressStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-indigo-600">{dueCount}</div>
          <div className="text-sm text-gray-600">Cards Due</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{totalStudied}</div>
          <div className="text-sm text-gray-600">Total Studied</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{studyStreak} 🔥</div>
          <div className="text-sm text-gray-600">Day Streak</div>
        </CardContent>
      </Card>
    </div>
  );
}

function App() {
  const [currentUser] = useState('demo-user'); // In real app, this would come from auth
  const [selectedLevel, setSelectedLevel] = useState<JlptLevel | 'all'>('all');
  const [dueKanji, setDueKanji] = useState<KanjiWithProgress[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('study');
  const [studyStats, setStudyStats] = useState({
    dueCount: 0,
    totalStudied: 0,
    studyStreak: 3 // Stub data
  });

  // Load due reviews
  const loadDueReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      // NOTE: Using stub data since backend handlers are placeholders
      // In real implementation, this would be:
      // const result = await trpc.getDueReviews.query({
      //   user_id: currentUser,
      //   jlpt_level: selectedLevel === 'all' ? undefined : selectedLevel,
      //   limit: 20
      // });
      
      console.log('Backend handlers are placeholder implementations - using stub data');
      
      let filteredKanji = STUB_KANJI_DATA;
      if (selectedLevel !== 'all') {
        filteredKanji = STUB_KANJI_DATA.filter((kanji: KanjiWithProgress) => kanji.jlpt_level === selectedLevel);
      }
      
      setDueKanji(filteredKanji);
      setStudyStats((prev) => ({
        ...prev,
        dueCount: filteredKanji.length
      }));
      setCurrentCardIndex(0);
    } catch (error) {
      console.error('Failed to load due reviews:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, selectedLevel]);

  // Load reviews on component mount and when level changes
  useEffect(() => {
    loadDueReviews();
  }, [loadDueReviews]);

  const handleAnswer = async (isCorrect: boolean) => {
    if (currentCardIndex >= dueKanji.length) return;
    
    const currentKanji = dueKanji[currentCardIndex];
    setIsLoading(true);

    try {
      const answerInput: AnswerFlashcardInput = {
        user_id: currentUser,
        kanji_id: currentKanji.id,
        is_correct: isCorrect
      };

      // NOTE: Using stub response since backend handler is placeholder
      // In real implementation, this would be:
      // await trpc.answerFlashcard.mutate(answerInput);
      
      console.log('Answering flashcard (stub):', answerInput);

      // Move to next card or finish session
      setTimeout(() => {
        if (currentCardIndex < dueKanji.length - 1) {
          setCurrentCardIndex((prev: number) => prev + 1);
        } else {
          // Session completed
          setCurrentCardIndex(0);
          setStudyStats((prev) => ({
            ...prev,
            totalStudied: prev.totalStudied + dueKanji.length,
            dueCount: 0
          }));
          setDueKanji([]);
        }
        setIsLoading(false);
      }, 1500); // Brief delay to show feedback
      
    } catch (error) {
      console.error('Failed to answer flashcard:', error);
      setIsLoading(false);
    }
  };

  const handleRestart = () => {
    loadDueReviews();
  };

  const currentKanji = dueKanji[currentCardIndex];
  const progressPercentage = dueKanji.length > 0 ? ((currentCardIndex / dueKanji.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            漢字 Kanji Master 📚
          </h1>
          <p className="text-gray-600">Master Japanese Kanji with Spaced Repetition</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3 bg-white">
            <TabsTrigger value="study" className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700">
              <BookOpen className="mr-2 h-4 w-4" />
              Study
            </TabsTrigger>
            <TabsTrigger value="progress" className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700">
              <BarChart3 className="mr-2 h-4 w-4" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="manage" className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700">
              <Settings className="mr-2 h-4 w-4" />
              Manage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="study" className="space-y-6">
            <ProgressStats {...studyStats} />

            <Tabs value={selectedLevel} onValueChange={(value) => setSelectedLevel(value as JlptLevel | 'all')} className="mb-6">
              <TabsList className="grid w-full grid-cols-6 bg-white">
                <TabsTrigger value="all" className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700">All</TabsTrigger>
                <TabsTrigger value="N5" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">N5</TabsTrigger>
                <TabsTrigger value="N4" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">N4</TabsTrigger>
                <TabsTrigger value="N3" className="data-[state=active]:bg-yellow-100 data-[state=active]:text-yellow-700">N3</TabsTrigger>
                <TabsTrigger value="N2" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">N2</TabsTrigger>
                <TabsTrigger value="N1" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700">N1</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Backend placeholder notice */}
            <Alert className="mb-6 border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Demo Mode:</strong> Backend handlers are placeholder implementations. This demo uses stub data to showcase the full SRS flashcard functionality.
                Real implementation would connect to a database with user progress tracking.
              </AlertDescription>
            </Alert>

            {dueKanji.length > 0 ? (
              <div className="space-y-6">
                {/* Progress bar */}
                <div className="w-full max-w-2xl mx-auto">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{currentCardIndex + 1} of {dueKanji.length}</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>

                {/* Current flashcard */}
                <Flashcard
                  kanji={currentKanji}
                  onAnswer={handleAnswer}
                  isLoading={isLoading}
                />
              </div>
            ) : (
              <Card className="w-full max-w-2xl mx-auto">
                <CardContent className="p-12 text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Great job!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    {studyStats.totalStudied > 0 
                      ? "You've completed your review session! All cards have been studied." 
                      : `No cards due for review in ${selectedLevel === 'all' ? 'any level' : selectedLevel}. Come back later!`
                    }
                  </p>
                  <Button onClick={handleRestart} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Start New Session
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="progress">
            <ProgressDashboard />
          </TabsContent>

          <TabsContent value="manage">
            <KanjiManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
