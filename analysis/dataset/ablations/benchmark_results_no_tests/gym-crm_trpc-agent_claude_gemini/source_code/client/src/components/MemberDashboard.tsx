import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { User, Calendar, Clock, X, CheckCircle, AlertCircle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Member, MemberBookingView } from '../../../server/src/schema';

interface MemberDashboardProps {
  selectedMemberId: number | null;
}

export function MemberDashboard({ selectedMemberId }: MemberDashboardProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [currentMember, setCurrentMember] = useState<string>(selectedMemberId?.toString() || '');
  const [bookings, setBookings] = useState<MemberBookingView[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cancellingBooking, setCancellingBooking] = useState<number | null>(null);

  // Load members
  const loadMembers = useCallback(async () => {
    try {
      const result = await trpc.getMembers.query();
      setMembers(result);
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  }, []);

  // Load member bookings
  const loadMemberBookings = useCallback(async (memberId: number) => {
    setIsLoading(true);
    try {
      const result = await trpc.getMemberBookings.query(memberId);
      setBookings(result);
    } catch (error) {
      console.error('Failed to load member bookings:', error);
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle member selection change
  useEffect(() => {
    if (selectedMemberId && selectedMemberId.toString() !== currentMember) {
      setCurrentMember(selectedMemberId.toString());
    }
  }, [selectedMemberId, currentMember]);

  // Load data on component mount and member change
  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    if (currentMember) {
      loadMemberBookings(parseInt(currentMember));
    }
  }, [currentMember, loadMemberBookings]);

  // Handle booking cancellation
  const handleCancelBooking = async (bookingId: number) => {
    setCancellingBooking(bookingId);
    try {
      await trpc.cancelBooking.mutate(bookingId);
      // Refresh bookings
      if (currentMember) {
        await loadMemberBookings(parseInt(currentMember));
      }
    } catch (error) {
      console.error('Failed to cancel booking:', error);
    } finally {
      setCancellingBooking(null);
    }
  };

  const selectedMemberData = members.find(m => m.id.toString() === currentMember);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'attended':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'no_show':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-gray-500" />;
      default:
        return <Calendar className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'attended':
        return 'bg-green-600';
      case 'no_show':
        return 'bg-red-600';
      case 'cancelled':
        return 'bg-gray-600';
      default:
        return 'bg-blue-600';
    }
  };

  const getMembershipColor = (type: string) => {
    switch (type) {
      case 'vip':
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 'premium':
        return 'bg-gradient-to-r from-purple-500 to-purple-700';
      default:
        return 'bg-gradient-to-r from-blue-500 to-blue-700';
    }
  };

  // Filter bookings into categories
  const upcomingBookings = bookings.filter(b => 
    b.status === 'booked' && new Date(b.class_date) >= new Date()
  );
  const pastBookings = bookings.filter(b => 
    b.status !== 'booked' || new Date(b.class_date) < new Date()
  );

  return (
    <div className="space-y-6">
      {/* Member Selection */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <User className="h-5 w-5 mr-2 text-orange-500" />
            Member Dashboard
          </CardTitle>
          <CardDescription className="text-slate-400">
            View and manage member bookings 🎯
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={currentMember} onValueChange={setCurrentMember}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="Select a member to view bookings" />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              {members.map((member: Member) => (
                <SelectItem 
                  key={member.id} 
                  value={member.id.toString()}
                  className="text-white hover:bg-slate-600"
                >
                  {member.first_name} {member.last_name} ({member.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Member Info */}
      {selectedMemberData && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">
                  {selectedMemberData.first_name} {selectedMemberData.last_name}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {selectedMemberData.email}
                  {selectedMemberData.phone && ` • ${selectedMemberData.phone}`}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getMembershipColor(selectedMemberData.membership_type)}>
                  {selectedMemberData.membership_type.toUpperCase()}
                </Badge>
                <Badge variant={selectedMemberData.status === 'active' ? 'default' : 'secondary'}>
                  {selectedMemberData.status}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-orange-500">{bookings.length}</p>
                <p className="text-slate-400 text-sm">Total Bookings</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500">
                  {bookings.filter(b => b.status === 'attended').length}
                </p>
                <p className="text-slate-400 text-sm">Attended</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-500">{upcomingBookings.length}</p>
                <p className="text-slate-400 text-sm">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bookings */}
      {currentMember && (
        <>
          {/* Upcoming Bookings */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Upcoming Classes</CardTitle>
              <CardDescription className="text-slate-400">
                Classes scheduled for the future
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : upcomingBookings.length === 0 ? (
                <p className="text-slate-500 text-center py-8">
                  No upcoming bookings 📅
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingBookings.map((booking: MemberBookingView) => (
                    <div key={booking.id} className="bg-slate-700/50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(booking.status)}
                            <h3 className="font-semibold text-white">{booking.class_name}</h3>
                            <Badge className={`text-xs ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </Badge>
                          </div>
                          <div className="flex items-center text-slate-300 text-sm mt-1 space-x-4">
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {booking.class_date.toLocaleDateString()}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {booking.start_time} ({booking.duration_minutes}min)
                            </span>
                            <span className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              {booking.instructor_name}
                            </span>
                          </div>
                        </div>
                        
                        {booking.status === 'booked' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                              >
                                Cancel
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-800 border-slate-600 text-white">
                              <DialogHeader>
                                <DialogTitle>Cancel Booking</DialogTitle>
                                <DialogDescription className="text-slate-300">
                                  Are you sure you want to cancel this booking for "{booking.class_name}"?
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button variant="outline" className="border-slate-600">
                                  Keep Booking
                                </Button>
                                <Button
                                  onClick={() => handleCancelBooking(booking.id)}
                                  disabled={cancellingBooking === booking.id}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {cancellingBooking === booking.id ? 'Cancelling...' : 'Yes, Cancel'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Past Bookings */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Booking History</CardTitle>
              <CardDescription className="text-slate-400">
                Past classes and attendance record
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pastBookings.length === 0 ? (
                <p className="text-slate-500 text-center py-8">
                  No booking history yet 📋
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {pastBookings.map((booking: MemberBookingView) => (
                    <div key={booking.id} className="bg-slate-700/30 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(booking.status)}
                            <h3 className="font-medium text-white">{booking.class_name}</h3>
                            <Badge className={`text-xs ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </Badge>
                          </div>
                          <div className="flex items-center text-slate-400 text-sm mt-1 space-x-4">
                            <span>{booking.class_date.toLocaleDateString()}</span>
                            <span>{booking.start_time}</span>
                            <span>{booking.instructor_name}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
