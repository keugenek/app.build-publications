import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { WellnessEntry } from '../../../server/src/schema';

interface WellnessChartProps {
  entries: WellnessEntry[];
}

export function WellnessChart({ entries }: WellnessChartProps) {
  // Format data for the chart
  const chartData = entries
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(entry => ({
      date: new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      wellness_score: entry.wellness_score,
    }));

  // Find min and max scores for scaling
  const scores = chartData.map(d => d.wellness_score);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const scoreRange = maxScore - minScore || 1; // Avoid division by zero

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Wellness Trends</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="h-80 flex flex-col">
            <div className="flex-1 flex items-end justify-between gap-2 md:gap-4 pb-4">
              {chartData.map((data, index) => {
                // Calculate height percentage based on score (0-100)
                const heightPercent = ((data.wellness_score - minScore) / scoreRange) * 80 + 10;
                
                return (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div className="text-xs text-gray-500 mb-1">{data.date}</div>
                    <div 
                      className="w-full bg-indigo-500 rounded-t-md transition-all hover:bg-indigo-600"
                      style={{ height: `${heightPercent}%` }}
                    />
                    <div className="text-xs mt-1 font-medium">
                      {data.wellness_score.toFixed(0)}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-gray-200 pt-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Lower Score</span>
                <span>Higher Score</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center text-gray-500">
            Not enough data to display trends
          </div>
        )}
      </CardContent>
    </Card>
  );
}
