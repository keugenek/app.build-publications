import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import type { KanjiWithProgress } from '../../../server/src/schema';

interface KanjiFlashcardsProps {
  kanji: KanjiWithProgress[];
  onProgressUpdate: (kanjiId: number, isLearned: boolean) => Promise<void>;
  isLoading: boolean;
  isReviewMode?: boolean;
}

export function KanjiFlashcards({
  kanji,
  onProgressUpdate,
  isLoading,
  isReviewMode = false
}: KanjiFlashcardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    total: 0
  });

  // Reset when kanji data changes
  useEffect(() => {
    setCurrentIndex(0);
    setShowAnswer(false);
    setSessionStats({ correct: 0, incorrect: 0, total: 0 });
  }, [kanji]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading kanji...</p>
        </div>
      </div>
    );
  }

  if (kanji.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {isReviewMode ? 'No Reviews Due!' : 'No Kanji Available'}
          </h3>
          <p className="text-gray-500">
            {isReviewMode 
              ? 'Great job! Check back later for more reviews.'
              : 'Try selecting a different JLPT level or add some kanji to get started.'
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentKanji = kanji[currentIndex];
  const progress = ((currentIndex + 1) / kanji.length) * 100;
  const isLearned = currentKanji.progress?.is_learned || false;

  const handleNext = () => {
    if (currentIndex < kanji.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowAnswer(false);
    }
  };

  const handleMarkLearned = async (learned: boolean) => {
    await onProgressUpdate(currentKanji.id, learned);
    
    setSessionStats((prev) => ({
      correct: prev.correct + (learned ? 1 : 0),
      incorrect: prev.incorrect + (!learned ? 1 : 0),
      total: prev.total + 1
    }));

    // Auto-advance in review mode
    if (isReviewMode && currentIndex < kanji.length - 1) {
      setTimeout(() => {
        handleNext();
      }, 1000);
    }
  };

  const handleRevealAnswer = () => {
    setShowAnswer(true);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setShowAnswer(false);
    setSessionStats({ correct: 0, incorrect: 0, total: 0 });
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">
            Kanji {currentIndex + 1} of {kanji.length}
          </span>
          <div className="flex gap-4 text-sm">
            {sessionStats.total > 0 && (
              <>
                <span className="text-green-600">✓ {sessionStats.correct}</span>
                <span className="text-red-600">✗ {sessionStats.incorrect}</span>
              </>
            )}
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Flashcard */}
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-between items-start">
            <Badge variant={isLearned ? 'default' : 'secondary'}>
              {currentKanji.jlpt_level}
            </Badge>
            {isLearned && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Learned
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="text-center space-y-6">
          {/* Kanji Character */}
          <div 
            className="text-8xl font-bold text-indigo-900 cursor-pointer hover:text-indigo-700 transition-colors"
            onClick={handleRevealAnswer}
          >
            {currentKanji.character}
          </div>

          {/* Answer Section */}
          {showAnswer ? (
            <div className="space-y-4 p-6 bg-gray-50 rounded-lg">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Meaning</h3>
                <p className="text-xl text-gray-900">{currentKanji.meaning}</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {currentKanji.on_reading && (
                  <div>
                    <h4 className="font-medium text-gray-600">On Reading (音読み)</h4>
                    <p className="text-lg text-blue-600">{currentKanji.on_reading}</p>
                  </div>
                )}
                {currentKanji.kun_reading && (
                  <div>
                    <h4 className="font-medium text-gray-600">Kun Reading (訓読み)</h4>
                    <p className="text-lg text-purple-600">{currentKanji.kun_reading}</p>
                  </div>
                )}
              </div>

              {/* Progress Info */}
              {currentKanji.progress && (
                <div className="text-sm text-gray-500 pt-2 border-t">
                  Review count: {currentKanji.progress.review_count} • 
                  {currentKanji.progress.last_reviewed && (
                    <span> Last reviewed: {currentKanji.progress.last_reviewed.toLocaleDateString()}</span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="py-8">
              <Button
                onClick={handleRevealAnswer}
                variant="outline"
                size="lg"
                className="text-lg px-8"
              >
                Reveal Answer
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                Or click on the kanji character
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {showAnswer && (
            <div className="flex justify-center gap-4">
              <Button
                onClick={() => handleMarkLearned(false)}
                variant="outline"
                className="flex items-center gap-2 text-red-600 border-red-600 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4" />
                Need Practice
              </Button>
              <Button
                onClick={() => handleMarkLearned(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4" />
                Got It!
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Controls */}
      <div className="flex justify-between items-center max-w-2xl mx-auto">
        <Button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        <Button
          onClick={handleReset}
          variant="ghost"
          size="sm"
          className="flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </Button>

        <Button
          onClick={handleNext}
          disabled={currentIndex === kanji.length - 1}
          variant="outline"
          className="flex items-center gap-2"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
