import { db } from '../db';
import { participantsTable, assignmentsTable } from '../db/schema';
import { type DeleteParticipantInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteParticipant(input: DeleteParticipantInput): Promise<{ success: boolean }> {
  try {
    // Check if participant exists before attempting deletion
    const existingParticipant = await db.select()
      .from(participantsTable)
      .where(eq(participantsTable.id, input.id))
      .execute();

    if (existingParticipant.length === 0) {
      throw new Error(`Participant with id ${input.id} not found`);
    }

    // Delete related assignments first (cascade delete)
    await db.delete(assignmentsTable)
      .where(eq(assignmentsTable.participant_id, input.id))
      .execute();

    // Delete the participant
    const result = await db.delete(participantsTable)
      .where(eq(participantsTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Participant deletion failed:', error);
    throw error;
  }
}
