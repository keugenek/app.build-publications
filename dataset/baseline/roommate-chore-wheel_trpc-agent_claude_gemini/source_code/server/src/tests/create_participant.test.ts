import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { participantsTable } from '../db/schema';
import { type CreateParticipantInput } from '../schema';
import { createParticipant } from '../handlers/create_participant';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateParticipantInput = {
  name: 'John Doe'
};

describe('createParticipant', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a participant', async () => {
    const result = await createParticipant(testInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save participant to database', async () => {
    const result = await createParticipant(testInput);

    // Query using proper drizzle syntax
    const participants = await db.select()
      .from(participantsTable)
      .where(eq(participantsTable.id, result.id))
      .execute();

    expect(participants).toHaveLength(1);
    expect(participants[0].name).toEqual('John Doe');
    expect(participants[0].id).toEqual(result.id);
    expect(participants[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple participants with different names', async () => {
    const participant1 = await createParticipant({ name: 'Alice Smith' });
    const participant2 = await createParticipant({ name: 'Bob Johnson' });

    // Verify both participants were created with unique IDs
    expect(participant1.id).not.toEqual(participant2.id);
    expect(participant1.name).toEqual('Alice Smith');
    expect(participant2.name).toEqual('Bob Johnson');

    // Verify both are in database
    const allParticipants = await db.select()
      .from(participantsTable)
      .execute();

    expect(allParticipants).toHaveLength(2);
    
    const names = allParticipants.map(p => p.name).sort();
    expect(names).toEqual(['Alice Smith', 'Bob Johnson']);
  });

  it('should handle names with special characters', async () => {
    const specialNameInput: CreateParticipantInput = {
      name: "José María O'Connor-Smith"
    };

    const result = await createParticipant(specialNameInput);

    expect(result.name).toEqual("José María O'Connor-Smith");
    
    // Verify it's saved correctly in database
    const participants = await db.select()
      .from(participantsTable)
      .where(eq(participantsTable.id, result.id))
      .execute();

    expect(participants[0].name).toEqual("José María O'Connor-Smith");
  });

  it('should handle long participant names', async () => {
    const longNameInput: CreateParticipantInput = {
      name: 'A'.repeat(255) // Very long name
    };

    const result = await createParticipant(longNameInput);

    expect(result.name).toEqual('A'.repeat(255));
    expect(result.id).toBeDefined();
  });
});
