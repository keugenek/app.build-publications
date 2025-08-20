import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type CreateEventInput } from '../schema';
import { createEvent } from '../handlers/create_event';
import { eq, gte, between, and } from 'drizzle-orm';

// Simple test input
const testInput: CreateEventInput = {
  title: 'Team Meeting',
  date: new Date('2024-01-15'),
  description: 'Weekly team sync meeting to discuss project updates'
};

describe('createEvent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an event', async () => {
    const result = await createEvent(testInput);

    // Basic field validation
    expect(result.title).toEqual('Team Meeting');
    expect(result.description).toEqual(testInput.description);
    expect(result.date).toEqual(new Date('2024-01-15'));
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save event to database', async () => {
    const result = await createEvent(testInput);

    // Query using proper drizzle syntax
    const events = await db.select()
      .from(eventsTable)
      .where(eq(eventsTable.id, result.id))
      .execute();

    expect(events).toHaveLength(1);
    expect(events[0].title).toEqual('Team Meeting');
    expect(events[0].description).toEqual(testInput.description);
    expect(new Date(events[0].date)).toEqual(new Date('2024-01-15'));
    expect(events[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different event types correctly', async () => {
    const conferenceInput: CreateEventInput = {
      title: 'Annual Conference 2024',
      date: new Date('2024-06-20'),
      description: 'Our annual company conference with keynote speakers and networking'
    };

    const result = await createEvent(conferenceInput);

    expect(result.title).toEqual('Annual Conference 2024');
    expect(result.date).toEqual(new Date('2024-06-20'));
    expect(result.description).toEqual(conferenceInput.description);
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
  });

  it('should query events by date range correctly', async () => {
    // Create test event
    await createEvent(testInput);

    // Test date filtering - demonstration of correct date handling
    const today = new Date();
    const futureDate = new Date('2024-12-31');

    // Apply date filter for events in 2024 - use string format for database queries
    const startOf2024 = '2024-01-01';
    const endOf2024 = '2024-12-31';

    // Build query with proper date filtering
    const query = db.select()
      .from(eventsTable)
      .where(
        and(
          gte(eventsTable.date, startOf2024),
          between(eventsTable.date, startOf2024, endOf2024)
        )
      );

    const events = await query.execute();

    expect(events.length).toBeGreaterThan(0);
    events.forEach(event => {
      const eventDate = new Date(event.date);
      expect(eventDate).toBeInstanceOf(Date);
      expect(eventDate >= new Date(startOf2024)).toBe(true);
      expect(eventDate <= new Date(endOf2024)).toBe(true);
    });
  });

  it('should create multiple events with unique IDs', async () => {
    const input1: CreateEventInput = {
      title: 'Morning Standup',
      date: new Date('2024-02-01'),
      description: 'Daily standup meeting'
    };

    const input2: CreateEventInput = {
      title: 'Sprint Planning',
      date: new Date('2024-02-05'),
      description: 'Sprint planning session for next iteration'
    };

    const event1 = await createEvent(input1);
    const event2 = await createEvent(input2);

    // Verify both events were created with unique IDs
    expect(event1.id).not.toEqual(event2.id);
    expect(event1.title).toEqual('Morning Standup');
    expect(event2.title).toEqual('Sprint Planning');
    
    // Verify both exist in database
    const allEvents = await db.select()
      .from(eventsTable)
      .execute();

    expect(allEvents).toHaveLength(2);
  });

  it('should handle date objects correctly', async () => {
    const futureDate = new Date('2024-12-25');
    const holidayInput: CreateEventInput = {
      title: 'Christmas Day',
      date: futureDate,
      description: 'Company holiday - offices closed'
    };

    const result = await createEvent(holidayInput);

    // Verify date handling
    expect(result.date).toEqual(futureDate);
    expect(result.date instanceof Date).toBe(true);
    expect(result.date.getFullYear()).toBe(2024);
    expect(result.date.getMonth()).toBe(11); // December is month 11
    expect(result.date.getDate()).toBe(25);
  });
});
