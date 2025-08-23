import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import type { Kanji, KanjisByLevelInput } from '../../../server/src/schema';

export function KanjiStudy({ userId }: { userId: number }) {
  const [level, setLevel] = useState<number>(5); // default N5
  const [kanjis, setKanjis] = useState<Kanji[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const loadKanjis = useCallback(async (jlptLevel: number) => {
    setIsLoading(true);
    try {
      const data = await trpc.getKanjisByLevel.query({ jlpt_level: jlptLevel } as KanjisByLevelInput);
      setKanjis(data);
      setCurrentIndex(0);
    } catch (err) {
      console.error('Failed to fetch kanjis', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKanjis(level);
  }, [level, loadKanjis]);

  const currentKanji = kanjis[currentIndex];

  const handleAnswer = async (correct: boolean) => {
    if (!currentKanji) return;
    try {
      await trpc.recordAnswer.mutate({
        user_id: userId,
        kanji_id: currentKanji.id,
        correct,
      });
    } catch (err) {
      console.error('Record answer error', err);
    }
    // Move to next kanji
    setCurrentIndex((prev) => (prev + 1) % kanjis.length);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Study JLPT N{level}</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">Change Level</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {[5,4,3,2,1].map((lvl) => (
              <DropdownMenuItem key={lvl} onSelect={() => setLevel(lvl)}>
                N{lvl}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoading ? (
        <p className="text-center">Loading kanjis...</p>
      ) : currentKanji ? (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-4xl text-center">{currentKanji.character}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-center">
            <p><span className="font-medium">Meaning:</span> {currentKanji.meaning}</p>
            <p><span className="font-medium">Onyomi:</span> {currentKanji.onyomi}</p>
            <p><span className="font-medium">Kunyomi:</span> {currentKanji.kunyomi}</p>
            <div className="flex gap-4 justify-center mt-4">
              <Button onClick={() => handleAnswer(true)} variant="default">Correct</Button>
              <Button onClick={() => handleAnswer(false)} variant="destructive">Incorrect</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <p className="text-center text-gray-500">No kanjis available for this level.</p>
      )}
    </div>
  );
}
