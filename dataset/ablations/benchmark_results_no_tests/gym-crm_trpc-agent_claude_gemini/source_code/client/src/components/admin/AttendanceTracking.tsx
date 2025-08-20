import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Clock, Users, Calendar, User, AlertTriangle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Class, Attendance } from '../../../../server/src/schema';

export function AttendanceTracking() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  // Load classes
  const loadClasses = useCallback(async () => {
    try {
      const result = await trpc.getClasses.query();
      // Filter to show classes that are scheduled or completed
      const relevantClasses = result.filter(c => 
        c.status === 'scheduled' || c.status === 'completed' || c.status === 'in_progress'
      );
      setClasses(relevantClasses);
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  }, []);

  // Load attendance for selected class
  const loadAttendance = useCallback(async (classId: number) => {
    setIsLoading(true);
    try {
      const result = await trpc.getClassAttendance.query(classId);
      setAttendance(result);
    } catch (error) {
      console.error('Failed to load attendance:', error);
      setAttendance([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    if (selectedClassId) {
      loadAttendance(parseInt(selectedClassId));
    }
  }, [selectedClassId, loadAttendance]);

  // Handle status update
  const handleStatusUpdate = async (bookingId: number, newStatus: 'booked' | 'attended' | 'no_show' | 'cancelled') => {
    setUpdatingStatus(bookingId);
    
    try {
      await trpc.updateBookingStatus.mutate({
        id: bookingId,
        status: newStatus
      });
      
      // Refresh attendance
      if (selectedClassId) {
        await loadAttendance(parseInt(selectedClassId));
      }
    } catch (error) {
      console.error('Failed to update booking status:', error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const selectedClass = classes.find(c => c.id.toString() === selectedClassId);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'attended':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'no_show':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
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

  const getClassStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-600';
      case 'in_progress':
        return 'bg-green-600';
      case 'completed':
        return 'bg-gray-600';
      default:
        return 'bg-slate-600';
    }
  };

  // Calculate attendance statistics
  const attendanceStats = attendance.length > 0 ? {
    total: attendance.length,
    attended: attendance.filter(a => a.status === 'attended').length,
    noShow: attendance.filter(a => a.status === 'no_show').length,
    booked: attendance.filter(a => a.status === 'booked').length,
    cancelled: attendance.filter(a => a.status === 'cancelled').length,
  } : null;

  const attendanceRate = attendanceStats ? 
    ((attendanceStats.attended / Math.max(attendanceStats.total - attendanceStats.cancelled, 1)) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Class Selection */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Users className="h-5 w-5 mr-2 text-orange-500" />
            Attendance Tracking
          </CardTitle>
          <CardDescription className="text-slate-400">
            Track member attendance for classes 📋
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
            <div className="lg:col-span-2">
              <label className="text-slate-300 text-sm font-medium mb-2 block">
                Select Class
              </label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Choose a class to view attendance..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {classes.map((cls: Class) => (
                    <SelectItem 
                      key={cls.id} 
                      value={cls.id.toString()}
                      className="text-white hover:bg-slate-600"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{cls.name} - {cls.class_date.toLocaleDateString()}</span>
                        <Badge className={`ml-2 ${getClassStatusColor(cls.status)}`}>
                          {cls.status}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedClass && (
              <div className="bg-slate-700/50 p-3 rounded-lg">
                <div className="text-white font-medium">{selectedClass.name}</div>
                <div className="text-slate-400 text-sm">
                  {selectedClass.class_date.toLocaleDateString()} at {selectedClass.start_time}
                </div>
                <div className="text-slate-400 text-sm">
                  Instructor: {selectedClass.instructor_name}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attendance Statistics */}
      {attendanceStats && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Attendance Overview</CardTitle>
            <CardDescription className="text-slate-400">
              Class attendance statistics and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                <div className="text-2xl font-bold text-white">{attendanceStats.total}</div>
                <div className="text-sm text-slate-400">Total Bookings</div>
              </div>
              <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                <div className="text-2xl font-bold text-green-400">{attendanceStats.attended}</div>
                <div className="text-sm text-slate-400">Attended</div>
              </div>
              <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                <div className="text-2xl font-bold text-red-400">{attendanceStats.noShow}</div>
                <div className="text-sm text-slate-400">No Shows</div>
              </div>
              <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">{attendanceStats.booked}</div>
                <div className="text-sm text-slate-400">Pending</div>
              </div>
              <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                <div className="text-2xl font-bold text-orange-400">{attendanceRate}%</div>
                <div className="text-sm text-slate-400">Attendance Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance List */}
      {selectedClassId && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-orange-500" />
              Class Attendance
            </CardTitle>
            <CardDescription className="text-slate-400">
              Mark attendance and manage booking statuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </div>
            ) : attendance.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-500">
                  No bookings found for this class 📅
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-600">
                      <TableHead className="text-slate-300">Member</TableHead>
                      <TableHead className="text-slate-300">Class</TableHead>
                      <TableHead className="text-slate-300">Date & Time</TableHead>
                      <TableHead className="text-slate-300">Current Status</TableHead>
                      <TableHead className="text-slate-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.map((record: Attendance) => (
                      <TableRow key={record.booking_id} className="border-slate-600">
                        <TableCell>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-slate-400" />
                            <div>
                              <div className="font-medium text-white">{record.member_name}</div>
                              <div className="text-sm text-slate-400">ID: {record.member_id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-white">{record.class_name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-slate-300">
                            <div>{record.class_date.toLocaleDateString()}</div>
                            <div className="text-sm text-slate-400">{record.start_time}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(record.status)}
                            <Badge className={getStatusColor(record.status)}>
                              {record.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {record.status === 'booked' && (
                              <>
                                <Button
                                  onClick={() => handleStatusUpdate(record.booking_id, 'attended')}
                                  disabled={updatingStatus === record.booking_id}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Attended
                                </Button>
                                <Button
                                  onClick={() => handleStatusUpdate(record.booking_id, 'no_show')}
                                  disabled={updatingStatus === record.booking_id}
                                  size="sm"
                                  variant="destructive"
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  No Show
                                </Button>
                              </>
                            )}
                            
                            {record.status === 'attended' && (
                              <Button
                                onClick={() => handleStatusUpdate(record.booking_id, 'booked')}
                                disabled={updatingStatus === record.booking_id}
                                size="sm"
                                variant="outline"
                                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                              >
                                <Clock className="h-4 w-4 mr-1" />
                                Undo
                              </Button>
                            )}
                            
                            {record.status === 'no_show' && (
                              <div className="flex space-x-2">
                                <Button
                                  onClick={() => handleStatusUpdate(record.booking_id, 'attended')}
                                  disabled={updatingStatus === record.booking_id}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Attended
                                </Button>
                                <Button
                                  onClick={() => handleStatusUpdate(record.booking_id, 'booked')}
                                  disabled={updatingStatus === record.booking_id}
                                  size="sm"
                                  variant="outline"
                                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                                >
                                  <Clock className="h-4 w-4 mr-1" />
                                  Reset
                                </Button>
                              </div>
                            )}
                            
                            {updatingStatus === record.booking_id && (
                              <div className="text-slate-400 text-sm">Updating...</div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
