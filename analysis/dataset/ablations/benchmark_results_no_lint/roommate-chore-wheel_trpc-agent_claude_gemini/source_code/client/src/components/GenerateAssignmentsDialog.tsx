import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { GenerateWeeklyAssignmentsInput } from '../../../server/src/schema';

interface GenerateAssignmentsDialogProps {
  onAssignmentsGenerated: () => void;
}

export function GenerateAssignmentsDialog({ onAssignmentsGenerated }: GenerateAssignmentsDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [assignedPeople, setAssignedPeople] = useState<string[]>([]);
  const [newPersonName, setNewPersonName] = useState('');

  // Calculate the start of current week (Monday)
  const getCurrentWeekStart = (): Date => {
    const today = new Date();
    const currentDay = today.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // If Sunday, go back 6 days
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const [weekStart, setWeekStart] = useState(getCurrentWeekStart());

  const addPerson = () => {
    const trimmedName = newPersonName.trim();
    if (trimmedName && !assignedPeople.includes(trimmedName)) {
      setAssignedPeople((prev: string[]) => [...prev, trimmedName]);
      setNewPersonName('');
    }
  };

  const removePerson = (personToRemove: string) => {
    setAssignedPeople((prev: string[]) => prev.filter((person: string) => person !== personToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const input: GenerateWeeklyAssignmentsInput = {
        week_start: weekStart,
        assigned_people: assignedPeople.length > 0 ? assignedPeople : undefined
      };
      await trpc.generateWeeklyAssignments.mutate(input);
      onAssignmentsGenerated();
      setOpen(false);
    } catch (error) {
      console.error('Failed to generate assignments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const handleDateChange = (dateString: string) => {
    const date = new Date(dateString);
    setWeekStart(date);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 hover:bg-purple-700">
          🎲 Generate Assignments
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">🎲</span>
              Generate Weekly Assignments
            </DialogTitle>
            <DialogDescription>
              Randomly assign chores to people for the selected week. Leave people list empty to create unassigned chores.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="week-start">Week Start Date</Label>
              <Input
                id="week-start"
                type="date"
                value={formatDateForInput(weekStart)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDateChange(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500">
                Typically set to Monday of the target week
              </p>
            </div>

            <div className="space-y-3">
              <Label>Assigned People (optional)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter person's name"
                  value={newPersonName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPersonName(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addPerson();
                    }
                  }}
                />
                <Button type="button" onClick={addPerson} disabled={!newPersonName.trim()}>
                  Add
                </Button>
              </div>
              {assignedPeople.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {assignedPeople.map((person: string) => (
                    <Badge
                      key={person}
                      variant="secondary"
                      className="cursor-pointer hover:bg-red-100"
                      onClick={() => removePerson(person)}
                    >
                      {person} ✕
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500">
                {assignedPeople.length === 0
                  ? 'No people added - chores will be created unassigned'
                  : `Chores will be randomly distributed among ${assignedPeople.length} people`
                }
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? 'Generating...' : '🎲 Generate Assignments'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
