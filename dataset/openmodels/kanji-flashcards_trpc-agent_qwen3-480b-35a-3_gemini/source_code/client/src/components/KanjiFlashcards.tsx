import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Flashcard } from '../../../server/src/schema';
import { trpc } from '@/utils/trpc';

export function KanjiFlashcards() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFlashcards = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getFlashcards.query();
      setFlashcards(result);
      setCurrentCardIndex(0);
      setShowAnswer(false);
    } catch (err) {
      setError('Failed to load flashcards');
      console.error('Error loading flashcards:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFlashcards();
  }, [loadFlashcards]);

  const handleNext = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowAnswer(false);
    }
  };

  const handlePrevious = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setShowAnswer(false);
    }
  };

  const handleFlip = () => {
    setShowAnswer(!showAnswer);
  };

  const handleFamiliarityChange = async (level: number) => {
    try {
      const currentCard = flashcards[currentCardIndex];
      if (currentCard.srs_entry) {
        // Update existing SRS entry
        await trpc.updateSrsEntry.mutate({
          id: currentCard.srs_entry.id,
          familiarity_level: level,
          last_reviewed_at: new Date(),
          // In a real app, we'd calculate the next review date based on the algorithm
          next_review_date: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next day
        });
      } else {
        // Create new SRS entry
        await trpc.createSrsEntry.mutate({
          user_id: 1, // In a real app, this would be the actual user ID
          kanji_id: currentCard.kanji.id,
          familiarity_level: level,
          next_review_date: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next day
        });
      }
      
      // Move to next card
      handleNext();
    } catch (err) {
      setError('Failed to update familiarity level');
      console.error('Error updating familiarity:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
          <Button onClick={loadFlashcards} variant="default">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">No Flashcards Available</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            There are no kanji flashcards to study right now. Add some kanji to get started!
          </p>
          <Button onClick={loadFlashcards} variant="default">
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  const currentCard = flashcards[currentCardIndex];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div className="text-gray-700 dark:text-gray-300">
          Card {currentCardIndex + 1} of {flashcards.length}
        </div>
        <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100">
          {currentCard.kanji.jlpt_level}
        </Badge>
      </div>

      <Card className="mb-8 bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-6xl md:text-8xl font-bold text-indigo-700 dark:text-indigo-300">
            {currentCard.kanji.kanji}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center pb-6">
          {showAnswer ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Meaning</h3>
                <p className="text-2xl text-indigo-600 dark:text-indigo-300">{currentCard.kanji.meaning}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-indigo-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300">On'yomi</h4>
                  <p className="text-lg text-indigo-600 dark:text-indigo-300">
                    {currentCard.kanji.onyomi || 'N/A'}
                  </p>
                </div>
                <div className="bg-indigo-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300">Kun'yomi</h4>
                  <p className="text-lg text-indigo-600 dark:text-indigo-300">
                    {currentCard.kanji.kunyomi || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                Click "Show Answer" to reveal meaning and readings
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between gap-4">
          <Button 
            variant="outline" 
            onClick={handleFlip}
            className="w-full sm:w-auto"
          >
            {showAnswer ? 'Hide Answer' : 'Show Answer'}
          </Button>
        </CardFooter>
      </Card>

      {showAnswer && (
        <div className="mb-8">
          <h3 className="text-center text-gray-700 dark:text-gray-300 mb-4">
            How well did you know this kanji?
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[0, 1, 2, 3, 4, 5].map((level) => (
              <Button
                key={level}
                variant="outline"
                onClick={() => handleFamiliarityChange(level)}
                className={`flex-1 ${
                  level === 0 
                    ? 'bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-200' 
                    : level <= 2 
                      ? 'bg-orange-100 hover:bg-orange-200 text-orange-800 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 dark:text-orange-200' 
                      : 'bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-200'
                }`}
              >
                {level === 0 ? 'Forgot' : level <= 2 ? 'Hard' : 'Easy'}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handlePrevious}
          disabled={currentCardIndex === 0}
          className="px-6"
        >
          Previous
        </Button>
        <Button 
          variant="default" 
          onClick={handleNext}
          disabled={currentCardIndex === flashcards.length - 1}
          className="px-6 bg-indigo-600 hover:bg-indigo-700"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
