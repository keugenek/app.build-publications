import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Trash2, FileText } from 'lucide-react';
import type { Event } from '../../../server/src/schema';

interface EventListProps {
  events: Event[];
  onDelete: (eventId: number) => Promise<void>;
}

export function EventList({ events, onDelete }: EventListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (eventId: number) => {
    setDeletingId(eventId);
    try {
      await onDelete(eventId);
    } catch (error) {
      console.error('Failed to delete event:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const formatEventDate = (date: Date): { date: string; time: string; isPast: boolean } => {
    const eventDate = new Date(date);
    const now = new Date();
    const isPast = eventDate < now;
    
    return {
      date: eventDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      time: eventDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      isPast
    };
  };

  const getTimeUntilEvent = (date: Date): string => {
    const eventDate = new Date(date);
    const now = new Date();
    const timeDiff = eventDate.getTime() - now.getTime();
    
    if (timeDiff < 0) {
      return 'Past event';
    }
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} away`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} away`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} away`;
    } else {
      return 'Starting soon!';
    }
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
        <p className="text-gray-500">Create your first event to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {events.map((event: Event) => {
        const { date, time, isPast } = formatEventDate(event.date);
        const timeUntil = getTimeUntilEvent(event.date);
        
        return (
          <Card 
            key={event.id} 
            className={`transition-all duration-200 hover:shadow-md border ${
              isPast ? 'bg-gray-50 border-gray-200' : 'bg-white border-blue-200 hover:border-blue-300'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Event Title and Status */}
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className={`text-lg font-semibold truncate ${
                      isPast ? 'text-gray-600' : 'text-gray-900'
                    }`}>
                      {event.title}
                    </h3>
                    <Badge variant={isPast ? 'secondary' : 'default'} className="text-xs">
                      {isPast ? '🕐 Past' : '📅 Upcoming'}
                    </Badge>
                  </div>

                  {/* Date and Time */}
                  <div className="flex items-center gap-4 mb-3 text-sm">
                    <div className={`flex items-center gap-1 ${
                      isPast ? 'text-gray-500' : 'text-blue-600'
                    }`}>
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">{date}</span>
                    </div>
                    <div className={`flex items-center gap-1 ${
                      isPast ? 'text-gray-500' : 'text-indigo-600'
                    }`}>
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">{time}</span>
                    </div>
                  </div>

                  {/* Time Until Event */}
                  {!isPast && (
                    <div className="mb-3">
                      <Badge variant="outline" className="text-xs font-medium text-green-700 border-green-200">
                        ⏰ {timeUntil}
                      </Badge>
                    </div>
                  )}

                  {/* Description */}
                  <div className="flex items-start gap-2 mb-3">
                    <FileText className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                      isPast ? 'text-gray-400' : 'text-gray-600'
                    }`} />
                    <p className={`text-sm leading-relaxed ${
                      isPast ? 'text-gray-500' : 'text-gray-700'
                    }`}>
                      {event.description}
                    </p>
                  </div>

                  {/* Created Date */}
                  <p className="text-xs text-gray-400">
                    Created: {new Date(event.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Delete Button */}
                <div className="ml-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={deletingId === event.id}
                      >
                        {deletingId === event.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Event</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{event.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(event.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
