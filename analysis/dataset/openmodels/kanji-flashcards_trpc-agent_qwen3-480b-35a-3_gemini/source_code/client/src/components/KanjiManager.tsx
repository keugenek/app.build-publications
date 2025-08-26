import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Kanji, CreateKanjiInput } from '../../../server/src/schema';
import { trpc } from '@/utils/trpc';

interface KanjiManagerProps {
  onKanjiAdded?: () => void;
}

export function KanjiManager({ onKanjiAdded }: KanjiManagerProps) {
  const [kanjiList, setKanjiList] = useState<Kanji[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateKanjiInput>({
    kanji: '',
    meaning: '',
    onyomi: null,
    kunyomi: null,
    jlpt_level: 'N5'
  });

  const loadKanji = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getKanji.query();
      setKanjiList(result);
    } catch (err) {
      setError('Failed to load kanji');
      console.error('Error loading kanji:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKanji();
  }, [loadKanji]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await trpc.createKanji.mutate(formData);
      setFormData({
        kanji: '',
        meaning: '',
        onyomi: null,
        kunyomi: null,
        jlpt_level: 'N5'
      });
      loadKanji();
      if (onKanjiAdded) onKanjiAdded();
    } catch (err) {
      setError('Failed to create kanji');
      console.error('Error creating kanji:', err);
    }
  };

  const handleInputChange = (field: keyof CreateKanjiInput, value: string | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-lg">
        <p>{error}</p>
        <Button variant="outline" onClick={loadKanji} className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Add New Kanji</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Kanji Character
              </label>
              <Input
                value={formData.kanji}
                onChange={(e) => handleInputChange('kanji', e.target.value)}
                placeholder="漢字"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Meaning
              </label>
              <Input
                value={formData.meaning}
                onChange={(e) => handleInputChange('meaning', e.target.value)}
                placeholder="meaning in English"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                On'yomi (optional)
              </label>
              <Input
                value={formData.onyomi || ''}
                onChange={(e) => handleInputChange('onyomi', e.target.value || null)}
                placeholder="おんよみ"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Kun'yomi (optional)
              </label>
              <Input
                value={formData.kunyomi || ''}
                onChange={(e) => handleInputChange('kunyomi', e.target.value || null)}
                placeholder="くんよみ"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                JLPT Level
              </label>
              <Select
                value={formData.jlpt_level}
                onValueChange={(value: "N1" | "N2" | "N3" | "N4" | "N5") => 
                  handleInputChange('jlpt_level', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select JLPT level" />
                </SelectTrigger>
                <SelectContent>
                  {["N1", "N2", "N3", "N4", "N5"].map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" className="w-full md:w-auto">
            Add Kanji
          </Button>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <h2 className="text-xl font-bold p-6 pb-4 text-gray-800 dark:text-gray-200">Kanji Database</h2>
        {kanjiList.length === 0 ? (
          <div className="text-center p-8 text-gray-500 dark:text-gray-400">
            No kanji entries found. Add your first kanji above!
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kanji</TableHead>
                <TableHead>Meaning</TableHead>
                <TableHead>On'yomi</TableHead>
                <TableHead>Kun'yomi</TableHead>
                <TableHead>JLPT Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kanjiList.map((kanji) => (
                <TableRow key={kanji.id}>
                  <TableCell className="font-medium text-2xl text-indigo-600 dark:text-indigo-400">
                    {kanji.kanji}
                  </TableCell>
                  <TableCell>{kanji.meaning}</TableCell>
                  <TableCell>{kanji.onyomi || '-'}</TableCell>
                  <TableCell>{kanji.kunyomi || '-'}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={
                        kanji.jlpt_level === 'N1' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' 
                          : kanji.jlpt_level === 'N2' 
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200' 
                            : kanji.jlpt_level === 'N3' 
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' 
                              : kanji.jlpt_level === 'N4' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' 
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                      }
                    >
                      {kanji.jlpt_level}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
