import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Trash2, Plus, Search } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Kanji, CreateKanjiInput, UpdateKanjiInput, JlptLevel } from '../../../server/src/schema';

// STUB DATA - Would be removed with real backend implementation
const STUB_KANJI_LIST: Kanji[] = [
  {
    id: 1,
    character: '水',
    meaning: 'Water',
    kun_reading: 'みず',
    on_reading: 'スイ',
    romaji: 'mizu / sui',
    jlpt_level: 'N5' as JlptLevel,
    created_at: new Date()
  },
  {
    id: 2,
    character: '火',
    meaning: 'Fire',
    kun_reading: 'ひ',
    on_reading: 'カ',
    romaji: 'hi / ka',
    jlpt_level: 'N5' as JlptLevel,
    created_at: new Date()
  },
  {
    id: 3,
    character: '木',
    meaning: 'Tree, Wood',
    kun_reading: 'き',
    on_reading: 'モク',
    romaji: 'ki / moku',
    jlpt_level: 'N5' as JlptLevel,
    created_at: new Date()
  }
];

interface KanjiFormProps {
  kanji?: Kanji;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateKanjiInput | UpdateKanjiInput) => void;
  isLoading: boolean;
}

function KanjiForm({ kanji, isOpen, onClose, onSubmit, isLoading }: KanjiFormProps) {
  const [formData, setFormData] = useState<CreateKanjiInput>({
    character: '',
    meaning: '',
    kun_reading: null,
    on_reading: null,
    romaji: null,
    jlpt_level: 'N5' as JlptLevel
  });

  // Reset form when dialog opens/closes or kanji changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        character: kanji?.character || '',
        meaning: kanji?.meaning || '',
        kun_reading: kanji?.kun_reading || null,
        on_reading: kanji?.on_reading || null,
        romaji: kanji?.romaji || null,
        jlpt_level: kanji?.jlpt_level || 'N5'
      });
    }
  }, [isOpen, kanji]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (kanji) {
      // Update mode
      const updateData: UpdateKanjiInput = {
        id: kanji.id,
        ...formData
      };
      onSubmit(updateData);
    } else {
      // Create mode
      onSubmit(formData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {kanji ? 'Edit Kanji' : 'Add New Kanji'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="character">Kanji Character *</Label>
            <Input
              id="character"
              value={formData.character}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateKanjiInput) => ({ ...prev, character: e.target.value }))
              }
              placeholder="水"
              required
              maxLength={1}
              className="text-2xl text-center"
            />
          </div>

          <div>
            <Label htmlFor="meaning">English Meaning *</Label>
            <Input
              id="meaning"
              value={formData.meaning}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateKanjiInput) => ({ ...prev, meaning: e.target.value }))
              }
              placeholder="Water"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="kun_reading">Kun Reading</Label>
              <Input
                id="kun_reading"
                value={formData.kun_reading || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateKanjiInput) => ({ ...prev, kun_reading: e.target.value || null }))
                }
                placeholder="みず"
              />
            </div>
            <div>
              <Label htmlFor="on_reading">On Reading</Label>
              <Input
                id="on_reading"
                value={formData.on_reading || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateKanjiInput) => ({ ...prev, on_reading: e.target.value || null }))
                }
                placeholder="スイ"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="romaji">Romaji</Label>
            <Input
              id="romaji"
              value={formData.romaji || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateKanjiInput) => ({ ...prev, romaji: e.target.value || null }))
              }
              placeholder="mizu / sui"
            />
          </div>

          <div>
            <Label>JLPT Level</Label>
            <Select
              value={formData.jlpt_level}
              onValueChange={(value: JlptLevel) =>
                setFormData((prev: CreateKanjiInput) => ({ ...prev, jlpt_level: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="N5">N5 (Beginner)</SelectItem>
                <SelectItem value="N4">N4</SelectItem>
                <SelectItem value="N3">N3</SelectItem>
                <SelectItem value="N2">N2</SelectItem>
                <SelectItem value="N1">N1 (Advanced)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : (kanji ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function KanjiManager() {
  const [kanjiList, setKanjiList] = useState<Kanji[]>([]);
  const [filteredKanji, setFilteredKanji] = useState<Kanji[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<JlptLevel | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [editingKanji, setEditingKanji] = useState<Kanji | undefined>(undefined);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const loadKanji = useCallback(async () => {
    setIsLoading(true);
    try {
      // NOTE: Using stub data since backend handlers are placeholders
      // In real implementation, this would be:
      // const result = await trpc.getAllKanji.query();
      
      console.log('Backend handlers are placeholder implementations - using stub data');
      setKanjiList(STUB_KANJI_LIST);
    } catch (error) {
      console.error('Failed to load kanji:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter kanji based on search and level
  useEffect(() => {
    let filtered = kanjiList;

    if (selectedLevel !== 'all') {
      filtered = filtered.filter((kanji: Kanji) => kanji.jlpt_level === selectedLevel);
    }

    if (searchTerm.trim()) {
      filtered = filtered.filter((kanji: Kanji) =>
        kanji.character.includes(searchTerm) ||
        kanji.meaning.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (kanji.kun_reading && kanji.kun_reading.includes(searchTerm)) ||
        (kanji.on_reading && kanji.on_reading.includes(searchTerm)) ||
        (kanji.romaji && kanji.romaji.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredKanji(filtered);
  }, [kanjiList, searchTerm, selectedLevel]);

  // Load kanji on mount
  useEffect(() => {
    loadKanji();
  }, [loadKanji]);

  const handleSubmit = async (data: CreateKanjiInput | UpdateKanjiInput) => {
    setIsLoading(true);
    try {
      if ('id' in data) {
        // Update existing kanji
        // NOTE: Using stub response since backend handler is placeholder
        // In real implementation: await trpc.updateKanji.mutate(data);
        console.log('Updating kanji (stub):', data);
        
        setKanjiList((prev: Kanji[]) =>
          prev.map((k: Kanji) => k.id === data.id ? { ...k, ...data } : k)
        );
      } else {
        // Create new kanji
        // NOTE: Using stub response since backend handler is placeholder
        // In real implementation: const result = await trpc.createKanji.mutate(data);
        console.log('Creating kanji (stub):', data);
        
        const newKanji: Kanji = {
          id: Math.max(...kanjiList.map((k: Kanji) => k.id)) + 1,
          ...data,
          created_at: new Date()
        };
        setKanjiList((prev: Kanji[]) => [...prev, newKanji]);
      }

      setIsFormOpen(false);
      setEditingKanji(undefined);
    } catch (error) {
      console.error('Failed to save kanji:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this kanji?')) return;

    setIsLoading(true);
    try {
      // NOTE: Using stub response since backend handler is placeholder
      // In real implementation: await trpc.deleteKanji.mutate({ id });
      console.log('Deleting kanji (stub):', id);
      
      setKanjiList((prev: Kanji[]) => prev.filter((k: Kanji) => k.id !== id));
    } catch (error) {
      console.error('Failed to delete kanji:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (kanji: Kanji) => {
    setEditingKanji(kanji);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingKanji(undefined);
    setIsFormOpen(true);
  };

  const getJlptBadgeColor = (level: JlptLevel): string => {
    const colors = {
      N5: 'bg-green-100 text-green-800',
      N4: 'bg-blue-100 text-blue-800',
      N3: 'bg-yellow-100 text-yellow-800',
      N2: 'bg-orange-100 text-orange-800',
      N1: 'bg-red-100 text-red-800'
    };
    return colors[level];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Kanji Management</CardTitle>
            <Button onClick={handleAddNew} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Kanji
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search kanji, meaning, or readings..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={selectedLevel}
              onValueChange={(value: JlptLevel | 'all') => setSelectedLevel(value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
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
          </div>

          {/* Kanji table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Kanji</TableHead>
                  <TableHead>Meaning</TableHead>
                  <TableHead>Kun Reading</TableHead>
                  <TableHead>On Reading</TableHead>
                  <TableHead>Romaji</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKanji.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {isLoading ? 'Loading...' : 'No kanji found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredKanji.map((kanji: Kanji) => (
                    <TableRow key={kanji.id}>
                      <TableCell className="text-2xl font-light">{kanji.character}</TableCell>
                      <TableCell className="font-medium">{kanji.meaning}</TableCell>
                      <TableCell>{kanji.kun_reading || '—'}</TableCell>
                      <TableCell>{kanji.on_reading || '—'}</TableCell>
                      <TableCell>{kanji.romaji || '—'}</TableCell>
                      <TableCell>
                        <Badge className={getJlptBadgeColor(kanji.jlpt_level)}>
                          {kanji.jlpt_level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(kanji)}
                            disabled={isLoading}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(kanji.id)}
                            disabled={isLoading}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <KanjiForm
        kanji={editingKanji}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
