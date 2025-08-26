import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { WellnessEntry, CreateWellnessEntryInput } from '../../../server/src/schema';

interface WellnessFormProps {
  userId: string;
  onSuccess: (entry: WellnessEntry) => void;
  existingEntry?: WellnessEntry;
}

export function WellnessForm({ userId, onSuccess, existingEntry }: WellnessFormProps) {
  const [formData, setFormData] = useState<Omit<CreateWellnessEntryInput, 'user_id'>>({
    date: new Date(),
    sleep_hours: 8,
    stress_level: 5,
    caffeine_intake: 0,
    alcohol_intake: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [predictedScore, setPredictedScore] = useState<number | null>(null);

  // Update form data when existing entry is provided
  useEffect(() => {
    if (existingEntry) {
      setFormData({
        date: new Date(existingEntry.date),
        sleep_hours: existingEntry.sleep_hours,
        stress_level: existingEntry.stress_level,
        caffeine_intake: existingEntry.caffeine_intake,
        alcohol_intake: existingEntry.alcohol_intake
      });
      setPredictedScore(existingEntry.wellness_score);
    }
  }, [existingEntry]);

  // Calculate predicted wellness score
  useEffect(() => {
    const calculatePredictedScore = () => {
      // Same algorithm as in the server handler
      const sleepScore = Math.max(0, 100 - Math.abs(8 - formData.sleep_hours) * 10);
      const stressScore = (11 - formData.stress_level) * 10;
      const caffeineScore = Math.max(0, 100 - Math.max(0, formData.caffeine_intake - 200) * 0.1);
      const alcoholScore = Math.max(0, 100 - formData.alcohol_intake * 20);
      const totalScore = (sleepScore * 0.3 + stressScore * 0.3 + caffeineScore * 0.2 + alcoholScore * 0.2);
      return Math.round(Math.min(100, Math.max(0, totalScore)));
    };

    setPredictedScore(calculatePredictedScore());
  }, [formData.sleep_hours, formData.stress_level, formData.caffeine_intake, formData.alcohol_intake]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const entry = await trpc.createWellnessEntry.mutate({
        user_id: userId,
        ...formData
      });
      
      onSuccess(entry);
      
      // Reset form if this wasn't updating an existing entry
      if (!existingEntry) {
        setFormData({
          date: new Date(),
          sleep_hours: 8,
          stress_level: 5,
          caffeine_intake: 0,
          alcohol_intake: 0
        });
      }
    } catch (error) {
      console.error('Failed to save wellness entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getStressEmoji = (level: number): string => {
    if (level <= 2) return '😌';
    if (level <= 4) return '🙂';
    if (level <= 6) return '😐';
    if (level <= 8) return '😰';
    return '😫';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Predicted Score */}
      {predictedScore !== null && (
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2">
          <div className="text-center">
            <Label className="text-sm font-medium text-gray-600 mb-2 block">
              Predicted Wellness Score
            </Label>
            <Badge className={`text-xl font-bold py-2 px-4 ${getScoreColor(predictedScore)}`}>
              {predictedScore}/100
            </Badge>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Sleep Hours */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            😴 Sleep Hours
            <span className="text-blue-600 font-semibold">{formData.sleep_hours}h</span>
          </Label>
          <Slider
            value={[formData.sleep_hours]}
            onValueChange={([value]: number[]) =>
              setFormData((prev) => ({ ...prev, sleep_hours: value }))
            }
            max={12}
            min={0}
            step={0.5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0h</span>
            <span className="text-green-600">7-9h (optimal)</span>
            <span>12h</span>
          </div>
        </div>

        {/* Stress Level */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            {getStressEmoji(formData.stress_level)} Stress Level
            <span className="text-blue-600 font-semibold">{formData.stress_level}/10</span>
          </Label>
          <Slider
            value={[formData.stress_level]}
            onValueChange={([value]: number[]) =>
              setFormData((prev) => ({ ...prev, stress_level: value }))
            }
            max={10}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>😌 Low (1)</span>
            <span>😐 Medium (5)</span>
            <span>😫 High (10)</span>
          </div>
        </div>

        {/* Caffeine Intake */}
        <div className="space-y-3">
          <Label htmlFor="caffeine" className="text-sm font-medium flex items-center gap-2">
            ☕ Caffeine Intake (mg)
          </Label>
          <Input
            id="caffeine"
            type="number"
            value={formData.caffeine_intake}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev) => ({ ...prev, caffeine_intake: parseFloat(e.target.value) || 0 }))
            }
            min={0}
            step={25}
            placeholder="0"
            className="w-full"
          />
          <div className="text-xs text-gray-500">
            <div>☕ Cup of coffee: ~95mg</div>
            <div>🫖 Cup of tea: ~25mg</div>
            <div>🥤 Energy drink: ~80mg</div>
          </div>
        </div>

        {/* Alcohol Intake */}
        <div className="space-y-3">
          <Label htmlFor="alcohol" className="text-sm font-medium flex items-center gap-2">
            🍷 Alcohol Intake (standard drinks)
          </Label>
          <Input
            id="alcohol"
            type="number"
            value={formData.alcohol_intake}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev) => ({ ...prev, alcohol_intake: parseFloat(e.target.value) || 0 }))
            }
            min={0}
            step={0.5}
            placeholder="0"
            className="w-full"
          />
          <div className="text-xs text-gray-500">
            <div>🍺 Beer (12oz): 1 drink</div>
            <div>🍷 Wine (5oz): 1 drink</div>
            <div>🥃 Spirits (1.5oz): 1 drink</div>
          </div>
        </div>
      </div>

      {/* Date Field */}
      <div className="space-y-3">
        <Label htmlFor="date" className="text-sm font-medium flex items-center gap-2">
          📅 Date
        </Label>
        <Input
          id="date"
          type="date"
          value={formData.date.toISOString().split('T')[0]}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({ ...prev, date: new Date(e.target.value) }))
          }
          max={new Date().toISOString().split('T')[0]}
          className="w-full md:w-auto"
        />
      </div>

      <Button 
        type="submit" 
        disabled={isLoading} 
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
      >
        {isLoading ? 'Saving...' : existingEntry ? 'Update Entry' : 'Log Wellness Entry'}
      </Button>
    </form>
  );
}
