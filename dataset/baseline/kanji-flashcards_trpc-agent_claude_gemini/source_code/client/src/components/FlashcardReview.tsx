import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { trpc } from '@/utils/trpc';
import type { Kanji, ReviewResult, JLPTLevel } from '../../../server/src/schema';

interface FlashcardReviewProps {
  userId: string;
  getSRSLevelColor?: (level: string) => string;
  getSRSLevelName?: (level: string) => string;
}

interface ReviewSession {
  kanji: Kanji;
  startTime: number;
  showMeaning: boolean;
  showReading: boolean;
  userAnswer: string;
  phase: 'question' | 'answer' | 'result';
}

export function FlashcardReview({ 
  userId
}: FlashcardReviewProps) {
  const [reviewQueue, setReviewQueue] = useState<Kanji[]>([]);
  const [currentSession, setCurrentSession] = useState<ReviewSession | null>(null);
  const [sessionStats, setSessionStats] = useState({
    completed: 0,
    correct: 0,
    incorrect: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const loadReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const reviews = await trpc.getReviewsDue.query({
        user_id: userId,
        limit: 20
      });
      
      // Since API returns empty array (stub), use sample data
      const sampleReviews: Kanji[] = reviews.length === 0 ? [
        {
          id: 1,
          character: '水',
          meaning: 'Water',
          kun_reading: 'みず',
          on_reading: 'スイ',
          jlpt_level: 'N5' as JLPTLevel,
          stroke_count: 4,
          created_at: new Date()
        },
        {
          id: 2,
          character: '火',
          meaning: 'Fire',
          kun_reading: 'ひ',
          on_reading: 'カ',
          jlpt_level: 'N5' as JLPTLevel,
          stroke_count: 4,
          created_at: new Date()
        },
        {
          id: 3,
          character: '木',
          meaning: 'Tree, Wood',
          kun_reading: 'き',
          on_reading: 'モク',
          jlpt_level: 'N5' as JLPTLevel,
          stroke_count: 4,
          created_at: new Date()
        },
        {
          id: 4,
          character: '日',
          meaning: 'Day, Sun',
          kun_reading: 'ひ',
          on_reading: 'ニチ',
          jlpt_level: 'N5' as JLPTLevel,
          stroke_count: 4,
          created_at: new Date()
        },
        {
          id: 5,
          character: '月',
          meaning: 'Month, Moon',
          kun_reading: 'つき',
          on_reading: 'ゲツ',
          jlpt_level: 'N5' as JLPTLevel,
          stroke_count: 4,
          created_at: new Date()
        }
      ] : reviews;
      
      setReviewQueue(sampleReviews);
      
      if (sampleReviews.length > 0 && !currentSession) {
        startNextReview(sampleReviews);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, currentSession]);

  const startNextReview = (queue: Kanji[]) => {
    if (queue.length === 0) {
      setCurrentSession(null);
      return;
    }

    const nextKanji = queue[0];
    setCurrentSession({
      kanji: nextKanji,
      startTime: Date.now(),
      showMeaning: Math.random() > 0.5, // Randomly show meaning or reading
      showReading: false,
      userAnswer: '',
      phase: 'question'
    });
    setShowHint(false);
  };

  const submitAnswer = async () => {
    if (!currentSession) return;

    setCurrentSession(prev => prev ? { ...prev, phase: 'answer' } : null);
  };

  const markResult = async (result: ReviewResult) => {
    if (!currentSession) return;

    const responseTime = Date.now() - currentSession.startTime;

    try {
      await trpc.submitReview.mutate({
        user_id: userId,
        kanji_id: currentSession.kanji.id,
        result,
        response_time_ms: responseTime
      });

      setSessionStats(prev => ({
        completed: prev.completed + 1,
        correct: prev.correct + (result === 'CORRECT' ? 1 : 0),
        incorrect: prev.incorrect + (result === 'INCORRECT' ? 1 : 0)
      }));

      setCurrentSession(prev => prev ? { ...prev, phase: 'result' } : null);

      // Auto-advance to next review after 2 seconds
      setTimeout(() => {
        const newQueue = reviewQueue.slice(1);
        setReviewQueue(newQueue);
        startNextReview(newQueue);
      }, 2000);

    } catch (error) {
      console.error('Failed to submit review:', error);
    }
  };

  const skipToNext = () => {
    const newQueue = reviewQueue.slice(1);
    setReviewQueue(newQueue);
    startNextReview(newQueue);
  };

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading reviews...</p>
        </CardContent>
      </Card>
    );
  }

  if (reviewQueue.length === 0 && !currentSession) {
    return (
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-2xl font-bold text-green-800 mb-2">All Reviews Complete!</h3>
          <p className="text-green-600 mb-4">
            Great job! You've completed all your reviews for now.
          </p>
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">Session Summary</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-2xl font-bold text-green-700">{sessionStats.completed}</div>
                <div className="text-green-600">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-700">{sessionStats.correct}</div>
                <div className="text-green-600">Correct</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{sessionStats.incorrect}</div>
                <div className="text-red-600">Incorrect</div>
              </div>
            </div>
            <div className="mt-3">
              <div className="text-sm text-gray-600 mb-1">
                Accuracy: {sessionStats.completed > 0 ? Math.round((sessionStats.correct / sessionStats.completed) * 100) : 0}%
              </div>
              <Progress 
                value={sessionStats.completed > 0 ? (sessionStats.correct / sessionStats.completed) * 100 : 0} 
                className="h-2"
              />
            </div>
          </div>
          <Button 
            onClick={() => loadReviews()} 
            className="mt-4 bg-green-600 hover:bg-green-700"
          >
            Check for More Reviews
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!currentSession) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">Setting up your review session...</p>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = ((sessionStats.completed / (sessionStats.completed + reviewQueue.length)) * 100) || 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">
              Review Progress: {sessionStats.completed}/{sessionStats.completed + reviewQueue.length}
            </span>
            <span className="text-sm text-gray-500">
              {reviewQueue.length} remaining
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>✅ {sessionStats.correct} correct</span>
            <span>❌ {sessionStats.incorrect} incorrect</span>
          </div>
        </CardContent>
      </Card>

      {/* Main Flashcard */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-between items-center">
            <Badge variant="outline" className="text-xs">
              {currentSession.kanji.jlpt_level}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {currentSession.kanji.stroke_count} strokes
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {/* Kanji Character */}
          <div className="text-8xl md:text-9xl font-bold text-blue-800 py-8">
            {currentSession.kanji.character}
          </div>

          {/* Question Phase */}
          {currentSession.phase === 'question' && (
            <div className="space-y-4">
              <div className="text-lg text-blue-700">
                {currentSession.showMeaning 
                  ? "What does this kanji mean?" 
                  : "How do you read this kanji?"
                }
              </div>
              
              <Input
                value={currentSession.userAnswer}
                onChange={(e) => setCurrentSession(prev => 
                  prev ? { ...prev, userAnswer: e.target.value } : null
                )}
                placeholder={currentSession.showMeaning ? "Enter meaning..." : "Enter reading..."}
                className="text-center text-lg max-w-md mx-auto"
                onKeyPress={(e) => e.key === 'Enter' && submitAnswer()}
              />

              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={submitAnswer}
                  disabled={!currentSession.userAnswer.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Submit Answer
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowHint(!showHint)}
                >
                  {showHint ? 'Hide' : 'Show'} Hint
                </Button>
              </div>

              {showHint && (
                <Alert className="max-w-md mx-auto">
                  <AlertDescription>
                    💡 <strong>Hint:</strong> This is a {currentSession.kanji.jlpt_level} level kanji with {currentSession.kanji.stroke_count} strokes.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Answer Phase */}
          {currentSession.phase === 'answer' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 border border-blue-200">
                <h3 className="text-xl font-bold text-blue-800 mb-4">Correct Answer:</h3>
                <div className="grid gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Meaning</div>
                    <div className="text-lg font-semibold">{currentSession.kanji.meaning}</div>
                  </div>
                  {currentSession.kanji.kun_reading && (
                    <div>
                      <div className="text-sm text-gray-600">Kun Reading</div>
                      <div className="text-lg font-semibold">{currentSession.kanji.kun_reading}</div>
                    </div>
                  )}
                  {currentSession.kanji.on_reading && (
                    <div>
                      <div className="text-sm text-gray-600">On Reading</div>
                      <div className="text-lg font-semibold">{currentSession.kanji.on_reading}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Your Answer:</div>
                <div className="text-lg font-medium">{currentSession.userAnswer}</div>
              </div>

              <div className="text-lg font-medium text-blue-700 mb-4">
                How did you do?
              </div>

              <div className="flex gap-4 justify-center">
                <Button 
                  onClick={() => markResult('CORRECT')}
                  className="bg-green-600 hover:bg-green-700 text-white px-8"
                >
                  ✅ Correct
                </Button>
                <Button 
                  onClick={() => markResult('INCORRECT')}
                  variant="destructive"
                  className="px-8"
                >
                  ❌ Incorrect
                </Button>
              </div>
            </div>
          )}

          {/* Result Phase */}
          {currentSession.phase === 'result' && (
            <div className="text-center space-y-4">
              <div className="text-2xl">
                {sessionStats.correct > sessionStats.incorrect ? '🎉' : '📚'}
              </div>
              <div className="text-lg font-semibold text-blue-700">
                Moving to next review...
              </div>
              <div className="animate-pulse">
                <Progress value={100} className="h-2 max-w-xs mx-auto" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skip Option */}
      {currentSession.phase === 'question' && (
        <div className="text-center">
          <Button variant="ghost" onClick={skipToNext} className="text-gray-500">
            Skip this kanji →
          </Button>
        </div>
      )}
    </div>
  );
}
