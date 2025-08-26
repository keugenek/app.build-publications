import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DailyMetrics } from '../../../server/src/schema';
import { format } from 'date-fns';

interface MetricsChartProps {
  metrics: DailyMetrics[];
}

export function MetricsChart({ metrics }: MetricsChartProps) {
  // Prepare data for charts (last 7 days)
  const chartData = metrics
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7)
    .map(metric => ({
      date: format(new Date(metric.date), 'MMM dd'),
      sleep: metric.sleep_duration,
      work: metric.work_hours,
      social: metric.social_time,
      screen: metric.screen_time,
      energy: metric.emotional_energy
    }));

  // Calculate max values for scaling
  const maxSleep = Math.max(...chartData.map(d => d.sleep), 1);
  const maxWork = Math.max(...chartData.map(d => d.work), 1);
  const maxSocial = Math.max(...chartData.map(d => d.social), 1);
  const maxScreen = Math.max(...chartData.map(d => d.screen), 1);
  const maxEnergy = 10; // Fixed scale for energy (1-10)

  return (
    <Card>
      <CardHeader>
        <CardTitle>7-Day Overview</CardTitle>
      </CardHeader>
      <CardContent>
        {metrics.length > 0 ? (
          <div className="space-y-6">
            {/* Chart Visualization */}
            <div className="h-64">
              <div className="flex items-end h-5/6 gap-2 border-b border-l border-gray-200 pb-4 pl-4">
                {chartData.map((data, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div className="flex items-end justify-center h-full w-full gap-1">
                      <div 
                        className="w-1/5 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                        style={{ height: `${(data.sleep / maxSleep) * 70 + 15}%` }}
                        title={`Sleep: ${data.sleep} hours`}
                      />
                      <div 
                        className="w-1/5 bg-green-500 rounded-t hover:bg-green-600 transition-colors"
                        style={{ height: `${(data.work / maxWork) * 70 + 15}%` }}
                        title={`Work: ${data.work} hours`}
                      />
                      <div 
                        className="w-1/5 bg-purple-500 rounded-t hover:bg-purple-600 transition-colors"
                        style={{ height: `${(data.social / maxSocial) * 70 + 15}%` }}
                        title={`Social: ${data.social} hours`}
                      />
                      <div 
                        className="w-1/5 bg-yellow-500 rounded-t hover:bg-yellow-600 transition-colors"
                        style={{ height: `${(data.screen / maxScreen) * 70 + 15}%` }}
                        title={`Screen: ${data.screen} hours`}
                      />
                      <div 
                        className="w-1/5 bg-red-500 rounded-t hover:bg-red-600 transition-colors"
                        style={{ height: `${(data.energy / maxEnergy) * 70 + 15}%` }}
                        title={`Energy: ${data.energy}/10`}
                      />
                    </div>
                    <div className="text-xs mt-2 text-gray-600 text-center">
                      {data.date}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center mt-2 space-x-4 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
                  <span>Sleep</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
                  <span>Work</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded mr-1"></div>
                  <span>Social</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded mr-1"></div>
                  <span>Screen</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded mr-1"></div>
                  <span>Energy</span>
                </div>
              </div>
            </div>

            {/* Metrics Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-700">
                  {metrics.reduce((sum, m) => sum + m.sleep_duration, 0).toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Total Sleep (hrs)</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-700">
                  {metrics.reduce((sum, m) => sum + m.work_hours, 0).toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Total Work (hrs)</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-700">
                  {metrics.reduce((sum, m) => sum + m.social_time, 0).toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Social Time (hrs)</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-700">
                  {metrics.reduce((sum, m) => sum + m.screen_time, 0).toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Screen Time (hrs)</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-700">
                  {(metrics.reduce((sum, m) => sum + m.emotional_energy, 0) / metrics.length || 0).toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Avg Energy</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No data available yet. Start by entering your first metrics!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
