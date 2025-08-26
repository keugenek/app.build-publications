import { db } from '../db';
import { weeklyAssignmentsTable, choresTable, usersTable } from '../db/schema';
import { type AssignChoresInput, type WeeklyAssignment } from '../schema';
import { eq, inArray } from 'drizzle-orm';

export const assignChores = async (input: AssignChoresInput): Promise<WeeklyAssignment[]> => {
  try {
    const choreIds = input.assignments.map(a => a.chore_id);
    const userIds = input.assignments.map(a => a.user_id);
    
    // Validate that all chores exist
    if (choreIds.length > 0) {
      const existingChores = await db.select({ id: choresTable.id })
        .from(choresTable)
        .where(inArray(choresTable.id, choreIds))
        .execute();
      
      const existingChoreIds = new Set(existingChores.map(c => c.id));
      const missingChores = choreIds.filter(id => !existingChoreIds.has(id));
      
      if (missingChores.length > 0) {
        throw new Error(`Chores with IDs ${missingChores.join(', ')} do not exist`);
      }
    }
    
    // Validate that all users exist
    if (userIds.length > 0) {
      const existingUsers = await db.select({ id: usersTable.id })
        .from(usersTable)
        .where(inArray(usersTable.id, userIds))
        .execute();
      
      const existingUserIds = new Set(existingUsers.map(u => u.id));
      const missingUsers = userIds.filter(id => !existingUserIds.has(id));
      
      if (missingUsers.length > 0) {
        throw new Error(`Users with IDs ${missingUsers.join(', ')} do not exist`);
      }
    }
    
    // Create assignments
    // Convert Date to string for database insertion
    const assignmentsToInsert = input.assignments.map(assignment => ({
      week_start_date: input.week_start_date.toISOString().split('T')[0], // Format as YYYY-MM-DD
      chore_id: assignment.chore_id,
      user_id: assignment.user_id,
      is_completed: false
    }));
    
    const result = await db.insert(weeklyAssignmentsTable)
      .values(assignmentsToInsert)
      .returning()
      .execute();
    
    // Convert string dates back to Date objects
    return result.map(assignment => ({
      ...assignment,
      week_start_date: new Date(assignment.week_start_date),
      completed_at: assignment.completed_at
    }));
  } catch (error) {
    console.error('Chore assignment failed:', error);
    throw error;
  }
};
