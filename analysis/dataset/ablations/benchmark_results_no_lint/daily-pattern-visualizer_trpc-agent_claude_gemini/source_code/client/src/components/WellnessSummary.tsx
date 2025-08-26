import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Moon, 
  Briefcase, 
  Users, 
  Monitor, 
  Zap,
  TrendingUp,
  TrendingDown,
  Calendar
} from 'lucide-react';
import type { WellnessSummary as WellnessSummaryType } from '../../../server/src/schema';

interface WellnessSummaryProps {
  summary: WellnessSummaryType | null;
  period: 'daily' | 'weekly' | 'monthly';
  onPeriodChange: (period: 'daily' | 'weekly' | 'monthly') => void;
}

export function WellnessSummary({ summary, period, onPeriodChange }: WellnessSummaryProps) {
  if (!summary) {
    return (
      <Card className="bg-white/70 backdrop-blur-sm border-white/20">
        <CardContent className="py-16 text-center">
          <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold mb-2">Loading Summary...</h3>
          <p className="text-gray-600">
            Analyzing your well-being data to generate insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    {
      key: 'sleep',
      label: 'Sleep Hours',
      icon: Moon,
      value: summary.average_sleep_hours,
      ideal: 8,
      max: 12,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500',
      unit: 'h',
      description: 'Average daily sleep'
    },
    {
      key: 'work',
      label: 'Work Hours',
      icon: Briefcase,
      value: summary.average_work_hours,
      ideal: 8,
      max: 16,
      color: 'text-orange-600',
      bgColor: 'bg-orange-500',
      unit: 'h',
      description: 'Average daily work'
    },
    {
      key: 'social',
      label: 'Social Time',
      icon: Users,
      value: summary.average_social_time_hours,
      ideal: 3,
      max: 8,
      color: 'text-green-600',
      bgColor: 'bg-green-500',
      unit: 'h',
      description: 'Average social activities'
    },
    {
      key: 'screen',
      label: 'Screen Time',
      icon: Monitor,
      value: summary.average_screen_time_hours,
      ideal: 4,
      max: 16,
      color: 'text-red-600',
      bgColor: 'bg-red-500',
      unit: 'h',
      description: 'Average screen exposure'
    },
    {
      key: 'energy',
      label: 'Energy Level',
      icon: Zap,
      value: summary.average_emotional_energy,
      ideal: 8,
      max: 10,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500',
      unit: '/10',
      description: 'Average energy rating'
    }
  ];

  const getHealthScore = (value: number, ideal: number, max: number): number => {
    // Calculate how close to ideal (100% = ideal, decreases as distance from ideal increases)
    const distance = Math.abs(value - ideal);
    const maxDistance = Math.max(ideal, max - ideal);
    return Math.max(0, 100 - (distance / maxDistance) * 100);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  const overallScore = metrics.reduce((acc, metric) => {
    return acc + getHealthScore(metric.value, metric.ideal, metric.max);
  }, 0) / metrics.length;

  return (
    <div className="space-y-6">
      {/* Header with Period Selector */}
      <Card className="bg-white/70 backdrop-blur-sm border-white/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <BarChart3 className="h-6 w-6 text-blue-600" />
                Wellness Summary
              </CardTitle>
              <CardDescription>
                Your well-being metrics overview for the {period} period
              </CardDescription>
            </div>
            <Select value={period} onValueChange={onPeriodChange}>
              <SelectTrigger className="w-40 bg-white/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{summary.total_entries}</div>
              <div className="text-sm text-gray-600">Total Entries</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
                {Math.round(overallScore)}%
              </div>
              <div className="text-sm text-gray-600">Overall Score</div>
            </div>
            <div className="text-center">
              <Badge variant={overallScore >= 80 ? 'default' : overallScore >= 60 ? 'secondary' : 'destructive'}>
                {getScoreBadge(overallScore)}
              </Badge>
              <div className="text-sm text-gray-600 mt-1">Health Status</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {summary.break_suggestions.length}
              </div>
              <div className="text-sm text-gray-600">Active Tips</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => {
          const score = getHealthScore(metric.value, metric.ideal, metric.max);
          const progressValue = (metric.value / metric.max) * 100;
          const isGood = score >= 70;
          
          return (
            <Card key={metric.key} className="bg-white/70 backdrop-blur-sm border-white/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center gap-2">
                    <metric.icon className={`h-5 w-5 ${metric.color}`} />
                    {metric.label}
                  </div>
                  {isGood ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </CardTitle>
                <CardDescription>{metric.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold">{metric.value.toFixed(1)}</span>
                  <span className="text-lg text-gray-500 mb-1">{metric.unit}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="text-gray-600">{Math.round(progressValue)}%</span>
                  </div>
                  <Progress 
                    value={progressValue} 
                    className="h-2" 
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0{metric.unit}</span>
                    <span className="text-center">Ideal: {metric.ideal}{metric.unit}</span>
                    <span>{metric.max}{metric.unit}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Badge 
                    variant={isGood ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    Score: {Math.round(score)}/100
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Period Comparison */}
      <Card className="bg-white/70 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Period Insights
          </CardTitle>
          <CardDescription>
            Key observations for your {period} wellness data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-green-600">✅ Doing Well</h4>
              <div className="space-y-2">
                {metrics
                  .filter((metric) => getHealthScore(metric.value, metric.ideal, metric.max) >= 70)
                  .map((metric) => (
                    <div key={metric.key} className="flex items-center gap-2 text-sm">
                      <metric.icon className={`h-4 w-4 ${metric.color}`} />
                      <span>{metric.label}: {metric.value.toFixed(1)}{metric.unit}</span>
                    </div>
                  ))}
                {metrics.filter((metric) => getHealthScore(metric.value, metric.ideal, metric.max) >= 70).length === 0 && (
                  <p className="text-gray-500 text-sm">Focus on improving all metrics for better well-being</p>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-amber-600">⚠️ Areas for Improvement</h4>
              <div className="space-y-2">
                {metrics
                  .filter((metric) => getHealthScore(metric.value, metric.ideal, metric.max) < 70)
                  .map((metric) => (
                    <div key={metric.key} className="flex items-center gap-2 text-sm">
                      <metric.icon className={`h-4 w-4 ${metric.color}`} />
                      <span>{metric.label}: {metric.value.toFixed(1)}{metric.unit}</span>
                      <span className="text-xs text-gray-500">(Target: {metric.ideal}{metric.unit})</span>
                    </div>
                  ))}
                {metrics.filter((metric) => getHealthScore(metric.value, metric.ideal, metric.max) < 70).length === 0 && (
                  <p className="text-green-600 text-sm">🎉 All metrics are in good range!</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
