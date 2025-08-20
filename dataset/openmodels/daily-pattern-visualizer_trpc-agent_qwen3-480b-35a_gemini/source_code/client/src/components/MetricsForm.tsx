import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CreateDailyMetricsInput, DailyMetrics, UpdateDailyMetricsInput } from '../../../server/src/schema';
import { trpc } from '@/utils/trpc';

interface MetricsFormProps {
  onMetricsSaved: () => void;
  editingMetrics?: DailyMetrics | null;
  onCancelEdit?: () => void;
}

export function MetricsForm({ onMetricsSaved, editingMetrics, onCancelEdit }: MetricsFormProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [sleepDuration, setSleepDuration] = useState<number>(8);
  const [workHours, setWorkHours] = useState<number>(8);
  const [socialTime, setSocialTime] = useState<number>(2);
  const [screenTime, setScreenTime] = useState<number>(6);
  const [emotionalEnergy, setEmotionalEnergy] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when editing metrics changes
  useEffect(() => {
    if (editingMetrics) {
      setDate(new Date(editingMetrics.date));
      setSleepDuration(editingMetrics.sleep_duration);
      setWorkHours(editingMetrics.work_hours);
      setSocialTime(editingMetrics.social_time);
      setScreenTime(editingMetrics.screen_time);
      setEmotionalEnergy(editingMetrics.emotional_energy);
    } else {
      // Reset to defaults when not editing
      setDate(new Date());
      setSleepDuration(8);
      setWorkHours(8);
      setSocialTime(2);
      setScreenTime(6);
      setEmotionalEnergy(5);
    }
  }, [editingMetrics]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const metricsData: CreateDailyMetricsInput = {
        date,
        sleep_duration: sleepDuration,
        work_hours: workHours,
        social_time: socialTime,
        screen_time: screenTime,
        emotional_energy: emotionalEnergy
      };

      if (editingMetrics) {
        // Update existing metrics
        const updateData: UpdateDailyMetricsInput = {
          id: editingMetrics.id,
          ...metricsData
        };
        await trpc.updateDailyMetrics.mutate(updateData);
      } else {
        // Create new metrics
        await trpc.createDailyMetrics.mutate(metricsData);
      }
      
      onMetricsSaved();
      
      // Reset form after successful submission (only for create mode)
      if (!editingMetrics) {
        setDate(new Date());
        setSleepDuration(8);
        setWorkHours(8);
        setSocialTime(2);
        setScreenTime(6);
        setEmotionalEnergy(5);
      }
    } catch (error) {
      console.error('Failed to save metrics:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {editingMetrics ? 'Edit Daily Metrics' : 'Log Daily Metrics'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sleep">Sleep Duration: {sleepDuration} hours</Label>
            <Slider
              id="sleep"
              min={0}
              max={16}
              step={0.5}
              value={[sleepDuration]}
              onValueChange={([value]) => setSleepDuration(value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="work">Work Hours: {workHours} hours</Label>
            <Slider
              id="work"
              min={0}
              max={16}
              step={0.5}
              value={[workHours]}
              onValueChange={([value]) => setWorkHours(value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="social">Social Time: {socialTime} hours</Label>
            <Slider
              id="social"
              min={0}
              max={16}
              step={0.5}
              value={[socialTime]}
              onValueChange={([value]) => setSocialTime(value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="screen">Screen Time: {screenTime} hours</Label>
            <Slider
              id="screen"
              min={0}
              max={16}
              step={0.5}
              value={[screenTime]}
              onValueChange={([value]) => setScreenTime(value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="energy">
              Emotional Energy: {emotionalEnergy}/10
            </Label>
            <div className="flex items-center space-x-2">
              <span className="text-sm">Low</span>
              <Slider
                id="energy"
                min={1}
                max={10}
                step={1}
                value={[emotionalEnergy]}
                onValueChange={([value]) => setEmotionalEnergy(value)}
              />
              <span className="text-sm">High</span>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (editingMetrics ? 'Update Metrics' : 'Save Metrics')}
            </Button>
            {editingMetrics && (
              <Button type="button" variant="outline" onClick={onCancelEdit}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
