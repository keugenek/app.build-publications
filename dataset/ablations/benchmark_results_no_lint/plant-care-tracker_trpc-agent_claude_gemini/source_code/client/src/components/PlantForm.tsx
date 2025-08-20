import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CreatePlantInput, UpdatePlantInput, SunlightExposure } from '../../../server/src/schema';

interface PlantFormProps {
  mode: 'create' | 'edit';
  formData: CreatePlantInput | Partial<UpdatePlantInput>;
  onFormChange: (data: CreatePlantInput | Partial<UpdatePlantInput>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function PlantForm({ 
  mode, 
  formData, 
  onFormChange, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: PlantFormProps) {
  const isEdit = mode === 'edit';
  const data = formData as any; // Type assertion for easier access

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${mode}-plant-name`}>Plant Name</Label>
        <Input
          id={`${mode}-plant-name`}
          placeholder={isEdit ? undefined : "e.g., Sunny the Sunflower"}
          value={data.name || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onFormChange({ ...formData, name: e.target.value })
          }
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor={`${mode}-last-watered`}>Last Watered</Label>
        <Input
          id={`${mode}-last-watered`}
          type="date"
          value={data.last_watered?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onFormChange({ ...formData, last_watered: new Date(e.target.value) })
          }
          required={!isEdit}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${mode}-sunlight`}>Sunlight Exposure</Label>
        <Select
          value={data.sunlight_exposure || 'Medium'}
          onValueChange={(value: SunlightExposure) =>
            onFormChange({ ...formData, sunlight_exposure: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select sunlight level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Low">🌙 Low</SelectItem>
            <SelectItem value="Medium">⛅ Medium</SelectItem>
            <SelectItem value="High">☀️ High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className={isEdit ? "flex gap-2" : ""}>
        {isEdit && onCancel && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={isLoading} 
          className={`${isEdit ? 'flex-1' : 'w-full'} bg-green-600 hover:bg-green-700`}
        >
          {isLoading 
            ? (isEdit ? 'Saving...' : 'Adding Plant...') 
            : (isEdit ? '💾 Save Changes' : '🌱 Add Plant')
          }
        </Button>
      </div>
    </form>
  );
}
