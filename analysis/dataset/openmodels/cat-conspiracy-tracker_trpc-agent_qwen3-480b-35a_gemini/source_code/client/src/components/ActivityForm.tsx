import { useState } from 'react';
import { CreateSuspiciousActivityInput, SuspiciousActivityType } from '../../../server/src/schema';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Eye, Gift, Volume2, Zap } from 'lucide-react';

interface ActivityFormProps {
  onSubmit: (data: CreateSuspiciousActivityInput) => void;
  isLoading?: boolean;
}

const activityTypeOptions = [
  { value: 'PROLONGED_STARE', label: 'Prolonged Stare', icon: <Eye className="w-4 h-4" /> },
  { value: 'GIFT_BRINGING', label: 'Gift Bringing', icon: <Gift className="w-4 h-4" /> },
  { value: 'SUDDEN_PURRING', label: 'Sudden Purring', icon: <Volume2 className="w-4 h-4" /> },
  { value: 'AGGRESSIVE_KNEADING', label: 'Aggressive Kneading', icon: <AlertTriangle className="w-4 h-4" /> },
  { value: 'MIDDLE_OF_NIGHT_ZOOMIES', label: 'Midnight Zoomies', icon: <Zap className="w-4 h-4" /> },
  { value: 'ATTACKING_INVISIBLE_ENEMIES', label: 'Attacking Invisible Enemies', icon: <AlertTriangle className="w-4 h-4" /> },
  { value: 'SITTING_IN_FRONT_OF_MONITOR', label: 'Blocking Monitor', icon: <Eye className="w-4 h-4" /> },
  { value: 'KNOCKING_THINGS_OFF_COUNTERS', label: 'Counter Surfing', icon: <AlertTriangle className="w-4 h-4" /> },
  { value: 'HIDING_AND_POUNCE', label: 'Ambush Pounce', icon: <AlertTriangle className="w-4 h-4" /> },
  { value: 'CONSTANT_OBSERVATION', label: 'Constant Observation', icon: <Eye className="w-4 h-4" /> }
];

export function ActivityForm({ onSubmit, isLoading = false }: ActivityFormProps) {
  const [formData, setFormData] = useState<CreateSuspiciousActivityInput>({
    description: '',
    activity_type: 'PROLONGED_STARE',
    conspiracy_points: 10
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block">Activity Type</label>
        <Select 
          value={formData.activity_type} 
          onValueChange={(value: SuspiciousActivityType) => 
            setFormData(prev => ({ ...prev, activity_type: value }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {activityTypeOptions.map(({ value, label, icon }) => (
              <SelectItem key={value} value={value}>
                <div className="flex items-center gap-2">
                  {icon}
                  {label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">Description</label>
        <Textarea
          placeholder="Describe the suspicious behavior in detail..."
          value={formData.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData(prev => ({ ...prev, description: e.target.value }))
          }
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">
          Conspiracy Points: {formData.conspiracy_points}
        </label>
        <input
          type="range"
          min="1"
          max="100"
          value={formData.conspiracy_points}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData(prev => ({ ...prev, conspiracy_points: parseInt(e.target.value) }))
          }
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Innocent</span>
          <span>Extremely Suspicious</span>
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Recording...' : 'Record Suspicious Activity'}
      </Button>
    </form>
  );
}
