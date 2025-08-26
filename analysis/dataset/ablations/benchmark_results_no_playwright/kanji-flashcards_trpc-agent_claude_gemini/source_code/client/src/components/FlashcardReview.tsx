import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Eye, ArrowLeft, Brain, Timer, RotateCcw } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { KanjiWithProgress, ReviewResult, SubmitReviewInput } from '../../../server/src/schema';

interface FlashcardReviewProps {
  dueReviews: KanjiWithProgress[];
  userId: number;
  onComplete: () => void;
  onBackToDashboard: () => void;
}

interface ReviewSession {
  kanji: KanjiWithProgress;
  startTime: number;
  result?: ReviewResult;
}

export function FlashcardReview({ 
  dueReviews, 
  userId, 
  onComplete, 
  onBackToDashboard 
}: FlashcardReviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewSessions, setReviewSessions] = useState<ReviewSession[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedReviews, setCompletedReviews] = useState<ReviewSession[]>([]);
  const [sessionStartTime] = useState(Date.now());

  // Initialize review sessions
  useEffect(() => {
    const sessions = dueReviews.map(kanji => ({
      kanji,
      startTime: Date.now()
    }));
    setReviewSessions(sessions);
  }, [dueReviews]);

  const currentKanji = reviewSessions[currentIndex]?.kanji;
  const totalReviews = reviewSessions.length;
  const remainingReviews = totalReviews - currentIndex;
  const progressPercentage = totalReviews > 0 ? (currentIndex / totalReviews) * 100 : 0;

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

  const handleReveal = () => {
    setShowAnswer(true);
    // Update the start time for accurate review timing
    setReviewSessions((prev: ReviewSession[]) => 
      prev.map((session, index) => 
        index === currentIndex 
          ? { ...session, startTime: Date.now() }
          : session
      )
    );
  };

  const handleAnswer = useCallback(async (result: ReviewResult) => {
    if (!currentKanji || !currentKanji.user_progress) return;

    const reviewTime = Date.now() - reviewSessions[currentIndex].startTime;
    const currentSession = reviewSessions[currentIndex];
    
    // Update current session with result
    const updatedSession = { ...currentSession, result };
    setCompletedReviews((prev: ReviewSession[]) => [...prev, updatedSession]);

    setIsSubmitting(true);

    try {
      const reviewData: SubmitReviewInput = {
        user_id: userId,
        kanji_id: currentKanji.id,
        result,
        review_time_ms: Math.max(reviewTime, 1) // Ensure positive time
      };

      await trpc.submitReview.mutate(reviewData);

      // Move to next kanji or complete session
      if (currentIndex + 1 >= totalReviews) {
        // Session complete
        onComplete();
      } else {
        setCurrentIndex((prev: number) => prev + 1);
        setShowAnswer(false);
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
      // You might want to show an error message here
    } finally {
      setIsSubmitting(false);
    }
  }, [currentKanji, reviewSessions, currentIndex, totalReviews, userId, onComplete]);

  const resetCard = () => {
    setShowAnswer(false);
    setReviewSessions((prev: ReviewSession[]) =>
      prev.map((session, index) =>
        index === currentIndex
          ? { ...session, startTime: Date.now(), result: undefined }
          : session
      )
    );
  };

  if (!currentKanji) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">No reviews available</p>
          <Button onClick={onBackToDashboard} className="mt-4">
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  const sessionTime = Math.floor((Date.now() - sessionStartTime) / 1000);
  const minutes = Math.floor(sessionTime / 60);
  const seconds = sessionTime % 60;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={onBackToDashboard}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Timer className="h-4 w-4" />
                <span>{minutes}:{seconds.toString().padStart(2, '0')}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Brain className="h-4 w-4" />
                <span>{currentIndex + 1} / {totalReviews}</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{remainingReviews} remaining</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Flashcard */}
      <Card className="relative">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge className={getLevelColor(currentKanji.jlpt_level)}>
                {currentKanji.jlpt_level}
              </Badge>
              {currentKanji.user_progress && (
                <Badge 
                  className={getSRSLevelInfo(currentKanji.user_progress.srs_level).color} 
                  variant="secondary"
                >
                  {getSRSLevelInfo(currentKanji.user_progress.srs_level).name}
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={resetCard}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-8 py-12">
          {/* Kanji Character */}
          <div className="text-center mb-8">
            <div className="text-8xl font-bold text-gray-900 mb-4 select-none">
              {currentKanji.character}
            </div>
            {currentKanji.user_progress && (
              <div className="text-sm text-gray-500">
                Streak: {currentKanji.user_progress.correct_streak} • 
                Total Reviews: {currentKanji.user_progress.total_reviews}
              </div>
            )}
          </div>

          <Separator className="my-6" />

          {/* Answer Section */}
          {!showAnswer ? (
            <div className="text-center">
              <p className="text-gray-600 mb-6">
                What does this kanji mean and how do you read it?
              </p>
              <Button onClick={handleReveal} size="lg">
                <Eye className="mr-2 h-5 w-5" />
                Show Answer
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Answer Content */}
              <div className="text-center space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Meaning</h3>
                  <p className="text-lg text-blue-800">{currentKanji.meaning_english}</p>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">Reading</h3>
                  <div className="space-y-1">
                    <p className="text-lg text-green-800">
                      <span className="font-medium">Hiragana:</span> {currentKanji.reading_hiragana}
                    </p>
                    {currentKanji.reading_katakana && (
                      <p className="text-lg text-green-800">
                        <span className="font-medium">Katakana:</span> {currentKanji.reading_katakana}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Answer Buttons */}
              <div className="flex justify-center space-x-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleAnswer('INCORRECT')}
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 border-red-200 hover:bg-red-50 hover:border-red-300"
                >
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span>Incorrect</span>
                </Button>
                <Button
                  size="lg"
                  onClick={() => handleAnswer('CORRECT')}
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-5 w-5" />
                  <span>Correct</span>
                </Button>
              </div>

              {isSubmitting && (
                <div className="text-center text-sm text-gray-500">
                  Saving your answer...
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Stats */}
      {completedReviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Session Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-600">
                  {completedReviews.filter(r => r.result === 'CORRECT').length}
                </div>
                <div className="text-sm text-green-800">Correct</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-red-600">
                  {completedReviews.filter(r => r.result === 'INCORRECT').length}
                </div>
                <div className="text-sm text-red-800">Incorrect</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
