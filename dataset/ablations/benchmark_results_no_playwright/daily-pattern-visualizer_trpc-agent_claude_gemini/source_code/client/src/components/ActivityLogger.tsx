import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { trpc } from '@/utils/trpc';
import type { CreateActivityLogInput, ActivityLog } from '../../../server/src/schema';

interface ActivityLoggerProps {
  userId: string;
  onLogCreated: (log: ActivityLog) => void;
}

export function ActivityLogger({ userId, onLogCreated }: ActivityLoggerProps) {
  const [formData, setFormData] = useState<CreateActivityLogInput>({
    user_id: userId,
    date: new Date(),
    sleep_hours: 8,
    work_hours: 8,
    social_hours: 2,
    screen_hours: 6,
    emotional_energy: 5,
    notes: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [recentLogs, setRecentLogs] = useState<ActivityLog[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newLog = await trpc.createActivityLog.mutate(formData);
      setRecentLogs((prev: ActivityLog[]) => [newLog, ...prev.slice(0, 4)]); // Keep only 5 recent logs
      onLogCreated(newLog);
      
      // Reset form for next entry
      setFormData((prev: CreateActivityLogInput) => ({
        ...prev,
        date: new Date(),
        notes: null
      }));
    } catch (error) {
      console.error('Failed to create activity log:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getEnergyEmoji = (energy: number): string => {
    if (energy <= 2) return '😴';
    if (energy <= 4) return '😐';
    if (energy <= 6) return '🙂';
    if (energy <= 8) return '😊';
    return '🚀';
  };

  const getEnergyLabel = (energy: number): string => {
    if (energy <= 2) return 'Very Low';
    if (energy <= 4) return 'Low';
    if (energy <= 6) return 'Moderate';
    if (energy <= 8) return 'High';
    return 'Excellent';
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium">
              📅 Date
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date.toISOString().split('T')[0]}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateActivityLogInput) => ({
                  ...prev,
                  date: new Date(e.target.value)
                }))
              }
              required
              className="w-full"
            />
          </div>

          {/* Sleep Hours */}
          <div className="space-y-2">
            <Label htmlFor="sleep" className="text-sm font-medium">
              😴 Sleep Hours: {formData.sleep_hours}h
            </Label>
            <Slider
              id="sleep"
              min={0}
              max={24}
              step={0.5}
              value={[formData.sleep_hours]}
              onValueChange={([value]: number[]) =>
                setFormData((prev: CreateActivityLogInput) => ({
                  ...prev,
                  sleep_hours: value
                }))
              }
              className="w-full"
            />
          </div>

          {/* Work Hours */}
          <div className="space-y-2">
            <Label htmlFor="work" className="text-sm font-medium">
              💼 Work Hours: {formData.work_hours}h
            </Label>
            <Slider
              id="work"
              min={0}
              max={24}
              step={0.5}
              value={[formData.work_hours]}
              onValueChange={([value]: number[]) =>
                setFormData((prev: CreateActivityLogInput) => ({
                  ...prev,
                  work_hours: value
                }))
              }
              className="w-full"
            />
          </div>

          {/* Social Hours */}
          <div className="space-y-2">
            <Label htmlFor="social" className="text-sm font-medium">
              👥 Social Hours: {formData.social_hours}h
            </Label>
            <Slider
              id="social"
              min={0}
              max={24}
              step={0.5}
              value={[formData.social_hours]}
              onValueChange={([value]: number[]) =>
                setFormData((prev: CreateActivityLogInput) => ({
                  ...prev,
                  social_hours: value
                }))
              }
              className="w-full"
            />
          </div>

          {/* Screen Hours */}
          <div className="space-y-2">
            <Label htmlFor="screen" className="text-sm font-medium">
              📱 Screen Hours: {formData.screen_hours}h
            </Label>
            <Slider
              id="screen"
              min={0}
              max={24}
              step={0.5}
              value={[formData.screen_hours]}
              onValueChange={([value]: number[]) =>
                setFormData((prev: CreateActivityLogInput) => ({
                  ...prev,
                  screen_hours: value
                }))
              }
              className="w-full"
            />
          </div>

          {/* Emotional Energy */}
          <div className="space-y-2">
            <Label htmlFor="energy" className="text-sm font-medium">
              {getEnergyEmoji(formData.emotional_energy)} Emotional Energy: {formData.emotional_energy} ({getEnergyLabel(formData.emotional_energy)})
            </Label>
            <Slider
              id="energy"
              min={1}
              max={10}
              step={1}
              value={[formData.emotional_energy]}
              onValueChange={([value]: number[]) =>
                setFormData((prev: CreateActivityLogInput) => ({
                  ...prev,
                  emotional_energy: value
                }))
              }
              className="w-full"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-medium">
            📝 Notes (Optional)
          </Label>
          <Textarea
            id="notes"
            placeholder="How was your day? Any observations about your activities or energy levels..."
            value={formData.notes || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setFormData((prev: CreateActivityLogInput) => ({
                ...prev,
                notes: e.target.value || null
              }))
            }
            className="min-h-[80px]"
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            '✅ Log Today\'s Activities'
          )}
        </Button>
      </form>

      {/* Recent Logs */}
      {recentLogs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Recent Logs</h3>
          <div className="grid gap-3">
            {recentLogs.map((log: ActivityLog) => (
              <Card key={log.id} className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-green-800">
                      {log.date.toLocaleDateString()}
                    </span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Energy: {getEnergyEmoji(log.emotional_energy)} {log.emotional_energy}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-sm text-green-700">
                    <span>😴 {log.sleep_hours}h</span>
                    <span>💼 {log.work_hours}h</span>
                    <span>👥 {log.social_hours}h</span>
                    <span>📱 {log.screen_hours}h</span>
                  </div>
                  {log.notes && (
                    <p className="text-sm text-green-600 mt-2 italic">"{log.notes}"</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
