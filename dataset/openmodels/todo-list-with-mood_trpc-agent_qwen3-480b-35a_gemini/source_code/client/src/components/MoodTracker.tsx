import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Plus } from 'lucide-react';
import { cn } from './utils';
import { trpc } from '@/utils/trpc';
import type { MoodEntry, CreateMoodEntryInput, UpdateMoodEntryInput } from '../../../server/src/schema';

const MOOD_LEVELS = [
  { value: 1, label: '😢 Awful', color: 'bg-red-500' },
  { value: 2, label: '😞 Bad', color: 'bg-orange-500' },
  { value: 3, label: '😐 Okay', color: 'bg-yellow-500' },
  { value: 4, label: '🙂 Good', color: 'bg-lime-500' },
  { value: 5, label: '😄 Great', color: 'bg-green-500' },
  { value: 6, label: '😊 Excellent', color: 'bg-emerald-500' },
  { value: 7, label: '🤩 Amazing', color: 'bg-teal-500' },
  { value: 8, label: '😍 Fantastic', color: 'bg-cyan-500' },
  { value: 9, label: '🌟 Wonderful', color: 'bg-blue-500' },
  { value: 10, label: '🎉 Incredible', color: 'bg-purple-500' },
];

export function MoodTracker() {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MoodEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [moodLevel, setMoodLevel] = useState<number>(5);
  const [notes, setNotes] = useState('');

  const loadMoodEntries = useCallback(async () => {
    try {
      const result = await trpc.getMoodEntries.query();
      setMoodEntries(result);
    } catch (error) {
      console.error('Failed to load mood entries:', error);
    }
  }, []);

  useEffect(() => {
    loadMoodEntries();
  }, [loadMoodEntries]);

  const handleCreateMoodEntry = async () => {
    if (!selectedDate) return;
    
    try {
      const input: CreateMoodEntryInput = {
        date: selectedDate,
        mood_level: moodLevel,
        notes: notes || null
      };
      
      const newEntry = await trpc.createMoodEntry.mutate(input);
      setMoodEntries(prev => [...prev, newEntry]);
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create mood entry:', error);
    }
  };

  const handleUpdateMoodEntry = async () => {
    if (!editingEntry) return;
    
    try {
      const input: UpdateMoodEntryInput = {
        id: editingEntry.id,
        mood_level: moodLevel,
        notes: notes || null
      };
      
      const updatedEntry = await trpc.updateMoodEntry.mutate(input);
      setMoodEntries(prev => prev.map(entry => entry.id === updatedEntry.id ? updatedEntry : entry));
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to update mood entry:', error);
    }
  };

  const handleDeleteMoodEntry = async (id: number) => {
    try {
      await trpc.deleteMoodEntry.mutate({ id });
      setMoodEntries(prev => prev.filter(entry => entry.id !== id));
    } catch (error) {
      console.error('Failed to delete mood entry:', error);
    }
  };

  const resetForm = () => {
    setSelectedDate(new Date());
    setMoodLevel(5);
    setNotes('');
    setEditingEntry(null);
  };

  const openEditDialog = (entry: MoodEntry) => {
    setEditingEntry(entry);
    setSelectedDate(new Date(entry.date));
    setMoodLevel(entry.mood_level);
    setNotes(entry.notes || '');
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Sort entries by date (newest first)
  const sortedEntries = [...moodEntries].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Mood Tracker</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Log Mood
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingEntry ? 'Edit Mood Entry' : 'Log Your Mood'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>Mood Level</Label>
                <div className="grid grid-cols-5 gap-2">
                  {MOOD_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setMoodLevel(level.value)}
                      className={cn(
                        "p-2 rounded-lg flex flex-col items-center justify-center transition-all",
                        moodLevel === level.value 
                          ? "ring-2 ring-offset-2 ring-blue-500 scale-105" 
                          : "hover:bg-gray-100 dark:hover:bg-gray-800",
                        "focus:outline-none"
                      )}
                    >
                      <div className={`w-8 h-8 rounded-full ${level.color} mb-1`} />
                      <span className="text-xs font-medium">{level.value}</span>
                    </button>
                  ))}
                </div>
                <div className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">
                  {MOOD_LEVELS.find(l => l.value === moodLevel)?.label}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How was your day? What affected your mood?"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={editingEntry ? handleUpdateMoodEntry : handleCreateMoodEntry}>
                {editingEntry ? 'Update' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {sortedEntries.length > 0 ? (
        <div className="grid gap-4">
          {sortedEntries.map((entry) => {
            const moodInfo = MOOD_LEVELS.find(l => l.value === entry.mood_level);
            return (
              <Card key={entry.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full ${moodInfo?.color} flex items-center justify-center`}>
                      <span className="text-white font-bold text-lg">{entry.mood_level}</span>
                    </div>
                    <div>
                      <div className="font-medium">
                        {format(new Date(entry.date), "MMMM d, yyyy")}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {moodInfo?.label}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(entry)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteMoodEntry(entry.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                {entry.notes && (
                  <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                    <p className="text-sm">{entry.notes}</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No mood entries yet. Log your first mood!</p>
        </div>
      )}
    </div>
  );
}
