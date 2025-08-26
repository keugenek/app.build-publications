import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WellnessForm } from '@/components/WellnessForm';
import { WellnessHistory } from '@/components/WellnessHistory';
import { WellnessChart } from '@/components/WellnessChart';
import { trpc } from '@/utils/trpc';
import type { WellnessEntry, CreateWellnessEntryInput } from '../../server/src/schema';

function App() {
  const [entries, setEntries] = useState<WellnessEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('log');

  const loadEntries = useCallback(async () => {
    try {
      const result = await trpc.getWellnessEntries.query();
      setEntries(result);
    } catch (error) {
      console.error('Failed to load entries:', error);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleSubmit = async (data: CreateWellnessEntryInput) => {
    setIsLoading(true);
    try {
      const response = await trpc.createWellnessEntry.mutate(data);
      setEntries((prev: WellnessEntry[]) => [...prev, response]);
      setActiveTab('history');
    } catch (error) {
      console.error('Failed to create entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-indigo-800 mb-2">Wellness Tracker</h1>
          <p className="text-gray-600">Track your daily wellness and monitor trends over time</p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="log">Log Wellness Data</TabsTrigger>
            <TabsTrigger value="history">History & Trends</TabsTrigger>
          </TabsList>
          
          <TabsContent value="log">
            <Card className="shadow-lg">
              <CardContent className="pt-6">
                <WellnessForm onSubmit={handleSubmit} isLoading={isLoading} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history">
            <div className="space-y-6">
              {entries.length > 0 ? (
                <>
                  <WellnessChart entries={entries} />
                  <WellnessHistory entries={entries} />
                </>
              ) : (
                <Card className="shadow-lg text-center py-12">
                  <CardContent>
                    <p className="text-gray-500">No wellness entries yet. Start by logging your first entry!</p>
                    <Button 
                      className="mt-4" 
                      onClick={() => setActiveTab('log')}
                    >
                      Log Your First Entry
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
