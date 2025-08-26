import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Users, Trophy, Activity } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { User, Class, Booking } from '../../../server/src/schema';

interface MemberDashboardProps {
  currentUser: User;
  classes: Class[];
  bookings: Booking[];
  onRefresh: () => void;
}

export function MemberDashboard({ currentUser, classes, bookings, onRefresh }: MemberDashboardProps) {
  const [isCanceling, setIsCanceling] = useState(false);

  // Get booked classes with details
  const bookedClasses = useMemo(() => {
    return bookings
      .filter((booking: Booking) => booking.booking_status === 'confirmed')
      .map((booking: Booking) => {
        const classDetail = classes.find((cls: Class) => cls.id === booking.class_id);
        return {
          booking,
          class: classDetail
        };
      })
      .filter((item) => item.class) // Only include bookings where we found the class
      .sort((a, b) => new Date(a.class!.start_time).getTime() - new Date(b.class!.start_time).getTime());
  }, [bookings, classes]);

  // Separate upcoming and past classes
  const now = new Date();
  const upcomingClasses = bookedClasses.filter((item) => new Date(item.class!.start_time) > now);
  const pastClasses = bookedClasses.filter((item) => new Date(item.class!.start_time) <= now);

  // Statistics
  const stats = {
    totalBookings: bookedClasses.length,
    upcomingBookings: upcomingClasses.length,
    completedClasses: pastClasses.length,
    cancelledBookings: bookings.filter((b: Booking) => b.booking_status === 'cancelled').length
  };

  // Handle booking cancellation
  const handleCancelBooking = async (bookingId: number) => {
    setIsCanceling(true);
    try {
      await trpc.cancelBooking.mutate({ id: bookingId });
      onRefresh();
    } catch (error) {
      console.error('Failed to cancel booking:', error);
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="text-3xl">👋</div>
            <div>
              <CardTitle className="text-xl">Welcome back, {currentUser.name}!</CardTitle>
              <CardDescription>
                Ready to crush your fitness goals today?
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl text-blue-500 mb-2">📊</div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalBookings}</div>
            <div className="text-sm text-gray-600">Total Bookings</div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl text-green-500 mb-2">⏰</div>
            <div className="text-2xl font-bold text-green-600">{stats.upcomingBookings}</div>
            <div className="text-sm text-gray-600">Upcoming Classes</div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-purple-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl text-purple-500 mb-2">✅</div>
            <div className="text-2xl font-bold text-purple-600">{stats.completedClasses}</div>
            <div className="text-sm text-gray-600">Completed Classes</div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-red-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl text-red-500 mb-2">❌</div>
            <div className="text-2xl font-bold text-red-600">{stats.cancelledBookings}</div>
            <div className="text-sm text-gray-600">Cancelled</div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Tabs */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white border-2 border-orange-200">
          <TabsTrigger value="upcoming" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            📅 Upcoming Classes ({stats.upcomingBookings})
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            📚 Class History ({stats.completedClasses})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          <Card className="border-2 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-orange-500" />
                Your Upcoming Workouts
              </CardTitle>
              <CardDescription>
                Get ready to sweat! Here are your scheduled classes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingClasses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">💤</div>
                  <p>No upcoming classes booked</p>
                  <p className="text-sm mt-1">Time to book some workouts!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingClasses.map((item) => {
                    const cls = item.class!;
                    const startTime = new Date(cls.start_time);
                    const endTime = new Date(cls.end_time);
                    const isToday = startTime.toDateString() === new Date().toDateString();

                    return (
                      <Card key={item.booking.id} className={`${isToday ? 'border-green-400 bg-green-50' : 'border-gray-200'}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg">{cls.name}</h3>
                                {isToday && <Badge className="bg-green-500">Today!</Badge>}
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {startTime.toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                                  {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  Max {cls.max_capacity}
                                </div>
                              </div>
                              
                              {cls.description && (
                                <p className="text-sm text-gray-500">{cls.description}</p>
                              )}
                            </div>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelBooking(item.booking.id)}
                              disabled={isCanceling}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              {isCanceling ? 'Canceling...' : 'Cancel'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card className="border-2 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-orange-500" />
                Your Fitness Journey
              </CardTitle>
              <CardDescription>
                Look at all those gains! Your completed workouts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pastClasses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🌱</div>
                  <p>No completed classes yet</p>
                  <p className="text-sm mt-1">Your journey starts here!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pastClasses.map((item) => {
                    const cls = item.class!;
                    const startTime = new Date(cls.start_time);
                    const endTime = new Date(cls.end_time);

                    return (
                      <Card key={item.booking.id} className="border-gray-200 opacity-90">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{cls.name}</h3>
                              <Badge variant="secondary">Completed ✓</Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {startTime.toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                                {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                            
                            {cls.description && (
                              <p className="text-sm text-gray-500">{cls.description}</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
