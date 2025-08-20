import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Users, UserPlus, CheckCircle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { ScheduleView, Member } from '../../../server/src/schema';

interface ClassScheduleProps {
  onMemberSelect: (memberId: number | null) => void;
}

export function ClassSchedule({ onMemberSelect }: ClassScheduleProps) {
  const [schedule, setSchedule] = useState<ScheduleView[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [bookingClass, setBookingClass] = useState<number | null>(null);

  // Get week range
  const getWeekRange = useCallback((date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay()); // Start of week (Sunday)
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(end.getDate() + 6); // End of week (Saturday)
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  }, []);

  // Load schedule data
  const loadSchedule = useCallback(async () => {
    try {
      const { start, end } = getWeekRange(selectedWeek);
      const result = await trpc.getSchedule.query({ start_date: start, end_date: end });
      setSchedule(result);
    } catch (error) {
      console.error('Failed to load schedule:', error);
    }
  }, [selectedWeek, getWeekRange]);

  // Load members for booking
  const loadMembers = useCallback(async () => {
    try {
      const result = await trpc.getMembers.query();
      setMembers(result);
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  }, []);

  useEffect(() => {
    loadSchedule();
    loadMembers();
  }, [loadSchedule, loadMembers]);

  // Handle booking
  const handleBookClass = async (classId: number) => {
    if (!selectedMember) return;
    
    setIsLoading(true);
    setBookingClass(classId);
    
    try {
      await trpc.createBooking.mutate({
        member_id: parseInt(selectedMember),
        class_id: classId
      });
      
      // Refresh schedule to update available spots
      await loadSchedule();
      
      // Update selected member for dashboard
      onMemberSelect(parseInt(selectedMember));
      
      setBookingClass(null);
    } catch (error) {
      console.error('Failed to book class:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Week navigation
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedWeek);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedWeek(newDate);
  };

  // Group classes by date
  const classesByDate = schedule.reduce((acc, cls) => {
    const dateKey = cls.class_date.toDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(cls);
    return acc;
  }, {} as Record<string, ScheduleView[]>);

  // Generate week days
  const weekDays = [];
  const { start } = getWeekRange(selectedWeek);
  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(day.getDate() + i);
    weekDays.push(day);
  }

  const getStatusColor = (status: string, availableSpots: number) => {
    if (status === 'cancelled') return 'bg-red-600';
    if (status === 'completed') return 'bg-gray-600';
    if (availableSpots === 0) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  const getStatusText = (status: string, availableSpots: number) => {
    if (status === 'cancelled') return 'Cancelled';
    if (status === 'completed') return 'Completed';
    if (availableSpots === 0) return 'Full';
    return `${availableSpots} spots`;
  };

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            onClick={() => navigateWeek('prev')} 
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            ← Previous Week
          </Button>
          <h3 className="text-lg font-semibold text-white">
            Week of {start.toLocaleDateString()}
          </h3>
          <Button 
            onClick={() => navigateWeek('next')} 
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Next Week →
          </Button>
        </div>
        
        <Select value={selectedMember} onValueChange={setSelectedMember}>
          <SelectTrigger className="w-64 bg-slate-700 border-slate-600 text-white">
            <SelectValue placeholder="Select member to book classes" />
          </SelectTrigger>
          <SelectContent className="bg-slate-700 border-slate-600">
            {members.map((member: Member) => (
              <SelectItem 
                key={member.id} 
                value={member.id.toString()}
                className="text-white hover:bg-slate-600"
              >
                {member.first_name} {member.last_name} - {member.membership_type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((day: Date) => {
          const dateKey = day.toDateString();
          const dayClasses = classesByDate[dateKey] || [];
          
          return (
            <Card key={dateKey} className="bg-slate-700/50 border-slate-600 min-h-[200px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-white">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {dayClasses.length === 0 ? (
                  <p className="text-slate-500 text-sm">No classes scheduled</p>
                ) : (
                  dayClasses.map((cls: ScheduleView) => {
                    const availableSpots = cls.max_capacity - cls.current_bookings;
                    
                    return (
                      <Dialog key={cls.id}>
                        <DialogTrigger asChild>
                          <div className="cursor-pointer p-2 rounded-lg bg-slate-600/50 hover:bg-slate-600 transition-colors">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium text-white text-sm truncate">
                                {cls.name}
                              </h4>
                              <Badge 
                                className={`text-xs ${getStatusColor(cls.status, availableSpots)} text-white`}
                              >
                                {getStatusText(cls.status, availableSpots)}
                              </Badge>
                            </div>
                            <div className="flex items-center text-slate-300 text-xs space-x-2">
                              <Clock className="h-3 w-3" />
                              <span>{cls.start_time}</span>
                              <Users className="h-3 w-3" />
                              <span>{cls.current_bookings}/{cls.max_capacity}</span>
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-800 border-slate-600 text-white">
                          <DialogHeader>
                            <DialogTitle className="text-orange-400">{cls.name}</DialogTitle>
                            <DialogDescription className="text-slate-300">
                              {cls.description || 'No description available'}
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <strong className="text-orange-400">Instructor:</strong>
                                <p>{cls.instructor_name}</p>
                              </div>
                              <div>
                                <strong className="text-orange-400">Duration:</strong>
                                <p>{cls.duration_minutes} minutes</p>
                              </div>
                              <div>
                                <strong className="text-orange-400">Date & Time:</strong>
                                <p>{cls.class_date.toLocaleDateString()} at {cls.start_time}</p>
                              </div>
                              <div>
                                <strong className="text-orange-400">Capacity:</strong>
                                <p>{cls.current_bookings}/{cls.max_capacity} booked</p>
                              </div>
                            </div>
                            
                            {availableSpots > 0 && cls.status === 'scheduled' && selectedMember && (
                              <Button
                                onClick={() => handleBookClass(cls.id)}
                                disabled={isLoading || bookingClass === cls.id}
                                className="w-full bg-orange-600 hover:bg-orange-700"
                              >
                                {bookingClass === cls.id ? (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-2 animate-spin" />
                                    Booking...
                                  </>
                                ) : (
                                  <>
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Book Class
                                  </>
                                )}
                              </Button>
                            )}
                            
                            {!selectedMember && (
                              <p className="text-slate-400 text-sm text-center">
                                Please select a member to book this class
                              </p>
                            )}
                            
                            {availableSpots === 0 && (
                              <p className="text-yellow-400 text-sm text-center font-medium">
                                ⚠️ This class is fully booked
                              </p>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    );
                  })
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
