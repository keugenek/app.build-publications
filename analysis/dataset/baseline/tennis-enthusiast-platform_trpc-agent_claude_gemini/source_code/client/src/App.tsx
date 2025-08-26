import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlayerCard } from '@/components/PlayerCard';
import { SearchForm } from '@/components/SearchForm';
import { ProfileForm } from '@/components/ProfileForm';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { UserProfile, CreateUserProfileInput, SearchPartnersInput } from '../../server/src/schema';
import './App.css';

function App() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const loadAllProfiles = useCallback(async () => {
    try {
      const result = await trpc.getAllProfiles.query();
      setProfiles(result);
    } catch (error) {
      console.error('Failed to load profiles:', error);
    }
  }, []);

  useEffect(() => {
    loadAllProfiles();
  }, [loadAllProfiles]);

  const handleCreateProfile = async (data: CreateUserProfileInput) => {
    setIsLoading(true);
    try {
      const response = await trpc.createUserProfile.mutate(data);
      setProfiles((prev: UserProfile[]) => [...prev, response]);
      setCurrentUser(response);
    } catch (error) {
      console.error('Failed to create profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (filters: SearchPartnersInput) => {
    setSearchLoading(true);
    try {
      const results = await trpc.searchPartners.query(filters);
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search partners:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleConnect = (profileId: number) => {
    // TODO: Implement connection logic
    console.log('Connecting to profile:', profileId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <header className="border-b border-emerald-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">🎾</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  CourtConnect
                </h1>
                <p className="text-sm text-slate-600">Find your perfect tennis partner</p>
              </div>
            </div>
            {currentUser && (
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <p className="font-semibold text-emerald-700">{currentUser.name}</p>
                  <p className="text-xs text-slate-600">{currentUser.skill_level}</p>
                </div>
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="text-emerald-600 font-semibold text-sm">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="browse" className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 bg-emerald-50 border border-emerald-200">
            <TabsTrigger value="browse" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
              🏆 Browse
            </TabsTrigger>
            <TabsTrigger value="search" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
              🔍 Search
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
              👤 Profile
            </TabsTrigger>
          </TabsList>

          {/* Browse All Players */}
          <TabsContent value="browse" className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-slate-800 gradient-text">All Tennis Players</h2>
              <p className="text-slate-600">Connect with players from around the community</p>
            </div>

            {profiles.length === 0 ? (
              <Card className="border-dashed border-2 border-slate-300 bg-slate-50/50">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4 tennis-bounce">
                    <span className="text-3xl">🎾</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">No players yet</h3>
                  <p className="text-slate-500 text-center mb-4">
                    Be the first to join the community! Create your profile to get started.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {profiles.map((profile: UserProfile) => (
                  <PlayerCard 
                    key={profile.id} 
                    profile={profile} 
                    variant="default"
                    onConnect={handleConnect}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Search Partners */}
          <TabsContent value="search" className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-slate-800 gradient-text">Find Your Match</h2>
              <p className="text-slate-600">Search for players by skill level and location</p>
            </div>

            <SearchForm onSearch={handleSearch} isLoading={searchLoading} />

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-slate-800 flex items-center space-x-2 gradient-text">
                  <span>🎯</span>
                  <span>Search Results ({searchResults.length})</span>
                </h3>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {searchResults.map((profile: UserProfile) => (
                    <PlayerCard 
                      key={profile.id} 
                      profile={profile} 
                      variant="search-result"
                      onConnect={handleConnect}
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Create/Update Profile */}
          <TabsContent value="profile" className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-slate-800 gradient-text">Your Tennis Profile</h2>
              <p className="text-slate-600">Create or update your player profile</p>
            </div>

            <ProfileForm 
              onSubmit={handleCreateProfile} 
              isLoading={isLoading}
              currentUser={currentUser}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="border-t border-emerald-200 bg-white/80 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center space-y-2">
            <p className="text-slate-600">
              🎾 <strong>CourtConnect</strong> - Where tennis players meet their match
            </p>
            <p className="text-xs text-slate-500">
              Built for the tennis community, by tennis enthusiasts
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
