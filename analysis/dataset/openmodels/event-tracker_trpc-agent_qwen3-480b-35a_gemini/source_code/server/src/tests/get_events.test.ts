import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { eventsTable } from '../db/schema';
import { getEvents } from '../handlers/get_events';
import { eq } from 'drizzle-orm';

describe('getEvents', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert some test events
    await db.insert(eventsTable).values([
      {
        title: 'Team Meeting',
        date: new Date('2023-06-15T10:00:00Z'),
        description: 'Weekly team sync'
      },
      {
        title: 'Product Launch',
        date: new Date('2023-06-20T14:00:00Z'),
        description: 'Launch of new product line'
      },
      {
        title: 'Conference',
        date: new Date('2023-07-05T09:00:00Z'),
        description: null
      }
    ]).execute();
  });

  afterEach(resetDB);

  it('should fetch all events from the database', async () => {
    const events = await getEvents();

    expect(events).toHaveLength(3);
    
    // Check that all expected fields are present
    events.forEach(event => {
      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('title');
      expect(event).toHaveProperty('date');
      expect(event).toHaveProperty('description');
      expect(event).toHaveProperty('created_at');
    });
  });

  it('should return events ordered by date', async () => {
    const events = await getEvents();

    // Events should be ordered by date ascending
    expect(new Date(events[0].date).getTime()).toBeLessThan(new Date(events[1].date).getTime());
    expect(new Date(events[1].date).getTime()).toBeLessThan(new Date(events[2].date).getTime());
  });

  it('should handle events with null descriptions', async () => {
    const events = await getEvents();
    
    const eventWithNullDescription = events.find(event => event.title === 'Conference');
    expect(eventWithNullDescription).toBeDefined();
    expect(eventWithNullDescription?.description).toBeNull();
  });

  it('should return empty array when no events exist', async () => {
    // Clear the database
    await db.delete(eventsTable).execute();
    
    const events = await getEvents();
    expect(events).toHaveLength(0);
  });

  it('should properly format date fields as ISO strings', async () => {
    const events = await getEvents();

    events.forEach(event => {
      // Check that dates are valid ISO strings
      expect(() => new Date(event.date)).not.toThrow();
      expect(() => new Date(event.created_at)).not.toThrow();
      
      // Verify they can be parsed back to Date objects
      const eventDate = new Date(event.date);
      const createdAt = new Date(event.created_at);
      
      expect(eventDate).toBeInstanceOf(Date);
      expect(createdAt).toBeInstanceOf(Date);
      expect(isNaN(eventDate.getTime())).toBe(false);
      expect(isNaN(createdAt.getTime())).toBe(false);
    });
  });
});
