import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Clock, Users, User } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { User as UserType, Class, Booking } from '../../../server/src/schema';

interface ClassScheduleProps {
  classes: Class[];
  currentUser: UserType;
  userBookings: Booking[];
  onRefresh: () => void;
}

export function ClassSchedule({ classes, currentUser, userBookings, onRefresh }: ClassScheduleProps) {
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Filter classes by selected date
  const filteredClasses = useMemo(() => {
    const selectedDateStr = selectedDate.toDateString();
    return classes.filter((cls: Class) => {
      const classDate = new Date(cls.start_time).toDateString();
      return classDate === selectedDateStr;
    });
  }, [classes, selectedDate]);

  // Check if user has booked a specific class
  const isClassBooked = (classId: number) => {
    return userBookings.some((booking: Booking) => booking.class_id === classId && booking.booking_status === 'confirmed');
  };

  // Handle booking a class
  const handleBookClass = async (classId: number) => {
    setIsBooking(true);
    try {
      await trpc.createBooking.mutate({
        user_id: currentUser.id,
        class_id: classId
      });
      onRefresh();
      setSelectedClass(null);
    } catch (error) {
      console.error('Failed to book class:', error);
    } finally {
      setIsBooking(false);
    }
  };

  // Handle canceling a booking
  const handleCancelBooking = async (classId: number) => {
    const booking = userBookings.find((b: Booking) => b.class_id === classId && b.booking_status === 'confirmed');
    if (!booking) return;

    setIsBooking(true);
    try {
      await trpc.cancelBooking.mutate({ id: booking.id });
      onRefresh();
      setSelectedClass(null);
    } catch (error) {
      console.error('Failed to cancel booking:', error);
    } finally {
      setIsBooking(false);
    }
  };

  // Generate date navigation
  const generateDateRange = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const dateRange = generateDateRange();

  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      <Card className="border-2 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-500" />
            Select Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {dateRange.map((date: Date) => (
              <Button
                key={date.toDateString()}
                variant={selectedDate.toDateString() === date.toDateString() ? 'default' : 'outline'}
                className={`min-w-[120px] ${
                  selectedDate.toDateString() === date.toDateString() 
                    ? 'bg-orange-500 hover:bg-orange-600' 
                    : 'hover:bg-orange-50'
                }`}
                onClick={() => setSelectedDate(date)}
              >
                <div className="text-center">
                  <div className="text-sm font-semibold">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-xs">
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Class List */}
      <Card className="border-2 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-orange-500" />
            Classes for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </CardTitle>
          <CardDescription>
            {filteredClasses.length} class{filteredClasses.length !== 1 ? 'es' : ''} available
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredClasses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">😴</div>
              <p>No classes scheduled for this date</p>
              <p className="text-sm mt-1">Check back tomorrow for new sessions!</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredClasses.map((cls: Class) => {
                const isBooked = isClassBooked(cls.id);
                const startTime = new Date(cls.start_time);
                const endTime = new Date(cls.end_time);

                return (
                  <Dialog key={cls.id}>
                    <DialogTrigger asChild>
                      <Card className={`cursor-pointer transition-all hover:shadow-lg ${
                        isBooked ? 'border-green-500 bg-green-50' : 'border-orange-200 hover:border-orange-300'
                      }`}>
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-lg">{cls.name}</h3>
                              {isBooked && (
                                <Badge className="bg-green-500">Booked ✓</Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                              {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Users className="h-4 w-4" />
                              Max {cls.max_capacity} participants
                            </div>
                            
                            {cls.description && (
                              <p className="text-sm text-gray-500 line-clamp-2">
                                {cls.description}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </DialogTrigger>
                    
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <div className="text-2xl">🏋️</div>
                          {cls.name}
                        </DialogTitle>
                        <DialogDescription>
                          {startTime.toLocaleString()} - {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        {cls.description && (
                          <div>
                            <h4 className="font-medium mb-2">Description</h4>
                            <p className="text-sm text-gray-600">{cls.description}</p>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            Max {cls.max_capacity} participants
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            Instructor #{cls.instructor_id}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {isBooked ? (
                            <Button 
                              variant="destructive" 
                              onClick={() => handleCancelBooking(cls.id)}
                              disabled={isBooking}
                              className="flex-1"
                            >
                              {isBooking ? 'Canceling...' : 'Cancel Booking'}
                            </Button>
                          ) : (
                            <Button 
                              onClick={() => handleBookClass(cls.id)}
                              disabled={isBooking}
                              className="flex-1 bg-orange-500 hover:bg-orange-600"
                            >
                              {isBooking ? 'Booking...' : 'Book Class 💪'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
