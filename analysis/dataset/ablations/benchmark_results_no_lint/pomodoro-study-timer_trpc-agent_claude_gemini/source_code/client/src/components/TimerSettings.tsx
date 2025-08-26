import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Save, Volume2, VolumeX } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { TimerSettings as TimerSettingsType, UpdateTimerSettingsInput } from '../../../server/src/schema';

interface TimerSettingsProps {
  settings: TimerSettingsType;
  onSettingsUpdate: () => void;
}

export function TimerSettings({ settings, onSettingsUpdate }: TimerSettingsProps) {
  const [formData, setFormData] = useState<UpdateTimerSettingsInput>({
    work_duration_minutes: settings.work_duration_minutes,
    break_duration_minutes: settings.break_duration_minutes,
    audio_enabled: settings.audio_enabled
  });
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage('');
    
    try {
      await trpc.updateTimerSettings.mutate(formData);
      setSuccessMessage('Settings saved successfully! ✅');
      onSettingsUpdate();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to update settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = 
    formData.work_duration_minutes !== settings.work_duration_minutes ||
    formData.break_duration_minutes !== settings.break_duration_minutes ||
    formData.audio_enabled !== settings.audio_enabled;

  return (
    <Card className="bg-white/80 backdrop-blur-sm shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          ⚙️ Timer Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="work-duration" className="text-sm font-medium">
                  🍅 Work Duration (minutes)
                </Label>
                <Input
                  id="work-duration"
                  type="number"
                  min="1"
                  max="90"
                  value={formData.work_duration_minutes || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: UpdateTimerSettingsInput) => ({
                      ...prev,
                      work_duration_minutes: parseInt(e.target.value) || 25
                    }))
                  }
                  className="text-center"
                  required
                />
                <p className="text-xs text-gray-500">
                  Recommended: 25 minutes (classic Pomodoro)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="break-duration" className="text-sm font-medium">
                  ☕ Break Duration (minutes)
                </Label>
                <Input
                  id="break-duration"
                  type="number"
                  min="1"
                  max="30"
                  value={formData.break_duration_minutes || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: UpdateTimerSettingsInput) => ({
                      ...prev,
                      break_duration_minutes: parseInt(e.target.value) || 5
                    }))
                  }
                  className="text-center"
                  required
                />
                <p className="text-xs text-gray-500">
                  Recommended: 5 minutes (short break)
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="audio-enabled" className="text-sm font-medium flex items-center gap-2">
                  {formData.audio_enabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  Audio Notifications
                </Label>
                <p className="text-xs text-gray-500">
                  Play sounds when timer starts and completes
                </p>
              </div>
              <Switch
                id="audio-enabled"
                checked={formData.audio_enabled || false}
                onCheckedChange={(checked: boolean) =>
                  setFormData((prev: UpdateTimerSettingsInput) => ({
                    ...prev,
                    audio_enabled: checked
                  }))
                }
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {successMessage && (
              <div className="text-sm text-green-600 text-center font-medium">
                {successMessage}
              </div>
            )}
            
            <Button
              type="submit"
              disabled={!hasChanges || isLoading}
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center space-y-1">
            <p><strong>💡 Pomodoro Tips:</strong></p>
            <p>• Work sessions: 25-50 minutes for deep focus</p>
            <p>• Short breaks: 5-15 minutes to recharge</p>
            <p>• Take a longer break (15-30 min) every 4 sessions</p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
