import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Activity, CreateActivityInput, ConspiracyLevel } from '../../server/src/schema';
import type { z } from 'zod';
import type { suspiciousActivityTypeEnum } from '../../server/src/schema';

// Define the suspicion scores for each activity type
const SUSPICION_SCORES: Record<string, number> = {
  'Prolonged Staring': 5,
  'Midnight Zoomies': 3,
  'Leaving \'Gifts\' (dead insects, toys, etc.)': 10,
  'Silent Judgment': 7,
  'Plotting on the Keyboard': 8
};

// Get conspiracy level message based on score
const getConspiracyMessage = (score: number) => {
  if (score >= 25) return "EXTREMELY SUSPICIOUS - YOUR CAT IS DEFINITELY PLOTTING AGAINST YOU";
  if (score >= 20) return "HIGHLY SUSPICIOUS - YOUR CAT IS DEFINITELY UP TO SOMETHING";
  if (score >= 15) return "QUITE SUSPICIOUS - YOUR CAT HAS SUSPICIOUS INTENT";
  if (score >= 10) return "SOMEWHAT SUSPICIOUS - YOUR CAT IS ACTING FISHY";
  if (score >= 5) return "MILDLY SUSPICIOUS - YOUR CAT IS JUST BEING A CAT";
  return "NOT SUSPICIOUS - YOUR CAT IS AN ANGEL (FOR NOW)";
};

// Get color for conspiracy level badge
const getConspiracyColor = (score: number) => {
  if (score >= 25) return "bg-red-900 text-white";
  if (score >= 20) return "bg-red-700 text-white";
  if (score >= 15) return "bg-orange-600 text-white";
  if (score >= 10) return "bg-yellow-600 text-white";
  if (score >= 5) return "bg-green-600 text-white";
  return "bg-green-300 text-gray-800";
};

function App() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [conspiracyLevel, setConspiracyLevel] = useState<ConspiracyLevel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateActivityInput>({
    description: '',
    activity_type: 'Prolonged Staring'
  });

  const loadActivities = useCallback(async () => {
    try {
      const result = await trpc.getActivities.query();
      setActivities(result);
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  }, []);

  const loadConspiracyLevel = useCallback(async () => {
    try {
      const result = await trpc.getTodaysConspiracyLevel.query();
      setConspiracyLevel(result);
    } catch (error) {
      console.error('Failed to load conspiracy level:', error);
    }
  }, []);

  useEffect(() => {
    loadActivities();
    loadConspiracyLevel();
  }, [loadActivities, loadConspiracyLevel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createActivity.mutate(formData);
      setActivities((prev: Activity[]) => [...prev, response]);
      setFormData({
        description: '',
        activity_type: 'Prolonged Staring'
      });
      // Refresh conspiracy level after adding new activity
      loadConspiracyLevel();
    } catch (error) {
      console.error('Failed to create activity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 mb-2">
            CAT CONSPIRACY DETECTOR
          </h1>
          <p className="text-gray-400 italic">
            Keeping track of your feline overlords since 2023
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Conspiracy Level and Form */}
          <div className="space-y-8">
            {/* Conspiracy Level Card */}
            <Card className="bg-gray-800 border-gray-700 shadow-lg shadow-purple-900/20">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">Today's Conspiracy Level</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                {conspiracyLevel ? (
                  <>
                    <div className="text-6xl font-bold text-purple-400 mb-4">
                      {conspiracyLevel.total_suspicion_score}
                    </div>
                    <Badge className={`${getConspiracyColor(conspiracyLevel.total_suspicion_score)} text-lg py-2 px-4`}>
                      {getConspiracyMessage(conspiracyLevel.total_suspicion_score)}
                    </Badge>
                    <p className="mt-4 text-gray-400 text-sm">
                      As of {conspiracyLevel.date.toLocaleDateString()}
                    </p>
                  </>
                ) : (
                  <p className="text-gray-500">Calculating conspiracy level...</p>
                )}
              </CardContent>
            </Card>

            {/* Activity Form */}
            <Card className="bg-gray-800 border-gray-700 shadow-lg shadow-purple-900/20">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Report Suspicious Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Activity Type</label>
                    <Select 
                      value={formData.activity_type} 
                      onValueChange={(value) => 
                        setFormData((prev) => ({ ...prev, activity_type: value as z.infer<typeof suspiciousActivityTypeEnum> }))
                      }
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 w-full">
                        <SelectValue placeholder="Select activity type" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        {Object.keys(SUSPICION_SCORES).map((activity) => (
                          <SelectItem key={activity} value={activity} className="focus:bg-gray-600">
                            {activity} (+{SUSPICION_SCORES[activity]} suspicion)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Textarea
                      placeholder="Describe the suspicious behavior in detail..."
                      value={formData.description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setFormData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      required
                      className="bg-gray-700 border-gray-600 min-h-[100px]"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-purple-700 hover:bg-purple-600"
                  >
                    {isLoading ? 'Recording...' : 'Record Suspicious Activity'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Activity List */}
          <div>
            <Card className="bg-gray-800 border-gray-700 shadow-lg shadow-purple-900/20 h-full">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Recent Suspicious Activities</CardTitle>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No suspicious activities reported yet. Keep an eye on your feline friend!
                  </p>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {activities.map((activity: Activity) => (
                      <div 
                        key={activity.id} 
                        className="p-4 rounded-lg bg-gray-700/50 border border-gray-600 hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-lg text-purple-300">{activity.activity_type}</h3>
                          <Badge className="bg-purple-900 text-purple-100">
                            +{activity.suspicion_score} suspicion
                          </Badge>
                        </div>
                        <p className="mt-2 text-gray-300">{activity.description}</p>
                        <div className="flex justify-between mt-3 text-sm text-gray-400">
                          <span>{activity.date.toLocaleDateString()}</span>
                          <span>Reported: {activity.created_at.toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>Remember: Your cat is always watching. Always conspiring. Always judging.</p>
          <p className="mt-2">© {new Date().getFullYear()} Cat Conspiracy Detection System</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
