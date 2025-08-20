import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, Inbox, Check, X, Clock, User } from 'lucide-react';

// Import types from server
import type { UserProfile, ConnectionRequest } from '../../../server/src/schema';

interface ConnectionRequestsProps {
  currentUser: UserProfile | null;
}

interface ConnectionRequestsData {
  sent: ConnectionRequest[];
  received: ConnectionRequest[];
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  accepted: 'bg-green-100 text-green-800 border-green-200',
  declined: 'bg-red-100 text-red-800 border-red-200'
};

const statusIcons = {
  pending: Clock,
  accepted: Check,
  declined: X
};

export function ConnectionRequests({ currentUser }: ConnectionRequestsProps) {
  const [requests, setRequests] = useState<ConnectionRequestsData>({
    sent: [],
    received: []
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load connection requests
  const loadRequests = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);
      const data = await trpc.getUserConnectionRequests.query({ userId: currentUser.id });
      setRequests(data);
    } catch (error) {
      console.error('Failed to load connection requests:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Handle responding to connection request
  const handleResponse = async (requestId: number, status: 'accepted' | 'declined') => {
    if (!currentUser) return;

    try {
      await trpc.respondToConnectionRequest.mutate({
        userId: currentUser.id,
        request_id: requestId,
        status
      });
      
      // Refresh requests after response
      await loadRequests();
      
      // Show feedback
      const message = status === 'accepted' ? 
        'Connection request accepted! 🎾' : 
        'Connection request declined.';
      alert(message);
    } catch (error) {
      console.error('Failed to respond to connection request:', error);
    }
  };

  if (!currentUser) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Please create a profile to view connection requests.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="received" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="received" className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            Received ({requests.received.length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Sent ({requests.sent.length})
          </TabsTrigger>
        </TabsList>

        {/* Received Requests */}
        <TabsContent value="received" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="h-5 w-5" />
                Received Connection Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading requests...</p>
                </div>
              ) : requests.received.length > 0 ? (
                <div className="space-y-4">
                  {requests.received.map((request: ConnectionRequest) => {
                    const StatusIcon = statusIcons[request.status];
                    return (
                      <div key={request.id} className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                              U
                            </div>
                            <div>
                              <p className="font-medium">User ID: {request.requester_id}</p>
                              <p className="text-sm text-gray-600">
                                {request.created_at.toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`${statusColors[request.status]} font-medium`}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Badge>
                        </div>

                        {request.message && (
                          <>
                            <div className="mb-3">
                              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border-l-4 border-l-green-500">
                                "{request.message}"
                              </p>
                            </div>
                          </>
                        )}

                        {request.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleResponse(request.id, 'accepted')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResponse(request.id, 'declined')}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Inbox className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 mb-2">No connection requests received yet</p>
                  <p className="text-sm text-gray-400">
                    Other players can find you through search and send connection requests
                  </p>
                  <Badge variant="outline" className="mt-4">
                    💡 Backend handlers are stubs - no real requests will appear
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sent Requests */}
        <TabsContent value="sent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Sent Connection Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading requests...</p>
                </div>
              ) : requests.sent.length > 0 ? (
                <div className="space-y-4">
                  {requests.sent.map((request: ConnectionRequest) => {
                    const StatusIcon = statusIcons[request.status];
                    return (
                      <div key={request.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                              U
                            </div>
                            <div>
                              <p className="font-medium">To User ID: {request.receiver_id}</p>
                              <p className="text-sm text-gray-600">
                                Sent {request.created_at.toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`${statusColors[request.status]} font-medium`}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Badge>
                        </div>

                        {request.message && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-600 mb-1">Your message:</p>
                            <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded border-l-4 border-l-blue-500">
                              "{request.message}"
                            </p>
                          </div>
                        )}

                        {request.status === 'pending' && (
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Waiting for response...
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Send className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 mb-2">No connection requests sent yet</p>
                  <p className="text-sm text-gray-400">
                    Browse players and send connection requests to start playing together
                  </p>
                  <Badge variant="outline" className="mt-4">
                    💡 Backend handlers are stubs - sent requests won't persist
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
