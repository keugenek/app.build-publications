import { db } from '../db';
import { usersTable, choresTable, weeklyChoreAssignmentsTable } from '../db/schema';
import { type AssignChoresInput, type WeeklyChoreAssignment } from '../schema';
import { eq } from 'drizzle-orm';

export const assignChores = async (input: AssignChoresInput): Promise<WeeklyChoreAssignment[]> => {
  try {
    // Get all users
    const users = await db.select().from(usersTable).execute();
    
    // Get all chores
    const chores = await db.select().from(choresTable).execute();
    
    // If no users or chores, return empty array
    if (users.length === 0 || chores.length === 0) {
      return [];
    }
    
    // Format the date for database query
    const formattedDate = input.week_start_date.toISOString().split('T')[0];
    
    // Check if assignments already exist for this week
    const existingAssignments = await db.select()
      .from(weeklyChoreAssignmentsTable)
      .where(eq(weeklyChoreAssignmentsTable.week_start_date, formattedDate))
      .execute();
      
    if (existingAssignments.length > 0) {
      // If assignments exist, return them instead of creating new ones
      return existingAssignments.map(assignment => ({
        ...assignment,
        week_start_date: new Date(assignment.week_start_date)
      }));
    }
    
    // Create assignments by randomly pairing users with chores
    const assignments: typeof weeklyChoreAssignmentsTable.$inferInsert[] = [];
    
    // Shuffle users array to randomize assignment
    const shuffledUsers = [...users].sort(() => Math.random() - 0.5);
    
    // Assign each chore to a user (cycling through users if there are more chores than users)
    chores.forEach((chore, index) => {
      const user = shuffledUsers[index % shuffledUsers.length];
      assignments.push({
        user_id: user.id,
        chore_id: chore.id,
        week_start_date: formattedDate, // Pass as formatted string for date column
        is_completed: false,
        assigned_at: new Date()
      });
    });
    
    // Insert assignments into database
    const result = await db.insert(weeklyChoreAssignmentsTable)
      .values(assignments)
      .returning()
      .execute();
    
    // Convert date strings back to Date objects
    return result.map(assignment => ({
      ...assignment,
      week_start_date: new Date(assignment.week_start_date)
    }));
  } catch (error) {
    console.error('Chore assignment failed:', error);
    throw error;
  }
};
