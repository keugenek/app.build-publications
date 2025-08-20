import './App.css';
import { useState, useEffect, useCallback } from 'react';
import { EventForm } from '@/components/EventForm';
import { EventList } from '@/components/EventList';
import { trpc } from '@/utils/trpc';
import type { Event, CreateEventInput } from '../../server/src/schema';

function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleCreateEvent = async (data: CreateEventInput) => {
    setIsLoading(true);
    try {
      const response = await trpc.createEvent.mutate(data);
      setEvents((prev) => [...prev, response]);
    } catch (error) {
      console.error('Failed to create event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    try {
      await trpc.deleteEvent.mutate({ id });
      setEvents((prev) => prev.filter(event => event.id !== id));
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Event Tracker</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Keep track of your important events and dates
          </p>
        </div>

        <EventForm onSubmit={handleCreateEvent} isLoading={isLoading} />
        
        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Your Events</h2>
          <EventList events={events} onDelete={handleDeleteEvent} />
        </div>
      </div>
    </div>
  );
}

export default App;
