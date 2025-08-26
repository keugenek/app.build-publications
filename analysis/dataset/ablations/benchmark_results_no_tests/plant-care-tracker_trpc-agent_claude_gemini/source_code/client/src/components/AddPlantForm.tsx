import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import type { CreatePlantInput } from '../../../server/src/schema';

interface AddPlantFormProps {
  onSubmit: (data: CreatePlantInput) => Promise<void>;
  isCreating?: boolean;
}

export function AddPlantForm({ onSubmit, isCreating = false }: AddPlantFormProps) {
  const [formData, setFormData] = useState<CreatePlantInput>({
    name: '',
    last_watered: new Date()
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    await onSubmit(formData);
    
    // Reset form after successful submission
    setFormData({
      name: '',
      last_watered: new Date()
    });
  };

  return (
    <Card className="mb-8 border-green-200 shadow-plant">
      <CardHeader className="bg-green-50">
        <CardTitle className="flex items-center gap-2 text-green-800">
          <Plus className="h-5 w-5" />
          Add New Plant
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="plantName" className="block text-sm font-medium text-gray-700 mb-2">
              Plant Name
            </label>
            <Input
              id="plantName"
              placeholder="e.g., Sunny the Sunflower 🌻"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreatePlantInput) => ({ ...prev, name: e.target.value }))
              }
              required
              className="border-green-300 focus:border-green-500 plant-input"
            />
          </div>
          <div>
            <label htmlFor="lastWatered" className="block text-sm font-medium text-gray-700 mb-2">
              Last Watered
            </label>
            <Input
              id="lastWatered"
              type="date"
              value={formData.last_watered.toISOString().split('T')[0]}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreatePlantInput) => ({ 
                  ...prev, 
                  last_watered: new Date(e.target.value) 
                }))
              }
              className="border-green-300 focus:border-green-500 plant-input"
            />
          </div>
          <Button 
            type="submit" 
            disabled={isCreating || !formData.name.trim()}
            className="bg-green-600 hover:bg-green-700 text-white btn-ripple"
          >
            {isCreating ? 'Adding...' : 'Add Plant'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
