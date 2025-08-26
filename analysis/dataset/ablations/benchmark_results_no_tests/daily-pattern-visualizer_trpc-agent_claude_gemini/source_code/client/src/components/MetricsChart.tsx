import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
// Using type-only imports
import type { DailyMetrics } from '../../../server/src/schema';

interface MetricsChartProps {
  data: DailyMetrics[];
}

export function MetricsChart({ data }: MetricsChartProps) {
  // Sort data by date and prepare for visualization
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data]);

  // Calculate max values for scaling
  const maxValues = useMemo(() => {
    if (sortedData.length === 0) return { maxHours: 24, maxEnergy: 10 };
    
    return {
      maxHours: Math.max(
        ...sortedData.map(d => Math.max(d.sleep_duration, d.work_hours, d.social_interaction_time, d.screen_time)),
        12 // Minimum scale
      ),
      maxEnergy: 10
    };
  }, [sortedData]);

  // Generate bar chart visualization
  const renderBarChart = (
    values: number[], 
    maxValue: number, 
    color: string,
    label: string
  ) => {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">{label}</h4>
          <Badge variant="outline" className="text-xs">
            Avg: {(values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(1)}
          </Badge>
        </div>
        <div className="flex items-end gap-1 h-16 bg-gray-50 p-2 rounded">
          {values.map((value, index) => {
            const height = Math.max((value / maxValue) * 100, 2); // Minimum 2% height
            const date = sortedData[index]?.date;
            const dayName = date ? new Date(date).toLocaleDateString('en-US', { weekday: 'short' }) : '';
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-full ${color} rounded-sm transition-all hover:opacity-80 cursor-pointer`}
                  style={{ height: `${height}%` }}
                  title={`${dayName}: ${value}h`}
                ></div>
                <span className="text-xs text-gray-500 mt-1">{dayName}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Generate energy level chart
  const renderEnergyChart = () => {
    const energyValues = sortedData.map(d => d.emotional_energy_level);
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">⚡ Energy Level</h4>
          <Badge variant="outline" className="text-xs">
            Avg: {(energyValues.reduce((sum, v) => sum + v, 0) / energyValues.length).toFixed(1)}/10
          </Badge>
        </div>
        <div className="flex items-end gap-1 h-16 bg-gray-50 p-2 rounded">
          {energyValues.map((value, index) => {
            const height = (value / 10) * 100;
            const date = sortedData[index]?.date;
            const dayName = date ? new Date(date).toLocaleDateString('en-US', { weekday: 'short' }) : '';
            
            // Color based on energy level
            const color = value >= 8 ? 'bg-green-500' : 
                         value >= 6 ? 'bg-blue-500' : 
                         value >= 4 ? 'bg-yellow-500' : 
                         'bg-red-500';
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-full ${color} rounded-sm transition-all hover:opacity-80 cursor-pointer`}
                  style={{ height: `${height}%` }}
                  title={`${dayName}: ${value}/10`}
                ></div>
                <span className="text-xs text-gray-500 mt-1">{dayName}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (sortedData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No data to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {sortedData.map((metrics, index) => {
          const date = new Date(metrics.date);
          const isToday = date.toDateString() === new Date().toDateString();
          
          return (
            <Card key={metrics.id} className={`p-3 ${isToday ? 'ring-2 ring-indigo-300 bg-indigo-50' : 'bg-white'}`}>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-700 mb-1">
                  {date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                  {isToday && <Badge className="ml-1 text-xs bg-indigo-500">Today</Badge>}
                </div>
                <div className="text-lg font-bold text-indigo-600">
                  {metrics.emotional_energy_level}/10
                </div>
                <div className="text-xs text-gray-500">Energy</div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {renderBarChart(
            sortedData.map(d => d.sleep_duration),
            maxValues.maxHours,
            'bg-blue-500',
            '😴 Sleep Duration (hours)'
          )}
          
          {renderBarChart(
            sortedData.map(d => d.work_hours),
            maxValues.maxHours,
            'bg-green-500',
            '💼 Work Hours'
          )}
        </div>

        <div className="space-y-4">
          {renderBarChart(
            sortedData.map(d => d.social_interaction_time),
            maxValues.maxHours,
            'bg-purple-500',
            '👥 Social Time (hours)'
          )}
          
          {renderBarChart(
            sortedData.map(d => d.screen_time),
            maxValues.maxHours,
            'bg-orange-500',
            '📱 Screen Time (hours)'
          )}
        </div>
      </div>

      {/* Energy Level Chart */}
      <div>
        {renderEnergyChart()}
      </div>

      {/* Daily Summary Table */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Daily Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Date</th>
                <th className="text-center py-2">😴 Sleep</th>
                <th className="text-center py-2">💼 Work</th>
                <th className="text-center py-2">👥 Social</th>
                <th className="text-center py-2">📱 Screen</th>
                <th className="text-center py-2">⚡ Energy</th>
                <th className="text-left py-2">📝 Notes</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((metrics) => {
                const date = new Date(metrics.date);
                const isToday = date.toDateString() === new Date().toDateString();
                
                return (
                  <tr 
                    key={metrics.id} 
                    className={`border-b hover:bg-gray-50 ${isToday ? 'bg-indigo-50' : ''}`}
                  >
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        {date.toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                        {isToday && <Badge className="text-xs bg-indigo-500">Today</Badge>}
                      </div>
                    </td>
                    <td className="text-center py-2">{metrics.sleep_duration}h</td>
                    <td className="text-center py-2">{metrics.work_hours}h</td>
                    <td className="text-center py-2">{metrics.social_interaction_time}h</td>
                    <td className="text-center py-2">{metrics.screen_time}h</td>
                    <td className="text-center py-2">
                      <Badge 
                        variant={metrics.emotional_energy_level >= 7 ? 'default' : 
                                metrics.emotional_energy_level >= 5 ? 'secondary' : 'destructive'}
                      >
                        {metrics.emotional_energy_level}/10
                      </Badge>
                    </td>
                    <td className="py-2 max-w-32">
                      {metrics.notes ? (
                        <div className="truncate text-gray-600" title={metrics.notes}>
                          {metrics.notes}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">No notes</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
