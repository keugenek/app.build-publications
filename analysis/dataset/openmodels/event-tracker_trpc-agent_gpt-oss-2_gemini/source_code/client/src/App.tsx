import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
import { trpc } from '@/utils/trpc';
import { EventForm } from '@/components/EventForm';
import type { Event } from '../../server/src/schema';

function App() {
  const [events, setEvents] = useState<Event[]>([]);
  

  const loadEvents = useCallback(async () => {
    try {
      const data = await trpc.getEvents.query();
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events', error);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleEventCreated = (event: Event) => {
    setEvents((prev) => [...prev, event]);
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteEvent.mutate({ id });
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (error) {
      console.error('Failed to delete event', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-center mb-6">Event Tracker</h1>
      <EventForm onEventCreated={handleEventCreated} />
      {events.length === 0 ? (
        <p className="text-center text-gray-500 mt-8">No events yet. Add one above!</p>
      ) : (
        <div className="mt-8 space-y-4">
          {events.map((event) => (
            <Card key={event.id} className="max-w-2xl mx-auto">
              <CardHeader className="flex justify-between items-start">
                <div>
                  <CardTitle>{event.title}</CardTitle>
                  {event.description && (
                    <CardDescription>{event.description}</CardDescription>
                  )}
                </div>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(event.id)}>
                  Delete
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Date: {new Date(event.event_date).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Created: {new Date(event.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
