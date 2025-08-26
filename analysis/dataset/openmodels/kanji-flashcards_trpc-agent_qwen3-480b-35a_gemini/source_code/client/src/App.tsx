import './App.css';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/utils/trpc';
import type { JLPTLevel, Kanji, Flashcard, UserProgress } from '../../server/src/schema';

function App() {
  const [currentLevel, setCurrentLevel] = useState<JLPTLevel>('N5');
  const [currentKanjiIndex, setCurrentKanjiIndex] = useState(0);
  const [showReading, setShowReading] = useState(false);
  const [userId] = useState('user-1'); // In a real app, this would come from auth
  
  const [kanjiList, setKanjiList] = useState<Kanji[]>([]);
  const [progressData, setProgressData] = useState<UserProgress[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoadingKanji, setIsLoadingKanji] = useState(true);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [isLoadingFlashcards, setIsLoadingFlashcards] = useState(true);

  // Fetch kanji for the current level
  useEffect(() => {
    const fetchKanji = async () => {
      setIsLoadingKanji(true);
      try {
        const result = await trpc.getKanjiByLevel.query({ jlptLevel: currentLevel });
        setKanjiList(result);
        setCurrentKanjiIndex(0);
      } catch (error) {
        console.error('Failed to fetch kanji:', error);
        setKanjiList([]);
      } finally {
        setIsLoadingKanji(false);
      }
    };
    
    fetchKanji();
  }, [currentLevel]);

  // Fetch user progress
  useEffect(() => {
    const fetchProgress = async () => {
      setIsLoadingProgress(true);
      try {
        const result = await trpc.getUserProgress.query(userId);
        setProgressData(result);
      } catch (error) {
        console.error('Failed to fetch progress:', error);
        setProgressData([]);
      } finally {
        setIsLoadingProgress(false);
      }
    };
    
    fetchProgress();
  }, [userId]);

  // Fetch flashcards for review
  useEffect(() => {
    const fetchFlashcards = async () => {
      setIsLoadingFlashcards(true);
      try {
        const result = await trpc.getFlashcardsForReview.query(userId);
        setFlashcards(result);
      } catch (error) {
        console.error('Failed to fetch flashcards:', error);
        setFlashcards([]);
      } finally {
        setIsLoadingFlashcards(false);
      }
    };
    
    fetchFlashcards();
  }, [userId]);

  const currentKanji = kanjiList?.[currentKanjiIndex];

  const handleNextKanji = () => {
    if (kanjiList && kanjiList.length > 0) {
      setCurrentKanjiIndex((prev) => (prev + 1) % kanjiList.length);
      setShowReading(false);
    }
  };

  const handlePrevKanji = () => {
    if (kanjiList && kanjiList.length > 0) {
      setCurrentKanjiIndex((prev) => (prev - 1 + kanjiList.length) % kanjiList.length);
      setShowReading(false);
    }
  };

  const toggleReading = () => {
    setShowReading(!showReading);
  };

  const handleReview = async (quality: number) => {
    if (!currentKanji) return;
    
    try {
      // In a real app, we would create or update flashcards here
      // For now, we'll just simulate the review
      console.log(`Reviewed kanji ${currentKanji.character} with quality ${quality}`);
      handleNextKanji();
    } catch (error) {
      console.error('Failed to review flashcard:', error);
    }
  };

  // Calculate progress percentages for each JLPT level
  const levelProgress: Record<JLPTLevel, number> = {
    N5: 0,
    N4: 0,
    N3: 0,
    N2: 0,
    N1: 0
  };

  if (progressData && progressData.length > 0) {
    progressData.forEach((progress) => {
      if (progress.totalKanjiCount > 0) {
        const level = progress.jlptLevel as JLPTLevel;
        if (level in levelProgress) {
          levelProgress[level] = 
            (progress.masteredKanjiCount / progress.totalKanjiCount) * 100;
        }
      }
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-2">
            日本語 Kanji Master
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Master Japanese Kanji with Spaced Repetition System
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* JLPT Level Selector */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <div className="flex flex-wrap justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  JLPT Level: {currentLevel}
                </h2>
                <div className="flex gap-2">
                  {(['N5', 'N4', 'N3', 'N2', 'N1'] as JLPTLevel[]).map((level) => (
                    <Button
                      key={level}
                      variant={currentLevel === level ? "default" : "outline"}
                      onClick={() => {
                        setCurrentLevel(level);
                        setCurrentKanjiIndex(0);
                      }}
                      className="px-3 py-1 text-sm"
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Progress for current level */}
              <div className="mt-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Level Progress
                  </span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {levelProgress[currentLevel].toFixed(0)}%
                  </span>
                </div>
                <Progress value={levelProgress[currentLevel]} className="h-2" />
              </div>
            </div>

            {/* Flashcard */}
            <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-gray-800 dark:text-white">
                  Kanji Flashcards
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-300">
                  Test your knowledge with spaced repetition
                </p>
              </CardHeader>
              <CardContent>
                {isLoadingKanji ? (
                  <div className="flex flex-col items-center justify-center h-64">
                    <Skeleton className="h-32 w-32 rounded-xl" />
                    <Skeleton className="h-4 w-24 mt-4" />
                    <Skeleton className="h-4 w-32 mt-2" />
                  </div>
                ) : kanjiList && kanjiList.length > 0 ? (
                  <div className="space-y-6">
                    {/* Kanji Display */}
                    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-8xl font-medium mb-4 text-gray-800 dark:text-white">
                        {currentKanji?.character}
                      </div>
                      <div className="text-center">
                        <p className="text-xl text-gray-700 dark:text-gray-300 mb-2">
                          {currentKanji?.meaning}
                        </p>
                        {showReading && currentKanji && (
                          <div className="mt-4">
                            {currentKanji.kunReading && (
                              <p className="text-gray-600 dark:text-gray-400">
                                Kun: {currentKanji.kunReading}
                              </p>
                            )}
                            {currentKanji.onReading && (
                              <p className="text-gray-600 dark:text-gray-400">
                                On: {currentKanji.onReading}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Navigation and Controls */}
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handlePrevKanji}>
                          Previous
                        </Button>
                        <Button variant="outline" onClick={toggleReading}>
                          {showReading ? 'Hide Reading' : 'Show Reading'}
                        </Button>
                        <Button variant="outline" onClick={handleNextKanji}>
                          Next
                        </Button>
                      </div>
                      
                      <div className="text-sm text-gray-600 dark:text-gray-400 self-center">
                        {kanjiList ? currentKanjiIndex + 1 : 0} of {kanjiList?.length || 0}
                      </div>
                    </div>

                    {/* SRS Review Buttons */}
                    <div className="grid grid-cols-3 gap-3">
                      <Button 
                        variant="destructive" 
                        onClick={() => handleReview(0)}
                        className="py-6"
                      >
                        Hard
                      </Button>
                      <Button 
                        variant="secondary" 
                        onClick={() => handleReview(3)}
                        className="py-6"
                      >
                        Good
                      </Button>
                      <Button 
                        variant="default" 
                        onClick={() => handleReview(5)}
                        className="py-6"
                      >
                        Easy
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600 dark:text-gray-300">
                      No kanji found for this level. Add some kanji to get started!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Overview */}
            <Card className="bg-white dark:bg-gray-800 rounded-xl shadow">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800 dark:text-white">
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingProgress ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(['N5', 'N4', 'N3', 'N2', 'N1'] as JLPTLevel[]).map((level) => (
                      <div key={level}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {level}
                          </span>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {levelProgress[level].toFixed(0)}%
                          </span>
                        </div>
                        <Progress value={levelProgress[level]} className="h-2" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Reviews */}
            <Card className="bg-white dark:bg-gray-800 rounded-xl shadow">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800 dark:text-white">
                  Upcoming Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingFlashcards ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : flashcards && flashcards.length > 0 ? (
                  <div className="space-y-3">
                    {flashcards.slice(0, 5).map((flashcard) => (
                      <div 
                        key={flashcard.id} 
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white">
                            {kanjiList?.find((k) => k.id === flashcard.kanjiId)?.character || 'Kanji'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Due: {flashcard.nextReviewDate.toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {flashcard.repetitionCount} reviews
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-300 text-center py-4">
                    No upcoming reviews
                  </p>
                )}
              </CardContent>
            </Card>

            {/* JLPT Level Info */}
            <Card className="bg-white dark:bg-gray-800 rounded-xl shadow">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800 dark:text-white">
                  JLPT Levels
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">N5</span>
                    <span className="text-gray-500 dark:text-gray-400">80 kanji</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">N4</span>
                    <span className="text-gray-500 dark:text-gray-400">181 kanji</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">N3</span>
                    <span className="text-gray-500 dark:text-gray-400">365 kanji</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">N2</span>
                    <span className="text-gray-500 dark:text-gray-400">365 kanji</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">N1</span>
                    <span className="text-gray-500 dark:text-gray-400">365 kanji</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
