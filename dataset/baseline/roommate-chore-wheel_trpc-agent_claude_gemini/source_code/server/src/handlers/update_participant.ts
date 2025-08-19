import { db } from '../db';
import { participantsTable } from '../db/schema';
import { type UpdateParticipantInput, type Participant } from '../schema';
import { eq } from 'drizzle-orm';

export const updateParticipant = async (input: UpdateParticipantInput): Promise<Participant> => {
  try {
    // Check if participant exists
    const existingParticipant = await db.select()
      .from(participantsTable)
      .where(eq(participantsTable.id, input.id))
      .execute();

    if (existingParticipant.length === 0) {
      throw new Error(`Participant with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof participantsTable.$inferInsert> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    // If no fields to update, return existing participant
    if (Object.keys(updateData).length === 0) {
      return existingParticipant[0];
    }

    // Update participant record
    const result = await db.update(participantsTable)
      .set(updateData)
      .where(eq(participantsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Participant update failed:', error);
    throw error;
  }
};
