import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import type { Connection, UpdateConnectionStatusInput } from '../../../server/src/schema';

interface ConnectionsViewProps {
  currentUserId: number;
}

// Enhanced Connection type with user details for display
interface ConnectionWithUserDetails extends Connection {
  otherUser: {
    id: number;
    name: string;
    skill_level: 'Beginner' | 'Intermediate' | 'Advanced';
    city: string;
    state: string;
    bio: string;
  };
  isIncoming: boolean; // true if current user is the target
}

export function ConnectionsView({ currentUserId }: ConnectionsViewProps) {
  const [connections, setConnections] = useState<ConnectionWithUserDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<Record<number, boolean>>({});

  // 🎾 Mock data for demonstration since backend returns empty array
  const mockConnections: ConnectionWithUserDetails[] = [
    {
      id: 1,
      requester_id: 2,
      target_id: currentUserId,
      status: 'pending',
      created_at: new Date('2024-02-10'),
      isIncoming: true,
      otherUser: {
        id: 2,
        name: 'Maya Rodriguez',
        skill_level: 'Advanced',
        city: 'Portland',
        state: 'Oregon',
        bio: 'Professional coach looking for challenging matches. Love the mental game of tennis! 🧠🎾'
      }
    },
    {
      id: 2,
      requester_id: currentUserId,
      target_id: 3,
      status: 'accepted',
      created_at: new Date('2024-02-08'),
      isIncoming: false,
      otherUser: {
        id: 3,
        name: 'Jake Thompson',
        skill_level: 'Beginner',
        city: 'Portland',
        state: 'Oregon',
        bio: 'New to tennis but super enthusiastic! Looking for patient partners to learn with. ☀️'
      }
    },
    {
      id: 3,
      requester_id: 6,
      target_id: currentUserId,
      status: 'accepted',
      created_at: new Date('2024-02-05'),
      isIncoming: true,
      otherUser: {
        id: 6,
        name: 'Emma Wilson',
        skill_level: 'Intermediate',
        city: 'Portland',
        state: 'Oregon',
        bio: 'Social player who loves meeting new people through tennis. Great vibes only! ✨'
      }
    },
    {
      id: 4,
      requester_id: currentUserId,
      target_id: 4,
      status: 'declined',
      created_at: new Date('2024-02-03'),
      isIncoming: false,
      otherUser: {
        id: 4,
        name: 'Sarah Chen',
        skill_level: 'Intermediate',
        city: 'Seattle',
        state: 'Washington',
        bio: 'Weekend warrior who loves doubles! Always down for a good rally and coffee after. ☕'
      }
    }
  ];

  const loadConnections = useCallback(async () => {
    setIsLoading(true);
    try {
      // Call the real API (which returns empty array due to stub)
      const apiConnections = await trpc.getUserConnections.query({ userId: currentUserId });
      
      // 🎾 Since API returns empty array, use mock data for demonstration
      setConnections(mockConnections);
    } catch (error) {
      console.error('Failed to load connections:', error);
      // Fallback to mock data
      setConnections(mockConnections);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const handleConnectionResponse = async (connectionId: number, status: 'accepted' | 'declined') => {
    setIsUpdating(prev => ({ ...prev, [connectionId]: true }));
    
    try {
      const updateData: UpdateConnectionStatusInput = {
        connection_id: connectionId,
        status: status
      };
      
      await trpc.updateConnectionStatus.mutate(updateData);
      
      // Update local state
      setConnections(prev => 
        prev.map(conn => 
          conn.id === connectionId 
            ? { ...conn, status } 
            : conn
        )
      );
      
      const action = status === 'accepted' ? 'accepted' : 'declined';
      alert(`🎾 Connection ${action}! (Note: This is using stub backend)`);
      
    } catch (error) {
      console.error('Failed to update connection:', error);
      alert('❌ Failed to update connection. Please try again.');
    } finally {
      setIsUpdating(prev => ({ ...prev, [connectionId]: false }));
    }
  };

  const pendingConnections = connections.filter(conn => conn.status === 'pending');
  const acceptedConnections = connections.filter(conn => conn.status === 'accepted');
  const incomingPending = pendingConnections.filter(conn => conn.isIncoming);
  const outgoingPending = pendingConnections.filter(conn => !conn.isIncoming);

  if (isLoading) {
    return (
      <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
        <CardContent className="p-8 text-center">
          <div className="text-2xl mb-2">⏳</div>
          <p className="text-gray-600">Loading your tennis connections...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white/50 backdrop-blur-sm border border-orange-200">
          <TabsTrigger 
            value="pending" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-green-400 data-[state=active]:text-white"
          >
            ⏳ Pending ({pendingConnections.length})
          </TabsTrigger>
          <TabsTrigger 
            value="accepted" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-green-400 data-[state=active]:text-white"
          >
            🤝 Connected ({acceptedConnections.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6">
          {/* Incoming Requests */}
          {incomingPending.length > 0 && (
            <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
              <CardHeader>
                <CardTitle className="text-lg text-gray-800 flex items-center space-x-2">
                  <span>📨</span>
                  <span>Incoming Requests ({incomingPending.length})</span>
                </CardTitle>
                <CardDescription>
                  These players want to connect with you!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {incomingPending.map((connection: ConnectionWithUserDetails) => (
                  <div key={connection.id} className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-green-400 rounded-full flex items-center justify-center text-white font-bold">
                          {connection.otherUser.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium text-gray-800">{connection.otherUser.name}</h3>
                            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                              {connection.otherUser.skill_level}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            📍 {connection.otherUser.city}, {connection.otherUser.state}
                          </p>
                          {connection.otherUser.bio && (
                            <p className="text-sm text-gray-700 italic">"{connection.otherUser.bio}"</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            Requested {connection.created_at.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleConnectionResponse(connection.id, 'accepted')}
                          disabled={isUpdating[connection.id]}
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white"
                        >
                          {isUpdating[connection.id] ? '⏳' : '✅ Accept'}
                        </Button>
                        <Button
                          onClick={() => handleConnectionResponse(connection.id, 'declined')}
                          disabled={isUpdating[connection.id]}
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                          {isUpdating[connection.id] ? '⏳' : '❌ Decline'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Outgoing Requests */}
          {outgoingPending.length > 0 && (
            <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
              <CardHeader>
                <CardTitle className="text-lg text-gray-800 flex items-center space-x-2">
                  <span>📤</span>
                  <span>Sent Requests ({outgoingPending.length})</span>
                </CardTitle>
                <CardDescription>
                  Waiting for these players to respond
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {outgoingPending.map((connection: ConnectionWithUserDetails) => (
                  <div key={connection.id} className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-green-400 rounded-full flex items-center justify-center text-white font-bold">
                        {connection.otherUser.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium text-gray-800">{connection.otherUser.name}</h3>
                          <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                            {connection.otherUser.skill_level}
                          </Badge>
                          <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                            Pending
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          📍 {connection.otherUser.city}, {connection.otherUser.state}
                        </p>
                        <p className="text-xs text-gray-400">
                          Sent {connection.created_at.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {pendingConnections.length === 0 && (
            <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-4">🎾</div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No pending connections</h3>
                <p className="text-gray-500">
                  Go search for players and start making connections!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="accepted">
          {acceptedConnections.length > 0 ? (
            <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
              <CardHeader>
                <CardTitle className="text-lg text-gray-800 flex items-center space-x-2">
                  <span>🤝</span>
                  <span>Your Tennis Network ({acceptedConnections.length})</span>
                </CardTitle>
                <CardDescription>
                  Players you're connected with - time to schedule some matches!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {acceptedConnections.map((connection: ConnectionWithUserDetails) => (
                  <div key={connection.id} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-green-400 rounded-full flex items-center justify-center text-white font-bold">
                        {connection.otherUser.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium text-gray-800">{connection.otherUser.name}</h3>
                          <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                            {connection.otherUser.skill_level}
                          </Badge>
                          <Badge className="text-xs bg-green-500 text-white">
                            ✅ Connected
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          📍 {connection.otherUser.city}, {connection.otherUser.state}
                        </p>
                        {connection.otherUser.bio && (
                          <p className="text-sm text-gray-700 italic">"{connection.otherUser.bio}"</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          Connected since {connection.created_at.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-4">🤝</div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No connections yet</h3>
                <p className="text-gray-500">
                  Start connecting with other tennis players to build your network!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Stub Notice */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <p className="text-xs text-yellow-700">
            <strong>🛠️ Development Note:</strong> This connections view uses mock data for demonstration since the backend connections API returns empty results. 
            Connection status updates are sent to the stub API and won't persist.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
