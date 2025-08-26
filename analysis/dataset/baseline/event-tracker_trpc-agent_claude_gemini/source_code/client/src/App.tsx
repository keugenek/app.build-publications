import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar, Plus, Trash2, Clock } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Event, CreateEventInput } from '../../server/src/schema';

function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState<CreateEventInput>({
    title: '',
    description: null,
    date: new Date()
  });

  const loadEvents = useCallback(async () => {
    try {
      const result = await trpc.getEvents.query();
      setEvents(result);
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const response = await trpc.createEvent.mutate(formData);
      setEvents((prev: Event[]) => [...prev, response].sort((a, b) => a.date.getTime() - b.date.getTime()));
      setFormData({
        title: '',
        description: null,
        date: new Date()
      });
    } catch (error) {
      console.error('Failed to create event:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (eventId: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteEvent.mutate({ id: eventId });
      setEvents((prev: Event[]) => prev.filter(event => event.id !== eventId));
    } catch (error) {
      console.error('Failed to delete event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isUpcoming = (date: Date) => {
    return date.getTime() > Date.now();
  };

  const upcomingEvents = events.filter(event => isUpcoming(event.date));
  const pastEvents = events.filter(event => !isUpcoming(event.date));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Event Tracker</h1>
          </div>
          <p className="text-gray-600 text-lg">Organize your events and never miss important moments 🎯</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Event Form */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Plus className="w-5 h-5 text-blue-600" />
                  Create New Event
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Input
                      placeholder="Event title"
                      value={formData.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateEventInput) => ({ ...prev, title: e.target.value }))
                      }
                      required
                      className="border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <Textarea
                      placeholder="Event description (optional)"
                      value={formData.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setFormData((prev: CreateEventInput) => ({
                          ...prev,
                          description: e.target.value || null
                        }))
                      }
                      className="border-gray-300 focus:border-blue-500 resize-none h-24"
                    />
                  </div>

                  <div>
                    <Input
                      type="datetime-local"
                      value={formData.date instanceof Date ? 
                        formData.date.toISOString().slice(0, 16) : 
                        formData.date}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateEventInput) => ({ 
                          ...prev, 
                          date: new Date(e.target.value) 
                        }))
                      }
                      required
                      className="border-gray-300 focus:border-blue-500"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isCreating || !formData.title.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2"
                  >
                    {isCreating ? 'Creating...' : '✨ Create Event'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Events List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Events */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-6 h-6 text-green-600" />
                Upcoming Events ({upcomingEvents.length})
              </h2>
              
              {upcomingEvents.length === 0 ? (
                <Card className="border-0 bg-white/60 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No upcoming events yet</p>
                    <p className="text-gray-400">Create your first event to get started! 🚀</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {upcomingEvents.map((event: Event) => (
                    <Card key={event.id} className="shadow-md border-0 bg-white/80 backdrop-blur-sm border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.title}</h3>
                            {event.description && (
                              <p className="text-gray-600 mb-3 leading-relaxed">{event.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1 text-green-700 font-medium">
                                <Calendar className="w-4 h-4" />
                                {formatDate(event.date)}
                              </span>
                              <span className="flex items-center gap-1 text-green-700 font-medium">
                                <Clock className="w-4 h-4" />
                                {formatTime(event.date)}
                              </span>
                            </div>
                          </div>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                disabled={isLoading}
                              >
                                <Trash2 className="w-4 h-4" />
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

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-gray-500" />
                  Past Events ({pastEvents.length})
                </h2>
                
                <div className="space-y-4">
                  {pastEvents.map((event: Event) => (
                    <Card key={event.id} className="shadow-md border-0 bg-white/60 backdrop-blur-sm border-l-4 border-l-gray-400 hover:shadow-lg transition-shadow opacity-75">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">{event.title}</h3>
                            {event.description && (
                              <p className="text-gray-500 mb-3 leading-relaxed">{event.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1 text-gray-600">
                                <Calendar className="w-4 h-4" />
                                {formatDate(event.date)}
                              </span>
                              <span className="flex items-center gap-1 text-gray-600">
                                <Clock className="w-4 h-4" />
                                {formatTime(event.date)}
                              </span>
                            </div>
                          </div>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                disabled={isLoading}
                              >
                                <Trash2 className="w-4 h-4" />
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
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-500">Built with React, Tailwind CSS, and Radix UI ⚡</p>
        </div>
      </div>
    </div>
  );
}

export default App;
