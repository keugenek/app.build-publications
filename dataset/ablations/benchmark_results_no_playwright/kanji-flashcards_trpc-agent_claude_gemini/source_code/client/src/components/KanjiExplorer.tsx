import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, BookOpen, Play, CheckCircle, Loader2 } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { JLPTLevel, Kanji } from '../../../server/src/schema';

interface KanjiExplorerProps {
  userId: number;
  onKanjiLearned: () => void;
}

export function KanjiExplorer({ userId, onKanjiLearned }: KanjiExplorerProps) {
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel>('N5');
  const [kanjiList, setKanjiList] = useState<Kanji[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [startingKanji, setStartingKanji] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [learningStatus, setLearningStatus] = useState<{ [key: number]: boolean }>({});

  const loadKanjiByLevel = useCallback(async (level: JLPTLevel) => {
    setIsLoading(true);
    setError(null);
    try {
      const kanji = await trpc.getKanjiByLevel.query({
        jlpt_level: level,
        limit: 50,
        offset: 0
      });
      setKanjiList(kanji);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load kanji');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKanjiByLevel(selectedLevel);
  }, [selectedLevel, loadKanjiByLevel]);

  const handleLevelChange = (level: JLPTLevel) => {
    setSelectedLevel(level);
    setSearchTerm('');
  };

  const handleStartLearning = async (kanjiId: number) => {
    setStartingKanji(kanjiId);
    setError(null);

    try {
      await trpc.startLearningKanji.mutate({
        userId,
        kanjiId
      });

      // Mark this kanji as being learned
      setLearningStatus((prev: { [key: number]: boolean }) => ({
        ...prev,
        [kanjiId]: true
      }));

      // Notify parent component
      onKanjiLearned();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start learning kanji');
    } finally {
      setStartingKanji(null);
    }
  };

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

  const getLevelDescription = (level: JLPTLevel) => {
    const descriptions = {
      'N5': 'Beginner - Basic kanji for daily use',
      'N4': 'Elementary - Common kanji for everyday situations',
      'N3': 'Intermediate - More complex kanji for various contexts',
      'N2': 'Upper Intermediate - Advanced kanji for business and academic use',
      'N1': 'Advanced - Complex kanji for specialized contexts'
    };
    return descriptions[level];
  };

  // Filter kanji based on search term
  const filteredKanji = kanjiList.filter((kanji: Kanji) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      kanji.character.includes(term) ||
      kanji.meaning_english.toLowerCase().includes(term) ||
      kanji.reading_hiragana.includes(term) ||
      (kanji.reading_katakana && kanji.reading_katakana.includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-blue-600" />
            <span>Explore Kanji</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">JLPT Level</label>
              <Select value={selectedLevel} onValueChange={handleLevelChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select JLPT Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="N5">N5 - Beginner</SelectItem>
                  <SelectItem value="N4">N4 - Elementary</SelectItem>
                  <SelectItem value="N3">N3 - Intermediate</SelectItem>
                  <SelectItem value="N2">N2 - Upper Intermediate</SelectItem>
                  <SelectItem value="N1">N1 - Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by character, meaning, or reading..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Badge className={getLevelColor(selectedLevel)} variant="secondary">
                {selectedLevel}
              </Badge>
              <span className="font-medium">
                {filteredKanji.length} kanji {searchTerm && 'found'}
              </span>
            </div>
            <p className="text-sm text-blue-700">
              {getLevelDescription(selectedLevel)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Kanji Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          // Loading skeletons
          [...Array(6)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-6">
                <div className="text-center space-y-3">
                  <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredKanji.length > 0 ? (
          filteredKanji.map((kanji: Kanji) => (
            <Card key={kanji.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  {/* Kanji Character */}
                  <div className="text-6xl font-bold text-gray-900 select-none">
                    {kanji.character}
                  </div>

                  {/* JLPT Level Badge */}
                  <Badge className={getLevelColor(kanji.jlpt_level)} variant="secondary">
                    {kanji.jlpt_level}
                  </Badge>

                  {/* Meaning */}
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">
                      {kanji.meaning_english}
                    </h3>
                  </div>

                  {/* Readings */}
                  <div className="space-y-1">
                    <div className="text-sm">
                      <span className="font-medium text-green-700">ひらがな: </span>
                      <span className="text-green-600">{kanji.reading_hiragana}</span>
                    </div>
                    {kanji.reading_katakana && (
                      <div className="text-sm">
                        <span className="font-medium text-blue-700">カタカナ: </span>
                        <span className="text-blue-600">{kanji.reading_katakana}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="pt-2">
                    {learningStatus[kanji.id] ? (
                      <Button variant="outline" disabled className="w-full">
                        <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                        Added to Learning
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleStartLearning(kanji.id)}
                        disabled={startingKanji === kanji.id}
                        className="w-full"
                      >
                        {startingKanji === kanji.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Start Learning
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No matching kanji found' : 'No kanji available'}
                </h3>
                <p className="text-gray-500">
                  {searchTerm 
                    ? 'Try adjusting your search terms or select a different JLPT level.'
                    : `No kanji data available for ${selectedLevel} level yet.`
                  }
                </p>
                {searchTerm && (
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchTerm('')}
                    className="mt-4"
                  >
                    Clear Search
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-sm text-gray-600 space-y-2">
            <p>
              💡 <strong>Tip:</strong> Start with N5 kanji if you're a beginner. 
              Each kanji you learn will be added to your review schedule using spaced repetition.
            </p>
            <p>
              🎯 <strong>Goal:</strong> Master each JLPT level progressively: N5 → N4 → N3 → N2 → N1
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
