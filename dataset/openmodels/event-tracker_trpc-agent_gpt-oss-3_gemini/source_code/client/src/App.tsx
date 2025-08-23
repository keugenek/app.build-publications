import './App.css';
import { useState, useEffect, useCallback, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/utils/trpc';
// Type‑only import for server‑side types
import type { Event, CreateEventInput } from '../../server/src/schema';

function App() {
  // State for events list
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Form state for creating a new event
  const [formData, setFormData] = useState<CreateEventInput>({
    title: '',
    description: '',
    date: new Date(), // initialize with today
  });

  // Load events from the server
  const loadEvents = useCallback(async () => {
    try {
      const data = await trpc.getEvents.query();
      setEvents(data);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newEvent = await trpc.createEvent.mutate(formData);
      // Append the newly created event to the list
      setEvents((prev) => [...prev, newEvent]);
      // Reset form
      setFormData({
        title: '',
        description: '',
        date: new Date(),
      });
    } catch (err) {
      console.error('Failed to create event:', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete an event by id
  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteEvent.mutate({ id });
      setEvents((prev) => prev.filter((ev) => ev.id !== id));
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Event Tracker</h1>

        {/* New Event Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md mb-10">
          <Input
            placeholder="Title"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            required
          />
          <Textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            className="resize-y min-h-[80px]"
          />
          <Input
            type="date"
            // Convert Date to YYYY‑MM‑DD string for the input value
            value={formData.date.toISOString().split('T')[0]}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, date: new Date(e.target.value) }))
            }
            required
          />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating...' : 'Add Event'}
          </Button>
        </form>

        {/* Events List */}
        {events.length === 0 ? (
          <p className="text-center text-gray-500">No events yet. Add one above!</p>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm flex justify-between items-start"
              >
                <div>
                  <h2 className="text-xl font-semibold">{event.title}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {event.description}
                  </p>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(event.date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDelete(event.id)}
                >
                  ✕
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
