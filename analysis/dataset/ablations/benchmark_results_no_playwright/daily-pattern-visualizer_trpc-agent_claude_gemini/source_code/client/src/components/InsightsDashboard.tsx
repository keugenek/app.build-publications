import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ActivityPattern, BreakSuggestion, ActivityLog } from '../../../server/src/schema';

interface InsightsDashboardProps {
  patterns: ActivityPattern | null;
  breakSuggestions: BreakSuggestion[];
  activityLogs: ActivityLog[];
}

export function InsightsDashboard({ patterns, breakSuggestions, activityLogs }: InsightsDashboardProps) {
  // Calculate some additional insights from the logs
  const calculateInsights = () => {
    if (activityLogs.length === 0) return null;


    const avgSleep = activityLogs.reduce((sum, log) => sum + log.sleep_hours, 0) / activityLogs.length;
    const avgWork = activityLogs.reduce((sum, log) => sum + log.work_hours, 0) / activityLogs.length;
    const avgSocial = activityLogs.reduce((sum, log) => sum + log.social_hours, 0) / activityLogs.length;
    const avgScreen = activityLogs.reduce((sum, log) => sum + log.screen_hours, 0) / activityLogs.length;
    const avgEnergy = activityLogs.reduce((sum, log) => sum + log.emotional_energy, 0) / activityLogs.length;

    // Calculate work-life balance score (out of 100)
    const workLifeBalance = Math.max(0, 100 - Math.abs(avgWork - 8) * 10 - Math.abs(avgSocial - 2) * 15);
    
    // Calculate sleep quality score
    const sleepScore = Math.max(0, 100 - Math.abs(avgSleep - 8) * 12.5);
    
    // Calculate screen time healthiness
    const screenHealthScore = Math.max(0, 100 - Math.max(0, avgScreen - 6) * 16.7);

    return {
      workLifeBalance: Math.round(workLifeBalance),
      sleepScore: Math.round(sleepScore),
      screenHealthScore: Math.round(screenHealthScore),
      avgEnergy: Math.round(avgEnergy * 10) / 10
    };
  };

  const insights = calculateInsights();

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 80) return 'from-green-100 to-green-50';
    if (score >= 60) return 'from-yellow-100 to-yellow-50';
    return 'from-red-100 to-red-50';
  };

  const getActivityTypeEmoji = (type: BreakSuggestion['activity_type']): string => {
    switch (type) {
      case 'short_break': return '☕';
      case 'long_break': return '🌅';
      case 'social_time': return '👥';
      case 'exercise': return '🏃‍♂️';
      default: return '⏰';
    }
  };

  const getActivityTypeLabel = (type: BreakSuggestion['activity_type']): string => {
    switch (type) {
      case 'short_break': return 'Short Break';
      case 'long_break': return 'Long Break';
      case 'social_time': return 'Social Time';
      case 'exercise': return 'Exercise';
      default: return 'Break';
    }
  };

  if (!patterns && activityLogs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-64 text-center">
          <div className="text-6xl mb-4">🧠</div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Insights Yet</h3>
          <p className="text-gray-500">
            Log a few days of activities to get personalized insights and recommendations!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Health Scores */}
      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className={`bg-gradient-to-br ${getScoreBgColor(insights.workLifeBalance)}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">⚖️ Work-Life Balance</span>
                <Badge variant="secondary" className={getScoreColor(insights.workLifeBalance)}>
                  {insights.workLifeBalance}%
                </Badge>
              </div>
              <Progress value={insights.workLifeBalance} className="h-2" />
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${getScoreBgColor(insights.sleepScore)}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">😴 Sleep Quality</span>
                <Badge variant="secondary" className={getScoreColor(insights.sleepScore)}>
                  {insights.sleepScore}%
                </Badge>
              </div>
              <Progress value={insights.sleepScore} className="h-2" />
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${getScoreBgColor(insights.screenHealthScore)}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">📱 Screen Health</span>
                <Badge variant="secondary" className={getScoreColor(insights.screenHealthScore)}>
                  {insights.screenHealthScore}%
                </Badge>
              </div>
              <Progress value={insights.screenHealthScore} className="h-2" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-100 to-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">⚡ Avg Energy</span>
                <Badge variant="secondary" className="text-blue-600">
                  {insights.avgEnergy}/10
                </Badge>
              </div>
              <Progress value={insights.avgEnergy * 10} className="h-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activity Patterns */}
      {patterns && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📈 Activity Patterns Analysis
            </CardTitle>
            <CardDescription>
              Based on {patterns.total_days} days of data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Averages Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl">😴</div>
                <div className="font-semibold text-blue-600">{patterns.average_sleep.toFixed(1)}h</div>
                <div className="text-xs text-blue-600">Sleep</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl">💼</div>
                <div className="font-semibold text-purple-600">{patterns.average_work.toFixed(1)}h</div>
                <div className="text-xs text-purple-600">Work</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl">👥</div>
                <div className="font-semibold text-green-600">{patterns.average_social.toFixed(1)}h</div>
                <div className="text-xs text-green-600">Social</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl">📱</div>
                <div className="font-semibold text-orange-600">{patterns.average_screen.toFixed(1)}h</div>
                <div className="text-xs text-orange-600">Screen</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl">⚡</div>
                <div className="font-semibold text-yellow-600">{patterns.average_energy.toFixed(1)}</div>
                <div className="text-xs text-yellow-600">Energy</div>
              </div>
            </div>

            {/* Optimal Work Time */}
            {patterns.optimal_work_time && (
              <Alert>
                <AlertDescription className="flex items-center gap-2">
                  <span className="text-lg">🎯</span>
                  <span>
                    <strong>Optimal Work Time:</strong> {patterns.optimal_work_time} - 
                    This is when your energy levels are typically highest!
                  </span>
                </AlertDescription>
              </Alert>
            )}

            {/* Break Suggestions from Patterns */}
            {patterns.break_suggestions.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700">💡 General Recommendations</h4>
                <div className="space-y-2">
                  {patterns.break_suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <span className="text-lg">💡</span>
                      <p className="text-sm text-blue-800">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Personalized Break Suggestions */}
      {breakSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎯 Personalized Break Suggestions
            </CardTitle>
            <CardDescription>
              Smart recommendations based on your activity patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {breakSuggestions.map((suggestion, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100"
                >
                  <div className="text-2xl">
                    {getActivityTypeEmoji(suggestion.activity_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-indigo-700">
                        {suggestion.suggested_time}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {getActivityTypeLabel(suggestion.activity_type)}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          suggestion.confidence >= 0.8 ? 'text-green-600 border-green-600' :
                          suggestion.confidence >= 0.6 ? 'text-yellow-600 border-yellow-600' :
                          'text-gray-600 border-gray-600'
                        }`}
                      >
                        {Math.round(suggestion.confidence * 100)}% confidence
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700">{suggestion.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Tips */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ✨ Quick Tips for Better Well-being
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span>😴</span>
                <span><strong>Sleep:</strong> Aim for 7-9 hours for optimal recovery</span>
              </div>
              <div className="flex items-center gap-2">
                <span>💼</span>
                <span><strong>Work:</strong> Take breaks every 90 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <span>👥</span>
                <span><strong>Social:</strong> Quality time boosts emotional energy</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span>📱</span>
                <span><strong>Screen:</strong> Follow the 20-20-20 rule</span>
              </div>
              <div className="flex items-center gap-2">
                <span>⚡</span>
                <span><strong>Energy:</strong> Track patterns to optimize your day</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🏃</span>
                <span><strong>Movement:</strong> Even short walks make a difference</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
