import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Calendar, Moon, Briefcase, Users, Monitor, Zap } from 'lucide-react';
import type { WellBeingEntry } from '../../../server/src/schema';

interface MetricsChartProps {
  entries: WellBeingEntry[];
}

type MetricKey = 'sleep_hours' | 'work_hours' | 'social_time_hours' | 'screen_time_hours' | 'emotional_energy_level';

interface MetricConfig {
  key: MetricKey;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  borderColor: string;
  unit: string;
  idealRange?: [number, number];
}

export function MetricsChart({ entries }: MetricsChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('sleep_hours');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const metrics: MetricConfig[] = [
    {
      key: 'sleep_hours',
      label: 'Sleep Hours',
      icon: Moon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      unit: 'hours',
      idealRange: [7, 9]
    },
    {
      key: 'work_hours',
      label: 'Work Hours',
      icon: Briefcase,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      unit: 'hours',
      idealRange: [6, 8]
    },
    {
      key: 'social_time_hours',
      label: 'Social Time',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      unit: 'hours'
    },
    {
      key: 'screen_time_hours',
      label: 'Screen Time',
      icon: Monitor,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      unit: 'hours'
    },
    {
      key: 'emotional_energy_level',
      label: 'Energy Level',
      icon: Zap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      unit: '/10',
      idealRange: [6, 10]
    }
  ];

  // Filter entries based on time range
  const filteredEntries = useMemo(() => {
    const now = new Date();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    return entries
      .filter((entry: WellBeingEntry) => entry.date >= cutoffDate)
      .sort((a: WellBeingEntry, b: WellBeingEntry) => a.date.getTime() - b.date.getTime());
  }, [entries, timeRange]);

  // Get selected metric config
  const currentMetric = metrics.find((m: MetricConfig) => m.key === selectedMetric) || metrics[0];

  // Calculate statistics
  const stats = useMemo(() => {
    if (filteredEntries.length === 0) return null;

    const values = filteredEntries.map((entry: WellBeingEntry) => entry[selectedMetric] as number);
    const sum = values.reduce((acc: number, val: number) => acc + val, 0);
    const average = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Calculate trend (comparing first half vs second half)
    const midPoint = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, midPoint);
    const secondHalf = values.slice(midPoint);
    
    if (firstHalf.length > 0 && secondHalf.length > 0) {
      const firstAvg = firstHalf.reduce((acc: number, val: number) => acc + val, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((acc: number, val: number) => acc + val, 0) / secondHalf.length;
      const trend = secondAvg > firstAvg ? 'up' : secondAvg < firstAvg ? 'down' : 'stable';
      const trendPercent = Math.abs(((secondAvg - firstAvg) / firstAvg) * 100);
      
      return { average, min, max, trend, trendPercent };
    }
    
    return { average, min, max, trend: 'stable', trendPercent: 0 };
  }, [filteredEntries, selectedMetric]);

  // Check if value is in ideal range
  const isInIdealRange = (value: number): boolean => {
    if (!currentMetric.idealRange) return true;
    const [min, max] = currentMetric.idealRange;
    return value >= min && value <= max;
  };

  // Get max value for chart scaling
  const maxValue = useMemo(() => {
    if (selectedMetric === 'emotional_energy_level') return 10;
    return Math.max(24, ...filteredEntries.map((entry: WellBeingEntry) => entry[selectedMetric] as number));
  }, [filteredEntries, selectedMetric]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={selectedMetric} onValueChange={(value: MetricKey) => setSelectedMetric(value)}>
          <SelectTrigger className="w-full sm:w-64 bg-white/70 backdrop-blur-sm">
            <SelectValue placeholder="Select metric" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {metrics.map((metric: MetricConfig) => (
              <SelectItem key={metric.key} value={metric.key}>
                <div className="flex items-center gap-2">
                  <metric.icon className={`h-4 w-4 ${metric.color}`} />
                  {metric.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={timeRange} onValueChange={(value: '7d' | '30d' | '90d') => setTimeRange(value)}>
          <SelectTrigger className="w-full sm:w-40 bg-white/70 backdrop-blur-sm">
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2 bg-white/70 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <currentMetric.icon className={`h-5 w-5 ${currentMetric.color}`} />
              {currentMetric.label} Trends
            </CardTitle>
            <CardDescription>
              Daily values over the selected time period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredEntries.length > 0 ? (
              <div className="space-y-4">
                {/* Simple bar chart */}
                <div className="h-64 flex items-end justify-between gap-1 p-4 bg-gray-50 rounded-lg">
                  {filteredEntries.map((entry: WellBeingEntry, index: number) => {
                    const value = entry[selectedMetric] as number;
                    const height = (value / maxValue) * 100;
                    const isIdeal = isInIdealRange(value);
                    
                    return (
                      <div key={entry.id} className="flex flex-col items-center group">
                        <div className="relative">
                          {/* Tooltip */}
                          <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10 transition-opacity">
                            {entry.date.toLocaleDateString()}: {value}{currentMetric.unit}
                          </div>
                          
                          {/* Bar */}
                          <div
                            className={`w-3 sm:w-4 rounded-t transition-all hover:opacity-80 ${
                              isIdeal ? currentMetric.bgColor : 'bg-gray-300'
                            } ${
                              isIdeal ? currentMetric.borderColor : 'border-gray-400'
                            } border-b-2`}
                            style={{ height: `${Math.max(height, 5)}%` }}
                          />
                        </div>
                        
                        {/* Date label (show only for some entries to avoid crowding) */}
                        {index % Math.ceil(filteredEntries.length / 7) === 0 && (
                          <span className="text-xs text-gray-500 mt-1 rotate-45 origin-left">
                            {entry.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Chart legend */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>0 {currentMetric.unit}</span>
                  <span>{maxValue} {currentMetric.unit}</span>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No data available for the selected time range</p>
                  <p className="text-sm mt-2">Start logging entries to see trends!</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="space-y-4">
          {stats && (
            <Card className="bg-white/70 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-lg">Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average:</span>
                    <span className="font-medium">
                      {stats.average.toFixed(1)}{currentMetric.unit}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Minimum:</span>
                    <span className="font-medium">
                      {stats.min.toFixed(1)}{currentMetric.unit}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Maximum:</span>
                    <span className="font-medium">
                      {stats.max.toFixed(1)}{currentMetric.unit}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Trend:</span>
                    <div className="flex items-center gap-2">
                      {stats.trend === 'up' && (
                        <>
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-green-600 font-medium">
                            +{stats.trendPercent.toFixed(1)}%
                          </span>
                        </>
                      )}
                      {stats.trend === 'down' && (
                        <>
                          <TrendingDown className="h-4 w-4 text-red-600" />
                          <span className="text-red-600 font-medium">
                            -{stats.trendPercent.toFixed(1)}%
                          </span>
                        </>
                      )}
                      {stats.trend === 'stable' && (
                        <span className="text-gray-600 font-medium">Stable</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ideal Range Info */}
          {currentMetric.idealRange && (
            <Card className="bg-white/70 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-lg">Ideal Range</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Recommended:</span>
                    <Badge variant="secondary">
                      {currentMetric.idealRange[0]}-{currentMetric.idealRange[1]}{currentMetric.unit}
                    </Badge>
                  </div>
                  {stats && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500">
                        {isInIdealRange(stats.average) ? (
                          <span className="text-green-600">✅ Your average is within the ideal range!</span>
                        ) : (
                          <span className="text-amber-600">⚠️ Consider adjusting to reach the ideal range</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
