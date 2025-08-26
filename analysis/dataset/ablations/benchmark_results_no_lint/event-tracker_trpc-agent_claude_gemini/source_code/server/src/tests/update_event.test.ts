import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type UpdateEventInput, type CreateEventInput } from '../schema';
import { updateEvent } from '../handlers/update_event';
import { eq } from 'drizzle-orm';

// Test helper to create an event
const createTestEvent = async (eventData: CreateEventInput) => {
  const result = await db.insert(eventsTable)
    .values({
      title: eventData.title,
      description: eventData.description,
      date: eventData.date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD
    })
    .returning()
    .execute();
  
  return {
    ...result[0],
    date: new Date(result[0].date), // Convert back to Date
  };
};

describe('updateEvent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all fields of an event', async () => {
    // Create test event
    const originalEvent = await createTestEvent({
      title: 'Original Title',
      description: 'Original description',
      date: new Date('2024-01-01')
    });

    const updateInput: UpdateEventInput = {
      id: originalEvent.id,
      title: 'Updated Title',
      description: 'Updated description',
      date: new Date('2024-12-31')
    };

    const result = await updateEvent(updateInput);

    // Validate updated fields
    expect(result.id).toEqual(originalEvent.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Updated description');
    expect(result.date).toEqual(new Date('2024-12-31'));
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at).toEqual(originalEvent.created_at);
  });

  it('should update only title when provided', async () => {
    // Create test event
    const originalEvent = await createTestEvent({
      title: 'Original Title',
      description: 'Original description',
      date: new Date('2024-01-01')
    });

    const updateInput: UpdateEventInput = {
      id: originalEvent.id,
      title: 'Updated Title Only'
    };

    const result = await updateEvent(updateInput);

    // Validate only title changed
    expect(result.title).toEqual('Updated Title Only');
    expect(result.description).toEqual(originalEvent.description);
    expect(result.date).toEqual(originalEvent.date);
    expect(result.created_at).toEqual(originalEvent.created_at);
  });

  it('should update description to null', async () => {
    // Create test event with description
    const originalEvent = await createTestEvent({
      title: 'Test Event',
      description: 'Original description',
      date: new Date('2024-01-01')
    });

    const updateInput: UpdateEventInput = {
      id: originalEvent.id,
      description: null
    };

    const result = await updateEvent(updateInput);

    // Validate description set to null
    expect(result.description).toBeNull();
    expect(result.title).toEqual(originalEvent.title);
    expect(result.date).toEqual(originalEvent.date);
  });

  it('should update only date when provided', async () => {
    // Create test event
    const originalEvent = await createTestEvent({
      title: 'Test Event',
      description: 'Test description',
      date: new Date('2024-01-01')
    });

    const newDate = new Date('2024-06-15');
    const updateInput: UpdateEventInput = {
      id: originalEvent.id,
      date: newDate
    };

    const result = await updateEvent(updateInput);

    // Validate only date changed
    expect(result.date).toEqual(newDate);
    expect(result.title).toEqual(originalEvent.title);
    expect(result.description).toEqual(originalEvent.description);
  });

  it('should save updated event to database', async () => {
    // Create test event
    const originalEvent = await createTestEvent({
      title: 'Original Title',
      description: 'Original description',
      date: new Date('2024-01-01')
    });

    const updateInput: UpdateEventInput = {
      id: originalEvent.id,
      title: 'Database Updated Title',
      description: null
    };

    await updateEvent(updateInput);

    // Query database directly to verify changes were persisted
    const savedEvent = await db.select()
      .from(eventsTable)
      .where(eq(eventsTable.id, originalEvent.id))
      .execute();

    expect(savedEvent).toHaveLength(1);
    expect(savedEvent[0].title).toEqual('Database Updated Title');
    expect(savedEvent[0].description).toBeNull();
    expect(savedEvent[0].date).toEqual('2024-01-01'); // Date stored as string in DB
  });

  it('should throw error when event does not exist', async () => {
    const updateInput: UpdateEventInput = {
      id: 999, // Non-existent ID
      title: 'Updated Title'
    };

    await expect(updateEvent(updateInput)).rejects.toThrow(/Event with id 999 not found/i);
  });

  it('should handle updating event with null description to non-null', async () => {
    // Create test event with null description
    const originalEvent = await createTestEvent({
      title: 'Test Event',
      description: null,
      date: new Date('2024-01-01')
    });

    const updateInput: UpdateEventInput = {
      id: originalEvent.id,
      description: 'Now has description'
    };

    const result = await updateEvent(updateInput);

    // Validate description updated from null
    expect(result.description).toEqual('Now has description');
    expect(result.title).toEqual(originalEvent.title);
    expect(result.date).toEqual(originalEvent.date);
  });

  it('should preserve created_at timestamp during update', async () => {
    // Create test event
    const originalEvent = await createTestEvent({
      title: 'Original Title',
      description: 'Original description',
      date: new Date('2024-01-01')
    });

    // Wait a small amount to ensure timestamps would differ if modified
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateEventInput = {
      id: originalEvent.id,
      title: 'Updated Title'
    };

    const result = await updateEvent(updateInput);

    // Validate created_at was not modified
    expect(result.created_at).toEqual(originalEvent.created_at);
    expect(result.created_at).toBeInstanceOf(Date);
  });
});
