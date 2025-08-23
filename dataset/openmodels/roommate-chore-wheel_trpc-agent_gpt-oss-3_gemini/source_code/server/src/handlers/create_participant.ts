import { type CreateParticipantInput, type Participant } from '../schema';
import { db } from '../db';
import { participantsTable } from '../db/schema';

/**
 * Creates a new participant in the database.
 * @param input - The participant creation input (name).
 * @returns The newly created participant record.
 */
export const createParticipant = async (input: CreateParticipantInput): Promise<Participant> => {
  try {
    const result = await db
      .insert(participantsTable)
      .values({ name: input.name })
      .returning()
      .execute();
    // Drizzle returns an array; the first element is the inserted row
    return result[0];
  } catch (error) {
    console.error('Participant creation failed:', error);
    throw error;
  }
};

/**
 * Retrieves all participants from the database.
 * @returns An array of participant records.
 */
export const getParticipants = async (): Promise<Participant[]> => {
  try {
    const participants = await db.select().from(participantsTable).execute();
    return participants;
  } catch (error) {
    console.error('Fetching participants failed:', error);
    throw error;
  }
};
