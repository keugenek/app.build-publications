import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { 
  CatProfile, 
  CreateCatProfileInput, 
  LogCatActivityInput, 
  DailyConspiracyReport,
  CatActivityType 
} from '../../server/src/schema';

// Activity descriptions for better UX
const ACTIVITY_DESCRIPTIONS = {
  prolonged_staring: "Staring intensely at you or walls for extended periods 👁️",
  bringing_gifts: "Bringing dead insects, toys, or 'presents' to you 🎁",
  knocking_items: "Deliberately knocking items off counters or tables 📱",
  sudden_zoomies: "Random bursts of hyperactive running around 🏃",
  vocalizing_at_objects: "Meowing or talking to inanimate objects 🗣️",
  hiding_under_furniture: "Spending suspicious time under beds or couches 🫥",
  sitting_in_boxes: "Claiming boxes as territory or portals 📦",
  midnight_meetings: "Mysterious nighttime activities and sounds 🌙",
  suspicious_purring: "Purring while staring directly at you 😺",
  ignoring_humans: "Complete indifference to your existence 🙄"
} as const;

const CONSPIRACY_LEVEL_COLORS = {
  innocent: 'bg-green-100 text-green-800',
  suspicious: 'bg-yellow-100 text-yellow-800',
  plotting: 'bg-orange-100 text-orange-800',
  dangerous: 'bg-red-100 text-red-800',
  world_domination: 'bg-purple-100 text-purple-800'
} as const;

const CONSPIRACY_LEVEL_EMOJIS = {
  innocent: '😇',
  suspicious: '🤔',
  plotting: '😈',
  dangerous: '🚨',
  world_domination: '👑'
} as const;

function App() {
  const [cats, setCats] = useState<CatProfile[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [todaysReport, setTodaysReport] = useState<DailyConspiracyReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCatForm, setShowCatForm] = useState(false);

  // Cat profile form state
  const [catFormData, setCatFormData] = useState<CreateCatProfileInput>({
    name: '',
    breed: null,
    color: null,
    age_years: undefined,
    suspicion_level: 'medium'
  });

  // Activity logging form state
  const [activityFormData, setActivityFormData] = useState<LogCatActivityInput>({
    cat_id: 0,
    activity_type: 'prolonged_staring',
    description: null,
    occurred_at: undefined
  });

  const loadCats = useCallback(async () => {
    try {
      const result = await trpc.getCatProfiles.query();
      setCats(result);
      
      // Auto-select first cat if none selected
      if (result.length > 0 && !selectedCatId) {
        setSelectedCatId(result[0].id);
      }
    } catch (error) {
      console.error('Failed to load cats:', error);
    }
  }, [selectedCatId]);

  const loadTodaysReport = useCallback(async () => {
    if (!selectedCatId) return;
    
    try {
      const result = await trpc.getTodaysConspiracyReport.query({ cat_id: selectedCatId });
      setTodaysReport(result);
    } catch (error) {
      console.error('Failed to load today\'s report:', error);
    }
  }, [selectedCatId]);

  useEffect(() => {
    loadCats();
  }, [loadCats]);

  useEffect(() => {
    loadTodaysReport();
  }, [loadTodaysReport]);

  const handleCreateCat = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newCat = await trpc.createCatProfile.mutate(catFormData);
      setCats((prev: CatProfile[]) => [...prev, newCat]);
      setSelectedCatId(newCat.id);
      setCatFormData({
        name: '',
        breed: null,
        color: null,
        age_years: undefined,
        suspicion_level: 'medium'
      });
      setShowCatForm(false);
    } catch (error) {
      console.error('Failed to create cat profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatId) return;
    
    setIsLoading(true);
    try {
      const activityData = {
        ...activityFormData,
        cat_id: selectedCatId
      };
      
      await trpc.logCatActivity.mutate(activityData);
      
      // Reset form
      setActivityFormData({
        cat_id: selectedCatId,
        activity_type: 'prolonged_staring',
        description: null,
        occurred_at: undefined
      });
      
      // Reload today's report
      await loadTodaysReport();
    } catch (error) {
      console.error('Failed to log activity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCat = cats.find((cat: CatProfile) => cat.id === selectedCatId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="container mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-2">
            🕵️ Cat Conspiracy Tracker 🐱
          </h1>
          <p className="text-gray-600">
            Monitor your feline overlord's suspicious activities and uncover their secret plots!
          </p>
        </div>

        {/* Cat Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🐾 Select Your Suspect
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              {cats.length > 0 ? (
                <div className="flex-1">
                  <Label htmlFor="cat-select">Choose cat to monitor:</Label>
                  <Select 
                    value={selectedCatId?.toString() || ''} 
                    onValueChange={(value: string) => setSelectedCatId(parseInt(value))}
                  >
                    <SelectTrigger id="cat-select">
                      <SelectValue placeholder="Select a cat" />
                    </SelectTrigger>
                    <SelectContent>
                      {cats.map((cat: CatProfile) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name} - {cat.suspicion_level} suspicion
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="flex-1">
                  <Alert>
                    <AlertDescription>
                      No cats registered yet! Add your first feline suspect below.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              <Button 
                onClick={() => setShowCatForm(!showCatForm)}
                variant={showCatForm ? "secondary" : "default"}
              >
                {showCatForm ? 'Cancel' : '+ Add Cat'}
              </Button>
            </div>

            {/* Cat Registration Form */}
            {showCatForm && (
              <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                <h3 className="text-lg font-semibold mb-4">Register New Suspect</h3>
                <form onSubmit={handleCreateCat} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cat-name">Name *</Label>
                      <Input
                        id="cat-name"
                        value={catFormData.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCatFormData((prev: CreateCatProfileInput) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder="Whiskers, Mittens, Dr. Fluffington..."
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="suspicion-level">Initial Suspicion Level *</Label>
                      <Select 
                        value={catFormData.suspicion_level} 
                        onValueChange={(value: 'low' | 'medium' | 'high' | 'maximum') =>
                          setCatFormData((prev: CreateCatProfileInput) => ({ ...prev, suspicion_level: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low - Seems innocent</SelectItem>
                          <SelectItem value="medium">Medium - Moderately sketchy</SelectItem>
                          <SelectItem value="high">High - Definitely plotting</SelectItem>
                          <SelectItem value="maximum">Maximum - Evil mastermind</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="cat-breed">Breed</Label>
                      <Input
                        id="cat-breed"
                        value={catFormData.breed || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCatFormData((prev: CreateCatProfileInput) => ({ 
                            ...prev, 
                            breed: e.target.value || null 
                          }))
                        }
                        placeholder="Persian, Siamese, Overlord..."
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="cat-color">Color</Label>
                      <Input
                        id="cat-color"
                        value={catFormData.color || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCatFormData((prev: CreateCatProfileInput) => ({ 
                            ...prev, 
                            color: e.target.value || null 
                          }))
                        }
                        placeholder="Black, Orange, Void-colored..."
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Registering...' : 'Register Cat'}
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedCat && (
          <>
            {/* Today's Conspiracy Report */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>📊 Today's Conspiracy Report for {selectedCat.name}</span>
                  {todaysReport && (
                    <Badge className={CONSPIRACY_LEVEL_COLORS[todaysReport.conspiracy_level]}>
                      {CONSPIRACY_LEVEL_EMOJIS[todaysReport.conspiracy_level]} {todaysReport.conspiracy_level.toUpperCase()}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todaysReport ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900">
                        {todaysReport.total_conspiracy_points} Points
                      </div>
                      <p className="text-gray-600 italic mt-2">
                        {todaysReport.level_description}
                      </p>
                    </div>
                    
                    {todaysReport.activities.length > 0 ? (
                      <div>
                        <h4 className="font-semibold mb-3">🕵️ Today's Suspicious Activities:</h4>
                        <div className="space-y-2">
                          {todaysReport.activities.map((activity, index) => (
                            <div key={activity.id || index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                              <div>
                                <span className="font-medium">
                                  {ACTIVITY_DESCRIPTIONS[activity.activity_type].split(' 👁️')[0].split(' 🎁')[0].split(' 📱')[0].split(' 🏃')[0].split(' 🗣️')[0].split(' 🫥')[0].split(' 📦')[0].split(' 🌙')[0].split(' 😺')[0].split(' 🙄')[0]}
                                </span>
                                {activity.description && (
                                  <p className="text-sm text-gray-600">"{activity.description}"</p>
                                )}
                              </div>
                              <Badge variant="secondary">
                                +{activity.conspiracy_points} pts
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-center text-gray-500">
                        No suspicious activities logged today... yet. 🤔
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-gray-500">Loading conspiracy report...</p>
                )}
              </CardContent>
            </Card>

            {/* Activity Logging */}
            <Card>
              <CardHeader>
                <CardTitle>📝 Log Suspicious Activity</CardTitle>
                <CardDescription>
                  Document your cat's latest conspiracy activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogActivity} className="space-y-4">
                  <div>
                    <Label htmlFor="activity-type">Suspicious Activity *</Label>
                    <Select 
                      value={activityFormData.activity_type} 
                      onValueChange={(value: CatActivityType) =>
                        setActivityFormData((prev: LogCatActivityInput) => ({ 
                          ...prev, 
                          activity_type: value 
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ACTIVITY_DESCRIPTIONS).map(([key, description]) => (
                          <SelectItem key={key} value={key}>
                            {description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="activity-description">Additional Details</Label>
                    <Input
                      id="activity-description"
                      value={activityFormData.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setActivityFormData((prev: LogCatActivityInput) => ({ 
                          ...prev, 
                          description: e.target.value || null 
                        }))
                      }
                      placeholder="Describe the suspicious behavior in detail..."
                    />
                  </div>
                  
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Logging Activity...' : '🚨 Log Suspicious Activity'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 space-y-2">
          <Separator />
          <p>
            Remember: They're always watching. Stay vigilant! 👁️‍🗨️
          </p>
          <p className="text-xs">
            Disclaimer: This app is for entertainment purposes. Your cat is probably just being a normal cat... probably. 😸
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
