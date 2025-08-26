import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Droplets } from 'lucide-react';
import type { PlantWithMood } from '../../../server/src/schema';

interface PlantCardProps {
  plant: PlantWithMood;
  onWater: (plantId: number) => void;
}

export function PlantCard({ plant, onWater }: PlantCardProps) {
  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Calculate days since last watered
  const getDaysSinceWatered = (lastWatered: Date): number => {
    const now = new Date();
    return Math.floor((now.getTime() - lastWatered.getTime()) / (1000 * 60 * 60 * 24));
  };

  const daysSince = getDaysSinceWatered(plant.last_watered);

  return (
    <Card 
      className={`border-2 plant-card shadow-plant hover:shadow-plant-lg ${
        plant.mood === 'Happy' 
          ? 'border-green-300 gradient-green' 
          : 'border-amber-300 gradient-amber'
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg text-gray-800">{plant.name}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Added {formatDate(plant.created_at)}
            </p>
          </div>
          <Badge 
            variant="secondary"
            className={`mood-badge ${
              plant.mood === 'Happy' 
                ? 'bg-green-100 text-green-800 border-green-300' 
                : 'bg-amber-100 text-amber-800 border-amber-300'
            }`}
          >
            {plant.mood === 'Happy' ? '😊 Happy' : '😢 Thirsty'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Last watered: {formatDate(plant.last_watered)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Droplets className="h-4 w-4" />
            <span>
              {daysSince === 0 
                ? 'Watered today' 
                : daysSince === 1 
                ? '1 day ago' 
                : `${daysSince} days ago`
              }
            </span>
          </div>
          <div className="pt-2">
            <Button
              onClick={() => onWater(plant.id)}
              size="sm"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white btn-ripple"
            >
              <Droplets className="h-4 w-4 mr-2" />
              Water Now
            </Button>
            {daysSince > 3 && (
              <p className="text-xs text-amber-600 mt-2 text-center">
                💧 This plant needs water soon!
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
