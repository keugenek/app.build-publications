import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Cat, CreateCatInput, Activity, CreateActivityInput, DailyConspiracyLevel } from '../../server/src/schema';

// Predefined suspicious activities with conspiracy scores
const SUSPICIOUS_ACTIVITIES = [
  { type: 'prolonged-staring', label: '👁️ Prolonged Staring at Walls', score: 3 },
  { type: 'dead-insect-gifting', label: '🦗 Gifting Dead Insects', score: 5 },
  { type: 'midnight-zoomies', label: '🏃‍♂️ Midnight Zoomies', score: 4 },
  { type: 'knocking-things-over', label: '🏺 Strategic Item Displacement', score: 6 },
  { type: 'sitting-on-keyboard', label: '⌨️ Keyboard Sabotage', score: 7 },
  { type: 'hiding-under-bed', label: '🛏️ Secret Underground Operations', score: 2 },
  { type: 'meowing-at-nothing', label: '😾 Communicating with Invisible Forces', score: 8 },
  { type: 'bringing-live-prey', label: '🐭 Delivering "Gifts" (Alive)', score: 9 },
  { type: 'stealing-food', label: '🥘 Food Heist Operations', score: 4 },
  { type: 'door-scratching', label: '🚪 Demanding Portal Access', score: 3 },
];

// Conspiracy level descriptions
const getConspiracyDescription = (score: number): { level: string; description: string; emoji: string } => {
  if (score <= 5) return { 
    level: 'Innocent Fluff Ball', 
    description: 'Just a regular cat... or so they want you to think 🤔',
    emoji: '😇'
  };
  if (score <= 15) return { 
    level: 'Mildly Suspicious', 
    description: 'Something fishy is going on... and it\'s not the tuna',
    emoji: '🤨'
  };
  if (score <= 25) return { 
    level: 'Definitely Plotting Something', 
    description: 'The whiskers are twitching with mischievous intent',
    emoji: '😼'
  };
  if (score <= 35) return { 
    level: 'Cat Conspiracy in Progress', 
    description: 'Alert the authorities! Your cat is up to no good',
    emoji: '🕵️‍♀️'
  };
  return { 
    level: 'Plotting World Domination', 
    description: 'It\'s too late... they\'ve already won',
    emoji: '👑'
  };
};

function App() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [conspiracyLevels, setConspiracyLevels] = useState<DailyConspiracyLevel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Cat form state
  const [catFormData, setCatFormData] = useState<CreateCatInput>({
    name: '',
    breed: null,
    age: null,
    description: null
  });

  // Activity form state
  const [activityFormData, setActivityFormData] = useState<CreateActivityInput>({
    cat_id: 0,
    activity_type: '',
    description: null,
    conspiracy_score: 1
  });

  const loadCats = useCallback(async () => {
    try {
      const result = await trpc.getCats.query();
      setCats(result);
    } catch (error) {
      console.error('Failed to load cats:', error);
    }
  }, []);

  const loadActivities = useCallback(async () => {
    try {
      const result = await trpc.getActivities.query({});
      setActivities(result);
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  }, []);

  const loadConspiracyLevels = useCallback(async () => {
    try {
      const result = await trpc.getDailyConspiracyLevel.query({
        date: selectedDate
      });
      setConspiracyLevels(result);
    } catch (error) {
      console.error('Failed to load conspiracy levels:', error);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadCats();
    loadActivities();
    loadConspiracyLevels();
  }, [loadCats, loadActivities, loadConspiracyLevels]);

  const handleCreateCat = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newCat = await trpc.createCat.mutate(catFormData);
      setCats((prev: Cat[]) => [...prev, newCat]);
      setCatFormData({
        name: '',
        breed: null,
        age: null,
        description: null
      });
    } catch (error) {
      console.error('Failed to register cat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activityFormData.cat_id === 0) {
      alert('Please select a cat first!');
      return;
    }
    setIsLoading(true);
    try {
      const newActivity = await trpc.createActivity.mutate(activityFormData);
      setActivities((prev: Activity[]) => [...prev, newActivity]);
      setActivityFormData({
        cat_id: activityFormData.cat_id,
        activity_type: '',
        description: null,
        conspiracy_score: 1
      });
      // Refresh conspiracy levels after adding new activity
      loadConspiracyLevels();
    } catch (error) {
      console.error('Failed to log suspicious activity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivityTypeChange = (activityType: string) => {
    const selectedActivity = SUSPICIOUS_ACTIVITIES.find(a => a.type === activityType);
    setActivityFormData((prev: CreateActivityInput) => ({
      ...prev,
      activity_type: activityType,
      conspiracy_score: selectedActivity?.score || 1
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-800">
            🐱 Cat Conspiracy Tracker 🕵️‍♀️
          </h1>
          <p className="text-lg text-gray-600">
            Because your cat is definitely plotting something... we just need to prove it!
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">🏠 Dashboard</TabsTrigger>
            <TabsTrigger value="cats">😸 My Cats</TabsTrigger>
            <TabsTrigger value="activities">📝 Log Activity</TabsTrigger>
            <TabsTrigger value="analysis">📊 Conspiracy Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>🎯 Quick Stats</CardTitle>
                  <CardDescription>Your feline surveillance summary</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Registered Suspects:</span>
                      <Badge variant="outline">{cats.length} cats</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Recorded Activities:</span>
                      <Badge variant="outline">{activities.length} incidents</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Most Suspicious Activity:</span>
                      <Badge variant="destructive">
                        {activities.length > 0 
                          ? SUSPICIOUS_ACTIVITIES.find(a => 
                              activities.some(act => act.activity_type === a.type)
                            )?.label || 'Various crimes'
                          : 'No evidence yet'
                        }
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>⚠️ Today's Threat Level</CardTitle>
                  <CardDescription>Current conspiracy assessment for {selectedDate}</CardDescription>
                </CardHeader>
                <CardContent>
                  {conspiracyLevels.length === 0 ? (
                    <Alert>
                      <AlertDescription>
                        No suspicious activities detected today... yet. 👀
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-3">
                      {conspiracyLevels.map((level: DailyConspiracyLevel) => {
                        const conspiracy = getConspiracyDescription(level.total_conspiracy_score);
                        return (
                          <div key={level.cat_id} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold">{level.cat_name}</span>
                              <span className="text-2xl">{conspiracy.emoji}</span>
                            </div>
                            <Badge className="mb-2">{conspiracy.level}</Badge>
                            <p className="text-sm text-gray-600 mb-2">{conspiracy.description}</p>
                            <div className="text-xs text-gray-500">
                              Score: {level.total_conspiracy_score} | Activities: {level.activity_count}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="cats" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>📋 Register New Suspect</CardTitle>
                  <CardDescription>Add a new feline to your surveillance list</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateCat} className="space-y-4">
                    <div>
                      <Input
                        placeholder="Cat name (e.g., Mr. Whiskers)"
                        value={catFormData.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCatFormData((prev: CreateCatInput) => ({ ...prev, name: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="Breed (optional)"
                        value={catFormData.breed || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCatFormData((prev: CreateCatInput) => ({
                            ...prev,
                            breed: e.target.value || null
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        placeholder="Age (optional)"
                        value={catFormData.age || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCatFormData((prev: CreateCatInput) => ({
                            ...prev,
                            age: parseInt(e.target.value) || null
                          }))
                        }
                        min="0"
                        max="30"
                      />
                    </div>
                    <div>
                      <Textarea
                        placeholder="Suspicious characteristics (optional)"
                        value={catFormData.description || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setCatFormData((prev: CreateCatInput) => ({
                            ...prev,
                            description: e.target.value || null
                          }))
                        }
                        rows={3}
                      />
                    </div>
                    <Button type="submit" disabled={isLoading} className="w-full">
                      {isLoading ? 'Registering...' : '🔍 Add to Watch List'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>😼 Registered Suspects</CardTitle>
                  <CardDescription>Your current surveillance targets</CardDescription>
                </CardHeader>
                <CardContent>
                  {cats.length === 0 ? (
                    <Alert>
                      <AlertDescription>
                        No cats registered yet. Add your first suspect to start tracking their conspiracy!
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-3">
                      {cats.map((cat: Cat) => (
                        <div key={cat.id} className="border p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{cat.name}</h3>
                            <Badge variant="outline">
                              {cat.age ? `${cat.age}yo` : 'Age unknown'}
                            </Badge>
                          </div>
                          {cat.breed && (
                            <p className="text-sm text-gray-600 mb-1">Breed: {cat.breed}</p>
                          )}
                          {cat.description && (
                            <p className="text-sm text-gray-700 mb-2">"{cat.description}"</p>
                          )}
                          <p className="text-xs text-gray-500">
                            Under surveillance since: {cat.created_at.toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activities" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>🚨 Log Suspicious Activity</CardTitle>
                  <CardDescription>Document the evidence of feline conspiracy</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateActivity} className="space-y-4">
                    <div>
                      <Select
                        value={activityFormData.cat_id.toString()}
                        onValueChange={(value) =>
                          setActivityFormData((prev: CreateActivityInput) => ({
                            ...prev,
                            cat_id: parseInt(value)
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select suspect..." />
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
                      <Select
                        value={activityFormData.activity_type}
                        onValueChange={handleActivityTypeChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="What did they do?" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUSPICIOUS_ACTIVITIES.map((activity) => (
                            <SelectItem key={activity.type} value={activity.type}>
                              {activity.label} (Score: {activity.score})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Textarea
                        placeholder="Additional details about this suspicious incident..."
                        value={activityFormData.description || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setActivityFormData((prev: CreateActivityInput) => ({
                            ...prev,
                            description: e.target.value || null
                          }))
                        }
                        rows={3}
                      />
                    </div>
                    <div>
                      <Input
                        type="datetime-local"
                        value={activityFormData.recorded_at ? activityFormData.recorded_at.toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setActivityFormData((prev: CreateActivityInput) => ({
                            ...prev,
                            recorded_at: new Date(e.target.value)
                          }))
                        }
                      />
                    </div>
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm font-medium mb-1">Conspiracy Score: {activityFormData.conspiracy_score}</p>
                      <p className="text-xs text-gray-600">
                        This activity will add {activityFormData.conspiracy_score} points to today's conspiracy level
                      </p>
                    </div>
                    <Button type="submit" disabled={isLoading || cats.length === 0} className="w-full">
                      {isLoading ? 'Documenting...' : '📝 Log Evidence'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>📚 Recent Activities</CardTitle>
                  <CardDescription>Latest documented suspicious behavior</CardDescription>
                </CardHeader>
                <CardContent>
                  {activities.length === 0 ? (
                    <Alert>
                      <AlertDescription>
                        No activities logged yet. Start documenting your cat's suspicious behavior!
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {activities.slice().reverse().map((activity: Activity) => {
                        const cat = cats.find((c: Cat) => c.id === activity.cat_id);
                        const activityInfo = SUSPICIOUS_ACTIVITIES.find(a => a.type === activity.activity_type);
                        return (
                          <div key={activity.id} className="border p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold">{cat?.name || 'Unknown Cat'}</span>
                              <Badge variant="destructive">Score: {activity.conspiracy_score}</Badge>
                            </div>
                            <p className="text-sm mb-1">
                              {activityInfo?.label || activity.activity_type}
                            </p>
                            {activity.description && (
                              <p className="text-sm text-gray-700 mb-2">"{activity.description}"</p>
                            )}
                            <p className="text-xs text-gray-500">
                              {activity.recorded_at.toLocaleString()}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>📈 Daily Conspiracy Analysis</CardTitle>
                <CardDescription>Deep dive into your cats' suspicious behavior patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedDate(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
                
                {conspiracyLevels.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      No data available for {selectedDate}. Either your cats were well-behaved, or they're getting better at hiding their schemes... 🤔
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid gap-4">
                    {conspiracyLevels.map((level: DailyConspiracyLevel) => {
                      const conspiracy = getConspiracyDescription(level.total_conspiracy_score);
                      return (
                        <Card key={level.cat_id} className="border-l-4 border-l-red-400">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">{level.cat_name}</CardTitle>
                              <span className="text-3xl">{conspiracy.emoji}</span>
                            </div>
                            <CardDescription>{conspiracy.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                              <div>
                                <p className="text-2xl font-bold text-red-600">{level.total_conspiracy_score}</p>
                                <p className="text-sm text-gray-600">Total Score</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-orange-600">{level.activity_count}</p>
                                <p className="text-sm text-gray-600">Activities</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-purple-600">
                                  {level.activity_count > 0 ? (level.total_conspiracy_score / level.activity_count).toFixed(1) : '0'}
                                </p>
                                <p className="text-sm text-gray-600">Avg. Score</p>
                              </div>
                              <div>
                                <Badge className="text-xs">{conspiracy.level}</Badge>
                                <p className="text-sm text-gray-600 mt-1">Threat Level</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
