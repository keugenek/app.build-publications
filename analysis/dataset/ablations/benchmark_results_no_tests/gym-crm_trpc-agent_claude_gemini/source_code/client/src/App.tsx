import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Users, Calendar, Settings } from 'lucide-react';

// Import components
import { ClassSchedule } from './components/ClassSchedule';
import { MemberDashboard } from './components/MemberDashboard';
import { AdminDashboard } from './components/AdminDashboard';

function App() {
  const [activeView, setActiveView] = useState<'member' | 'admin'>('member');
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/90 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-orange-500 to-red-600 p-2 rounded-lg">
                <Dumbbell className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">FitFlow CRM</h1>
                <p className="text-slate-400 text-sm">Gym Management System</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant={activeView === 'member' ? 'default' : 'secondary'} className="bg-orange-600">
                {activeView === 'member' ? 'Member View' : 'Admin View'}
              </Badge>
              <Button
                onClick={() => setActiveView(activeView === 'member' ? 'admin' : 'member')}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                {activeView === 'member' ? (
                  <>
                    <Settings className="h-4 w-4 mr-2" />
                    Admin
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Member
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {activeView === 'member' ? (
          <Tabs defaultValue="schedule" className="space-y-6">
            <TabsList className="bg-slate-800 border-slate-700">
              <TabsTrigger value="schedule" className="data-[state=active]:bg-orange-600">
                <Calendar className="h-4 w-4 mr-2" />
                Class Schedule
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-orange-600">
                <Users className="h-4 w-4 mr-2" />
                My Bookings
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="schedule" className="space-y-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-orange-500" />
                    Class Schedule
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Browse and book available fitness classes 💪
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ClassSchedule onMemberSelect={setSelectedMemberId} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="dashboard" className="space-y-6">
              <MemberDashboard selectedMemberId={selectedMemberId} />
            </TabsContent>
          </Tabs>
        ) : (
          <AdminDashboard />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900/90 border-t border-slate-700 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-slate-500">
            <p>FitFlow CRM © 2024 - Empowering Your Fitness Journey 🏋️‍♀️</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
