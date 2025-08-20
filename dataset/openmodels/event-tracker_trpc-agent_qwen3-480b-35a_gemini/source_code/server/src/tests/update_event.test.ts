import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type UpdateEventInput, type CreateEventInput } from '../schema';
import { updateEvent } from '../handlers/update_event';
import { eq } from 'drizzle-orm';

// Helper function to create test event directly in database
const createTestEvent = async (input: Partial<CreateEventInput> = {}) => {
  const defaultInput: CreateEventInput = {
    title: 'Test Event',
    date: new Date().toISOString(),
    description: 'A test event'
  };
  
  const finalInput = { ...defaultInput, ...input };
  
  const result = await db.insert(eventsTable)
    .values({
      title: finalInput.title,
      date: new Date(finalInput.date),
      description: finalInput.description
    })
    .returning()
    .execute();
  
  const event = result[0];
  return {
    ...event,
    date: event.date.toISOString(),
    created_at: event.created_at.toISOString()
  };
};

describe('updateEvent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update an event', async () => {
    // Create test event
    const createdEvent = await createTestEvent();
    
    // Prepare update input
    const updateInput: UpdateEventInput = {
      id: createdEvent.id,
      title: 'Updated Event Title',
      date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      description: 'Updated description'
    };

    const result = await updateEvent(updateInput);

    // Validate returned data
    expect(result.id).toEqual(createdEvent.id);
    expect(result.title).toEqual('Updated Event Title');
    expect(result.description).toEqual('Updated description');
    // created_at should be a string (ISOString)
    expect(typeof result.created_at).toBe('string');
    
    // Verify date was updated
    const expectedDate = new Date(updateInput.date!).toISOString();
    expect(result.date).toEqual(expectedDate);
  });

  it('should update only provided fields', async () => {
    // Create test event
    const createdEvent = await createTestEvent({
      title: 'Original Title',
      date: new Date('2023-01-01').toISOString(),
      description: 'Original description'
    });
    
    // Update only title
    const updateInput: UpdateEventInput = {
      id: createdEvent.id,
      title: 'New Title'
      // Note: date and description are not provided
    };

    const result = await updateEvent(updateInput);

    // Should update title but preserve other fields
    expect(result.title).toEqual('New Title');
    expect(result.description).toEqual('Original description');
    
    // Date should remain unchanged
    expect(result.date).toEqual(new Date('2023-01-01').toISOString());
  });

  it('should save updated event to database', async () => {
    // Create test event
    const createdEvent = await createTestEvent();
    
    // Update the event
    const updateInput: UpdateEventInput = {
      id: createdEvent.id,
      title: 'Database Updated Title',
      description: 'Database updated description'
    };

    await updateEvent(updateInput);

    // Query database to verify update was persisted
    const events = await db.select()
      .from(eventsTable)
      .where(eq(eventsTable.id, createdEvent.id))
      .execute();

    expect(events).toHaveLength(1);
    expect(events[0].title).toEqual('Database Updated Title');
    expect(events[0].description).toEqual('Database updated description');
    expect(events[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when updating non-existent event', async () => {
    const updateInput: UpdateEventInput = {
      id: 99999,
      title: 'Non-existent Event'
    };

    await expect(updateEvent(updateInput))
      .rejects
      .toThrow(/Event with id 99999 not found/);
  });
});
