import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { SuspiciousActivity, CreateSuspiciousActivityInput, DailyConspiracyLevel } from '../../server/src/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Cat, AlertTriangle, Calendar, HelpCircle } from 'lucide-react';
import { ActivityForm } from '@/components/ActivityForm';
import { ConspiracyLevelDisplay } from '@/components/ConspiracyLevelDisplay';
import { SuspiciousActivityCard } from '@/components/SuspiciousActivityCard';

function App() {
  const [activities, setActivities] = useState<SuspiciousActivity[]>([]);
  const [dailyLevel, setDailyLevel] = useState<DailyConspiracyLevel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const loadActivities = useCallback(async () => {    
    setError(null);
    try {
      const result = await trpc.getSuspiciousActivities.query();
      setActivities(result);
    } catch (err) {
      console.error('Failed to load activities:', err);
      setError('Failed to load activities. Please try again later.');
    }
  }, []);

  const loadDailyLevel = useCallback(async () => {
    setError(null);
    try {
      const today = new Date();
      const result = await trpc.getDailyConspiracyLevel.query({ date: today });
      setDailyLevel(result);
    } catch (err) {
      console.error('Failed to load daily level:', err);
      setError('Failed to load daily conspiracy level. Please try again later.');
    }
  }, []);

  useEffect(() => {
    loadActivities();
    loadDailyLevel();
  }, [loadActivities, loadDailyLevel]);

  const handleFormSubmit = async (data: CreateSuspiciousActivityInput) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await trpc.createSuspiciousActivity.mutate(data);
      setActivities(prev => [...prev, response]);
      
      // Reload daily level after adding new activity
      await loadDailyLevel();
    } catch (err) {
      console.error('Failed to create activity:', err);
      setError('Failed to record suspicious activity. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const activityTypeHelp = [
    { type: 'PROLONGED_STARE', description: 'Your cat stares at you intensely for extended periods' },
    { type: 'GIFT_BRINGING', description: 'Your cat brings you "gifts" like dead insects or rodents' },
    { type: 'SUDDEN_PURRING', description: 'Unexpected purring that seems to have a hidden meaning' },
    { type: 'AGGRESSIVE_KNEADING', description: 'Kneading with claws extended, possibly a secret code' },
    { type: 'MIDDLE_OF_NIGHT_ZOOMIES', description: 'Sudden bursts of energy in the middle of the night' },
    { type: 'ATTACKING_INVISIBLE_ENEMIES', description: 'Fighting invisible foes with great intensity' },
    { type: 'SITTING_IN_FRONT_OF_MONITOR', description: 'Blocking your screen while you work' },
    { type: 'KNOCKING_THINGS_OFF_COUNTERS', description: 'Systematically knocking items off surfaces' },
    { type: 'HIDING_AND_POUNCE', description: 'Hiding and then ambushing you unexpectedly' },
    { type: 'CONSTANT_OBSERVATION', description: 'Following your every move with intense scrutiny' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center py-6 md:py-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="relative">
              <Cat className="w-10 h-10 text-purple-600 dark:text-purple-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Feline Conspiracy Tracker
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-4">
            Track your cat's suspicious activities and monitor their daily conspiracy level. 
            Because every cat owner knows their pet is plotting something...
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowHelp(!showHelp)}
            className="mx-auto flex items-center gap-2"
          >
            <HelpCircle className="w-4 h-4" />
            {showHelp ? 'Hide Activity Guide' : 'Show Activity Guide'}
          </Button>
        </header>

        {showHelp && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Suspicious Activity Guide
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activityTypeHelp.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="mt-0.5 text-lg">
                      {index % 3 === 0 ? '🐱' : index % 3 === 1 ? '🐈' : '🐾'}
                    </div>
                    <div>
                      <h3 className="font-medium">{activity.type.replace(/_/g, ' ')}</h3>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Report Suspicious Activity
              </CardTitle>
              <CardDescription>
                Document your cat's nefarious behavior for posterity and conspiracy analysis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityForm onSubmit={handleFormSubmit} isLoading={isLoading} />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <ConspiracyLevelDisplay dailyLevel={dailyLevel} />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  Today's Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-primary">
                      {activities.filter(a => 
                        new Date(a.recorded_at).toDateString() === new Date().toDateString()
                      ).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Activities Today</div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-primary">
                      {activities.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Activities</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cat className="w-5 h-5" />
              Recent Suspicious Activities
            </CardTitle>
            <CardDescription>
              Your cat's documented nefarious activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Cat className="w-16 h-16 mx-auto mb-4 text-muted-foreground/20" />
                <h3 className="text-lg font-medium mb-1">No suspicious activities recorded yet</h3>
                <p className="text-sm">Your cat is currently flying under the radar...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activities
                  .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
                  .map((activity) => (
                    <SuspiciousActivityCard key={activity.id} activity={activity} />
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <footer className="text-center py-6 text-sm text-muted-foreground">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <Cat className="w-4 h-4" />
              <span>Remember: Cats are always watching. Always plotting. Always cuddly.</span>
              <Cat className="w-4 h-4" />
            </div>
            <p>© {new Date().getFullYear()} Feline Conspiracy Tracker</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
