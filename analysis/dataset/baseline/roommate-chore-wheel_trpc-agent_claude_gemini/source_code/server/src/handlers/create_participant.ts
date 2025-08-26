import { db } from '../db';
import { participantsTable } from '../db/schema';
import { type CreateParticipantInput, type Participant } from '../schema';

export async function createParticipant(input: CreateParticipantInput): Promise<Participant> {
  try {
    // Insert participant record
    const result = await db.insert(participantsTable)
      .values({
        name: input.name
      })
      .returning()
      .execute();

    // Return the created participant
    return result[0];
  } catch (error) {
    console.error('Participant creation failed:', error);
    throw error;
  }
}
