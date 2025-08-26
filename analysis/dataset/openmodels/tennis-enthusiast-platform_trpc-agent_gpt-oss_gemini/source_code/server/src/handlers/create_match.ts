import { type CreateMatchInput, type Match } from '../schema';
import { db } from '../db';
import { matchesTable } from '../db/schema';

export const createMatch = async (input: CreateMatchInput): Promise<Match> => {
    try {
    const result = await db
      .insert(matchesTable)
      .values({
        player_one_id: input.player_one_id,
        player_two_id: input.player_two_id,
        scheduled_at: input.scheduled_at,
      })
      .returning()
      .execute();

    const match = result[0];
    return match;
  } catch (error) {
    console.error('Match creation failed:', error);
    throw error;
  }

};
