import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/utils/trpc';
import type { User, SearchUsersInput, SkillLevel, SendMessageInput } from '../../../server/src/schema';

interface UserSearchProps {
  currentUserId: number;
}

export function UserSearch({ currentUserId }: UserSearchProps) {
  const [searchFilters, setSearchFilters] = useState<SearchUsersInput>({
    exclude_user_id: currentUserId
  });
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Demo data for search results since backend is using stubs
  const demoUsers: User[] = [
    {
      id: 2,
      name: 'Sarah Wilson',
      email: 'sarah@example.com',
      skill_level: 'intermediate',
      location: 'San Francisco, CA',
      bio: 'Weekend warrior looking for doubles partners. Available Saturday mornings!',
      created_at: new Date('2024-01-15'),
      updated_at: new Date('2024-01-15')
    },
    {
      id: 3,
      name: 'Mike Chen',
      email: 'mike@example.com',
      skill_level: 'advanced',
      location: 'San Francisco, CA',
      bio: 'Former college player. Love competitive singles matches.',
      created_at: new Date('2024-01-10'),
      updated_at: new Date('2024-01-10')
    },
    {
      id: 4,
      name: 'Emily Rodriguez',
      email: 'emily@example.com',
      skill_level: 'beginner',
      location: 'Oakland, CA',
      bio: 'Just started playing tennis! Looking for patient partners to practice with.',
      created_at: new Date('2024-01-20'),
      updated_at: new Date('2024-01-20')
    },
    {
      id: 5,
      name: 'David Park',
      email: 'david@example.com',
      skill_level: 'intermediate',
      location: 'Berkeley, CA',
      bio: 'Tennis enthusiast who plays 3-4 times a week. Always up for a good match!',
      created_at: new Date('2024-01-12'),
      updated_at: new Date('2024-01-12')
    }
  ];

  const searchUsers = useCallback(async () => {
    setIsSearching(true);
    try {
      // Using demo data since backend handlers are stubs
      let filteredUsers = demoUsers;
      
      if (searchFilters.location) {
        filteredUsers = filteredUsers.filter(user => 
          user.location.toLowerCase().includes(searchFilters.location!.toLowerCase())
        );
      }
      
      if (searchFilters.skill_level) {
        filteredUsers = filteredUsers.filter(user => 
          user.skill_level === searchFilters.skill_level
        );
      }
      
      setSearchResults(filteredUsers);
    } catch (error) {
      console.error('Failed to search users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchFilters]);

  useEffect(() => {
    // Load initial results
    searchUsers();
  }, [searchUsers]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !messageContent.trim()) return;

    setIsSendingMessage(true);
    try {
      const messageData: SendMessageInput = {
        recipient_id: selectedUser.id,
        content: messageContent.trim()
      };
      
      await trpc.sendMessage.mutate({
        senderId: currentUserId,
        messageData
      });
      
      setMessageContent('');
      setIsDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const skillLevelColors = {
    beginner: 'bg-blue-100 text-blue-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800'
  };

  const skillLevelEmojis = {
    beginner: '🟢',
    intermediate: '🟡', 
    advanced: '🔴'
  };

  return (
    <div className="space-y-6">
      {/* Search Filters */}
      <Card className="border-gray-200">
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-800">🔍 Search Filters</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location-search">Location</Label>
              <Input
                id="location-search"
                value={searchFilters.location || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchFilters((prev: SearchUsersInput) => ({ 
                    ...prev, 
                    location: e.target.value || undefined 
                  }))
                }
                placeholder="e.g., San Francisco, New York..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="skill-search">Skill Level</Label>
              <Select
                value={searchFilters.skill_level || ''}
                onValueChange={(value: SkillLevel | '') =>
                  setSearchFilters((prev: SearchUsersInput) => ({ 
                    ...prev, 
                    skill_level: value || undefined 
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any skill level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any skill level</SelectItem>
                  <SelectItem value="beginner">🟢 Beginner</SelectItem>
                  <SelectItem value="intermediate">🟡 Intermediate</SelectItem>
                  <SelectItem value="advanced">🔴 Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-center">
            <Button 
              onClick={searchUsers}
              disabled={isSearching}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSearching ? 'Searching...' : '🔍 Search Players'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      <div className="space-y-4">
        {searchResults.length === 0 && !isSearching && (
          <Card className="border-gray-200">
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">🎾</div>
              <p className="text-gray-600">No players found matching your criteria.</p>
              <p className="text-sm text-gray-500 mt-2">Try adjusting your search filters above.</p>
            </CardContent>
          </Card>
        )}

        {searchResults.map((user: User) => (
          <Card key={user.id} className="border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-700 font-semibold text-lg">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{user.name}</h3>
                      <p className="text-sm text-gray-600">📍 {user.location}</p>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <Badge className={skillLevelColors[user.skill_level]}>
                      {skillLevelEmojis[user.skill_level]} {user.skill_level}
                    </Badge>
                  </div>
                  
                  {user.bio && (
                    <p className="text-gray-700 text-sm leading-relaxed mb-4">{user.bio}</p>
                  )}
                  
                  <p className="text-xs text-gray-500">
                    Joined {user.created_at.toLocaleDateString()}
                  </p>
                </div>
                
                <div className="ml-4">
                  <Dialog open={isDialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) {
                      setSelectedUser(null);
                      setMessageContent('');
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline"
                        onClick={() => setSelectedUser(user)}
                        className="border-green-200 text-green-700 hover:bg-green-50"
                      >
                        💬 Message
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Send Message to {user.name}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSendMessage} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="message">Your Message</Label>
                          <Textarea
                            id="message"
                            value={messageContent}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                              setMessageContent(e.target.value)
                            }
                            placeholder="Hi! I'd love to play tennis with you. Are you available this weekend?"
                            rows={4}
                            required
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={isSendingMessage || !messageContent.trim()}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {isSendingMessage ? 'Sending...' : '📤 Send Message'}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
