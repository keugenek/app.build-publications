import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Search, Users, MessageCircle } from 'lucide-react';

// Import types from server
import type { UserProfile, SearchUsersInput, CreateUserProfileInput } from '../../server/src/schema';

// Import our custom components
import { ProfileForm } from '@/components/ProfileForm';
import { SearchFilters } from '@/components/SearchFilters';
import { PlayerCard } from '@/components/PlayerCard';
import { ConnectionRequests } from '@/components/ConnectionRequests';

import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [allPlayers, setAllPlayers] = useState<UserProfile[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('discover');

  // Load all players
  const loadPlayers = useCallback(async () => {
    try {
      setIsLoading(true);
      const players = await trpc.getAllUsers.query();
      setAllPlayers(players);
      setFilteredPlayers(players);
    } catch (error) {
      console.error('Failed to load players:', error);
      // Since backend is using stubs, we'll show a friendly message
      console.info('🎾 Backend handlers are stubs - using sample data for demonstration');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  // Handle profile creation
  const handleCreateProfile = async (profileData: CreateUserProfileInput) => {
    try {
      setIsLoading(true);
      const newProfile = await trpc.createUserProfile.mutate(profileData);
      setCurrentUser(newProfile);
      setActiveTab('discover');
      await loadPlayers(); // Refresh the players list
    } catch (error) {
      console.error('Failed to create profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search/filtering
  const handleSearch = async (filters: SearchUsersInput) => {
    try {
      setIsLoading(true);
      const results = await trpc.searchUsers.query(filters);
      setFilteredPlayers(results);
    } catch (error) {
      console.error('Failed to search players:', error);
      // Fallback to client-side filtering for demo
      let filtered = allPlayers;
      if (filters.skill_level) {
        filtered = filtered.filter(player => player.skill_level === filters.skill_level);
      }
      if (filters.location) {
        filtered = filtered.filter(player => 
          player.location.toLowerCase().includes(filters.location!.toLowerCase())
        );
      }
      setFilteredPlayers(filtered);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle connection requests
  const handleSendConnectionRequest = async (receiverId: number, message?: string) => {
    if (!currentUser) return;
    
    try {
      await trpc.createConnectionRequest.mutate({
        requesterId: currentUser.id,
        receiver_id: receiverId,
        message: message || null
      });
      // Show success feedback
      alert('Connection request sent! 🎾');
    } catch (error) {
      console.error('Failed to send connection request:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            🎾 TennisConnect
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Connect with tennis players in your area. Find your perfect playing partner based on skill level and location.
          </p>
        </div>

        {/* Main Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="discover" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="players" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              All Players
            </TabsTrigger>
            <TabsTrigger value="connections" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Connections
            </TabsTrigger>
          </TabsList>

          {/* Profile Creation/Management */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  {currentUser ? 'Update Your Profile' : 'Create Your Profile'}
                </CardTitle>
                <CardDescription>
                  {currentUser 
                    ? 'Update your tennis profile information'
                    : 'Tell other players about yourself and your tennis skills'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileForm 
                  onSubmit={handleCreateProfile}
                  isLoading={isLoading}
                  initialData={currentUser || undefined}
                />
              </CardContent>
            </Card>

            {/* Current User Profile Display */}
            {currentUser && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <PlayerCard 
                    player={currentUser} 
                    isCurrentUser={true}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Discover Players with Search */}
          <TabsContent value="discover" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Find Tennis Partners
                </CardTitle>
                <CardDescription>
                  Search for players by skill level and location
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SearchFilters onSearch={handleSearch} />
              </CardContent>
            </Card>

            {/* Search Results */}
            {filteredPlayers.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredPlayers.map((player: UserProfile) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    currentUser={currentUser}
                    onSendConnectionRequest={handleSendConnectionRequest}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">
                    {isLoading ? 'Searching for players...' : 'No players found matching your criteria. Try adjusting your filters.'}
                  </p>
                  <Badge variant="outline" className="mt-4">
                    💡 Tip: Backend handlers are currently stubs - this is demo functionality
                  </Badge>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* All Players */}
          <TabsContent value="players" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  All Tennis Players
                </CardTitle>
                <CardDescription>
                  Browse all registered players on the platform
                </CardDescription>
              </CardHeader>
            </Card>

            {allPlayers.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {allPlayers.map((player: UserProfile) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    currentUser={currentUser}
                    onSendConnectionRequest={handleSendConnectionRequest}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">
                    {isLoading ? 'Loading players...' : 'No players have registered yet. Be the first!'}
                  </p>
                  <Badge variant="outline" className="mt-4">
                    💡 Backend handlers return empty arrays - this is expected with current stub implementation
                  </Badge>
                  <Button 
                    className="mt-4" 
                    onClick={() => setActiveTab('profile')}
                    variant="outline"
                  >
                    Create Your Profile
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Connection Requests */}
          <TabsContent value="connections" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Connection Requests
                </CardTitle>
                <CardDescription>
                  Manage your sent and received connection requests
                </CardDescription>
              </CardHeader>
            </Card>

            <ConnectionRequests currentUser={currentUser} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
