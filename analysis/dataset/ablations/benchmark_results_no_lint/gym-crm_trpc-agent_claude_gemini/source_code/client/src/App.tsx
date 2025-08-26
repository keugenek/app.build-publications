import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { trpc } from '@/utils/trpc';

// Import components
import { ClassSchedule } from '@/components/ClassSchedule';
import { AdminPanel } from '@/components/AdminPanel';
import { MemberDashboard } from '@/components/MemberDashboard';
import { UserAuth } from '@/components/UserAuth';

// Import types
import type { User, Class, Booking } from '../../server/src/schema';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [usersResult, classesResult] = await Promise.all([
        trpc.getUsers.query(),
        trpc.getClasses.query()
      ]);
      setUsers(usersResult);
      setClasses(classesResult);

      // Load user bookings if user is logged in
      if (currentUser) {
        const bookingsResult = await trpc.getBookingsByUser.query({ user_id: currentUser.id });
        setUserBookings(bookingsResult);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle user login/logout
  const handleUserChange = useCallback((user: User | null) => {
    setCurrentUser(user);
    if (!user) {
      setUserBookings([]);
    }
  }, []);

  // Refresh data after mutations
  const refreshData = useCallback(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">💪</div>
          <div className="text-xl font-bold text-gray-700">Loading FitCRM...</div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <UserAuth users={users} onUserSelect={handleUserChange} onRefresh={refreshData} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-orange-500">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">🏋️</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">FitCRM</h1>
                <p className="text-sm text-gray-600">Gym Class Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.email}`} />
                <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="text-right">
                <div className="font-semibold text-gray-800">{currentUser.name}</div>
                <Badge variant={currentUser.role === 'admin' ? 'default' : currentUser.role === 'instructor' ? 'secondary' : 'outline'}>
                  {currentUser.role}
                </Badge>
              </div>
              <Button variant="outline" onClick={() => handleUserChange(null)}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white border-2 border-orange-200">
            <TabsTrigger value="schedule" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              📅 Class Schedule
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              📊 {currentUser.role === 'member' ? 'My Bookings' : 'Dashboard'}
            </TabsTrigger>
            {(currentUser.role === 'admin' || currentUser.role === 'instructor') && (
              <TabsTrigger value="admin" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                ⚙️ Admin Panel
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="schedule" className="mt-6">
            <ClassSchedule 
              classes={classes}
              currentUser={currentUser}
              userBookings={userBookings}
              onRefresh={refreshData}
            />
          </TabsContent>

          <TabsContent value="dashboard" className="mt-6">
            <MemberDashboard 
              currentUser={currentUser}
              classes={classes}
              bookings={userBookings}
              onRefresh={refreshData}
            />
          </TabsContent>

          {(currentUser.role === 'admin' || currentUser.role === 'instructor') && (
            <TabsContent value="admin" className="mt-6">
              <AdminPanel 
                currentUser={currentUser}
                users={users}
                classes={classes}
                onRefresh={refreshData}
              />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}

export default App;
