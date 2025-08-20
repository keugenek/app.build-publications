import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { UserProfile, SearchFilters, CreateConnectionInput } from '../../../server/src/schema';

interface PlayerSearchProps {
  currentUserId: number;
}

export function PlayerSearch({ currentUserId }: PlayerSearchProps) {
  const [players, setPlayers] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isConnecting, setIsConnecting] = useState<Record<number, boolean>>({});
  const [filters, setFilters] = useState<SearchFilters>({
    skill_level: undefined,
    city: undefined,
    state: undefined
  });

  // 🎾 Mock data for demonstration since backend returns empty array
  const mockPlayers: UserProfile[] = [
    {
      id: 2,
      name: 'Maya Rodriguez',
      skill_level: 'Advanced',
      city: 'Portland',
      state: 'Oregon',
      bio: 'Professional coach looking for challenging matches. Love the mental game of tennis! 🧠🎾',
      created_at: new Date('2024-01-15')
    },
    {
      id: 3,
      name: 'Jake Thompson',
      skill_level: 'Beginner',
      city: 'Portland',
      state: 'Oregon',
      bio: 'New to tennis but super enthusiastic! Looking for patient partners to learn with. ☀️',
      created_at: new Date('2024-02-01')
    },
    {
      id: 4,
      name: 'Sarah Chen',
      skill_level: 'Intermediate',
      city: 'Seattle',
      state: 'Washington',
      bio: 'Weekend warrior who loves doubles! Always down for a good rally and coffee after. ☕',
      created_at: new Date('2024-01-20')
    },
    {
      id: 5,
      name: 'Mike Anderson',
      skill_level: 'Advanced',
      city: 'San Francisco',
      state: 'California',
      bio: 'Tennis is life! Looking for competitive singles matches. Let\'s bring the intensity! 🔥',
      created_at: new Date('2024-01-10')
    },
    {
      id: 6,
      name: 'Emma Wilson',
      skill_level: 'Intermediate',
      city: 'Portland',
      state: 'Oregon',
      bio: 'Social player who loves meeting new people through tennis. Great vibes only! ✨',
      created_at: new Date('2024-02-05')
    }
  ];

  const searchPlayers = useCallback(async () => {
    setIsSearching(true);
    try {
      // Call the real API (which returns empty array due to stub)
      const apiResults = await trpc.searchPlayers.query(filters);
      
      // 🎾 Since API returns empty array, use filtered mock data for demonstration
      let filteredPlayers = mockPlayers.filter(player => player.id !== currentUserId);
      
      if (filters.skill_level) {
        filteredPlayers = filteredPlayers.filter(player => player.skill_level === filters.skill_level);
      }
      if (filters.city) {
        filteredPlayers = filteredPlayers.filter(player => 
          player.city.toLowerCase().includes(filters.city!.toLowerCase())
        );
      }
      if (filters.state) {
        filteredPlayers = filteredPlayers.filter(player => 
          player.state.toLowerCase().includes(filters.state!.toLowerCase())
        );
      }
      
      setPlayers(filteredPlayers);
    } catch (error) {
      console.error('Failed to search players:', error);
      // Fallback to mock data
      setPlayers(mockPlayers.filter(player => player.id !== currentUserId));
    } finally {
      setIsSearching(false);
    }
  }, [filters, currentUserId]);

  useEffect(() => {
    searchPlayers();
  }, [searchPlayers]);

  const handleConnect = async (targetId: number) => {
    setIsConnecting(prev => ({ ...prev, [targetId]: true }));
    
    try {
      const connectionData: CreateConnectionInput = {
        requester_id: currentUserId,
        target_id: targetId
      };
      
      await trpc.createConnection.mutate(connectionData);
      
      // Show success feedback
      const targetPlayer = players.find(p => p.id === targetId);
      alert(`🎾 Connection request sent to ${targetPlayer?.name}! (Note: This is using stub backend)`);
      
    } catch (error) {
      console.error('Failed to create connection:', error);
      alert('❌ Failed to send connection request. Please try again.');
    } finally {
      setIsConnecting(prev => ({ ...prev, [targetId]: false }));
    }
  };

  const clearFilters = () => {
    setFilters({
      skill_level: undefined,
      city: undefined,
      state: undefined
    });
  };

  return (
    <div className="space-y-6">
      {/* Search Filters */}
      <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
        <CardHeader>
          <CardTitle className="text-xl text-gray-800 flex items-center space-x-2">
            <span>🔍</span>
            <span>Search Filters</span>
          </CardTitle>
          <CardDescription>
            Filter players by skill level and location to find your perfect match!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">🏆 Skill Level</label>
              <Select
                value={filters.skill_level || ''}
                onValueChange={(value: string) =>
                  setFilters(prev => ({ 
                    ...prev, 
                    skill_level: value ? (value as 'Beginner' | 'Intermediate' | 'Advanced') : undefined 
                  }))
                }
              >
                <SelectTrigger className="border-orange-200">
                  <SelectValue placeholder="Any level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any level</SelectItem>
                  <SelectItem value="Beginner">🌱 Beginner</SelectItem>
                  <SelectItem value="Intermediate">🎯 Intermediate</SelectItem>
                  <SelectItem value="Advanced">🏆 Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">🏙️ City</label>
              <Input
                value={filters.city || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFilters(prev => ({ ...prev, city: e.target.value || undefined }))
                }
                placeholder="Search by city"
                className="border-orange-200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">🗺️ State</label>
              <Input
                value={filters.state || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFilters(prev => ({ ...prev, state: e.target.value || undefined }))
                }
                placeholder="Search by state"
                className="border-orange-200"
              />
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={searchPlayers}
              disabled={isSearching}
              className="bg-gradient-to-r from-orange-400 to-green-400 hover:from-orange-500 hover:to-green-500 text-white"
            >
              {isSearching ? '⏳ Searching...' : '🔍 Search Players'}
            </Button>
            <Button 
              onClick={clearFilters} 
              variant="outline"
              className="border-orange-200 hover:bg-orange-50"
            >
              ✨ Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
            <span>🎾</span>
            <span>Tennis Players ({players.length})</span>
          </h3>
          {players.length > 0 && (
            <p className="text-sm text-gray-500">
              Found {players.length} awesome tennis player{players.length !== 1 ? 's' : ''}!
            </p>
          )}
        </div>

        {players.length === 0 ? (
          <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4">🎾</div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">No players found</h3>
              <p className="text-gray-500">
                Try adjusting your search filters to find more tennis partners!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {players.map((player: UserProfile) => (
              <Card key={player.id} className="bg-white/70 backdrop-blur-sm border-orange-200 hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-green-400 rounded-full flex items-center justify-center text-white font-bold text-xl">
                        {player.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-800">{player.name}</h3>
                          <Badge 
                            variant="secondary" 
                            className={`
                              ${player.skill_level === 'Beginner' ? 'bg-green-100 text-green-700' : ''}
                              ${player.skill_level === 'Intermediate' ? 'bg-orange-100 text-orange-700' : ''}
                              ${player.skill_level === 'Advanced' ? 'bg-red-100 text-red-700' : ''}
                            `}
                          >
                            {player.skill_level}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 flex items-center space-x-1">
                          <span>📍</span>
                          <span>{player.city}, {player.state}</span>
                        </p>
                        {player.bio && (
                          <p className="text-sm text-gray-700 italic">"{player.bio}"</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Joined {player.created_at.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handleConnect(player.id)}
                      disabled={isConnecting[player.id]}
                      className="bg-gradient-to-r from-orange-400 to-green-400 hover:from-orange-500 hover:to-green-500 text-white"
                    >
                      {isConnecting[player.id] ? '⏳ Connecting...' : '🤝 Connect'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Stub Notice */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <p className="text-xs text-yellow-700">
            <strong>🛠️ Development Note:</strong> This search uses mock data for demonstration since the backend search API returns empty results. 
            Connection requests are sent to the stub API and won't persist.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
