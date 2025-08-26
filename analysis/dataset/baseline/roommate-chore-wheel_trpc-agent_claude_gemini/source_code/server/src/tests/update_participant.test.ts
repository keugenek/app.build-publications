import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { participantsTable } from '../db/schema';
import { type UpdateParticipantInput, type CreateParticipantInput } from '../schema';
import { updateParticipant } from '../handlers/update_participant';
import { eq } from 'drizzle-orm';

// Test data
const createTestParticipant = async (name: string = 'Test Participant') => {
  const result = await db.insert(participantsTable)
    .values({ name })
    .returning()
    .execute();
  return result[0];
};

describe('updateParticipant', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update participant name', async () => {
    // Create test participant
    const testParticipant = await createTestParticipant('Original Name');
    
    const updateInput: UpdateParticipantInput = {
      id: testParticipant.id,
      name: 'Updated Name'
    };

    const result = await updateParticipant(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(testParticipant.id);
    expect(result.name).toEqual('Updated Name');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at).toEqual(testParticipant.created_at);
  });

  it('should save updated participant to database', async () => {
    // Create test participant
    const testParticipant = await createTestParticipant('Original Name');
    
    const updateInput: UpdateParticipantInput = {
      id: testParticipant.id,
      name: 'Database Updated Name'
    };

    await updateParticipant(updateInput);

    // Verify in database
    const participants = await db.select()
      .from(participantsTable)
      .where(eq(participantsTable.id, testParticipant.id))
      .execute();

    expect(participants).toHaveLength(1);
    expect(participants[0].name).toEqual('Database Updated Name');
    expect(participants[0].created_at).toEqual(testParticipant.created_at);
  });

  it('should return existing participant when no fields to update', async () => {
    // Create test participant
    const testParticipant = await createTestParticipant('Unchanged Name');
    
    const updateInput: UpdateParticipantInput = {
      id: testParticipant.id
      // No name field provided
    };

    const result = await updateParticipant(updateInput);

    // Should return unchanged participant
    expect(result.id).toEqual(testParticipant.id);
    expect(result.name).toEqual('Unchanged Name');
    expect(result.created_at).toEqual(testParticipant.created_at);
  });

  it('should handle partial updates with undefined name', async () => {
    // Create test participant
    const testParticipant = await createTestParticipant('Original Name');
    
    const updateInput: UpdateParticipantInput = {
      id: testParticipant.id,
      name: undefined
    };

    const result = await updateParticipant(updateInput);

    // Should return unchanged participant
    expect(result.id).toEqual(testParticipant.id);
    expect(result.name).toEqual('Original Name');
    expect(result.created_at).toEqual(testParticipant.created_at);
  });

  it('should throw error for non-existent participant', async () => {
    const updateInput: UpdateParticipantInput = {
      id: 99999, // Non-existent ID
      name: 'New Name'
    };

    await expect(updateParticipant(updateInput))
      .rejects
      .toThrow(/participant with id 99999 not found/i);
  });

  it('should update multiple participants independently', async () => {
    // Create two test participants
    const participant1 = await createTestParticipant('Participant 1');
    const participant2 = await createTestParticipant('Participant 2');

    // Update first participant
    const updateInput1: UpdateParticipantInput = {
      id: participant1.id,
      name: 'Updated Participant 1'
    };

    const result1 = await updateParticipant(updateInput1);

    // Update second participant
    const updateInput2: UpdateParticipantInput = {
      id: participant2.id,
      name: 'Updated Participant 2'
    };

    const result2 = await updateParticipant(updateInput2);

    // Verify both updates
    expect(result1.name).toEqual('Updated Participant 1');
    expect(result2.name).toEqual('Updated Participant 2');

    // Verify in database
    const allParticipants = await db.select()
      .from(participantsTable)
      .execute();

    expect(allParticipants).toHaveLength(2);
    
    const updatedParticipant1 = allParticipants.find(p => p.id === participant1.id);
    const updatedParticipant2 = allParticipants.find(p => p.id === participant2.id);

    expect(updatedParticipant1?.name).toEqual('Updated Participant 1');
    expect(updatedParticipant2?.name).toEqual('Updated Participant 2');
  });

  it('should preserve created_at timestamp during update', async () => {
    // Create test participant
    const testParticipant = await createTestParticipant('Original Name');
    const originalCreatedAt = testParticipant.created_at;

    // Wait a small amount to ensure timestamps would be different if changed
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateParticipantInput = {
      id: testParticipant.id,
      name: 'Updated Name'
    };

    const result = await updateParticipant(updateInput);

    // Verify created_at is preserved
    expect(result.created_at).toEqual(originalCreatedAt);
    expect(result.name).toEqual('Updated Name');
  });
});
