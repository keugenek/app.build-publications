import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { BehaviorType, CreateCatActivityInput, ActivityWithBehaviorType } from '../../../server/src/schema';

interface ActivityLoggerProps {
  behaviorTypes: BehaviorType[];
  onActivityAdded: (activity: ActivityWithBehaviorType) => void;
}

export function ActivityLogger({ behaviorTypes, onActivityAdded }: ActivityLoggerProps) {
  const [formData, setFormData] = useState<CreateCatActivityInput>({
    behavior_type_id: 0,
    description: '',
    cat_name: null,
    activity_date: new Date()
  });
  const [isLoading, setIsLoading] = useState(false);

  const selectedBehaviorType = behaviorTypes.find(bt => bt.id === formData.behavior_type_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.behavior_type_id === 0) {
      alert('Please select a behavior type');
      return;
    }

    setIsLoading(true);
    try {
      const newActivity = await trpc.createCatActivity.mutate(formData);
      
      // Transform the response to include behavior type info
      const activityWithBehaviorType: ActivityWithBehaviorType = {
        ...newActivity,
        behavior_type: selectedBehaviorType!
      };
      
      onActivityAdded(activityWithBehaviorType);
      
      // Reset form
      setFormData({
        behavior_type_id: 0,
        description: '',
        cat_name: null,
        activity_date: new Date()
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
      alert('Failed to log activity. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTimeLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <Card className="border-2 border-purple-200 shadow-lg activity-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🚨 Report Suspicious Activity
        </CardTitle>
        <CardDescription>
          Document your cat's latest scheme for world domination
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="behavior-type">Behavior Type *</Label>
            <Select
              value={formData.behavior_type_id.toString()}
              onValueChange={(value: string) =>
                setFormData((prev: CreateCatActivityInput) => ({
                  ...prev,
                  behavior_type_id: parseInt(value)
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select the type of suspicious behavior" />
              </SelectTrigger>
              <SelectContent>
                {behaviorTypes.map((behaviorType: BehaviorType) => (
                  <SelectItem key={behaviorType.id} value={behaviorType.id.toString()}>
                    <div className="flex items-center gap-2">
                      <span>{behaviorType.name}</span>
                      <Badge variant="secondary">
                        Threat: {behaviorType.conspiracy_score}/10
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedBehaviorType && (
              <div className="flex items-center gap-2">
                <Badge 
                  className={`${
                    selectedBehaviorType.conspiracy_score >= 8 
                      ? 'bg-red-500' 
                      : selectedBehaviorType.conspiracy_score >= 5 
                      ? 'bg-yellow-500' 
                      : 'bg-green-500'
                  } text-white`}
                >
                  Conspiracy Score: {selectedBehaviorType.conspiracy_score}/10
                </Badge>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Incident Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the suspicious behavior in detail... What exactly did your cat do? How long did it last? Any witnesses?"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev: CreateCatActivityInput) => ({
                  ...prev,
                  description: e.target.value
                }))
              }
              className="min-h-[100px]"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Cat Name (optional)</Label>
              <Input
                id="cat-name"
                placeholder="e.g., Whiskers, Mr. Fluffington"
                value={formData.cat_name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateCatActivityInput) => ({
                    ...prev,
                    cat_name: e.target.value || null
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity-date">Date & Time *</Label>
              <Input
                id="activity-date"
                type="datetime-local"
                value={formatDateTimeLocal(formData.activity_date)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateCatActivityInput) => ({
                    ...prev,
                    activity_date: new Date(e.target.value)
                  }))
                }
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading || behaviorTypes.length === 0}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            size="lg"
          >
            {isLoading ? '🕵️‍♂️ Documenting Evidence...' : '📝 Log Suspicious Activity'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
