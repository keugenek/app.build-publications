import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { WellnessEntry } from '../../../server/src/schema';

interface WellnessInsightsProps {
  entries: WellnessEntry[];
}

export function WellnessInsights({ entries }: WellnessInsightsProps) {
  if (entries.length === 0) {
    return null;
  }

  // Calculate average values
  const totalEntries = entries.length;
  const avgSleep = entries.reduce((sum, entry) => sum + entry.sleep_hours, 0) / totalEntries;
  const avgStress = entries.reduce((sum, entry) => sum + entry.stress_level, 0) / totalEntries;
  const avgCaffeine = entries.reduce((sum, entry) => sum + entry.caffeine_intake, 0) / totalEntries;
  const avgAlcohol = entries.reduce((sum, entry) => sum + entry.alcohol_intake, 0) / totalEntries;
  const avgWellness = entries.reduce((sum, entry) => sum + entry.wellness_score, 0) / totalEntries;

  // Find best and worst entries
  const bestEntry = [...entries].sort((a, b) => b.wellness_score - a.wellness_score)[0];
  const worstEntry = [...entries].sort((a, b) => a.wellness_score - b.wellness_score)[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wellness Insights</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-primary/5 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Average Values</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sleep:</span>
                <span>{avgSleep.toFixed(1)} hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stress:</span>
                <span>{avgStress.toFixed(1)}/10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Caffeine:</span>
                <span>{avgCaffeine.toFixed(1)} drinks</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Alcohol:</span>
                <span>{avgAlcohol.toFixed(1)} drinks</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-muted-foreground">Wellness Score:</span>
                <span className="font-medium">{avgWellness.toFixed(1)}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
              <h3 className="font-medium mb-2 text-green-700">Best Day</h3>
              <p className="text-sm">
                {bestEntry.date.toLocaleDateString()} with a score of{" "}
                <span className="font-bold">{bestEntry.wellness_score.toFixed(1)}</span>
              </p>
            </div>
            
            <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
              <h3 className="font-medium mb-2 text-red-700">Needs Improvement</h3>
              <p className="text-sm">
                {worstEntry.date.toLocaleDateString()} with a score of{" "}
                <span className="font-bold">{worstEntry.wellness_score.toFixed(1)}</span>
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
