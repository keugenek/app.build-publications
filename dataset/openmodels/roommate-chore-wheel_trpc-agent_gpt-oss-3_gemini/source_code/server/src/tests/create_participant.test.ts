import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { participantsTable } from '../db/schema';
import { type CreateParticipantInput } from '../schema';
import { createParticipant, getParticipants } from '../handlers/create_participant';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateParticipantInput = {
  name: 'Alice Johnson',
};

describe('createParticipant', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should insert a participant and return it', async () => {
    const result = await createParticipant(testInput);

    expect(result.id).toBeDefined();
    expect(result.name).toBe(testInput.name);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the participant in the database', async () => {
    const result = await createParticipant(testInput);

    const participants = await db.select()
      .from(participantsTable)
      .where(eq(participantsTable.id, result.id))
      .execute();

    expect(participants).toHaveLength(1);
    const participant = participants[0];
    expect(participant.name).toBe(testInput.name);
    expect(participant.created_at).toBeInstanceOf(Date);
  });
});

describe('getParticipants', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all participants', async () => {
    // Insert two participants directly via handler
    await createParticipant({ name: 'Bob' });
    await createParticipant({ name: 'Carol' });

    const all = await getParticipants();
    expect(all).toHaveLength(2);
    const names = all.map(p => p.name).sort();
    expect(names).toEqual(['Bob', 'Carol']);
  });
});
