import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type CreateEventInput } from '../schema';
import { getEvents } from '../handlers/get_events';

// Helper to insert an event directly using the DB.
async function insertEvent(input: CreateEventInput) {
  const [event] = await db
    .insert(eventsTable)
    .values({
      title: input.title,
      description: input.description,
      date: input.date.toISOString().slice(0, 10), // convert Date to YYYY-MM-DD string
    })
    .returning()
    .execute();
  return event;
}

describe('getEvents handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('returns empty array when no events exist', async () => {
    const events = await getEvents();
    expect(events).toBeArray();
    expect(events).toHaveLength(0);
  });

  it('fetches a single event with correct date conversion', async () => {
    const now = new Date();
    const input: CreateEventInput = {
      title: 'Test Event',
      description: 'Testing getEvents',
      date: now,
    };
    const inserted = await insertEvent(input);
    const events = await getEvents();
    expect(events).toHaveLength(1);
    const ev = events[0];
    expect(ev.id).toBe(inserted.id);
    expect(ev.title).toBe(input.title);
    expect(ev.description).toBe(input.description);
    expect(ev.date).toBeInstanceOf(Date);
    expect(ev.created_at).toBeInstanceOf(Date);
    // Compare dates ignoring time (date column stored as DATE)
    expect(ev.date.toISOString().slice(0, 10)).toBe(input.date.toISOString().slice(0, 10));
  });

  it('retrieves multiple events', async () => {
    const dates = [new Date('2023-01-01'), new Date('2023-06-15'), new Date('2023-12-31')];
    for (let i = 0; i < dates.length; i++) {
      await insertEvent({
        title: `Event ${i}`,
        description: `Desc ${i}`,
        date: dates[i],
      });
    }
    const events = await getEvents();
    expect(events).toHaveLength(3);
    for (const ev of events) {
      expect(ev.date).toBeInstanceOf(Date);
      expect(ev.created_at).toBeInstanceOf(Date);
    }
  });
});
