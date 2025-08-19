import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { DailyLog, CreateDailyLogInput, UpdateDailyLogInput } from '../../../server/src/schema';

interface DailyLogFormProps {
  existingLog: DailyLog | null;
  onSubmit: () => Promise<void>;
  isLoading: boolean;
}

export function DailyLogForm({ existingLog, onSubmit, isLoading }: DailyLogFormProps) {
  const [formData, setFormData] = useState<Omit<CreateDailyLogInput, 'date'>>({
    sleep_duration: 0,
    work_hours: 0,
    social_time: 0,
    screen_time: 0,
    emotional_energy: 5
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingLog) {
      setFormData({
        sleep_duration: existingLog.sleep_duration,
        work_hours: existingLog.work_hours,
        social_time: existingLog.social_time,
        screen_time: existingLog.screen_time,
        emotional_energy: existingLog.emotional_energy
      });
    }
  }, [existingLog]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      if (existingLog) {
        // Update existing log
        const updateData: UpdateDailyLogInput = {
          id: existingLog.id,
          ...formData
        };
        await trpc.updateDailyLog.mutate(updateData);
      } else {
        // Create new log
        const createData: CreateDailyLogInput = {
          date: today,
          ...formData
        };
        await trpc.createDailyLog.mutate(createData);
      }
      
      await onSubmit(); // Refresh parent data
    } catch (error) {
      console.error('Failed to save daily log:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEnergyEmoji = (energy: number) => {
    if (energy <= 2) return '😴';
    if (energy <= 4) return '😔';
    if (energy <= 6) return '😐';
    if (energy <= 8) return '😊';
    return '🌟';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sleep Duration */}
        <Card className="border-2 border-blue-100 hover:border-blue-200 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              😴 Sleep Duration
            </CardTitle>
            <CardDescription>Hours of sleep last night</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={formData.sleep_duration}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData(prev => ({ ...prev, sleep_duration: parseFloat(e.target.value) || 0 }))
                  }
                  className="w-24 text-center font-semibold"
                />
                <span className="text-sm text-gray-600">hours</span>
              </div>
              <Slider
                value={[formData.sleep_duration]}
                onValueChange={([value]: number[]) =>
                  setFormData(prev => ({ ...prev, sleep_duration: value }))
                }
                max={24}
                step={0.5}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Work Hours */}
        <Card className="border-2 border-green-100 hover:border-green-200 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              💼 Work Hours
            </CardTitle>
            <CardDescription>Hours spent working today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={formData.work_hours}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData(prev => ({ ...prev, work_hours: parseFloat(e.target.value) || 0 }))
                  }
                  className="w-24 text-center font-semibold"
                />
                <span className="text-sm text-gray-600">hours</span>
              </div>
              <Slider
                value={[formData.work_hours]}
                onValueChange={([value]: number[]) =>
                  setFormData(prev => ({ ...prev, work_hours: value }))
                }
                max={24}
                step={0.5}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Time */}
        <Card className="border-2 border-purple-100 hover:border-purple-200 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              👥 Social Time
            </CardTitle>
            <CardDescription>Hours spent with others</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={formData.social_time}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData(prev => ({ ...prev, social_time: parseFloat(e.target.value) || 0 }))
                  }
                  className="w-24 text-center font-semibold"
                />
                <span className="text-sm text-gray-600">hours</span>
              </div>
              <Slider
                value={[formData.social_time]}
                onValueChange={([value]: number[]) =>
                  setFormData(prev => ({ ...prev, social_time: value }))
                }
                max={24}
                step={0.5}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Screen Time */}
        <Card className="border-2 border-orange-100 hover:border-orange-200 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              📱 Screen Time
            </CardTitle>
            <CardDescription>Hours spent on devices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={formData.screen_time}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData(prev => ({ ...prev, screen_time: parseFloat(e.target.value) || 0 }))
                  }
                  className="w-24 text-center font-semibold"
                />
                <span className="text-sm text-gray-600">hours</span>
              </div>
              <Slider
                value={[formData.screen_time]}
                onValueChange={([value]: number[]) =>
                  setFormData(prev => ({ ...prev, screen_time: value }))
                }
                max={24}
                step={0.5}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Emotional Energy */}
      <Card className="border-2 border-yellow-100 hover:border-yellow-200 transition-colors">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {getEnergyEmoji(formData.emotional_energy)} Emotional Energy
          </CardTitle>
          <CardDescription>
            How are you feeling today? (1 = Very Low, 10 = Very High)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-gray-600">Very Low</Label>
              <div className="text-2xl font-bold text-center flex-1">
                {formData.emotional_energy} {getEnergyEmoji(formData.emotional_energy)}
              </div>
              <Label className="text-sm text-gray-600">Very High</Label>
            </div>
            <Slider
              value={[formData.emotional_energy]}
              onValueChange={([value]: number[]) =>
                setFormData(prev => ({ ...prev, emotional_energy: value }))
              }
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 px-1">
              {Array.from({ length: 10 }, (_, i) => (
                <span key={i + 1}>{i + 1}</span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center pt-4">
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="px-8 py-3 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
        >
          {isSubmitting ? '💾 Saving...' : existingLog ? '✅ Update Log' : '💾 Save Log'}
        </Button>
      </div>
    </form>
  );
}
