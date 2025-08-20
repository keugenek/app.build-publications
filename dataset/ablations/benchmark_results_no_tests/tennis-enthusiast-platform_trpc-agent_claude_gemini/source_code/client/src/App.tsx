import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ProfileForm } from '@/components/ProfileForm';
import { PlayerSearch } from '@/components/PlayerSearch';
import { ConnectionsView } from '@/components/ConnectionsView';
import type { UserProfile } from '../../server/src/schema';

// 🎾 Note: Using mock current user since authentication is not implemented
// In a real app, this would come from authentication context
const MOCK_CURRENT_USER: UserProfile = {
  id: 1,
  name: 'Alex Mitchell',
  skill_level: 'Intermediate',
  city: 'Portland',
  state: 'Oregon',
  bio: 'Love playing tennis on weekends! Always looking for new partners to hit with. 🎾',
  created_at: new Date()
};

function App() {
  const [currentUser] = useState<UserProfile>(MOCK_CURRENT_USER);
  const [activeTab, setActiveTab] = useState('search');

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      {/* Hipster Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-orange-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-green-400 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">🎾</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent">
                  TennisConnect
                </h1>
                <p className="text-sm text-gray-500">Find your perfect tennis partner</p>
              </div>
            </div>
            
            <Card className="p-3 bg-white/50 backdrop-blur-sm border-orange-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-green-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-sm">
                  <div className="font-medium text-gray-700">{currentUser.name}</div>
                  <div className="flex items-center space-x-1">
                    <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                      {currentUser.skill_level}
                    </Badge>
                    <span className="text-gray-500">📍 {currentUser.city}, {currentUser.state}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-white/50 backdrop-blur-sm border border-orange-200">
            <TabsTrigger 
              value="search" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-green-400 data-[state=active]:text-white"
            >
              🔍 Find Players
            </TabsTrigger>
            <TabsTrigger 
              value="profile" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-green-400 data-[state=active]:text-white"
            >
              👤 My Profile
            </TabsTrigger>
            <TabsTrigger 
              value="connections" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-green-400 data-[state=active]:text-white"
            >
              🤝 Connections
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-gray-800">Discover Tennis Players</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Find awesome tennis partners in your area! Filter by skill level and location to discover your perfect match on the court. 🎾
                </p>
              </div>
              <PlayerSearch currentUserId={currentUser.id} />
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-gray-800">Your Tennis Profile</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Keep your profile fresh and let other players know what makes you an awesome tennis partner! ✨
                </p>
              </div>
              <ProfileForm currentUser={currentUser} />
            </div>
          </TabsContent>

          <TabsContent value="connections">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-gray-800">Your Tennis Network</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Manage your connections and see who's interested in playing tennis with you! 🤝
                </p>
              </div>
              <ConnectionsView currentUserId={currentUser.id} />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Hipster Footer */}
      <footer className="bg-white/50 backdrop-blur-sm border-t border-orange-200 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-2">
            <p className="text-gray-600">Made with 💜 for the tennis community</p>
            <p className="text-sm text-gray-500">
              "Tennis is a perfect combination of violent action taking place in an atmosphere of total tranquility." - Billie Jean King
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
