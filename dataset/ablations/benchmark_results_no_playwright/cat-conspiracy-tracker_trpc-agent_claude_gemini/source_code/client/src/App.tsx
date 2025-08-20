import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { ConspiracyMeter } from '@/components/ConspiracyMeter';
import { ActivityLog } from '@/components/ActivityLog';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SuccessAlert } from '@/components/SuccessAlert';
import { trpc } from '@/utils/trpc';
import type { 
  Cat, 
  ActivityType, 
  CreateCatInput, 
  LogSuspiciousActivityInput, 
  ExpandedSuspiciousActivity,
  DailyConspiracyLevel 
} from '../../server/src/schema';

function App() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [suspiciousActivities, setSuspiciousActivities] = useState<ExpandedSuspiciousActivity[]>([]);
  const [conspiracyLevel, setConspiracyLevel] = useState<DailyConspiracyLevel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Form states
  const [catFormData, setCatFormData] = useState<CreateCatInput>({
    name: '',
    description: null
  });

  const [activityFormData, setActivityFormData] = useState<LogSuspiciousActivityInput>({
    cat_id: 0,
    activity_type_id: 0,
    notes: null,
    activity_date: new Date().toISOString().split('T')[0]
  });

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      const [catsResult, activityTypesResult, activitiesResult] = await Promise.all([
        trpc.getCats.query(),
        trpc.getActivityTypes.query(),
        trpc.getSuspiciousActivities.query({ date: selectedDate })
      ]);
      
      setCats(catsResult);
      setActivityTypes(activityTypesResult);
      setSuspiciousActivities(activitiesResult);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsInitialLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load conspiracy level when cat is selected
  useEffect(() => {
    const loadConspiracyLevel = async () => {
      if (activityFormData.cat_id > 0) {
        try {
          const level = await trpc.getDailyConspiracyLevel.query({
            cat_id: activityFormData.cat_id,
            date: selectedDate
          });
          setConspiracyLevel(level);
        } catch (error) {
          console.error('Failed to load conspiracy level:', error);
          setConspiracyLevel(null);
        }
      } else {
        setConspiracyLevel(null);
      }
    };
    
    loadConspiracyLevel();
  }, [activityFormData.cat_id, selectedDate]);

  const handleCreateCat = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newCat = await trpc.createCat.mutate(catFormData);
      setCats((prev: Cat[]) => [...prev, newCat]);
      setCatFormData({ name: '', description: null });
      setSuccessMessage(`🎉 ${newCat.name} has been added to the surveillance network!`);
      setShowSuccess(true);
    } catch (error) {
      console.error('Failed to create cat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activityFormData.cat_id === 0 || activityFormData.activity_type_id === 0) {
      return;
    }
    
    setIsLoading(true);
    try {
      await trpc.logSuspiciousActivity.mutate(activityFormData);
      // Reload activities and conspiracy level
      const activitiesResult = await trpc.getSuspiciousActivities.query({ date: selectedDate });
      setSuspiciousActivities(activitiesResult);
      
      if (activityFormData.cat_id > 0) {
        const level = await trpc.getDailyConspiracyLevel.query({
          cat_id: activityFormData.cat_id,
          date: selectedDate
        });
        setConspiracyLevel(level);
      }
      
      setActivityFormData((prev: LogSuspiciousActivityInput) => ({
        ...prev,
        activity_type_id: 0,
        notes: null
      }));
      
      const activityType = activityTypes.find(at => at.id === activityFormData.activity_type_id);
      setSuccessMessage(`🚨 Suspicious activity logged! ${activityType?.name} (+${activityType?.suspicion_points} conspiracy points)`);
      setShowSuccess(true);
    } catch (error) {
      console.error('Failed to log activity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedDefaultActivities = async () => {
    setIsLoading(true);
    try {
      await trpc.seedDefaultActivities.mutate();
      const result = await trpc.getActivityTypes.query();
      setActivityTypes(result);
      setSuccessMessage('🌱 Default suspicious activities have been loaded! Ready to track conspiracies!');
      setShowSuccess(true);
    } catch (error) {
      console.error('Failed to seed activities:', error);
    } finally {
      setIsLoading(false);
    }
  };



  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <LoadingSpinner message="Initializing Surveillance System..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8 relative">
          <div className="absolute inset-0 cat-pattern opacity-20"></div>
          <div className="relative z-10 space-y-4">
            <h1 className="text-5xl font-bold gradient-text mb-4">
              🕵️ Feline Conspiracy Tracker 🐱
            </h1>
            <p className="text-xl text-purple-600 mb-2">
              Monitor your cat's suspicious activities and calculate their daily conspiracy level!
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-purple-500">
              <span>🎯 Track Activities</span>
              <span>📊 Calculate Threat Levels</span>
              <span>🚨 Prevent World Domination</span>
            </div>
          </div>
        </div>

        {/* Success Notifications */}
        <div className="fixed top-4 right-4 z-50">
          <SuccessAlert
            message={successMessage}
            show={showSuccess}
            onHide={() => setShowSuccess(false)}
          />
        </div>

        {/* Date Selector */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📅 Investigation Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedDate(e.target.value)}
              className="max-w-xs"
            />
          </CardContent>
        </Card>

        <Tabs defaultValue="monitor" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="monitor">🔍 Monitor Activities</TabsTrigger>
            <TabsTrigger value="manage">📝 Manage Cats</TabsTrigger>
            <TabsTrigger value="activities">⚙️ Activity Types</TabsTrigger>
          </TabsList>

          {/* Monitor Tab */}
          <TabsContent value="monitor" className="space-y-6">
            {/* Conspiracy Level Display */}
            {conspiracyLevel && (
              <ConspiracyMeter conspiracyLevel={conspiracyLevel} />
            )}

            {/* Activity Logging Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🚨 Log Suspicious Activity
                </CardTitle>
                <CardDescription>
                  Caught your cat doing something suspicious? Log it here!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogActivity} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Suspect Cat 🐱</label>
                      <Select
                        value={activityFormData.cat_id.toString()}
                        onValueChange={(value: string) =>
                          setActivityFormData((prev: LogSuspiciousActivityInput) => ({
                            ...prev,
                            cat_id: parseInt(value) || 0
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a cat to investigate" />
                        </SelectTrigger>
                        <SelectContent>
                          {cats.map((cat: Cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Suspicious Activity 🕵️</label>
                      <Select
                        value={activityFormData.activity_type_id.toString()}
                        onValueChange={(value: string) =>
                          setActivityFormData((prev: LogSuspiciousActivityInput) => ({
                            ...prev,
                            activity_type_id: parseInt(value) || 0
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="What did they do?" />
                        </SelectTrigger>
                        <SelectContent>
                          {activityTypes.map((activity: ActivityType) => (
                            <SelectItem key={activity.id} value={activity.id.toString()}>
                              {activity.name} ({activity.suspicion_points} pts)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Activity Date 📅</label>
                    <Input
                      type="date"
                      value={activityFormData.activity_date}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setActivityFormData((prev: LogSuspiciousActivityInput) => ({
                          ...prev,
                          activity_date: e.target.value
                        }))
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Additional Evidence 📝</label>
                    <Textarea
                      placeholder="Any additional details about this suspicious behavior..."
                      value={activityFormData.notes || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setActivityFormData((prev: LogSuspiciousActivityInput) => ({
                          ...prev,
                          notes: e.target.value || null
                        }))
                      }
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || activityFormData.cat_id === 0 || activityFormData.activity_type_id === 0}
                    className="w-full bg-purple-600 hover:bg-purple-700 cat-button text-lg py-6"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <span className="animate-spin">🔄</span>
                        Logging Evidence...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="animate-pulse">🚨</span>
                        Log Suspicious Activity
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <ActivityLog activities={suspiciousActivities} selectedDate={selectedDate} />
          </TabsContent>

          {/* Manage Cats Tab */}
          <TabsContent value="manage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🐱 Register New Cat
                </CardTitle>
                <CardDescription>
                  Add a new suspect to your surveillance network
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateCat} className="space-y-4">
                  <Input
                    placeholder="Cat name (e.g., Mr. Whiskers)"
                    value={catFormData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCatFormData((prev: CreateCatInput) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                  <Textarea
                    placeholder="Physical description and known behavioral patterns..."
                    value={catFormData.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setCatFormData((prev: CreateCatInput) => ({
                        ...prev,
                        description: e.target.value || null
                      }))
                    }
                  />
                  <Button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700 cat-button">
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <span className="animate-spin">🔄</span>
                        Registering Cat...
                      </div>
                    ) : (
                      '📝 Register Cat'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🗂️ Registered Cats
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cats.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      No cats registered yet. Add some suspects to start monitoring! 🕵️
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid gap-3">
                    {cats.map((cat: Cat) => (
                      <div key={cat.id} className="border rounded-lg p-3 bg-gray-50">
                        <h3 className="font-medium text-purple-800 mb-1">
                          {cat.name}
                        </h3>
                        {cat.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {cat.description}
                          </p>
                        )}
                        <div className="text-xs text-gray-500">
                          Registered: {cat.created_at.toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Types Tab */}
          <TabsContent value="activities" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ⚙️ Suspicious Activity Types
                </CardTitle>
                <CardDescription>
                  Predefined suspicious behaviors and their conspiracy point values
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activityTypes.length === 0 ? (
                  <div className="space-y-4">
                    <Alert>
                      <AlertDescription>
                        No activity types loaded. Click below to seed the database with default suspicious activities!
                      </AlertDescription>
                    </Alert>
                    <Button
                      onClick={handleSeedDefaultActivities}
                      disabled={isLoading}
                      className="bg-purple-600 hover:bg-purple-700 cat-button"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <span className="animate-spin">🔄</span>
                          Seeding Activities...
                        </div>
                      ) : (
                        '🌱 Load Default Activities'
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {activityTypes.map((activity: ActivityType) => (
                      <div key={activity.id} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-purple-800">
                            {activity.name}
                          </h3>
                          <Badge className="bg-purple-100 text-purple-800">
                            {activity.suspicion_points} pts
                          </Badge>
                        </div>
                        {activity.description && (
                          <p className="text-sm text-gray-600">
                            {activity.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Fun Footer */}
        <div className="mt-12 text-center py-8 border-t border-purple-200 bg-white/50 rounded-lg">
          <p className="text-purple-600 text-sm mb-2">
            ⚠️ <strong>Disclaimer:</strong> This application is for entertainment purposes only. 
            No actual cat conspiracies have been confirmed... yet. 🤔
          </p>
          <p className="text-xs text-gray-500">
            Remember: Trust no cat. They're always plotting something. 🐱‍💻
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
