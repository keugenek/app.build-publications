import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, Trash2, Plus } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Event, CreateEventInput } from '../../server/src/schema';

function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state with proper typing
  const [formData, setFormData] = useState<CreateEventInput>({
    title: '',
    date: new Date(),
    description: ''
  });

  // Helper function to format date for input
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Load events function
  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getEvents.query();
      setEvents(result);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load events on component mount
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await trpc.createEvent.mutate(formData);
      setEvents((prev: Event[]) => [...prev, response].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      
      // Reset form
      setFormData({
        title: '',
        date: new Date(),
        description: ''
      });
    } catch (error) {
      console.error('Failed to create event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle event deletion
  const handleDelete = async (eventId: number) => {
    try {
      await trpc.deleteEvent.mutate({ id: eventId });
      setEvents((prev: Event[]) => prev.filter(event => event.id !== eventId));
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  // Check if event is upcoming
  const isUpcoming = (eventDate: Date): boolean => {
    return new Date(eventDate) > new Date();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <Calendar className="h-8 w-8 text-blue-600" />
            Event Tracker
          </h1>
          <p className="text-gray-600">Organize and track your events effortlessly</p>
        </div>

        {/* Add Event Form */}
        <Card className="mb-8 shadow-lg border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Plus className="h-5 w-5 text-blue-600" />
              Add New Event
            </CardTitle>
            <CardDescription>
              Create a new event with title, date, and description
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Event Title</label>
                  <Input
                    placeholder="Enter event title..."
                    value={formData.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateEventInput) => ({ ...prev, title: e.target.value }))
                    }
                    required
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Event Date</label>
                  <Input
                    type="datetime-local"
                    value={formatDateForInput(formData.date)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateEventInput) => ({ 
                        ...prev, 
                        date: new Date(e.target.value) 
                      }))
                    }
                    required
                    className="bg-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <Textarea
                  placeholder="Describe your event..."
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateEventInput) => ({ ...prev, description: e.target.value }))
                  }
                  required
                  className="min-h-20 bg-white resize-none"
                />
              </div>
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2"
              >
                {isSubmitting ? 'Creating Event...' : 'Create Event'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Events List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Events</h2>
          
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardContent className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No events yet. Create your first event above! 📅</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {events.map((event: Event) => (
                <Card key={event.id} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
                          {isUpcoming(event.date) ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                              Upcoming
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                              Past
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-blue-600 mb-2">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">
                            {event.date.toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-gray-600 leading-relaxed">{event.description}</p>
                        <p className="text-xs text-gray-400 mt-3">
                          Created: {event.created_at.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
