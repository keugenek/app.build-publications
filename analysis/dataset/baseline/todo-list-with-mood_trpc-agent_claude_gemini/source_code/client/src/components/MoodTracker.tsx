import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Heart, Meh } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { MoodEntry, CreateMoodEntryInput } from '../../../server/src/schema';

interface MoodTrackerProps {
  moodEntries: MoodEntry[];
  onMoodChange: () => Promise<void>;
  showHistory?: boolean;
}

const MOOD_CONFIG = {
  1: { emoji: '😢', label: 'Very Bad', color: 'bg-red-500', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  2: { emoji: '😔', label: 'Bad', color: 'bg-orange-500', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  3: { emoji: '😐', label: 'Neutral', color: 'bg-yellow-500', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
  4: { emoji: '😊', label: 'Good', color: 'bg-green-500', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  5: { emoji: '😃', label: 'Very Good', color: 'bg-blue-500', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
} as const;

export function MoodTracker({ moodEntries, onMoodChange, showHistory = false }: MoodTrackerProps) {
  const [isLogging, setIsLogging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateMoodEntryInput>({
    mood_rating: 3,
    note: null,
    date: new Date().toISOString().split('T')[0],
  });

  // Get today's mood entry
  const today = new Date().toISOString().split('T')[0];
  const todayEntry = moodEntries.find((entry: MoodEntry) => 
    entry.date.toISOString().split('T')[0] === today
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await trpc.createMoodEntry.mutate(formData);
      setFormData({
        mood_rating: 3,
        note: null,
        date: new Date().toISOString().split('T')[0],
      });
      setIsLogging(false);
      await onMoodChange();
    } catch (error) {
      console.error('Failed to create mood entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showHistory) {
    return (
      <div className="space-y-4">
        {moodEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Heart className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No mood entries yet. Start tracking your mood! 💭</p>
          </div>
        ) : (
          <div className="space-y-3">
            {moodEntries.map((entry: MoodEntry) => (
              <MoodEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Today's Mood Status */}
      {todayEntry ? (
        <div className="text-center">
          <div className={`inline-flex items-center gap-3 px-6 py-4 rounded-lg ${MOOD_CONFIG[todayEntry.mood_rating as keyof typeof MOOD_CONFIG].bgColor} ${MOOD_CONFIG[todayEntry.mood_rating as keyof typeof MOOD_CONFIG].borderColor} border-2`}>
            <div className="text-3xl">
              {MOOD_CONFIG[todayEntry.mood_rating as keyof typeof MOOD_CONFIG].emoji}
            </div>
            <div>
              <p className="font-medium text-gray-900">Today's Mood</p>
              <p className="text-sm text-gray-600">
                {MOOD_CONFIG[todayEntry.mood_rating as keyof typeof MOOD_CONFIG].label}
              </p>
            </div>
          </div>
          {todayEntry.note && (
            <p className="mt-3 text-sm text-gray-600 italic">
              "{todayEntry.note}"
            </p>
          )}
          <p className="mt-2 text-xs text-gray-500">
            Logged at {todayEntry.created_at.toLocaleTimeString()}
          </p>
        </div>
      ) : (
        <div className="text-center">
          <div className="inline-flex items-center gap-3 px-6 py-4 rounded-lg bg-gray-50 border-2 border-gray-200">
            <Meh className="w-8 h-8 text-gray-400" />
            <div>
              <p className="font-medium text-gray-700">No mood logged today</p>
              <p className="text-sm text-gray-500">How are you feeling?</p>
            </div>
          </div>
        </div>
      )}

      {/* Log Mood Form */}
      {!todayEntry && (
        <>
          {isLogging ? (
            <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 rounded-lg border">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  How are you feeling today?
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(MOOD_CONFIG).map(([rating, config]) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() =>
                        setFormData((prev: CreateMoodEntryInput) => ({
                          ...prev,
                          mood_rating: parseInt(rating)
                        }))
                      }
                      className={`p-4 rounded-lg border-2 transition-all text-center ${
                        formData.mood_rating === parseInt(rating)
                          ? `${config.bgColor} ${config.borderColor} ${config.color} text-white`
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="text-2xl mb-1">{config.emoji}</div>
                      <div className={`text-xs font-medium ${
                        formData.mood_rating === parseInt(rating) ? 'text-white' : 'text-gray-600'
                      }`}>
                        {config.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                placeholder="Add a note about your day (optional)"
                value={formData.note || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateMoodEntryInput) => ({
                    ...prev,
                    note: e.target.value || null
                  }))
                }
                className="bg-white"
                rows={3}
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Mood'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsLogging(false);
                    setFormData({
                      mood_rating: 3,
                      note: null,
                      date: new Date().toISOString().split('T')[0],
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button
              onClick={() => setIsLogging(true)}
              className="w-full"
              variant="outline"
            >
              <Heart className="w-4 h-4 mr-2" />
              Log Today's Mood
            </Button>
          )}
        </>
      )}

      {/* Recent Mood Entries */}
      {moodEntries.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-gray-700 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Recent Entries
          </h3>
          <div className="space-y-2">
            {moodEntries.slice(0, 3).map((entry: MoodEntry) => (
              <MoodEntryCard key={entry.id} entry={entry} compact />
            ))}
          </div>
          {moodEntries.length > 3 && (
            <p className="text-xs text-gray-500 text-center">
              View all entries in the History tab
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface MoodEntryCardProps {
  entry: MoodEntry;
  compact?: boolean;
}

function MoodEntryCard({ entry, compact = false }: MoodEntryCardProps) {
  const config = MOOD_CONFIG[entry.mood_rating as keyof typeof MOOD_CONFIG];
  
  return (
    <Card className={`${config.bgColor} ${config.borderColor} border transition-all hover:shadow-sm`}>
      <CardContent className={compact ? "p-3" : "p-4"}>
        <div className="flex items-start gap-3">
          <div className={compact ? "text-xl" : "text-2xl"}>
            {config.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className={`${config.color} text-white text-xs`}>
                {config.label}
              </Badge>
              <span className="text-sm text-gray-600">
                {entry.date.toLocaleDateString()}
              </span>
            </div>
            {entry.note && (
              <p className={`text-gray-700 ${compact ? 'text-sm' : ''} ${compact ? 'line-clamp-2' : ''}`}>
                "{entry.note}"
              </p>
            )}
            {!compact && (
              <p className="mt-2 text-xs text-gray-500">
                Logged: {entry.created_at.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
