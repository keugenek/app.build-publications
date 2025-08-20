import { useState, useEffect, useCallback } from 'react';
import { trpc } from './utils/trpc';
import type { UserProfile, CreateUserProfileInput, SearchPlayersInput } from '../../server/src/schema';
import { Button } from '@/components/ui/button';
import { SearchForm } from '@/components/SearchForm';
import { UserProfileForm } from '@/components/UserProfileForm';
import { PlayerList } from '@/components/PlayerList';
import { Plus } from 'lucide-react';

function App() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams, setSearchParams] = useState<SearchPlayersInput>({});
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadPlayers = useCallback(async () => {
    try {
      const result = await trpc.getPlayers.query();
      setProfiles(result);
    } catch (error) {
      console.error('Failed to load players:', error);
    }
  }, []);

  const searchPlayers = useCallback(async (params: SearchPlayersInput) => {
    try {
      const result = await trpc.searchPlayers.query(params);
      setProfiles(result);
    } catch (error) {
      console.error('Failed to search players:', error);
    }
  }, []);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  const handleSearch = (params: SearchPlayersInput) => {
    setSearchParams(params);
    searchPlayers(params);
  };

  const handleCreateProfile = async (data: CreateUserProfileInput) => {
    setIsLoading(true);
    try {
      const response = await trpc.createProfile.mutate(data);
      setProfiles(prev => [response, ...prev]);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-green-800 mb-3">
            Tennis Partner Finder
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Connect with tennis players in your area and find the perfect match for your skill level
          </p>
        </header>

        {/* Search Section */}
        <SearchForm searchParams={searchParams} onSearch={handleSearch} />

        {/* Create Profile Section */}
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Tennis Players</h2>
          <Button onClick={() => setShowCreateForm(!showCreateForm)} className="bg-green-600 hover:bg-green-700">
            <Plus className="mr-2 h-4 w-4" />
            {showCreateForm ? 'Cancel' : 'Create Profile'}
          </Button>
        </div>

        {/* Create Profile Form */}
        {showCreateForm && (
          <UserProfileForm onSubmit={handleCreateProfile} isLoading={isLoading} />
        )}

        {/* Players List */}
        <PlayerList profiles={profiles} />

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>
            © {new Date().getFullYear()} Tennis Partner Finder. Connect with players in your community.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
