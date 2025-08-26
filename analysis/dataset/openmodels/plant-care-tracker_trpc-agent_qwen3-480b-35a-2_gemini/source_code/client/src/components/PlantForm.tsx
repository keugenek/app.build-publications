import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import type { CreatePlantInput } from '../../../server/src/schema';

interface PlantFormProps {
  onSubmit: (data: CreatePlantInput) => Promise<void>;
  isLoading?: boolean;
}

export function PlantForm({ onSubmit, isLoading = false }: PlantFormProps) {
  const [formData, setFormData] = useState<CreatePlantInput>({
    name: '',
    species: '',
    lastWatered: new Date(),
    lightExposure: 'low'
  });
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    // Reset form after successful submission
    setFormData({
      name: '',
      species: '',
      lastWatered: new Date(),
      lightExposure: 'low'
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-white shadow-sm">
      <h2 className="text-xl font-semibold">Add New Plant</h2>
      
      <div>
        <label className="block text-sm font-medium mb-1">Plant Name</label>
        <Input
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreatePlantInput) => ({ ...prev, name: e.target.value }))
          }
          placeholder="e.g., Fern, Cactus, etc."
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Species</label>
        <Input
          value={formData.species}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreatePlantInput) => ({ ...prev, species: e.target.value }))
          }
          placeholder="e.g., Ficus, Succulent, etc."
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Last Watered</label>
        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !formData.lastWatered && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.lastWatered ? format(formData.lastWatered, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={formData.lastWatered}
              onSelect={(date) => {
                setFormData((prev: CreatePlantInput) => ({ 
                  ...prev, 
                  lastWatered: date || new Date() 
                }));
                setDatePickerOpen(false);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Light Exposure</label>
        <Select 
          value={formData.lightExposure}
          onValueChange={(value: "low" | "medium" | "high") =>
            setFormData((prev: CreatePlantInput) => ({ ...prev, lightExposure: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select light exposure">
              {formData.lightExposure ? formData.lightExposure.charAt(0).toUpperCase() + formData.lightExposure.slice(1) + " Light" : "Select light exposure"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low Light</SelectItem>
            <SelectItem value="medium">Medium Light</SelectItem>
            <SelectItem value="high">High Light</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Adding...' : 'Add Plant'}
      </Button>
    </form>
  );
}
