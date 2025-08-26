import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { matchesTable } from '../db/schema';
import { type CreateMatchInput } from '../schema';
import { createMatch } from '../handlers/create_match';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateMatchInput = {
  player_one_id: 1,
  player_two_id: 2,
  scheduled_at: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
};

describe('createMatch', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a match with proper fields', async () => {
    const result = await createMatch(testInput);

    expect(result.id).toBeDefined();
    expect(result.player_one_id).toEqual(testInput.player_one_id);
    expect(result.player_two_id).toEqual(testInput.player_two_id);
    // scheduled_at may lose ms precision depending on DB, compare timestamps
    expect(result.scheduled_at.getTime()).toBeCloseTo(testInput.scheduled_at.getTime(), -1);
    expect(result.status).toEqual('PENDING');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the match in the database', async () => {
    const result = await createMatch(testInput);

    const matches = await db
      .select()
      .from(matchesTable)
      .where(eq(matchesTable.id, result.id))
      .execute();

    expect(matches).toHaveLength(1);
    const saved = matches[0];
    expect(saved.player_one_id).toEqual(testInput.player_one_id);
    expect(saved.player_two_id).toEqual(testInput.player_two_id);
    expect(saved.scheduled_at.getTime()).toBeCloseTo(testInput.scheduled_at.getTime(), -1);
    expect(saved.status).toEqual('PENDING');
    expect(saved.created_at).toBeInstanceOf(Date);
  });
});
