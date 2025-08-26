import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { WellnessTrend } from '../../../server/src/schema';

interface WellnessTrendsProps {
  trends: WellnessTrend[];
  isLoading?: boolean;
}

export function WellnessTrends({ trends, isLoading = false }: WellnessTrendsProps) {
  if (isLoading) {
    return (
      <Card className="shadow-lg wellness-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📈 Wellness Trends
          </CardTitle>
          <CardDescription>
            Analyze patterns in your wellness data over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="loading-pulse text-4xl mb-4">⏳</div>
            <p className="text-lg text-gray-600">Loading trends...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (trends.length === 0) {
    return (
      <Card className="shadow-lg wellness-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📈 Wellness Trends
          </CardTitle>
          <CardDescription>
            Analyze patterns in your wellness data over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-xl font-semibold mb-2">Not enough data yet!</p>
            <p className="text-gray-600">Add more wellness entries to see meaningful trends and patterns.</p>
            <p className="text-sm text-gray-500 mt-2">You need at least 3-5 entries to start seeing trends.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate statistics
  const averageWellnessScore = trends.reduce((sum, trend) => sum + trend.wellness_score, 0) / trends.length;
  const averageSleep = trends.reduce((sum, trend) => sum + trend.hours_of_sleep, 0) / trends.length;
  const averageStress = trends.reduce((sum, trend) => sum + trend.stress_level, 0) / trends.length;
  const averageCaffeine = trends.reduce((sum, trend) => sum + trend.caffeine_intake, 0) / trends.length;
  const averageAlcohol = trends.reduce((sum, trend) => sum + trend.alcohol_intake, 0) / trends.length;

  // Find best and worst days
  const bestDay = trends.reduce((best, current) => 
    current.wellness_score > best.wellness_score ? current : best
  );
  const worstDay = trends.reduce((worst, current) => 
    current.wellness_score < worst.wellness_score ? current : worst
  );

  // Calculate trends (simple comparison of first vs last half)
  const midpoint = Math.floor(trends.length / 2);
  const firstHalf = trends.slice(0, midpoint);
  const secondHalf = trends.slice(midpoint);
  
  const firstHalfAvg = firstHalf.reduce((sum, t) => sum + t.wellness_score, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, t) => sum + t.wellness_score, 0) / secondHalf.length;
  const trendDirection = secondHalfAvg > firstHalfAvg ? 'improving' : secondHalfAvg < firstHalfAvg ? 'declining' : 'stable';

  const getTrendIcon = (direction: string) => {
    if (direction === 'improving') return '📈 ';
    if (direction === 'declining') return '📉 ';
    return '➡️ ';
  };

  const getTrendColor = (direction: string) => {
    if (direction === 'improving') return 'text-green-600';
    if (direction === 'declining') return 'text-red-600';
    return 'text-blue-600';
  };

  return (
    <Card className="shadow-lg wellness-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📈 Wellness Trends
        </CardTitle>
        <CardDescription>
          Analyze patterns in your wellness data over time ({trends.length} data points)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall trend summary */}
        <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Overall Trend</h3>
          <p className={`text-2xl font-bold ${getTrendColor(trendDirection)}`}>
            {getTrendIcon(trendDirection)} Your wellness is {trendDirection}!
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Based on comparison of recent vs. earlier entries
          </p>
        </div>

        {/* Statistics cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-2">🌟</div>
              <p className="text-sm text-gray-600">Average Wellness Score</p>
              <p className="text-2xl font-bold text-blue-600">
                {averageWellnessScore.toFixed(1)}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-2">😴</div>
              <p className="text-sm text-gray-600">Average Sleep</p>
              <p className="text-2xl font-bold text-green-600">
                {averageSleep.toFixed(1)}h
              </p>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-2">😰</div>
              <p className="text-sm text-gray-600">Average Stress</p>
              <p className="text-2xl font-bold text-orange-600">
                {averageStress.toFixed(1)}/10
              </p>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-2">☕</div>
              <p className="text-sm text-gray-600">Average Caffeine</p>
              <p className="text-2xl font-bold text-yellow-600">
                {averageCaffeine.toFixed(0)}mg
              </p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-2">🍷</div>
              <p className="text-sm text-gray-600">Average Alcohol</p>
              <p className="text-2xl font-bold text-purple-600">
                {averageAlcohol.toFixed(1)} drinks
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-2">📊</div>
              <p className="text-sm text-gray-600">Total Entries</p>
              <p className="text-2xl font-bold text-gray-600">
                {trends.length}
              </p>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Best and worst days */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                🏆 Best Day
              </h3>
              <p className="font-bold text-lg text-green-800">
                {bestDay.date.toLocaleDateString()}
              </p>
              <p className="text-green-600">
                Score: {bestDay.wellness_score.toFixed(1)}
              </p>
              <div className="text-sm text-green-600 mt-2">
                Sleep: {bestDay.hours_of_sleep}h • Stress: {bestDay.stress_level}/10
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                📉 Challenging Day
              </h3>
              <p className="font-bold text-lg text-red-800">
                {worstDay.date.toLocaleDateString()}
              </p>
              <p className="text-red-600">
                Score: {worstDay.wellness_score.toFixed(1)}
              </p>
              <div className="text-sm text-red-600 mt-2">
                Sleep: {worstDay.hours_of_sleep}h • Stress: {worstDay.stress_level}/10
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Recent trend data */}
        <div>
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            📅 Recent Activity
          </h3>
          <div className="space-y-2 wellness-scroll max-h-64 overflow-y-auto">
            {trends.slice(-10).reverse().map((trend: WellnessTrend, index: number) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="text-lg">
                    {trend.wellness_score >= 80 ? '🌟' : 
                     trend.wellness_score >= 60 ? '😊' : 
                     trend.wellness_score >= 40 ? '😐' : '😔'}
                  </div>
                  <div>
                    <span className="font-medium">
                      {trend.date.toLocaleDateString()}
                    </span>
                    <div className="text-xs text-gray-500">
                      {trend.date.toLocaleDateString('en-US', { weekday: 'long' })}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">
                    {trend.wellness_score.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {trend.hours_of_sleep}h • {trend.stress_level}/10 • {trend.caffeine_intake}mg
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
