import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Droplets, Sun, AlertTriangle, Heart } from 'lucide-react';
import type { PlantWithMood } from '../../../server/src/schema';

interface QuickActionsProps {
  plants: PlantWithMood[];
  onWaterPlant: (plantId: number) => Promise<void>;
  isLoading: boolean;
}

export function QuickActions({ plants, onWaterPlant, isLoading }: QuickActionsProps) {
  if (plants.length === 0) return null;

  // Get plants that need attention
  const thirstyPlants = plants.filter((plant: PlantWithMood) => 
    plant.mood === 'Thirsty' || plant.mood === 'Wilting'
  );

  const plantsNeedingSun = plants.filter((plant: PlantWithMood) => 
    plant.mood === 'Needs Sun' || plant.mood === 'Wilting'
  );

  const plantsNeedingCare = plants.filter((plant: PlantWithMood) => 
    plant.mood !== 'Happy'
  );

  if (plantsNeedingCare.length === 0) {
    return (
      <Card className="mb-6 border-green-200 bg-green-50">
        <CardContent className="p-6 text-center">
          <div className="text-4xl mb-2">🌟</div>
          <p className="text-green-700 font-medium text-lg">All your plants are happy!</p>
          <p className="text-green-600 text-sm">Keep up the excellent plant parenting! 👏</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-orange-800 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Quick Actions - Plants Need Attention! 🚨
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Thirsty plants */}
        {thirstyPlants.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">
                {thirstyPlants.length} plant{thirstyPlants.length > 1 ? 's' : ''} need water:
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {thirstyPlants.map((plant: PlantWithMood) => (
                <Badge
                  key={plant.id}
                  variant="secondary"
                  className="bg-blue-100 text-blue-800 border-blue-200"
                >
                  💧 {plant.name}
                </Badge>
              ))}
            </div>
            <Button
              onClick={() => {
                thirstyPlants.forEach((plant: PlantWithMood) => {
                  onWaterPlant(plant.id);
                });
              }}
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600 text-white mr-2"
              size="sm"
            >
              <Droplets className="h-4 w-4 mr-1" />
              Water All Thirsty Plants
            </Button>
          </div>
        )}

        {/* Plants needing sun */}
        {plantsNeedingSun.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sun className="h-4 w-4 text-yellow-600" />
              <span className="font-medium text-yellow-800">
                {plantsNeedingSun.length} plant{plantsNeedingSun.length > 1 ? 's' : ''} need more light:
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {plantsNeedingSun.map((plant: PlantWithMood) => (
                <Badge
                  key={plant.id}
                  variant="secondary"
                  className="bg-yellow-100 text-yellow-800 border-yellow-200"
                >
                  ☀️ {plant.name}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-yellow-700 bg-yellow-100 p-2 rounded">
              💡 Pro tip: Consider moving these plants to a brighter spot or closer to a window!
            </p>
          </div>
        )}

        {/* Overall care summary */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">
                {plantsNeedingCare.length} of {plants.length} plants need attention
              </span>
            </div>
            <Badge
              variant="secondary"
              className={
                plantsNeedingCare.length / plants.length > 0.5
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }
            >
              {Math.round((1 - plantsNeedingCare.length / plants.length) * 100)}% Happy
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
