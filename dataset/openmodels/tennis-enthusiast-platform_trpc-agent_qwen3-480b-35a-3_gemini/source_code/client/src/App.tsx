import { useState, useEffect, useCallback } from 'react';
import { trpc } from './utils/trpc';
import type { User, CreateUserInput, SearchPlayersInput, SendMessageInput, Message } from '../../server/src/schema';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Textarea } from './components/ui/textarea';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { Badge } from './components/ui/badge';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<{[key: string]: Message[]}>({});
  const [newUserForm, setNewUserForm] = useState<CreateUserInput>({
    name: '',
    skill_level: 'Beginner',
    location: ''
  });
  const [searchForm, setSearchForm] = useState<SearchPlayersInput>({
    skill_level: undefined,
    location: undefined
  });
  const [messageForm, setMessageForm] = useState<Omit<SendMessageInput, 'sender_id' | 'receiver_id'>>({
    content: ''
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load users
  const loadUsers = useCallback(async () => {
    try {
      const result = await trpc.getUsers.query(searchForm);
      setUsers(result);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }, [searchForm]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Create user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await trpc.createUser.mutate(newUserForm);
      setCurrentUser(result);
      // Reset form
      setNewUserForm({
        name: '',
        skill_level: 'Beginner',
        location: ''
      });
    } catch (error) {
      console.error('Failed to create user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Search users
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers();
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedUser) return;
    
    setIsLoading(true);
    try {
      const messageData: SendMessageInput = {
        sender_id: currentUser.id,
        receiver_id: selectedUser.id,
        content: messageForm.content
      };
      
      await trpc.sendMessage.mutate(messageData);
      
      // Refresh messages
      const updatedMessages = await trpc.getMessages.query({
        userId1: currentUser.id,
        userId2: selectedUser.id
      });
      
      setMessages(prev => ({
        ...prev,
        [`${Math.min(currentUser.id, selectedUser.id)}-${Math.max(currentUser.id, selectedUser.id)}`]: updatedMessages
      }));
      
      // Reset message form
      setMessageForm({ content: '' });
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load messages when selecting a user
  const handleSelectUser = async (user: User) => {
    if (!currentUser) return;
    
    setSelectedUser(user);
    const conversationKey = `${Math.min(currentUser.id, user.id)}-${Math.max(currentUser.id, user.id)}`;
    
    try {
      const conversationMessages = await trpc.getMessages.query({
        userId1: currentUser.id,
        userId2: user.id
      });
      
      setMessages(prev => ({
        ...prev,
        [conversationKey]: conversationMessages
      }));
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
      <div className="container mx-auto px-4">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-green-800 mb-2">🎾 Tennis Partner Finder</h1>
          <p className="text-gray-600">Find tennis partners in your area based on skill level</p>
        </header>

        {!currentUser ? (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Create Your Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <Input
                  placeholder="Your name"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
                <Select 
                  value={newUserForm.skill_level} 
                  onValueChange={(value: "Beginner" | "Intermediate" | "Advanced") => setNewUserForm(prev => ({ ...prev, skill_level: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select skill level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Your location (city/region)"
                  value={newUserForm.location}
                  onChange={(e) => setNewUserForm(prev => ({ ...prev, location: e.target.value }))}
                  required
                />
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? 'Creating Profile...' : 'Create Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - User Info & Search */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Avatar>
                      <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{currentUser.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p><span className="font-semibold">Skill Level:</span> {currentUser.skill_level}</p>
                    <p><span className="font-semibold">Location:</span> {currentUser.location}</p>
                    <Badge variant="secondary" className="mt-2">
                      You
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Search Players</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSearch} className="space-y-4">
                    <Select
                      value={searchForm.skill_level || 'all'}
                      onValueChange={(value: "all" | "Beginner" | "Intermediate" | "Advanced") => setSearchForm(prev => ({ 
                        ...prev, 
                        skill_level: value === "all" ? undefined : value
                      }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Skill Levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Skill Levels</SelectItem>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Location"
                      value={searchForm.location || ''}
                      onChange={(e) => setSearchForm(prev => ({ 
                        ...prev, 
                        location: e.target.value || undefined 
                      }))}
                    />
                    <Button type="submit" className="w-full">
                      Search
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Middle Column - Players List */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Players</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {users
                      .filter(user => user.id !== currentUser.id)
                      .map(user => (
                        <div 
                          key={user.id}
                          className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                            selectedUser?.id === user.id 
                              ? 'border-green-500 bg-green-50' 
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                          onClick={() => handleSelectUser(user)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold">{user.name}</h3>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="outline">{user.skill_level}</Badge>
                                <Badge variant="secondary">{user.location}</Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    
                    {users.filter(user => user.id !== currentUser.id).length === 0 && (
                      <p className="text-center text-gray-500 py-4">
                        No players found. Try adjusting your search criteria.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Messaging */}
            <div className="space-y-6">
              {selectedUser ? (
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Avatar>
                        <AvatarFallback>{selectedUser.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>Messages with {selectedUser.name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="flex-1 space-y-4 mb-4 max-h-[400px] overflow-y-auto">
                      {(messages[`${Math.min(currentUser.id, selectedUser.id)}-${Math.max(currentUser.id, selectedUser.id)}`] || [])
                        .map((message, index) => (
                          <div 
                            key={index} 
                            className={`p-3 rounded-lg max-w-[80%] ${
                              message.sender_id === currentUser.id
                                ? 'bg-green-100 ml-auto'
                                : 'bg-gray-100'
                            }`}
                          >
                            <p>{message.content}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ))}
                      
                      {(messages[`${Math.min(currentUser.id, selectedUser.id)}-${Math.max(currentUser.id, selectedUser.id)}`] || []).length === 0 && (
                        <p className="text-center text-gray-500 py-4">
                          No messages yet. Start a conversation!
                        </p>
                      )}
                    </div>
                    
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <Textarea
                        placeholder="Type your message..."
                        value={messageForm.content}
                        onChange={(e) => setMessageForm(prev => ({ ...prev, content: e.target.value }))}
                        required
                        className="flex-1"
                      />
                      <Button type="submit" disabled={isLoading}>
                        Send
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <CardContent className="text-center">
                    <p className="text-gray-500">Select a player to start messaging</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
