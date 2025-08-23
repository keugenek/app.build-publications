import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlayerCard } from '@/components/PlayerCard';
import { MessageItem } from '@/components/MessageItem';

import type { UserProfile, CreateUserProfileInput, SearchPlayersInput, SendMessageInput, Message } from '../../server/src/schema';

function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [isMessagesDialogOpen, setIsMessagesDialogOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageContent, setNewMessageContent] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<UserProfile | null>(null);
  const [searchParams, setSearchParams] = useState<SearchPlayersInput>({});
  const [profileForm, setProfileForm] = useState<CreateUserProfileInput>({
    name: '',
    email: '',
    skill_level: 'beginner',
    location: '',
    bio: null
  });

  const getSkillBadgeVariant = (skill: string) => {
    switch (skill) {
      case 'beginner': return 'secondary';
      case 'intermediate': return 'default';
      case 'advanced': return 'destructive';
      default: return 'secondary';
    }
  };

  // Load current user profile
  const loadCurrentUser = useCallback(async () => {
    try {
      // In a real app, you would get the current user ID from auth
      // For this implementation, we'll check if profile already exists in local storage
      const storedProfile = localStorage.getItem('tennisConnectProfile');
      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        setCurrentUser(profile);
        setProfileForm({
          name: profile.name,
          email: profile.email,
          skill_level: profile.skill_level,
          location: profile.location,
          bio: profile.bio
        });
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentUser) {
        // Update existing profile
        const updatedProfile = {
          ...currentUser,
          ...profileForm,
          updated_at: new Date()
        };
        localStorage.setItem('tennisConnectProfile', JSON.stringify(updatedProfile));
        setCurrentUser(updatedProfile);
      } else {
        // Create new profile
        const newProfile = {
          id: Date.now(), // Simple ID generation for demo
          ...profileForm,
          created_at: new Date(),
          updated_at: new Date()
        };
        localStorage.setItem('tennisConnectProfile', JSON.stringify(newProfile));
        setCurrentUser(newProfile);
      }
      setIsProfileDialogOpen(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  const handleSearch = async () => {
    try {
      // In a real application, this would fetch players from the backend API
      // For this demo, we're providing sample data to illustrate functionality
      const storedProfile = localStorage.getItem('tennisConnectProfile');
      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        // Simulate search results - in a real app, you'd filter through a list of players
        const sampleResults: UserProfile[] = [
          {
            id: profile.id + 1,
            name: 'Alex Rodriguez',
            email: 'alex@example.com',
            skill_level: 'intermediate',
            location: searchParams.location || profile.location,
            bio: 'Looking for weekend matches',
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            id: profile.id + 2,
            name: 'Maria Johnson',
            email: 'maria@example.com',
            skill_level: 'advanced',
            location: searchParams.location || profile.location,
            bio: 'Professional coach available for lessons',
            created_at: new Date(),
            updated_at: new Date()
          }
        ];
        setSearchResults(sampleResults);
      }
    } catch (error) {
      console.error('Failed to search players:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedPlayer || !currentUser || !newMessageContent.trim()) return;
    
    try {
      const messageInput: SendMessageInput = {
        sender_id: currentUser.id,
        recipient_id: selectedPlayer.id,
        content: newMessageContent
      };
      
      // In a real app, this would call the API
      // For demo purposes, we'll store messages in localStorage
      const storedMessages = localStorage.getItem('tennisConnectMessages');
      const messages = storedMessages ? JSON.parse(storedMessages) : [];
      
      const newMessage = {
        id: Date.now(),
        ...messageInput,
        created_at: new Date()
      };
      
      messages.push(newMessage);
      localStorage.setItem('tennisConnectMessages', JSON.stringify(messages));
      
      setNewMessageContent('');
      loadMessages(selectedPlayer.id);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const loadMessages = async (playerId: number) => {
    try {
      if (!currentUser) return;
      
      // In a real app, this would call the API
      // For demo purposes, we'll load from localStorage
      const storedMessages = localStorage.getItem('tennisConnectMessages');
      if (storedMessages) {
        const allMessages = JSON.parse(storedMessages);
        
        // Filter messages between current user and selected player
        const conversation = allMessages.filter(
          (msg: Message) => 
            (msg.sender_id === currentUser.id && msg.recipient_id === playerId) ||
            (msg.sender_id === playerId && msg.recipient_id === currentUser.id)
        );
        
        setMessages(conversation);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const openMessages = async (player: UserProfile) => {
    setSelectedPlayer(player);
    setIsMessagesDialogOpen(true);
    await loadMessages(player.id);
  };

  

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-green-800">TennisConnect</h1>
            <p className="text-green-600">Connect with tennis players in your area</p>
          </div>
          
          <div className="flex gap-2">
            <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  {currentUser ? 'Edit Profile' : 'Create Profile'}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{currentUser ? 'Edit Profile' : 'Create Profile'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">Name</label>
                    <Input
                      id="name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">Email</label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="location" className="text-sm font-medium">Location</label>
                    <Input
                      id="location"
                      value={profileForm.location}
                      onChange={(e) => setProfileForm({...profileForm, location: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="skill_level" className="text-sm font-medium">Skill Level</label>
                    <Select 
                      value={profileForm.skill_level} 
                      onValueChange={(value: "beginner" | "intermediate" | "advanced") => setProfileForm({...profileForm, skill_level: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select skill level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="bio" className="text-sm font-medium">Bio</label>
                    <Textarea
                      id="bio"
                      value={profileForm.bio || ''}
                      onChange={(e) => setProfileForm({...profileForm, bio: e.target.value || null})}
                      placeholder="Tell others about your tennis journey..."
                    />
                  </div>
                  
                  <Button type="submit" className="w-full">
                    {currentUser ? 'Update Profile' : 'Create Profile'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
              <DialogTrigger asChild>
                <Button>Find Players</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Search Players</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="search-location" className="text-sm font-medium">Location</label>
                    <Input
                      id="search-location"
                      value={searchParams.location || ''}
                      onChange={(e) => setSearchParams({...searchParams, location: e.target.value})}
                      placeholder="Enter city or area"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="search-skill" className="text-sm font-medium">Skill Level</label>
                    <Select 
                      value={searchParams.skill_level || 'any'} 
                      onValueChange={(value: "beginner" | "intermediate" | "advanced" | "any") => setSearchParams({...searchParams, skill_level: value === 'any' ? undefined : value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any skill level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any skill level</SelectItem>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button onClick={handleSearch} className="w-full">
                    Search
                  </Button>
                  
                  {searchResults.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-medium mb-2">Results:</h3>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {searchResults.map((player) => (
                          <PlayerCard 
                            key={player.id} 
                            player={player} 
                            onMessageClick={openMessages} 
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>
        
        {/* Main Content */}
        <main>
          {currentUser ? (
            <div className="space-y-8">
              {/* Profile Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="text-xl">{currentUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-2xl">{currentUser.name}</CardTitle>
                      <CardDescription>{currentUser.location}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant={getSkillBadgeVariant(currentUser.skill_level)}>
                      {currentUser.skill_level}
                    </Badge>
                    <Badge variant="outline">Member</Badge>
                  </div>
                  {currentUser.bio && (
                    <p className="text-gray-700">{currentUser.bio}</p>
                  )}
                </CardContent>
              </Card>
              
              {/* Stats Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">12</div>
                    <div className="text-gray-500">Matches Played</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">8</div>
                    <div className="text-gray-500">Matches Won</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">24</div>
                    <div className="text-gray-500">Connections</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <h2 className="text-2xl font-bold mb-2">Welcome to TennisConnect!</h2>
                <p className="text-gray-600 mb-6">
                  Create a profile to connect with tennis players in your area and schedule matches.
                </p>
                <Button onClick={() => setIsProfileDialogOpen(true)}>
                  Create Profile
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
        
        {/* Messages Dialog */}
        <Dialog open={isMessagesDialogOpen} onOpenChange={setIsMessagesDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {selectedPlayer ? `Chat with ${selectedPlayer.name}` : 'Messages'}
              </DialogTitle>
            </DialogHeader>
            {selectedPlayer && (
              <div className="space-y-4">
                <div className="h-64 overflow-y-auto border rounded-lg p-4 bg-gray-50">
                  {messages.length > 0 ? (
                    <div className="space-y-3">
                      {messages.map((message) => (
                        <MessageItem 
                          key={message.id} 
                          message={message} 
                          isCurrentUser={message.sender_id === currentUser?.id} 
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No messages yet. Start a conversation!</p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    value={newMessageContent}
                    onChange={(e) => setNewMessageContent(e.target.value)}
                    placeholder="Type your message..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button onClick={handleSendMessage}>Send</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} TennisConnect. Connect with tennis players in your community.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
