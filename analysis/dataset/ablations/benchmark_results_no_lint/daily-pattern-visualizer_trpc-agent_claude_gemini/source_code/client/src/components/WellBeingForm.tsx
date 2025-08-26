import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Moon, Briefcase, Users, Monitor, Zap, Save } from 'lucide-react';
// Using built-in date formatting instead of date-fns for simplicity
import { trpc } from '@/utils/trpc';
import type { CreateWellBeingEntryInput, WellBeingEntry } from '../../../server/src/schema';

interface WellBeingFormProps {
  onSuccess: (entry: WellBeingEntry) => void;
  isLoading: boolean;
}

export function WellBeingForm({ onSuccess, isLoading }: WellBeingFormProps) {
  const [formData, setFormData] = useState<CreateWellBeingEntryInput>({
    date: new Date(),
    sleep_hours: 8,
    work_hours: 8,
    social_time_hours: 2,
    screen_time_hours: 4,
    emotional_energy_level: 7
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const result = await trpc.createWellBeingEntry.mutate(formData);
      onSuccess(result);
      
      // Reset form to today's date with default values
      setFormData({
        date: new Date(),
        sleep_hours: 8,
        work_hours: 8,
        social_time_hours: 2,
        screen_time_hours: 4,
        emotional_energy_level: 7
      });
    } catch (error) {
      console.error('Failed to create entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formFields = [
    {
      id: 'sleep_hours',
      label: 'Sleep Hours',
      icon: Moon,
      value: formData.sleep_hours,
      max: 24,
      step: 0.5,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'How many hours did you sleep?'
    },
    {
      id: 'work_hours',
      label: 'Work Hours',
      icon: Briefcase,
      value: formData.work_hours,
      max: 24,
      step: 0.5,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'How many hours did you work?'
    },
    {
      id: 'social_time_hours',
      label: 'Social Time Hours',
      icon: Users,
      value: formData.social_time_hours,
      max: 24,
      step: 0.5,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'How many hours did you spend socializing?'
    },
    {
      id: 'screen_time_hours',
      label: 'Screen Time Hours',
      icon: Monitor,
      value: formData.screen_time_hours,
      max: 24,
      step: 0.5,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'How many hours of screen time?'
    }
  ];

  return (
    <Card className="max-w-4xl mx-auto bg-white/70 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Save className="h-6 w-6 text-blue-600" />
          Log Your Well-being Data
        </CardTitle>
        <CardDescription>
          Record your daily metrics to track patterns and improve your well-being 📊
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Picker */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium">Date</Label>
            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal bg-white/50"
                  type="button"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white" align="start">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={(date: Date | undefined) => {
                    if (date) {
                      setFormData((prev: CreateWellBeingEntryInput) => ({ ...prev, date }));
                      setShowDatePicker(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time-based Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formFields.map((field) => (
              <div key={field.id} className={`p-4 rounded-lg ${field.bgColor} border`}>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <field.icon className={`h-5 w-5 ${field.color}`} />
                    <Label htmlFor={field.id} className="font-medium">
                      {field.label}
                    </Label>
                  </div>
                  <p className="text-sm text-gray-600">{field.description}</p>
                  
                  <div className="flex items-center gap-4">
                    <Input
                      id={field.id}
                      type="number"
                      min="0"
                      max={field.max}
                      step={field.step}
                      value={field.value}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = parseFloat(e.target.value) || 0;
                        setFormData((prev: CreateWellBeingEntryInput) => ({ 
                          ...prev, 
                          [field.id]: Math.min(Math.max(0, value), field.max)
                        }));
                      }}
                      className="w-20 bg-white/70"
                    />
                    <div className="flex-1">
                      <Slider
                        value={[field.value]}
                        onValueChange={(values: number[]) => {
                          setFormData((prev: CreateWellBeingEntryInput) => ({ 
                            ...prev, 
                            [field.id]: values[0] 
                          }));
                        }}
                        max={field.max}
                        step={field.step}
                        className="flex-1"
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-12">
                      {field.value}h
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Energy Level */}
          <div className="p-4 rounded-lg bg-purple-50 border">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-600" />
                <Label htmlFor="emotional_energy_level" className="font-medium">
                  Emotional Energy Level
                </Label>
              </div>
              <p className="text-sm text-gray-600">
                How would you rate your overall emotional energy today? (1 = Very Low, 10 = Very High)
              </p>
              
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500 w-8">1</span>
                <div className="flex-1">
                  <Slider
                    value={[formData.emotional_energy_level]}
                    onValueChange={(values: number[]) => {
                      setFormData((prev: CreateWellBeingEntryInput) => ({ 
                        ...prev, 
                        emotional_energy_level: values[0] 
                      }));
                    }}
                    min={1}
                    max={10}
                    step={1}
                    className="flex-1"
                  />
                </div>
                <span className="text-sm text-gray-500 w-8">10</span>
                <div className="flex items-center gap-2 bg-white/70 px-3 py-1 rounded-full">
                  <Zap className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-purple-600">
                    {formData.emotional_energy_level}/10
                  </span>
                </div>
              </div>
              
              {/* Energy level indicators */}
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>😴 Very Low</span>
                <span>😐 Moderate</span>
                <span>⚡ Very High</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="px-8 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Entry
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Quick Tips */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
          <h3 className="font-medium text-gray-800 mb-2">💡 Quick Tips:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Aim for 7-9 hours of sleep per night for optimal well-being</li>
            <li>• Balance work hours with adequate breaks and social time</li>
            <li>• Try to limit screen time, especially before bedtime</li>
            <li>• Regular social interaction boosts emotional energy</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
