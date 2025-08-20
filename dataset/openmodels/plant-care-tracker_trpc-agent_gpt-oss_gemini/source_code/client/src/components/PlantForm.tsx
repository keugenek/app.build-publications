import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useState } from 'react';
import type { CreatePlantInput, UpdatePlantInput, Plant } from '../../../server/src/schema';

interface PlantFormProps {
  onSubmit: (data: CreatePlantInput) => Promise<void>;
  isLoading?: boolean;
}

export function PlantForm({ onSubmit, isLoading = false }: PlantFormProps) {
  const [formData, setFormData] = useState<CreatePlantInput>({
    name: '',
    species: '',
    last_watered_at: undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    setFormData({ name: '', species: '', last_watered_at: undefined });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default">Add Plant</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Plant</DialogTitle>
          <DialogDescription>Enter plant details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <Input
            placeholder="Plant name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            required
          />
          <Input
            placeholder="Species"
            value={formData.species}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, species: e.target.value }))
            }
            required
          />
          <Input
            type="date"
            placeholder="Last watered (optional)"
            // HTML date input returns string, convert to Date or undefined on submit
            onChange={(e) => {
              const val = e.target.value;
              setFormData((prev) => ({
                ...prev,
                last_watered_at: val ? new Date(val) : undefined,
              }));
            }}
          />
          <DialogFooter>
            <Button type="submit" disabled={isLoading} variant="default">
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Edit form used inside a Dialog for updating a plant.
 */
interface PlantEditFormProps {
  plant: Plant;
  onSubmit: (data: UpdatePlantInput) => Promise<void>;
  isLoading?: boolean;
}

export function PlantEditForm({ plant, onSubmit, isLoading = false }: PlantEditFormProps) {
  const [formData, setFormData] = useState<UpdatePlantInput>({
    id: plant.id,
    name: plant.name,
    species: plant.species,
    last_watered_at: plant.last_watered_at,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Plant</DialogTitle>
          <DialogDescription>Update plant information.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <Input
            placeholder="Plant name"
            value={formData.name ?? ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          />
          <Input
            placeholder="Species"
            value={formData.species ?? ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, species: e.target.value }))}
          />
          <Input
            type="date"
            placeholder="Last watered"
            // Convert Date to YYYY-MM-DD for input value
            value={
              formData.last_watered_at
                ? new Date(formData.last_watered_at).toISOString().split('T')[0]
                : ''
            }
            onChange={(e) => {
              const val = e.target.value;
              setFormData((prev) => ({
                ...prev,
                last_watered_at: val ? new Date(val) : undefined,
              }));
            }}
          />
          <DialogFooter>
            <Button type="submit" disabled={isLoading} variant="default">
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
