import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import type { WellnessTrend } from '../../../server/src/schema';

export function WellnessTrendsChart() {
  const [trends, setTrends] = useState<WellnessTrend[]>([]);

  useEffect(() => {
    const loadTrends = async () => {
      try {
        const result = await trpc.getWellnessTrends.query();
        setTrends(result);
      } catch (error) {
        console.error('Failed to load trends:', error);
      }
    };

    loadTrends();
  }, []);

  if (trends.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wellness Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Not enough data to show trends. Add more entries!
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get min and max wellness scores for scaling
  const scores = trends.map(t => t.wellness_score);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const scoreRange = maxScore - minScore || 1; // Avoid division by zero

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wellness Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-end justify-between pt-4 pb-8 px-2 border-b border-l">
          {trends.slice(0, 14).reverse().map((trend, index) => {
            // Calculate bar height based on wellness score
            const heightPercentage = ((trend.wellness_score - minScore) / scoreRange) * 80 + 10;
            
            // Determine bar color based on wellness score
            let barColor = 'bg-blue-500';
            if (trend.wellness_score >= 70) {
              barColor = 'bg-green-500';
            } else if (trend.wellness_score >= 40) {
              barColor = 'bg-yellow-500';
            } else {
              barColor = 'bg-red-500';
            }
            
            return (
              <div key={index} className="flex flex-col items-center flex-1 px-1">
                <div 
                  className={`w-full rounded-t ${barColor} transition-all duration-300 ease-in-out hover:opacity-80 hover:scale-105`}
                  style={{ height: `${heightPercentage}%` }}
                />
                <div className="text-xs mt-2 text-center text-muted-foreground">
                  {trend.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div className="text-xs font-medium">
                  {trend.wellness_score.toFixed(0)}
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-center text-sm text-muted-foreground mt-4">
          Wellness score trend over the last {Math.min(14, trends.length)} days
        </div>
      </CardContent>
    </Card>
  );
}
