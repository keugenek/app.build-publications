import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { participantsTable, choresTable, weeksTable, assignmentsTable } from '../db/schema';
import { type DeleteParticipantInput } from '../schema';
import { deleteParticipant } from '../handlers/delete_participant';
import { eq } from 'drizzle-orm';

// Test input
const testInput: DeleteParticipantInput = {
  id: 1
};

describe('deleteParticipant', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a participant successfully', async () => {
    // Create test participant
    const participantResult = await db.insert(participantsTable)
      .values({
        name: 'Test Participant'
      })
      .returning()
      .execute();

    const participantId = participantResult[0].id;

    // Delete the participant
    const result = await deleteParticipant({ id: participantId });

    expect(result.success).toBe(true);

    // Verify participant is deleted from database
    const participants = await db.select()
      .from(participantsTable)
      .where(eq(participantsTable.id, participantId))
      .execute();

    expect(participants).toHaveLength(0);
  });

  it('should delete participant and cascade delete related assignments', async () => {
    // Create test participant
    const participantResult = await db.insert(participantsTable)
      .values({
        name: 'Test Participant'
      })
      .returning()
      .execute();

    const participantId = participantResult[0].id;

    // Create test chore
    const choreResult = await db.insert(choresTable)
      .values({
        name: 'Test Chore'
      })
      .returning()
      .execute();

    const choreId = choreResult[0].id;

    // Create test week
    const weekResult = await db.insert(weeksTable)
      .values({
        year: 2024,
        week_number: 1,
        start_date: '2024-01-01',
        end_date: '2024-01-07'
      })
      .returning()
      .execute();

    const weekId = weekResult[0].id;

    // Create test assignment
    const assignmentResult = await db.insert(assignmentsTable)
      .values({
        week_id: weekId,
        participant_id: participantId,
        chore_id: choreId,
        is_completed: false
      })
      .returning()
      .execute();

    const assignmentId = assignmentResult[0].id;

    // Verify assignment exists before deletion
    const assignmentsBefore = await db.select()
      .from(assignmentsTable)
      .where(eq(assignmentsTable.participant_id, participantId))
      .execute();

    expect(assignmentsBefore).toHaveLength(1);

    // Delete the participant
    const result = await deleteParticipant({ id: participantId });

    expect(result.success).toBe(true);

    // Verify participant is deleted
    const participants = await db.select()
      .from(participantsTable)
      .where(eq(participantsTable.id, participantId))
      .execute();

    expect(participants).toHaveLength(0);

    // Verify related assignments are also deleted
    const assignmentsAfter = await db.select()
      .from(assignmentsTable)
      .where(eq(assignmentsTable.participant_id, participantId))
      .execute();

    expect(assignmentsAfter).toHaveLength(0);
  });

  it('should handle multiple assignments for same participant', async () => {
    // Create test participant
    const participantResult = await db.insert(participantsTable)
      .values({
        name: 'Test Participant'
      })
      .returning()
      .execute();

    const participantId = participantResult[0].id;

    // Create test chores
    const chore1Result = await db.insert(choresTable)
      .values({
        name: 'Test Chore 1'
      })
      .returning()
      .execute();

    const chore2Result = await db.insert(choresTable)
      .values({
        name: 'Test Chore 2'
      })
      .returning()
      .execute();

    const chore1Id = chore1Result[0].id;
    const chore2Id = chore2Result[0].id;

    // Create test week
    const weekResult = await db.insert(weeksTable)
      .values({
        year: 2024,
        week_number: 1,
        start_date: '2024-01-01',
        end_date: '2024-01-07'
      })
      .returning()
      .execute();

    const weekId = weekResult[0].id;

    // Create multiple assignments for the participant
    await db.insert(assignmentsTable)
      .values([
        {
          week_id: weekId,
          participant_id: participantId,
          chore_id: chore1Id,
          is_completed: false
        },
        {
          week_id: weekId,
          participant_id: participantId,
          chore_id: chore2Id,
          is_completed: true
        }
      ])
      .execute();

    // Verify multiple assignments exist
    const assignmentsBefore = await db.select()
      .from(assignmentsTable)
      .where(eq(assignmentsTable.participant_id, participantId))
      .execute();

    expect(assignmentsBefore).toHaveLength(2);

    // Delete the participant
    const result = await deleteParticipant({ id: participantId });

    expect(result.success).toBe(true);

    // Verify all assignments are deleted
    const assignmentsAfter = await db.select()
      .from(assignmentsTable)
      .where(eq(assignmentsTable.participant_id, participantId))
      .execute();

    expect(assignmentsAfter).toHaveLength(0);
  });

  it('should throw error when participant does not exist', async () => {
    const nonExistentId = 9999;

    await expect(deleteParticipant({ id: nonExistentId }))
      .rejects.toThrow(/Participant with id 9999 not found/i);
  });

  it('should not affect other participants when deleting one', async () => {
    // Create multiple test participants
    const participant1Result = await db.insert(participantsTable)
      .values({
        name: 'Participant 1'
      })
      .returning()
      .execute();

    const participant2Result = await db.insert(participantsTable)
      .values({
        name: 'Participant 2'
      })
      .returning()
      .execute();

    const participant1Id = participant1Result[0].id;
    const participant2Id = participant2Result[0].id;

    // Create test chore and week
    const choreResult = await db.insert(choresTable)
      .values({
        name: 'Test Chore'
      })
      .returning()
      .execute();

    const weekResult = await db.insert(weeksTable)
      .values({
        year: 2024,
        week_number: 1,
        start_date: '2024-01-01',
        end_date: '2024-01-07'
      })
      .returning()
      .execute();

    const choreId = choreResult[0].id;
    const weekId = weekResult[0].id;

    // Create assignments for both participants
    await db.insert(assignmentsTable)
      .values([
        {
          week_id: weekId,
          participant_id: participant1Id,
          chore_id: choreId,
          is_completed: false
        },
        {
          week_id: weekId,
          participant_id: participant2Id,
          chore_id: choreId,
          is_completed: false
        }
      ])
      .execute();

    // Delete only the first participant
    const result = await deleteParticipant({ id: participant1Id });

    expect(result.success).toBe(true);

    // Verify first participant is deleted
    const participant1After = await db.select()
      .from(participantsTable)
      .where(eq(participantsTable.id, participant1Id))
      .execute();

    expect(participant1After).toHaveLength(0);

    // Verify second participant still exists
    const participant2After = await db.select()
      .from(participantsTable)
      .where(eq(participantsTable.id, participant2Id))
      .execute();

    expect(participant2After).toHaveLength(1);
    expect(participant2After[0].name).toBe('Participant 2');

    // Verify first participant's assignments are deleted
    const assignments1After = await db.select()
      .from(assignmentsTable)
      .where(eq(assignmentsTable.participant_id, participant1Id))
      .execute();

    expect(assignments1After).toHaveLength(0);

    // Verify second participant's assignments still exist
    const assignments2After = await db.select()
      .from(assignmentsTable)
      .where(eq(assignmentsTable.participant_id, participant2Id))
      .execute();

    expect(assignments2After).toHaveLength(1);
  });
});
