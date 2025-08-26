import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ActivityLog } from '../../../server/src/schema';

interface ActivityChartsProps {
  activityLogs: ActivityLog[];
}

export function ActivityCharts({ activityLogs }: ActivityChartsProps) {
  // Sort logs by date for proper chronological display
  const sortedLogs = [...activityLogs].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Calculate averages
  const averages = activityLogs.length > 0 ? {
    sleep: activityLogs.reduce((sum, log) => sum + log.sleep_hours, 0) / activityLogs.length,
    work: activityLogs.reduce((sum, log) => sum + log.work_hours, 0) / activityLogs.length,
    social: activityLogs.reduce((sum, log) => sum + log.social_hours, 0) / activityLogs.length,
    screen: activityLogs.reduce((sum, log) => sum + log.screen_hours, 0) / activityLogs.length,
    energy: activityLogs.reduce((sum, log) => sum + log.emotional_energy, 0) / activityLogs.length
  } : null;

  // Simple bar chart component
  const SimpleBarChart = ({ 
    data, 
    label, 
    color, 
    maxValue = 24 
  }: { 
    data: { date: Date; value: number }[]; 
    label: string; 
    color: string;
    maxValue?: number;
  }) => (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-700">{label}</h4>
      <div className="space-y-1">
        {data.slice(-14).map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-16">
              {item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
              <div
                className={`h-4 rounded-full ${color} transition-all duration-300`}
                style={{ width: `${Math.min((item.value / maxValue) * 100, 100)}%` }}
              />
              <span className="absolute right-2 top-0 text-xs text-gray-600 leading-4">
                {item.value.toFixed(1)}{maxValue === 10 ? '' : 'h'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Energy trend visualization
  const EnergyTrend = ({ data }: { data: { date: Date; value: number }[] }) => (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-700">🚀 Energy Levels</h4>
      <div className="space-y-1">
        {data.slice(-14).map((item, index) => {
          const getEnergyColor = (energy: number) => {
            if (energy <= 3) return 'bg-red-400';
            if (energy <= 5) return 'bg-yellow-400';
            if (energy <= 7) return 'bg-blue-400';
            return 'bg-green-400';
          };
          
          const getEnergyEmoji = (energy: number) => {
            if (energy <= 3) return '😴';
            if (energy <= 5) return '😐';
            if (energy <= 7) return '😊';
            return '🚀';
          };

          return (
            <div key={index} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-16">
                {item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                <div
                  className={`h-6 rounded-full ${getEnergyColor(item.value)} transition-all duration-300`}
                  style={{ width: `${(item.value / 10) * 100}%` }}
                />
                <span className="absolute right-2 top-0 text-sm leading-6">
                  {getEnergyEmoji(item.value)} {item.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (activityLogs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-64 text-center">
          <div className="text-6xl mb-4">📈</div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Data Yet</h3>
          <p className="text-gray-500">
            Start logging your daily activities to see beautiful charts and insights!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-1">😴</div>
            <div className="text-2xl font-bold text-blue-600">
              {averages?.sleep.toFixed(1)}h
            </div>
            <div className="text-sm text-blue-600">Avg Sleep</div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-1">💼</div>
            <div className="text-2xl font-bold text-purple-600">
              {averages?.work.toFixed(1)}h
            </div>
            <div className="text-sm text-purple-600">Avg Work</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-1">👥</div>
            <div className="text-2xl font-bold text-green-600">
              {averages?.social.toFixed(1)}h
            </div>
            <div className="text-sm text-green-600">Avg Social</div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-1">📱</div>
            <div className="text-2xl font-bold text-orange-600">
              {averages?.screen.toFixed(1)}h
            </div>
            <div className="text-sm text-orange-600">Avg Screen</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-1">⚡</div>
            <div className="text-2xl font-bold text-yellow-600">
              {averages?.energy.toFixed(1)}
            </div>
            <div className="text-sm text-yellow-600">Avg Energy</div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>📊 Activity Patterns (Last 14 Days)</CardTitle>
            <CardDescription>
              Track your daily activity hours over time
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <SimpleBarChart
              data={sortedLogs.map(log => ({ date: new Date(log.date), value: log.sleep_hours }))}
              label="😴 Sleep Hours"
              color="bg-blue-500"
              maxValue={12}
            />
            <SimpleBarChart
              data={sortedLogs.map(log => ({ date: new Date(log.date), value: log.work_hours }))}
              label="💼 Work Hours"
              color="bg-purple-500"
              maxValue={16}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🎯 Lifestyle Balance</CardTitle>
            <CardDescription>
              Monitor your social time and screen usage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <SimpleBarChart
              data={sortedLogs.map(log => ({ date: new Date(log.date), value: log.social_hours }))}
              label="👥 Social Hours"
              color="bg-green-500"
              maxValue={8}
            />
            <SimpleBarChart
              data={sortedLogs.map(log => ({ date: new Date(log.date), value: log.screen_hours }))}
              label="📱 Screen Hours"
              color="bg-orange-500"
              maxValue={16}
            />
          </CardContent>
        </Card>
      </div>

      {/* Energy Trends */}
      <Card>
        <CardHeader>
          <CardTitle>⚡ Energy Level Trends</CardTitle>
          <CardDescription>
            Your emotional energy patterns over the past two weeks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EnergyTrend
            data={sortedLogs.map(log => ({ date: new Date(log.date), value: log.emotional_energy }))}
          />
        </CardContent>
      </Card>

      {/* Recent Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>📅 Recent Activity Timeline</CardTitle>
          <CardDescription>
            Your latest logged activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedLogs.slice(-7).reverse().map((log: ActivityLog) => (
              <div key={log.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-600 w-20">
                  {log.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-blue-50">😴 {log.sleep_hours}h</Badge>
                  <Badge variant="outline" className="bg-purple-50">💼 {log.work_hours}h</Badge>
                  <Badge variant="outline" className="bg-green-50">👥 {log.social_hours}h</Badge>
                  <Badge variant="outline" className="bg-orange-50">📱 {log.screen_hours}h</Badge>
                  <Badge variant="outline" className="bg-yellow-50">
                    ⚡ {log.emotional_energy}
                  </Badge>
                </div>
                {log.notes && (
                  <div className="text-sm text-gray-600 italic">"{log.notes}"</div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
