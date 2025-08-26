import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Leaf, Heart, Droplets } from 'lucide-react';
import type { PlantWithMood, PlantMood } from '../../../server/src/schema';

interface PlantStatsProps {
  plants: PlantWithMood[];
}

export function PlantStats({ plants }: PlantStatsProps) {
  if (plants.length === 0) return null;

  const getMoodCounts = () => {
    const moodCounts: Record<PlantMood, number> = {
      'Happy': 0,
      'Thirsty': 0,
      'Needs Sun': 0,
      'Wilting': 0
    };

    plants.forEach((plant: PlantWithMood) => {
      moodCounts[plant.mood]++;
    });

    return moodCounts;
  };

  const getHealthScore = (): number => {
    const moodCounts = getMoodCounts();
    const totalPlants = plants.length;
    const happyPlants = moodCounts.Happy;
    return Math.round((happyPlants / totalPlants) * 100);
  };

  const getMostCommonType = (): string => {
    const typeCounts: Record<string, number> = {};
    plants.forEach((plant: PlantWithMood) => {
      typeCounts[plant.type] = (typeCounts[plant.type] || 0) + 1;
    });

    let mostCommon = '';
    let maxCount = 0;
    Object.entries(typeCounts).forEach(([type, count]) => {
      if (count > maxCount) {
        mostCommon = type;
        maxCount = count;
      }
    });

    return mostCommon;
  };

  const getAverageWateringDays = (): number => {
    const now = new Date();
    const totalDays = plants.reduce((sum: number, plant: PlantWithMood) => {
      const daysSince = Math.floor((now.getTime() - plant.last_watered_date.getTime()) / (1000 * 60 * 60 * 24));
      return sum + daysSince;
    }, 0);

    return Math.round(totalDays / plants.length);
  };

  const moodCounts = getMoodCounts();
  const healthScore = getHealthScore();
  const mostCommonType = getMostCommonType();
  const avgWateringDays = getAverageWateringDays();

  const getHealthScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getHealthMessage = (score: number): string => {
    if (score === 100) return "Perfect! All your plants are thriving! 🌟";
    if (score >= 80) return "Excellent plant parent! 👏";
    if (score >= 60) return "Good job, but some plants need attention 🌱";
    if (score >= 40) return "Time to give your plants some love! 💚";
    return "Your plants need urgent care! 🆘";
  };

  return (
    <div className="mb-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {/* Total Plants */}
        <Card className="text-center p-4 border-green-200">
          <div className="text-2xl font-bold text-green-600">{plants.length}</div>
          <div className="text-sm text-green-700 flex items-center justify-center gap-1">
            <Leaf className="h-3 w-3" />
            Total Plants
          </div>
        </Card>

        {/* Health Score */}
        <Card className={`text-center p-4 border-green-200 ${getHealthScoreColor(healthScore)}`}>
          <div className="text-2xl font-bold">{healthScore}%</div>
          <div className="text-sm flex items-center justify-center gap-1">
            <Heart className="h-3 w-3" />
            Health Score
          </div>
        </Card>

        {/* Most Common Type */}
        <Card className="text-center p-4 border-green-200">
          <div className="text-lg font-bold text-green-600 truncate">{mostCommonType}</div>
          <div className="text-sm text-green-700">Favorite Type</div>
        </Card>

        {/* Average Watering */}
        <Card className="text-center p-4 border-green-200">
          <div className="text-2xl font-bold text-blue-600">{avgWateringDays}</div>
          <div className="text-sm text-blue-700 flex items-center justify-center gap-1">
            <Droplets className="h-3 w-3" />
            Avg Days Since Water
          </div>
        </Card>
      </div>

      {/* Health Message */}
      <Card className={`mb-4 border-green-200 ${getHealthScoreColor(healthScore)}`}>
        <CardContent className="text-center p-4">
          <p className="font-medium">{getHealthMessage(healthScore)}</p>
        </CardContent>
      </Card>

      {/* Mood Distribution */}
      <Card className="border-green-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-green-800 text-lg flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Plant Moods Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center">
              <Badge className="bg-green-100 text-green-800 border-green-200 mb-2 text-lg px-3 py-1">
                😊 {moodCounts.Happy}
              </Badge>
              <div className="text-xs text-green-700">Happy</div>
            </div>
            <div className="text-center">
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 mb-2 text-lg px-3 py-1">
                😅 {moodCounts.Thirsty}
              </Badge>
              <div className="text-xs text-blue-700">Thirsty</div>
            </div>
            <div className="text-center">
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 mb-2 text-lg px-3 py-1">
                😴 {moodCounts['Needs Sun']}
              </Badge>
              <div className="text-xs text-yellow-700">Needs Sun</div>
            </div>
            <div className="text-center">
              <Badge className="bg-red-100 text-red-800 border-red-200 mb-2 text-lg px-3 py-1">
                😵 {moodCounts.Wilting}
              </Badge>
              <div className="text-xs text-red-700">Wilting</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
