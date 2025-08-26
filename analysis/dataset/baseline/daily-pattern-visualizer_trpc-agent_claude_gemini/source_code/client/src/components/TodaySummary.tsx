import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { DailyLog } from '../../../server/src/schema';

interface TodaySummaryProps {
  log: DailyLog | null;
  isLoading: boolean;
}

export function TodaySummary({ log, isLoading }: TodaySummaryProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading summary...</p>
        </div>
      </div>
    );
  }

  if (!log) {
    return (
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur text-center py-12">
        <CardContent>
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Data Yet</h3>
          <p className="text-gray-500">
            Start by logging your activities in the "Today's Log" tab to see your summary here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getEnergyStatus = (energy: number) => {
    if (energy <= 3) return { status: 'Low', color: 'bg-red-500', emoji: '😔' };
    if (energy <= 6) return { status: 'Moderate', color: 'bg-yellow-500', emoji: '😐' };
    if (energy <= 8) return { status: 'Good', color: 'bg-green-500', emoji: '😊' };
    return { status: 'Excellent', color: 'bg-blue-500', emoji: '🌟' };
  };

  const getSleepStatus = (hours: number) => {
    if (hours < 6) return { status: 'Too Little', color: 'text-red-600', emoji: '😴' };
    if (hours <= 8) return { status: 'Good', color: 'text-green-600', emoji: '😊' };
    if (hours <= 9) return { status: 'Great', color: 'text-blue-600', emoji: '🌟' };
    return { status: 'Too Much', color: 'text-orange-600', emoji: '😪' };
  };

  const getWorkLifeBalance = (work: number, social: number) => {
    const ratio = social > 0 ? work / social : work > 8 ? 10 : 1;
    if (ratio > 4) return { status: 'Work Heavy', color: 'text-orange-600', emoji: '⚠️' };
    if (ratio > 2) return { status: 'Work Focused', color: 'text-yellow-600', emoji: '💼' };
    return { status: 'Balanced', color: 'text-green-600', emoji: '⚖️' };
  };

  const energyStatus = getEnergyStatus(log.emotional_energy);
  const sleepStatus = getSleepStatus(log.sleep_duration);
  const balanceStatus = getWorkLifeBalance(log.work_hours, log.social_time);

  const metrics = [
    {
      title: 'Sleep Duration',
      value: log.sleep_duration,
      unit: 'hours',
      emoji: '😴',
      color: 'from-blue-500 to-cyan-500',
      progress: Math.min((log.sleep_duration / 10) * 100, 100),
      status: sleepStatus
    },
    {
      title: 'Work Hours',
      value: log.work_hours,
      unit: 'hours',
      emoji: '💼',
      color: 'from-green-500 to-emerald-500',
      progress: Math.min((log.work_hours / 12) * 100, 100),
      status: { status: log.work_hours > 8 ? 'High' : 'Normal', color: log.work_hours > 8 ? 'text-orange-600' : 'text-green-600', emoji: log.work_hours > 8 ? '⚠️' : '✅' }
    },
    {
      title: 'Social Time',
      value: log.social_time,
      unit: 'hours',
      emoji: '👥',
      color: 'from-purple-500 to-pink-500',
      progress: Math.min((log.social_time / 8) * 100, 100),
      status: { status: log.social_time < 2 ? 'Low' : 'Good', color: log.social_time < 2 ? 'text-orange-600' : 'text-green-600', emoji: log.social_time < 2 ? '😟' : '😊' }
    },
    {
      title: 'Screen Time',
      value: log.screen_time,
      unit: 'hours',
      emoji: '📱',
      color: 'from-orange-500 to-red-500',
      progress: Math.min((log.screen_time / 12) * 100, 100),
      status: { status: log.screen_time > 6 ? 'High' : 'Moderate', color: log.screen_time > 6 ? 'text-red-600' : 'text-green-600', emoji: log.screen_time > 6 ? '📱💔' : '✅' }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="shadow-lg border-0 bg-white/90 backdrop-blur overflow-hidden">
            <CardHeader className={`bg-gradient-to-r ${metric.color} text-white pb-2`}>
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>{metric.title}</span>
                <span className="text-lg">{metric.emoji}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-gray-900">
                    {metric.value}
                  </span>
                  <span className="text-sm text-gray-500">{metric.unit}</span>
                </div>
                <Progress value={metric.progress} className="h-2" />
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`${metric.status.color} border-current`}>
                    {metric.status.emoji} {metric.status.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Energy & Mood */}
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
          <CardHeader className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
            <CardTitle className="flex items-center gap-2">
              {energyStatus.emoji} Emotional Energy
            </CardTitle>
            <CardDescription className="text-yellow-100">
              Today's energy level assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl font-bold">{log.emotional_energy}/10</span>
              <Badge className={`${energyStatus.color} text-white`}>
                {energyStatus.status}
              </Badge>
            </div>
            <Progress value={log.emotional_energy * 10} className="h-3 mb-4" />
            <p className="text-sm text-gray-600">
              {log.emotional_energy <= 4 
                ? "Consider taking breaks and engaging in activities that boost your mood." 
                : log.emotional_energy <= 7
                ? "You're doing well! Keep maintaining your current routine."
                : "Excellent energy levels! You're having a great day."
              }
            </p>
          </CardContent>
        </Card>

        {/* Work-Life Balance */}
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <CardTitle className="flex items-center gap-2">
              {balanceStatus.emoji} Work-Life Balance
            </CardTitle>
            <CardDescription className="text-indigo-100">
              Analysis of work and social time
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Work vs Social Ratio</span>
                <Badge className={`${balanceStatus.color} border-current`} variant="outline">
                  {balanceStatus.status}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Work: {log.work_hours}h</span>
                  <span>Social: {log.social_time}h</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full" 
                    style={{ width: `${Math.min((log.work_hours / (log.work_hours + log.social_time || 1)) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                {log.work_hours > log.social_time * 3
                  ? "Consider spending more time with friends and family to maintain balance."
                  : log.social_time > log.work_hours * 2
                  ? "Great social balance! Make sure you're staying productive too."
                  : "Nice balance between work and social activities!"
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Insights */}
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
        <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-900 text-white">
          <CardTitle>📊 Today's Insights</CardTitle>
          <CardDescription className="text-gray-200">
            Key observations from your daily activities
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl mb-2">⏰</div>
              <div className="text-sm text-gray-600">Total Logged</div>
              <div className="text-lg font-semibold">
                {(log.sleep_duration + log.work_hours + log.social_time + log.screen_time).toFixed(1)}h
              </div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl mb-2">🎯</div>
              <div className="text-sm text-gray-600">Most Active</div>
              <div className="text-lg font-semibold">
                {log.work_hours >= log.social_time && log.work_hours >= log.screen_time ? 'Work' :
                 log.social_time >= log.screen_time ? 'Social' : 'Screen Time'}
              </div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl mb-2">💡</div>
              <div className="text-sm text-gray-600">Energy Trend</div>
              <div className="text-lg font-semibold">
                {log.emotional_energy >= 7 ? 'High' : log.emotional_energy >= 5 ? 'Stable' : 'Low'}
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-700 leading-relaxed">
              <strong>Summary:</strong> You logged {log.created_at.toLocaleDateString()} with {log.emotional_energy}/10 energy. 
              Your day included {log.work_hours}h of work, {log.social_time}h of social time, 
              and {log.screen_time}h of screen time after {log.sleep_duration}h of sleep.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
