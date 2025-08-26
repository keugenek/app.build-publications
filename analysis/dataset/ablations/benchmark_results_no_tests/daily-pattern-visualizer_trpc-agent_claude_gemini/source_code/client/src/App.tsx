import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Coffee, Play, Square, TrendingUp, Calendar } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { MetricsForm } from './components/MetricsForm';
import { MetricsChart } from './components/MetricsChart';
import { WorkSession } from './components/WorkSession';
// Using type-only imports for better TypeScript compliance
import type { 
  DailyMetrics, 
  CreateDailyMetricsInput, 
  BreakAlert, 
  WorkSession as WorkSessionType 
} from '../../server/src/schema';

function App() {
  // State for daily metrics
  const [todayMetrics, setTodayMetrics] = useState<DailyMetrics | null>(null);
  const [weeklyMetrics, setWeeklyMetrics] = useState<DailyMetrics[]>([]);
  const [breakAlert, setBreakAlert] = useState<BreakAlert | null>(null);
  const [activeWorkSession, setActiveWorkSession] = useState<WorkSessionType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Get date range for current week (last 7 days)
  const getWeekRange = useCallback(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6); // Last 7 days including today
    
    return {
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0]
    };
  }, []);

  // Load today's metrics
  const loadTodayMetrics = useCallback(async () => {
    try {
      const result = await trpc.getDailyMetricsByDate.query({ date: today });
      setTodayMetrics(result);
    } catch (error) {
      console.log('No metrics for today yet:', error);
      setTodayMetrics(null);
    }
  }, [today]);

  // Load weekly metrics for visualization
  const loadWeeklyMetrics = useCallback(async () => {
    try {
      const range = getWeekRange();
      const result = await trpc.getMetricsByDateRange.query(range);
      setWeeklyMetrics(result);
    } catch (error) {
      console.error('Failed to load weekly metrics:', error);
      setWeeklyMetrics([]);
    }
  }, [getWeekRange]);

  // Load break alert status
  const loadBreakAlert = useCallback(async () => {
    try {
      const result = await trpc.checkBreakAlert.query();
      setBreakAlert(result);
    } catch (error) {
      console.error('Failed to load break alert:', error);
    }
  }, []);

  // Load active work session
  const loadActiveWorkSession = useCallback(async () => {
    try {
      const result = await trpc.getActiveWorkSession.query();
      setActiveWorkSession(result);
    } catch (error) {
      console.log('No active work session:', error);
      setActiveWorkSession(null);
    }
  }, []);

  // Load all data
  const loadData = useCallback(async () => {
    await Promise.all([
      loadTodayMetrics(),
      loadWeeklyMetrics(),
      loadBreakAlert(),
      loadActiveWorkSession()
    ]);
  }, [loadTodayMetrics, loadWeeklyMetrics, loadBreakAlert, loadActiveWorkSession]);

  useEffect(() => {
    loadData();
    
    // Set up periodic refresh for break alerts and work sessions
    const interval = setInterval(() => {
      loadBreakAlert();
      loadActiveWorkSession();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [loadData, loadBreakAlert, loadActiveWorkSession]);

  // Handle metrics form submission
  const handleMetricsSubmit = async (data: CreateDailyMetricsInput) => {
    setIsLoading(true);
    try {
      await trpc.createDailyMetrics.mutate(data);
      await loadTodayMetrics();
      await loadWeeklyMetrics(); // Refresh weekly view
    } catch (error) {
      console.error('Failed to create metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Start work session
  const handleStartWork = async () => {
    try {
      await trpc.startWorkSession.mutate({ is_break: false });
      await loadActiveWorkSession();
      await loadBreakAlert();
    } catch (error) {
      console.error('Failed to start work session:', error);
    }
  };

  // Start break
  const handleStartBreak = async () => {
    try {
      // End current work session if active
      if (activeWorkSession && !activeWorkSession.is_break) {
        await trpc.endWorkSession.mutate({ id: activeWorkSession.id });
      }
      // Start break session
      await trpc.startWorkSession.mutate({ is_break: true });
      await loadActiveWorkSession();
      await loadBreakAlert();
    } catch (error) {
      console.error('Failed to start break:', error);
    }
  };

  // End current session
  const handleEndSession = async () => {
    if (!activeWorkSession) return;
    
    try {
      await trpc.endWorkSession.mutate({ id: activeWorkSession.id });
      await loadActiveWorkSession();
      await loadBreakAlert();
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-800 flex items-center justify-center gap-2">
            <TrendingUp className="w-8 h-8 text-indigo-600" />
            Personal Dashboard
          </h1>
          <p className="text-gray-600">Track your daily metrics and optimize your well-being</p>
          <p className="text-sm text-gray-500">
            Today is {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Break Alert */}
        {breakAlert?.should_take_break && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="flex items-center justify-between">
                <div>
                  <strong>Time for a break! 🧘‍♂️</strong>
                  <p className="mt-1">{breakAlert.message}</p>
                  <p className="text-sm">Continuous work: {breakAlert.continuous_work_hours.toFixed(1)} hours</p>
                </div>
                <Button 
                  onClick={handleStartBreak}
                  variant="outline" 
                  size="sm"
                  className="ml-4 border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  <Coffee className="w-4 h-4 mr-2" />
                  Take Break
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Work Session Controls */}
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-green-800 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Work Session Tracker
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WorkSession
              activeSession={activeWorkSession}
              onStartWork={handleStartWork}
              onStartBreak={handleStartBreak}
              onEndSession={handleEndSession}
            />
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="today" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="today" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
              Today's Metrics
            </TabsTrigger>
            <TabsTrigger value="weekly" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
              Weekly View
            </TabsTrigger>
            <TabsTrigger value="trends" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
              Trends
            </TabsTrigger>
          </TabsList>

          {/* Today's Metrics Tab */}
          <TabsContent value="today" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Metrics Form */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-indigo-700">📊 Daily Metrics Entry</CardTitle>
                </CardHeader>
                <CardContent>
                  <MetricsForm
                    onSubmit={handleMetricsSubmit}
                    isLoading={isLoading}
                    initialData={todayMetrics}
                    date={today}
                  />
                </CardContent>
              </Card>

              {/* Today's Summary */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-indigo-700">📈 Today's Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {todayMetrics ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-700">
                            {todayMetrics.sleep_duration}h
                          </div>
                          <div className="text-sm text-blue-600">😴 Sleep</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-700">
                            {todayMetrics.work_hours}h
                          </div>
                          <div className="text-sm text-green-600">💼 Work</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-700">
                            {todayMetrics.social_interaction_time}h
                          </div>
                          <div className="text-sm text-purple-600">👥 Social</div>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-700">
                            {todayMetrics.screen_time}h
                          </div>
                          <div className="text-sm text-orange-600">📱 Screen</div>
                        </div>
                      </div>
                      
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-3xl font-bold text-yellow-700">
                          {todayMetrics.emotional_energy_level}/10
                        </div>
                        <div className="text-sm text-yellow-600">⚡ Energy Level</div>
                        <div className="flex justify-center mt-2">
                          <Badge variant={
                            todayMetrics.emotional_energy_level >= 8 ? 'default' :
                            todayMetrics.emotional_energy_level >= 6 ? 'secondary' : 'destructive'
                          }>
                            {todayMetrics.emotional_energy_level >= 8 ? '🚀 High Energy' :
                             todayMetrics.emotional_energy_level >= 6 ? '😊 Good Energy' : '😴 Low Energy'}
                          </Badge>
                        </div>
                      </div>

                      {todayMetrics.notes && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <h4 className="font-medium text-gray-700 mb-2">📝 Notes</h4>
                          <p className="text-gray-600 text-sm">{todayMetrics.notes}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No metrics recorded for today yet.</p>
                      <p className="text-sm">Fill out the form to track your daily metrics! 📊</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Weekly View Tab */}
          <TabsContent value="weekly">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-indigo-700">📅 Weekly Overview (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                {weeklyMetrics.length > 0 ? (
                  <MetricsChart data={weeklyMetrics} />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">No weekly data available yet</p>
                    <p>Start tracking your daily metrics to see trends and patterns! 📈</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-indigo-700">🎯 Weekly Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  {weeklyMetrics.length > 0 ? (
                    <div className="space-y-4">
                      {(() => {
                        const avgSleep = weeklyMetrics.reduce((sum, m) => sum + m.sleep_duration, 0) / weeklyMetrics.length;
                        const avgWork = weeklyMetrics.reduce((sum, m) => sum + m.work_hours, 0) / weeklyMetrics.length;
                        const avgEnergy = weeklyMetrics.reduce((sum, m) => sum + m.emotional_energy_level, 0) / weeklyMetrics.length;
                        const avgScreen = weeklyMetrics.reduce((sum, m) => sum + m.screen_time, 0) / weeklyMetrics.length;
                        
                        return (
                          <>
                            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                              <span className="text-blue-700">😴 Average Sleep</span>
                              <span className="font-bold text-blue-800">{avgSleep.toFixed(1)}h</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                              <span className="text-green-700">💼 Average Work</span>
                              <span className="font-bold text-green-800">{avgWork.toFixed(1)}h</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                              <span className="text-yellow-700">⚡ Average Energy</span>
                              <span className="font-bold text-yellow-800">{avgEnergy.toFixed(1)}/10</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                              <span className="text-orange-700">📱 Average Screen Time</span>
                              <span className="font-bold text-orange-800">{avgScreen.toFixed(1)}h</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>Track more days to see insights! 💡</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-indigo-700">💡 Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-800">🌙 Sleep Quality</h4>
                      <p className="text-sm text-green-700">Aim for 7-9 hours of sleep per night for optimal recovery.</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-800">⚡ Energy Management</h4>
                      <p className="text-sm text-blue-700">Take regular breaks every 2-3 hours during work to maintain energy.</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-purple-800">👥 Social Balance</h4>
                      <p className="text-sm text-purple-700">Social interaction boosts mood and cognitive function.</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <h4 className="font-medium text-orange-800">📱 Screen Time</h4>
                      <p className="text-sm text-orange-700">Consider screen breaks to reduce eye strain and improve focus.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
