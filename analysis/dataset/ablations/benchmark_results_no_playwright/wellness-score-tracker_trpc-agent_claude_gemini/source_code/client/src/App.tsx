import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { WellnessForm } from '@/components/WellnessForm';
import { WellnessHistory } from '@/components/WellnessHistory';
import { WellnessTrends } from '@/components/WellnessTrends';
import type { WellnessEntry, WellnessTrend, CreateWellnessEntryInput } from '../../server/src/schema';
import './App.css';

// User ID for this wellness tracking session
const DEMO_USER_ID = 1;

function App() {
  const [wellnessEntries, setWellnessEntries] = useState<WellnessEntry[]>([]);
  const [wellnessTrends, setWellnessTrends] = useState<WellnessTrend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTrends, setIsLoadingTrends] = useState(false);
  const [isDeletingEntry, setIsDeletingEntry] = useState(false);

  // Load wellness entries
  const loadWellnessEntries = useCallback(async () => {
    try {
      const result = await trpc.getWellnessEntries.query({
        user_id: DEMO_USER_ID,
        limit: 30 // Last 30 entries
      });
      setWellnessEntries(result);
    } catch (error) {
      console.error('Failed to load wellness entries:', error);
    }
  }, []);

  // Load wellness trends for visualization
  const loadWellnessTrends = useCallback(async () => {
    setIsLoadingTrends(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30); // Last 30 days
      
      const result = await trpc.getWellnessTrends.query({
        user_id: DEMO_USER_ID,
        start_date: startDate,
        end_date: endDate
      });
      setWellnessTrends(result);
    } catch (error) {
      console.error('Failed to load wellness trends:', error);
    } finally {
      setIsLoadingTrends(false);
    }
  }, []);

  useEffect(() => {
    loadWellnessEntries();
    loadWellnessTrends();
  }, [loadWellnessEntries, loadWellnessTrends]);

  const handleCreateEntry = async (formData: CreateWellnessEntryInput) => {
    setIsLoading(true);
    try {
      const response = await trpc.createWellnessEntry.mutate(formData);
      setWellnessEntries((prev: WellnessEntry[]) => [response, ...prev]);
      // Reload trends to include new entry
      loadWellnessTrends();
      return response;
    } catch (error) {
      console.error('Failed to create wellness entry:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId: number) => {
    setIsDeletingEntry(true);
    try {
      await trpc.deleteWellnessEntry.mutate({
        id: entryId,
        user_id: DEMO_USER_ID
      });
      setWellnessEntries((prev: WellnessEntry[]) => 
        prev.filter(entry => entry.id !== entryId)
      );
      // Reload trends after deletion
      loadWellnessTrends();
    } catch (error) {
      console.error('Failed to delete wellness entry:', error);
    } finally {
      setIsDeletingEntry(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="wellness-title text-4xl font-bold text-gray-800 mb-2">🌟 Wellness Tracker</h1>
          <p className="text-gray-600 text-lg">Track your daily wellness and discover patterns in your health journey</p>
          <p className="text-sm text-gray-500 mt-2">Monitor sleep, stress, caffeine, and alcohol to optimize your wellbeing</p>
        </div>

        <Tabs defaultValue="today" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today">📝 Today's Entry</TabsTrigger>
            <TabsTrigger value="history">📊 History</TabsTrigger>
            <TabsTrigger value="trends">📈 Trends</TabsTrigger>
          </TabsList>

          {/* Today's Entry Tab */}
          <TabsContent value="today">
            <WellnessForm
              onSubmit={handleCreateEntry}
              isLoading={isLoading}
              userId={DEMO_USER_ID}
            />
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <WellnessHistory
              entries={wellnessEntries}
              onDeleteEntry={handleDeleteEntry}
              isDeleting={isDeletingEntry}
            />
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends">
            <WellnessTrends
              trends={wellnessTrends}
              isLoading={isLoadingTrends}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
