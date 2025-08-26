import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, SunIcon, DropletsIcon } from 'lucide-react';
import { format } from 'date-fns';
import type { PlantWithMood } from '../../../server/src/schema';

interface PlantCardProps {
  plant: PlantWithMood;
  onWater: (id: number) => void;
  isUpdating?: boolean;
}

export function PlantCard({ plant, onWater, isUpdating = false }: PlantCardProps) {
  // Get mood-based color for badge
  const getMoodColor = (mood: string) => {
    if (mood.includes('Happy') || mood.includes('content')) return 'bg-green-100 text-green-800';
    if (mood.includes('Thirsty') || mood.includes('Dry')) return 'bg-blue-100 text-blue-800';
    if (mood.includes('Needs Sun') || mood.includes('Dark')) return 'bg-yellow-100 text-yellow-800';
    if (mood.includes('Stressed') || mood.includes('Unhappy')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{plant.name}</CardTitle>
          <Badge className={getMoodColor(plant.mood)}>
            {plant.mood}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{plant.species}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center text-sm">
          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>Last watered: {format(plant.lastWatered, 'MMM d, yyyy')}</span>
        </div>
        
        <div className="flex items-center text-sm">
          <SunIcon className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>Light: {plant.lightExposure}</span>
        </div>
        
        <div className="flex items-center text-sm">
          <DropletsIcon className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>Added: {format(plant.createdAt, 'MMM d, yyyy')}</span>
        </div>
        
        <Button 
          onClick={() => onWater(plant.id)} 
          variant="outline" 
          size="sm" 
          className="w-full"
          disabled={isUpdating}
        >
          {isUpdating ? 'Watering...' : 'Water Plant'}
        </Button>
      </CardContent>
    </Card>
  );
}
