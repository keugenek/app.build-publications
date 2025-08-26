import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { EventForm } from '@/components/EventForm';
import { EventList } from '@/components/EventList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, Plus } from 'lucide-react';
import type { Event, CreateEventInput } from '../../server/src/schema';

function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

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

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleCreateEvent = async (eventData: CreateEventInput) => {
    setIsCreating(true);
    try {
      const newEvent = await trpc.createEvent.mutate(eventData);
      setEvents((prev: Event[]) => [...prev, newEvent].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      ));
    } catch (error) {
      console.error('Failed to create event:', error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    try {
      await trpc.deleteEvent.mutate({ id: eventId });
      setEvents((prev: Event[]) => prev.filter(event => event.id !== eventId));
    } catch (error) {
      console.error('Failed to delete event:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <CalendarDays className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Event Tracker</h1>
          </div>
          <p className="text-lg text-gray-600">Keep track of your important events and never miss a moment</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Add Event Form */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Event
              </CardTitle>
              <CardDescription className="text-blue-100">
                Create a new event to track
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <EventForm onSubmit={handleCreateEvent} isLoading={isCreating} />
            </CardContent>
          </Card>

          {/* Event List */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Your Events
              </CardTitle>
              <CardDescription className="text-indigo-100">
                {events.length} {events.length === 1 ? 'event' : 'events'} scheduled
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <EventList events={events} onDelete={handleDeleteEvent} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <Separator className="mb-6" />
          <p className="text-gray-500 text-sm">
            ✨ Stay organized and never forget important events
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
