import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type UpdateEventInput, type CreateEventInput } from '../schema';
import { updateEvent } from '../handlers/update_event';
import { eq } from 'drizzle-orm';

// Helper function to create a test event
const createTestEvent = async (eventData?: Partial<CreateEventInput>) => {
  const defaultEvent = {
    title: 'Original Event',
    description: 'Original description',
    date: new Date('2024-12-25T10:00:00Z')
  };

  const result = await db.insert(eventsTable)
    .values({ ...defaultEvent, ...eventData })
    .returning()
    .execute();

  return result[0];
};

describe('updateEvent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update an event with all fields', async () => {
    // Create a test event
    const originalEvent = await createTestEvent();
    
    const updateInput: UpdateEventInput = {
      id: originalEvent.id,
      title: 'Updated Event Title',
      description: 'Updated event description',
      date: new Date('2025-01-01T15:00:00Z')
    };

    const result = await updateEvent(updateInput);

    // Verify the update was successful
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(originalEvent.id);
    expect(result!.title).toEqual('Updated Event Title');
    expect(result!.description).toEqual('Updated event description');
    expect(result!.date).toEqual(new Date('2025-01-01T15:00:00Z'));
    expect(result!.created_at).toEqual(originalEvent.created_at); // Should not change
  });

  it('should update only the title field', async () => {
    const originalEvent = await createTestEvent();
    
    const updateInput: UpdateEventInput = {
      id: originalEvent.id,
      title: 'New Title Only'
    };

    const result = await updateEvent(updateInput);

    // Verify only title was updated
    expect(result).not.toBeNull();
    expect(result!.title).toEqual('New Title Only');
    expect(result!.description).toEqual(originalEvent.description); // Unchanged
    expect(result!.date).toEqual(originalEvent.date); // Unchanged
    expect(result!.created_at).toEqual(originalEvent.created_at); // Unchanged
  });

  it('should update only the description field', async () => {
    const originalEvent = await createTestEvent();
    
    const updateInput: UpdateEventInput = {
      id: originalEvent.id,
      description: 'New description only'
    };

    const result = await updateEvent(updateInput);

    // Verify only description was updated
    expect(result).not.toBeNull();
    expect(result!.title).toEqual(originalEvent.title); // Unchanged
    expect(result!.description).toEqual('New description only');
    expect(result!.date).toEqual(originalEvent.date); // Unchanged
  });

  it('should update only the date field', async () => {
    const originalEvent = await createTestEvent();
    const newDate = new Date('2025-06-15T12:30:00Z');
    
    const updateInput: UpdateEventInput = {
      id: originalEvent.id,
      date: newDate
    };

    const result = await updateEvent(updateInput);

    // Verify only date was updated
    expect(result).not.toBeNull();
    expect(result!.title).toEqual(originalEvent.title); // Unchanged
    expect(result!.description).toEqual(originalEvent.description); // Unchanged
    expect(result!.date).toEqual(newDate);
  });

  it('should set description to null', async () => {
    const originalEvent = await createTestEvent({
      description: 'Some description'
    });
    
    const updateInput: UpdateEventInput = {
      id: originalEvent.id,
      description: null
    };

    const result = await updateEvent(updateInput);

    // Verify description was set to null
    expect(result).not.toBeNull();
    expect(result!.description).toBeNull();
    expect(result!.title).toEqual(originalEvent.title); // Unchanged
    expect(result!.date).toEqual(originalEvent.date); // Unchanged
  });

  it('should return null when event does not exist', async () => {
    const updateInput: UpdateEventInput = {
      id: 99999, // Non-existent ID
      title: 'This should not work'
    };

    const result = await updateEvent(updateInput);

    expect(result).toBeNull();
  });

  it('should return null when no fields are provided for update', async () => {
    const originalEvent = await createTestEvent();
    
    const updateInput: UpdateEventInput = {
      id: originalEvent.id
      // No fields to update
    };

    const result = await updateEvent(updateInput);

    expect(result).toBeNull();
  });

  it('should persist changes to database', async () => {
    const originalEvent = await createTestEvent();
    
    const updateInput: UpdateEventInput = {
      id: originalEvent.id,
      title: 'Database Persisted Title',
      description: 'Database persisted description'
    };

    await updateEvent(updateInput);

    // Query database directly to verify changes were persisted
    const events = await db.select()
      .from(eventsTable)
      .where(eq(eventsTable.id, originalEvent.id))
      .execute();

    expect(events).toHaveLength(1);
    expect(events[0].title).toEqual('Database Persisted Title');
    expect(events[0].description).toEqual('Database persisted description');
    expect(events[0].date).toEqual(originalEvent.date); // Should remain unchanged
    expect(events[0].created_at).toEqual(originalEvent.created_at); // Should remain unchanged
  });

  it('should handle events with null descriptions', async () => {
    const originalEvent = await createTestEvent({
      description: null
    });
    
    const updateInput: UpdateEventInput = {
      id: originalEvent.id,
      title: 'Updated title for null desc event'
    };

    const result = await updateEvent(updateInput);

    // Verify update worked with originally null description
    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Updated title for null desc event');
    expect(result!.description).toBeNull(); // Should remain null
  });

  it('should update multiple fields at once', async () => {
    const originalEvent = await createTestEvent();
    const newDate = new Date('2025-03-15T18:45:00Z');
    
    const updateInput: UpdateEventInput = {
      id: originalEvent.id,
      title: 'Multi-field Update',
      description: 'Updated multiple fields',
      date: newDate
    };

    const result = await updateEvent(updateInput);

    // Verify all fields were updated
    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Multi-field Update');
    expect(result!.description).toEqual('Updated multiple fields');
    expect(result!.date).toEqual(newDate);
    expect(result!.created_at).toEqual(originalEvent.created_at); // Should not change
  });
});
