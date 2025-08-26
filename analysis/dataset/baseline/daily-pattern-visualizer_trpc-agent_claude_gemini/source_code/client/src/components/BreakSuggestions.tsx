import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { DailyLog, BreakSuggestion } from '../../../server/src/schema';

interface BreakSuggestionsProps {
  todayLog: DailyLog | null;
}

export function BreakSuggestions({ todayLog }: BreakSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<BreakSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadSuggestions = useCallback(async (workHours: number, screenTime: number) => {
    try {
      setIsLoading(true);
      const result = await trpc.getBreakSuggestions.query({
        work_hours: workHours,
        screen_time: screenTime
      });
      setSuggestions(result);
    } catch (error) {
      console.error('Failed to load break suggestions:', error);
      setSuggestions(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (todayLog) {
      loadSuggestions(todayLog.work_hours, todayLog.screen_time);
    }
  }, [todayLog, loadSuggestions]);

  const getIntensityLevel = (workHours: number, screenTime: number) => {
    const totalIntensive = workHours + screenTime;
    if (totalIntensive <= 4) return { level: 'Low', color: 'text-green-600', emoji: '😌' };
    if (totalIntensive <= 8) return { level: 'Moderate', color: 'text-yellow-600', emoji: '😐' };
    if (totalIntensive <= 12) return { level: 'High', color: 'text-orange-600', emoji: '😰' };
    return { level: 'Very High', color: 'text-red-600', emoji: '🚨' };
  };

  const getRiskLevel = (workHours: number, screenTime: number) => {
    if (workHours > 10 || screenTime > 8) return 'high';
    if (workHours > 8 || screenTime > 6) return 'medium';
    return 'low';
  };

  if (!todayLog) {
    return (
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur text-center py-12">
        <CardContent>
          <div className="text-6xl mb-4">💡</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Data Available</h3>
          <p className="text-gray-500">
            Log your work hours and screen time first to get personalized break suggestions.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating personalized suggestions...</p>
        </div>
      </div>
    );
  }

  const intensity = getIntensityLevel(todayLog.work_hours, todayLog.screen_time);
  const riskLevel = getRiskLevel(todayLog.work_hours, todayLog.screen_time);

  return (
    <div className="space-y-6">
      {/* Activity Overview */}
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <CardTitle className="text-xl flex items-center gap-2">
            📊 Today's Activity Overview
          </CardTitle>
          <CardDescription className="text-indigo-100">
            Based on your logged work and screen time
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Work Hours */}
            <div className="text-center">
              <div className="text-3xl mb-2">💼</div>
              <div className="text-2xl font-bold text-gray-900">{todayLog.work_hours}</div>
              <div className="text-sm text-gray-600 mb-2">hours worked</div>
              <Progress value={Math.min((todayLog.work_hours / 12) * 100, 100)} className="h-2" />
              <div className="text-xs text-gray-500 mt-1">
                {todayLog.work_hours > 8 ? 'Above recommended' : 'Within limits'}
              </div>
            </div>

            {/* Screen Time */}
            <div className="text-center">
              <div className="text-3xl mb-2">📱</div>
              <div className="text-2xl font-bold text-gray-900">{todayLog.screen_time}</div>
              <div className="text-sm text-gray-600 mb-2">hours screen time</div>
              <Progress value={Math.min((todayLog.screen_time / 10) * 100, 100)} className="h-2" />
              <div className="text-xs text-gray-500 mt-1">
                {todayLog.screen_time > 6 ? 'High usage' : 'Moderate usage'}
              </div>
            </div>

            {/* Intensity Level */}
            <div className="text-center">
              <div className="text-3xl mb-2">{intensity.emoji}</div>
              <div className={`text-2xl font-bold ${intensity.color}`}>{intensity.level}</div>
              <div className="text-sm text-gray-600 mb-2">intensity</div>
              <Progress 
                value={Math.min(((todayLog.work_hours + todayLog.screen_time) / 16) * 100, 100)} 
                className="h-2" 
              />
              <div className="text-xs text-gray-500 mt-1">
                Combined activity level
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessment */}
      {riskLevel !== 'low' && (
        <Alert className={`border-2 ${riskLevel === 'high' ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'}`}>
          <div className="text-xl">{riskLevel === 'high' ? '🚨' : '⚠️'}</div>
          <AlertTitle className={riskLevel === 'high' ? 'text-red-800' : 'text-orange-800'}>
            {riskLevel === 'high' ? 'High Burnout Risk' : 'Moderate Activity Level'}
          </AlertTitle>
          <AlertDescription className={riskLevel === 'high' ? 'text-red-700' : 'text-orange-700'}>
            {riskLevel === 'high' 
              ? 'Your current work and screen time levels are quite high. It\'s important to take regular breaks to avoid burnout and maintain your well-being.'
              : 'You\'re engaging in moderate levels of work and screen time. Consider taking breaks to maintain productivity and health.'
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Break Suggestions */}
      {suggestions && suggestions.suggestions.length > 0 && (
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
          <CardHeader className="bg-gradient-to-r from-green-500 to-teal-600 text-white">
            <CardTitle className="text-xl flex items-center gap-2">
              💡 Personalized Break Suggestions
            </CardTitle>
            <CardDescription className="text-green-100">
              Tailored recommendations based on your activity levels
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-4">
              {suggestions.suggestions.map((suggestion, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:shadow-md transition-shadow"
                >
                  <div className="text-xl mt-1">
                    {index === 0 ? '🏃‍♂️' : 
                     index === 1 ? '🧘‍♀️' : 
                     index === 2 ? '👀' : 
                     index === 3 ? '🥤' : 
                     index === 4 ? '🌿' : '✨'}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800 leading-relaxed">{suggestion}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Break Timer & Guidelines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
            <CardTitle className="flex items-center gap-2">
              ⏰ Break Guidelines
            </CardTitle>
            <CardDescription className="text-blue-100">
              Recommended break schedule
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl">🕐</div>
                <div>
                  <div className="font-semibold text-gray-800">20-20-20 Rule</div>
                  <div className="text-sm text-gray-600">Every 20 minutes, look at something 20 feet away for 20 seconds</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <div className="text-2xl">☕</div>
                <div>
                  <div className="font-semibold text-gray-800">5-minute breaks</div>
                  <div className="text-sm text-gray-600">Take a 5-minute break every hour of work</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl">🚶‍♂️</div>
                <div>
                  <div className="font-semibold text-gray-800">15-minute walks</div>
                  <div className="text-sm text-gray-600">Take longer breaks every 2-3 hours</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
            <CardTitle className="flex items-center gap-2">
              🎯 Health Tips
            </CardTitle>
            <CardDescription className="text-purple-100">
              Maintain your well-being
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Badge className="bg-green-100 text-green-800 border-green-300 mt-1">💪</Badge>
                <div className="text-sm text-gray-700">
                  <strong>Stay Active:</strong> Stand up and stretch regularly to prevent stiffness and improve circulation.
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Badge className="bg-blue-100 text-blue-800 border-blue-300 mt-1">💧</Badge>
                <div className="text-sm text-gray-700">
                  <strong>Stay Hydrated:</strong> Drink water regularly throughout the day to maintain focus and energy.
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 mt-1">👁️</Badge>
                <div className="text-sm text-gray-700">
                  <strong>Eye Care:</strong> Adjust screen brightness and take frequent visual breaks to reduce eye strain.
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Badge className="bg-purple-100 text-purple-800 border-purple-300 mt-1">🧘</Badge>
                <div className="text-sm text-gray-700">
                  <strong>Mental Health:</strong> Practice mindfulness or deep breathing during breaks to reduce stress.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
        <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-900 text-white">
          <CardTitle>🚀 Quick Break Actions</CardTitle>
          <CardDescription className="text-gray-200">
            Start a break right now
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { title: '2-min breathing', emoji: '🧘‍♀️', duration: '2 minutes' },
              { title: '5-min walk', emoji: '🚶‍♂️', duration: '5 minutes' },
              { title: '10-min stretch', emoji: '🤸‍♀️', duration: '10 minutes' },
              { title: '15-min fresh air', emoji: '🌿', duration: '15 minutes' }
            ].map((action, index) => (
              <Button 
                key={index}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <div className="text-2xl">{action.emoji}</div>
                <div className="text-sm font-semibold text-center">{action.title}</div>
                <div className="text-xs text-gray-500">{action.duration}</div>
              </Button>
            ))}
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              💡 <strong>Pro Tip:</strong> Set phone reminders to take regular breaks throughout your day!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
