import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { ProfileForm } from '@/components/ProfileForm';
import { UserSearch } from '@/components/UserSearch';
import { MessagingHub } from '@/components/MessagingHub';
import type { User } from '../../server/src/schema';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('profile');

  // For demo purposes, we'll simulate having a current user
  // In a real app, this would come from authentication
  const demoUser: User = {
    id: 1,
    name: 'Alex Johnson',
    email: 'alex@example.com',
    skill_level: 'intermediate',
    location: 'San Francisco, CA',
    bio: 'Love playing tennis in the evenings and weekends. Looking for consistent playing partners!',
    created_at: new Date(),
    updated_at: new Date()
  };

  useEffect(() => {
    // Simulate loading current user
    setCurrentUser(demoUser);
  }, []);

  const handleProfileUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎾</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Tennis Connect</h1>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-green-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">🎾</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Tennis Connect</h1>
                <p className="text-sm text-gray-600">Find your perfect tennis partner</p>
              </div>
            </div>
            <Card className="border-green-200">
              <CardContent className="p-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-700 font-semibold">
                      {currentUser.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{currentUser.name}</p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        {currentUser.skill_level}
                      </Badge>
                      <span className="text-xs text-gray-500">{currentUser.location}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-white border border-green-200">
            <TabsTrigger value="profile" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              👤 My Profile
            </TabsTrigger>
            <TabsTrigger value="search" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              🔍 Find Players
            </TabsTrigger>
            <TabsTrigger value="messages" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              💬 Messages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="border-green-200">
              <CardHeader className="bg-green-50">
                <CardTitle className="text-green-800">Your Tennis Profile</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ProfileForm 
                  currentUser={currentUser} 
                  onProfileUpdate={handleProfileUpdate}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="search" className="space-y-6">
            <Card className="border-green-200">
              <CardHeader className="bg-green-50">
                <CardTitle className="text-green-800">Find Tennis Partners</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <UserSearch currentUserId={currentUser.id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <Card className="border-green-200">
              <CardHeader className="bg-green-50">
                <CardTitle className="text-green-800">Your Conversations</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <MessagingHub currentUserId={currentUser.id} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-green-100 mt-16">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-gray-600 text-sm">
            🎾 Tennis Connect - Connecting tennis players worldwide
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
