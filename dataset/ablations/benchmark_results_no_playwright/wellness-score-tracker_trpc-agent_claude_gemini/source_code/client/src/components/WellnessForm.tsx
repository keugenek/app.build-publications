import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import type { CreateWellnessEntryInput, WellnessEntry } from '../../../server/src/schema';

interface WellnessFormProps {
  onSubmit: (data: CreateWellnessEntryInput) => Promise<WellnessEntry>;
  isLoading?: boolean;
  userId: number;
}

export function WellnessForm({ onSubmit, isLoading = false, userId }: WellnessFormProps) {
  const [formData, setFormData] = useState<CreateWellnessEntryInput>({
    user_id: userId,
    date: new Date(),
    hours_of_sleep: 8,
    stress_level: 5,
    caffeine_intake: 100,
    alcohol_intake: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    // Reset form to today's defaults
    setFormData({
      user_id: userId,
      date: new Date(),
      hours_of_sleep: 8,
      stress_level: 5,
      caffeine_intake: 100,
      alcohol_intake: 0
    });
  };

  return (
    <Card className="shadow-lg wellness-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 wellness-card-title">
          🗓️ Log Today's Wellness Data
        </CardTitle>
        <CardDescription>
          Enter your daily wellness metrics to calculate your wellness score
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium">📅 Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date.toISOString().split('T')[0]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateWellnessEntryInput) => ({
                    ...prev,
                    date: new Date(e.target.value)
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sleep" className="text-sm font-medium">😴 Hours of Sleep</Label>
              <Input
                id="sleep"
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={formData.hours_of_sleep}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateWellnessEntryInput) => ({
                    ...prev,
                    hours_of_sleep: parseFloat(e.target.value) || 0
                  }))
                }
                placeholder="e.g., 7.5"
                required
              />
              <p className="text-xs text-gray-500">Optimal: 7-9 hours</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stress" className="text-sm font-medium">😰 Stress Level (1-10)</Label>
              <Input
                id="stress"
                type="number"
                min="1"
                max="10"
                value={formData.stress_level}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateWellnessEntryInput) => ({
                    ...prev,
                    stress_level: parseInt(e.target.value) || 1
                  }))
                }
                placeholder="1 = very calm, 10 = very stressed"
                required
              />
              <p className="text-xs text-gray-500">1 = very calm, 10 = very stressed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="caffeine" className="text-sm font-medium">☕ Caffeine Intake (mg)</Label>
              <Input
                id="caffeine"
                type="number"
                min="0"
                value={formData.caffeine_intake}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateWellnessEntryInput) => ({
                    ...prev,
                    caffeine_intake: parseFloat(e.target.value) || 0
                  }))
                }
                placeholder="e.g., 200"
                required
              />
              <p className="text-xs text-gray-500">1 cup coffee ≈ 95mg, 1 energy drink ≈ 80mg</p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="alcohol" className="text-sm font-medium">🍷 Alcohol Intake (drinks)</Label>
              <Input
                id="alcohol"
                type="number"
                min="0"
                step="0.5"
                value={formData.alcohol_intake}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateWellnessEntryInput) => ({
                    ...prev,
                    alcohol_intake: parseFloat(e.target.value) || 0
                  }))
                }
                placeholder="e.g., 1.5"
                required
              />
              <p className="text-xs text-gray-500">1 drink = 12oz beer, 5oz wine, or 1.5oz spirits</p>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSubmit} 
          disabled={isLoading} 
          className="w-full wellness-button bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
        >
          {isLoading ? '⏳ Calculating...' : '✨ Calculate Wellness Score'}
        </Button>
      </CardFooter>
    </Card>
  );
}
