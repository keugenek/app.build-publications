import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { Kanji, JLPTLevel, CreateKanjiInput } from '../../../server/src/schema';

interface KanjiLibraryProps {
  userId: string;
  jlptLevel?: JLPTLevel;
  getSRSLevelColor: (level: string) => string;
}

export function KanjiLibrary({ userId, jlptLevel, getSRSLevelColor }: KanjiLibraryProps) {
  const [kanjiList, setKanjiList] = useState<Kanji[]>([]);
  const [filteredKanji, setFilteredKanji] = useState<Kanji[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [showAddKanji, setShowAddKanji] = useState(false);
  
  const [newKanji, setNewKanji] = useState<CreateKanjiInput>({
    character: '',
    meaning: '',
    kun_reading: null,
    on_reading: null,
    jlpt_level: 'N5' as JLPTLevel,
    stroke_count: 1
  });

  const itemsPerPage = 12;

  const loadKanji = useCallback(async () => {
    setIsLoading(true);
    try {
      const kanji = await trpc.getKanji.query({
        jlpt_level: jlptLevel,
        limit: 50,
        offset: 0
      });
      
      // Since API returns empty array (stub), use sample data
      const sampleKanji: Kanji[] = kanji.length === 0 ? [
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
        },
        {
          id: 6,
          character: '山',
          meaning: 'Mountain',
          kun_reading: 'やま',
          on_reading: 'サン',
          jlpt_level: 'N5' as JLPTLevel,
          stroke_count: 3,
          created_at: new Date()
        },
        {
          id: 7,
          character: '川',
          meaning: 'River',
          kun_reading: 'かわ',
          on_reading: 'セン',
          jlpt_level: 'N5' as JLPTLevel,
          stroke_count: 3,
          created_at: new Date()
        },
        {
          id: 8,
          character: '田',
          meaning: 'Rice Field',
          kun_reading: 'た',
          on_reading: 'デン',
          jlpt_level: 'N5' as JLPTLevel,
          stroke_count: 5,
          created_at: new Date()
        },
        {
          id: 9,
          character: '人',
          meaning: 'Person',
          kun_reading: 'ひと',
          on_reading: 'ジン',
          jlpt_level: 'N5' as JLPTLevel,
          stroke_count: 2,
          created_at: new Date()
        },
        {
          id: 10,
          character: '大',
          meaning: 'Big, Large',
          kun_reading: 'おお',
          on_reading: 'ダイ',
          jlpt_level: 'N5' as JLPTLevel,
          stroke_count: 3,
          created_at: new Date()
        },
        {
          id: 11,
          character: '小',
          meaning: 'Small',
          kun_reading: 'ちい',
          on_reading: 'ショウ',
          jlpt_level: 'N5' as JLPTLevel,
          stroke_count: 3,
          created_at: new Date()
        },
        {
          id: 12,
          character: '中',
          meaning: 'Middle, Inside',
          kun_reading: 'なか',
          on_reading: 'チュウ',
          jlpt_level: 'N5' as JLPTLevel,
          stroke_count: 4,
          created_at: new Date()
        },
        // N4 Level examples
        {
          id: 13,
          character: '春',
          meaning: 'Spring',
          kun_reading: 'はる',
          on_reading: 'シュン',
          jlpt_level: 'N4' as JLPTLevel,
          stroke_count: 9,
          created_at: new Date()
        },
        {
          id: 14,
          character: '夏',
          meaning: 'Summer',
          kun_reading: 'なつ',
          on_reading: 'カ',
          jlpt_level: 'N4' as JLPTLevel,
          stroke_count: 10,
          created_at: new Date()
        },
        {
          id: 15,
          character: '秋',
          meaning: 'Autumn',
          kun_reading: 'あき',
          on_reading: 'シュウ',
          jlpt_level: 'N4' as JLPTLevel,
          stroke_count: 9,
          created_at: new Date()
        },
        // N3 Level examples
        {
          id: 16,
          character: '議',
          meaning: 'Deliberation',
          kun_reading: null,
          on_reading: 'ギ',
          jlpt_level: 'N3' as JLPTLevel,
          stroke_count: 20,
          created_at: new Date()
        },
        {
          id: 17,
          character: '経',
          meaning: 'Sutra, Manage',
          kun_reading: 'へ',
          on_reading: 'ケイ',
          jlpt_level: 'N3' as JLPTLevel,
          stroke_count: 11,
          created_at: new Date()
        }
      ] : kanji;
      
      setKanjiList(sampleKanji);
    } catch (error) {
      console.error('Failed to load kanji:', error);
    } finally {
      setIsLoading(false);
    }
  }, [jlptLevel]);

  // Filter kanji based on search and level
  useEffect(() => {
    let filtered = kanjiList;

    if (searchQuery) {
      filtered = filtered.filter(kanji =>
        kanji.character.includes(searchQuery) ||
        kanji.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
        kanji.kun_reading?.includes(searchQuery) ||
        kanji.on_reading?.includes(searchQuery)
      );
    }

    if (selectedLevel !== 'all') {
      filtered = filtered.filter(kanji => kanji.jlpt_level === selectedLevel);
    }

    setFilteredKanji(filtered);
    setCurrentPage(0);
  }, [kanjiList, searchQuery, selectedLevel]);

  const handleStartStudy = async (kanjiId: number) => {
    try {
      await trpc.startKanjiStudy.mutate({
        user_id: userId,
        kanji_id: kanjiId
      });
      
      // Show success feedback
      alert('Kanji added to your study list!');
    } catch (error) {
      console.error('Failed to start studying kanji:', error);
      alert('Failed to add kanji to study list.');
    }
  };

  const handleAddKanji = async () => {
    try {
      const createdKanji = await trpc.createKanji.mutate(newKanji);
      setKanjiList(prev => [createdKanji, ...prev]);
      setNewKanji({
        character: '',
        meaning: '',
        kun_reading: null,
        on_reading: null,
        jlpt_level: 'N5' as JLPTLevel,
        stroke_count: 1
      });
      setShowAddKanji(false);
      alert('Kanji added successfully!');
    } catch (error) {
      console.error('Failed to create kanji:', error);
      alert('Failed to add kanji.');
    }
  };

  useEffect(() => {
    loadKanji();
  }, [loadKanji]);

  const paginatedKanji = filteredKanji.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const totalPages = Math.ceil(filteredKanji.length / itemsPerPage);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Search kanji, meaning, or reading..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            
            <Select value={selectedLevel || 'all'} onValueChange={(value) => setSelectedLevel(value as JLPTLevel | 'all')}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="JLPT Level" />
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

            <Dialog open={showAddKanji} onOpenChange={setShowAddKanji}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  ➕ Add Kanji
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Kanji</DialogTitle>
                  <DialogDescription>
                    Add a new kanji to the library for everyone to study.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Kanji character"
                    value={newKanji.character}
                    onChange={(e) => setNewKanji(prev => ({ ...prev, character: e.target.value }))}
                    maxLength={1}
                  />
                  <Input
                    placeholder="Meaning"
                    value={newKanji.meaning}
                    onChange={(e) => setNewKanji(prev => ({ ...prev, meaning: e.target.value }))}
                  />
                  <Input
                    placeholder="Kun reading (optional)"
                    value={newKanji.kun_reading || ''}
                    onChange={(e) => setNewKanji(prev => ({ 
                      ...prev, 
                      kun_reading: e.target.value || null 
                    }))}
                  />
                  <Input
                    placeholder="On reading (optional)"
                    value={newKanji.on_reading || ''}
                    onChange={(e) => setNewKanji(prev => ({ 
                      ...prev, 
                      on_reading: e.target.value || null 
                    }))}
                  />
                  <div className="flex gap-2">
                    <Select value={newKanji.jlpt_level} onValueChange={(value) => 
                      setNewKanji(prev => ({ ...prev, jlpt_level: value as JLPTLevel }))
                    }>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="N5">N5</SelectItem>
                        <SelectItem value="N4">N4</SelectItem>
                        <SelectItem value="N3">N3</SelectItem>
                        <SelectItem value="N2">N2</SelectItem>
                        <SelectItem value="N1">N1</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="Strokes"
                      value={newKanji.stroke_count}
                      onChange={(e) => setNewKanji(prev => ({ 
                        ...prev, 
                        stroke_count: parseInt(e.target.value) || 1 
                      }))}
                      min={1}
                      max={30}
                      className="w-24"
                    />
                  </div>
                  <Button onClick={handleAddKanji} className="w-full">
                    Add Kanji
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
            <span>
              Showing {filteredKanji.length} kanji
              {selectedLevel !== 'all' && ` (${selectedLevel} level)`}
            </span>
            {searchQuery && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSearchQuery('')}
              >
                Clear search
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {filteredKanji.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No kanji found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery 
                ? `No results for "${searchQuery}"`
                : 'No kanji match your current filters'
              }
            </p>
            {searchQuery && (
              <Button onClick={() => setSearchQuery('')}>
                Clear search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Kanji Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedKanji.map((kanji) => (
              <Card key={kanji.id} className="bg-gradient-to-br from-white to-blue-50 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className={getSRSLevelColor(kanji.jlpt_level)}>
                      {kanji.jlpt_level}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {kanji.stroke_count} strokes
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-6xl font-bold text-blue-800 mb-4">
                    {kanji.character}
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="font-semibold text-gray-800">
                      {kanji.meaning}
                    </div>
                    <Separator />
                    <div className="space-y-1 text-sm text-gray-600">
                      {kanji.kun_reading && (
                        <div>
                          <span className="font-medium">Kun:</span> {kanji.kun_reading}
                        </div>
                      )}
                      {kanji.on_reading && (
                        <div>
                          <span className="font-medium">On:</span> {kanji.on_reading}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => handleStartStudy(kanji.id)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    📚 Start Studying
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                size="sm"
              >
                ← Previous
              </Button>
              
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <Button
                    key={i}
                    variant={currentPage === i ? "default" : "outline"}
                    onClick={() => setCurrentPage(i)}
                    size="sm"
                    className="w-10"
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
              
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage === totalPages - 1}
                size="sm"
              >
                Next →
              </Button>
            </div>
          )}
        </>
      )}

      {/* Stub Data Notice */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertDescription className="text-blue-800">
          💡 <strong>Library Info:</strong> This kanji library contains sample data. 
          In production, it would display kanji from a comprehensive database with full JLPT coverage.
        </AlertDescription>
      </Alert>
    </div>
  );
}
