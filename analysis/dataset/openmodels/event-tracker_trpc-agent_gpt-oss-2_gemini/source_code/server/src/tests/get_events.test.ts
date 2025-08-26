import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type Event } from '../schema';
import { getEvents } from '../handlers/get_events';
// import { eq } from 'drizzle-orm';

/**
 * Helper to create an event directly via the DB.
 */
const createEventInDB = async (overrides?: Partial<Event>) => {
  const base = {
    title: 'Sample Event',
    description: 'A test event',
    event_date: new Date('2024-01-01T10:00:00Z'),
    // created_at will be set by default
  } as const;

  const [inserted] = await db
    .insert(eventsTable)
    .values({ ...base, ...overrides })
    .returning()
    .execute();
  return inserted;
};

describe('getEvents handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('returns an empty array when there are no events', async () => {
    const events = await getEvents();
    expect(events).toBeInstanceOf(Array);
    expect(events).toHaveLength(0);
  });

  it('returns all events stored in the database', async () => {
    // Insert two events
    const event1 = await createEventInDB({
      title: 'Event One',
      description: null,
      event_date: new Date('2024-02-15T12:00:00Z'),
    });
    const event2 = await createEventInDB({
      title: 'Event Two',
      description: 'Second event description',
      event_date: new Date('2024-03-20T15:30:00Z'),
    });

    const events = await getEvents();
    // Should contain at least the two inserted events
    const ids = events.map((e) => e.id);
    expect(ids).toContain(event1.id);
    expect(ids).toContain(event2.id);

    // Verify fields of one of the events
    const fetchedEvent1 = events.find((e) => e.id === event1.id)!;
    expect(fetchedEvent1.title).toBe('Event One');
    expect(fetchedEvent1.description).toBeNull();
    expect(fetchedEvent1.event_date).toBeInstanceOf(Date);
    expect(fetchedEvent1.event_date.getTime()).toBe(new Date('2024-02-15T12:00:00Z').getTime());
    expect(fetchedEvent1.created_at).toBeInstanceOf(Date);
  });
});
