import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable, choresTable, weeklyAssignmentsTable } from '../db/schema';
import { type UpdateAssignmentInput } from '../schema';
import { updateAssignment } from '../handlers/update_assignment';
import { eq } from 'drizzle-orm';

describe('updateAssignment', () => {
  let memberId: number;
  let choreId: number;
  let assignmentId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test member
    const memberResult = await db.insert(membersTable)
      .values({ name: 'John Doe' })
      .returning()
      .execute();
    
    memberId = memberResult[0].id;
    
    // Create test chore
    const choreResult = await db.insert(choresTable)
      .values({ name: 'Clean kitchen', description: 'Wash dishes and clean counters' })
      .returning()
      .execute();
    
    choreId = choreResult[0].id;
    
    // Create test assignment
    const assignmentResult = await db.insert(weeklyAssignmentsTable)
      .values({
        member_id: memberId,
        chore_id: choreId,
        week_start_date: '2023-01-01', // Date as string for database
        is_completed: false
      })
      .returning()
      .execute();
      
    assignmentId = assignmentResult[0].id;
  });
  
  afterEach(resetDB);

  it('should update an assignment to completed', async () => {
    // Update the assignment
    const input: UpdateAssignmentInput = {
      id: assignmentId,
      is_completed: true
    };
    
    const result = await updateAssignment(input);
    
    // Verify the result
    expect(result.id).toEqual(assignmentId);
    expect(result.is_completed).toBe(true);
    expect(result.completed_at).toBeInstanceOf(Date);
    expect(result.completed_at).not.toBeNull();
  });

  it('should update an assignment to not completed', async () => {
    // First, create an already completed assignment
    const completedAssignmentResult = await db.insert(weeklyAssignmentsTable)
      .values({
        member_id: memberId,
        chore_id: choreId,
        week_start_date: '2023-01-08', // Date as string for database
        is_completed: true,
        completed_at: new Date()
      })
      .returning()
      .execute();
      
    const completedAssignmentId = completedAssignmentResult[0].id;
    
    // Update the assignment
    const input: UpdateAssignmentInput = {
      id: completedAssignmentId,
      is_completed: false
    };
    
    const result = await updateAssignment(input);
    
    // Verify the result
    expect(result.id).toEqual(completedAssignmentId);
    expect(result.is_completed).toBe(false);
    expect(result.completed_at).toBeNull();
  });

  it('should save updated assignment to database', async () => {
    // Update the assignment
    const input: UpdateAssignmentInput = {
      id: assignmentId,
      is_completed: true
    };
    
    await updateAssignment(input);
    
    // Query the database to confirm the update
    const updatedAssignments = await db.select()
      .from(weeklyAssignmentsTable)
      .where(eq(weeklyAssignmentsTable.id, assignmentId))
      .execute();
    
    expect(updatedAssignments).toHaveLength(1);
    expect(updatedAssignments[0].is_completed).toBe(true);
    expect(updatedAssignments[0].completed_at).toBeInstanceOf(Date);
    expect(updatedAssignments[0].completed_at).not.toBeNull();
  });

  it('should throw an error when assignment is not found', async () => {
    const input: UpdateAssignmentInput = {
      id: 99999, // Non-existent ID
      is_completed: true
    };
    
    await expect(updateAssignment(input)).rejects.toThrow(/Assignment with id 99999 not found/);
  });
});
