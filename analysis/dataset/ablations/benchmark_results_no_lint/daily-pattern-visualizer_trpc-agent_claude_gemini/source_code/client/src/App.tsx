import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Calendar, TrendingUp, AlertTriangle, BarChart3, Moon, Briefcase, Users, Monitor, Zap } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { WellBeingForm } from '@/components/WellBeingForm';
import { MetricsChart } from '@/components/MetricsChart';
import { BreakSuggestions } from '@/components/BreakSuggestions';
import { WellnessSummary } from '@/components/WellnessSummary';
import type { WellBeingEntry, WellnessSummary as WellnessSummaryType, BreakSuggestion } from '../../server/src/schema';

function App() {
  const [entries, setEntries] = useState<WellBeingEntry[]>([]);
  const [wellnessSummary, setWellnessSummary] = useState<WellnessSummaryType | null>(null);
  const [breakSuggestions, setBreakSuggestions] = useState<BreakSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [summaryPeriod, setSummaryPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  // Load well-being entries
  const loadEntries = useCallback(async () => {
    try {
      const result = await trpc.getWellBeingEntries.query();
      setEntries(result);
    } catch (error) {
      console.error('Failed to load entries:', error);
    }
  }, []);

  // Load wellness summary
  const loadWellnessSummary = useCallback(async () => {
    try {
      const result = await trpc.getWellnessSummary.query(summaryPeriod);
      setWellnessSummary(result);
    } catch (error) {
      console.error('Failed to load wellness summary:', error);
    }
  }, [summaryPeriod]);

  // Load break suggestions
  const loadBreakSuggestions = useCallback(async () => {
    try {
      const result = await trpc.getBreakSuggestions.query();
      setBreakSuggestions(result);
    } catch (error) {
      console.error('Failed to load break suggestions:', error);
    }
  }, []);

  // Initial data loading
  useEffect(() => {
    loadEntries();
    loadWellnessSummary();
    loadBreakSuggestions();
  }, [loadEntries, loadWellnessSummary, loadBreakSuggestions]);

  // Handle new entry creation
  const handleEntryCreate = async (entry: WellBeingEntry) => {
    setEntries((prev: WellBeingEntry[]) => [entry, ...prev]);
    // Refresh summary after new entry
    await loadWellnessSummary();
    await loadBreakSuggestions();
  };

  // Get today's entry for quick stats
  const todaysEntry = entries.find((entry: WellBeingEntry) => {
    const today = new Date().toDateString();
    return entry.date.toDateString() === today;
  });

  // Quick stats for header
  const quickStats = [
    {
      icon: Moon,
      label: 'Sleep',
      value: todaysEntry ? `${todaysEntry.sleep_hours}h` : '--',
      color: 'text-blue-600'
    },
    {
      icon: Briefcase,
      label: 'Work',
      value: todaysEntry ? `${todaysEntry.work_hours}h` : '--',
      color: 'text-orange-600'
    },
    {
      icon: Users,
      label: 'Social',
      value: todaysEntry ? `${todaysEntry.social_time_hours}h` : '--',
      color: 'text-green-600'
    },
    {
      icon: Monitor,
      label: 'Screen',
      value: todaysEntry ? `${todaysEntry.screen_time_hours}h` : '--',
      color: 'text-red-600'
    },
    {
      icon: Zap,
      label: 'Energy',
      value: todaysEntry ? `${todaysEntry.emotional_energy_level}/10` : '--',
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Well-being Dashboard 🌟
            </h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Track your daily well-being metrics and discover patterns to improve your lifestyle. 
            Log your sleep, work, social time, screen time, and energy levels.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {quickStats.map((stat, index) => (
            <Card key={index} className="bg-white/70 backdrop-blur-sm border-white/20">
              <CardContent className="p-4 text-center">
                <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="log" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Log Entry
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Trends
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Suggestions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Wellness Summary */}
              <div className="lg:col-span-2">
                <WellnessSummary 
                  summary={wellnessSummary} 
                  period={summaryPeriod}
                  onPeriodChange={setSummaryPeriod}
                />
              </div>
              
              {/* Break Suggestions Preview */}
              <div>
                <Card className="bg-white/70 backdrop-blur-sm border-white/20 h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      Break Suggestions
                    </CardTitle>
                    <CardDescription>
                      Quick wellness recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {breakSuggestions.length > 0 ? (
                      <div className="space-y-3">
                        {breakSuggestions.slice(0, 3).map((suggestion: BreakSuggestion, index: number) => (
                          <Alert key={index} className="p-3">
                            <AlertTitle className="text-sm flex items-center gap-2">
                              <Badge 
                                variant={suggestion.urgency_level === 'high' ? 'destructive' : 
                                       suggestion.urgency_level === 'medium' ? 'default' : 'secondary'}
                              >
                                {suggestion.urgency_level}
                              </Badge>
                              {suggestion.suggestion_type.replace('_', ' ')}
                            </AlertTitle>
                            <AlertDescription className="text-xs mt-1">
                              {suggestion.message}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No suggestions available</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Recent Entries */}
            <Card className="bg-white/70 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle>Recent Entries</CardTitle>
                <CardDescription>Your latest well-being data</CardDescription>
              </CardHeader>
              <CardContent>
                {entries.length > 0 ? (
                  <div className="space-y-3">
                    {entries.slice(0, 7).map((entry: WellBeingEntry) => (
                      <div key={entry.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">
                            {entry.date.toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-blue-600">💤 {entry.sleep_hours}h</span>
                          <span className="text-orange-600">💼 {entry.work_hours}h</span>
                          <span className="text-green-600">👥 {entry.social_time_hours}h</span>
                          <span className="text-red-600">📱 {entry.screen_time_hours}h</span>
                          <span className="text-purple-600">⚡ {entry.emotional_energy_level}/10</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No entries yet. Start by logging your first well-being entry! 🌟
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="log">
            <WellBeingForm onSuccess={handleEntryCreate} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="trends">
            <MetricsChart entries={entries} />
          </TabsContent>

          <TabsContent value="suggestions">
            <BreakSuggestions suggestions={breakSuggestions} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
