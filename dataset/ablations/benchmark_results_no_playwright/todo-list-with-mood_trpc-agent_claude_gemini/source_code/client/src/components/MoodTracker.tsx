import { useState, useEffect } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Heart, AlertCircle } from 'lucide-react';
import type { MoodEntry, CreateMoodEntryInput, UpdateMoodEntryInput } from '../../../server/src/schema';

interface MoodTrackerProps {
  date: string; // YYYY-MM-DD format
  currentMoodEntry: MoodEntry | null;
  onMoodChange: () => void;
}

const moodEmojis = ['😢', '😕', '😐', '😊', '😁'];
const moodLabels = ['Very Bad', 'Bad', 'Okay', 'Good', 'Very Good'];

export function MoodTracker({ date, currentMoodEntry, onMoodChange }: MoodTrackerProps) {
  const [selectedMood, setSelectedMood] = useState<number>(3); // Default to "Okay"
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with current mood entry data
  useEffect(() => {
    if (currentMoodEntry) {
      setSelectedMood(currentMoodEntry.mood_score);
      setNote(currentMoodEntry.note || '');
    } else {
      setSelectedMood(3);
      setNote('');
    }
  }, [currentMoodEntry]);

  const handleSaveMood = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (currentMoodEntry) {
        // Update existing mood entry
        const updateData: UpdateMoodEntryInput = {
          id: currentMoodEntry.id,
          mood_score: selectedMood,
          note: note.trim() || null
        };
        await trpc.updateMoodEntry.mutate(updateData);
      } else {
        // Create new mood entry
        const createData: CreateMoodEntryInput = {
          date,
          mood_score: selectedMood,
          note: note.trim() || null
        };
        await trpc.createMoodEntry.mutate(createData);
      }
      onMoodChange();
    } catch (err) {
      console.error('Failed to save mood:', err);
      setError('Failed to save mood entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMood = async () => {
    if (!currentMoodEntry) return;
    if (!confirm('Are you sure you want to delete this mood entry?')) return;

    setError(null);
    try {
      await trpc.deleteMoodEntry.mutate({ id: currentMoodEntry.id });
      setSelectedMood(3);
      setNote('');
      onMoodChange();
    } catch (err) {
      console.error('Failed to delete mood:', err);
      setError('Failed to delete mood entry. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Mood Scale */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
          <Heart className="h-5 w-5 mr-2 text-pink-500" />
          How are you feeling today?
        </h3>
        
        <div className="grid grid-cols-5 gap-2 mb-4">
          {moodEmojis.map((emoji, index) => {
            const moodValue = index + 1;
            const isSelected = selectedMood === moodValue;
            
            return (
              <button
                key={moodValue}
                onClick={() => setSelectedMood(moodValue)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-pink-400 bg-pink-50 scale-110'
                    : 'border-gray-200 bg-white hover:border-pink-200 hover:bg-pink-25'
                }`}
                type="button"
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{emoji}</div>
                  <div className={`text-sm font-medium ${
                    isSelected ? 'text-pink-700' : 'text-gray-600'
                  }`}>
                    {moodLabels[index]}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Selected: <span className="font-semibold text-pink-600">
              {moodEmojis[selectedMood - 1]} {moodLabels[selectedMood - 1]}
            </span>
          </p>
        </div>
      </div>

      {/* Note Section */}
      <div>
        <label htmlFor="mood-note" className="block text-sm font-medium text-gray-700 mb-2">
          What's on your mind? (optional)
        </label>
        <Textarea
          id="mood-note"
          placeholder="Tell us more about how you're feeling today..."
          value={note}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
          rows={3}
          className="resize-none"
          disabled={isSubmitting}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleSaveMood}
          disabled={isSubmitting}
          className="flex-1 bg-pink-500 hover:bg-pink-600"
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Saving...
            </div>
          ) : (
            currentMoodEntry ? 'Update Mood' : 'Save Mood'
          )}
        </Button>
        
        {currentMoodEntry && (
          <Button
            onClick={handleDeleteMood}
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Delete
          </Button>
        )}
      </div>

      {/* Current Entry Info */}
      {currentMoodEntry && (
        <Card className="p-4 bg-pink-50 border-pink-200">
          <div className="text-sm text-pink-800">
            <p className="font-medium">Current mood entry saved</p>
            <p>
              Last updated: {new Date(currentMoodEntry.updated_at).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
