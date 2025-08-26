import { db } from '../db';
import { choresTable, weeklyAssignmentsTable } from '../db/schema';
import { type GenerateWeeklyAssignmentsInput, type WeeklyAssignment } from '../schema';
import { eq } from 'drizzle-orm';

export async function generateWeeklyAssignments(input: GenerateWeeklyAssignmentsInput): Promise<WeeklyAssignment[]> {
  try {
    // Format week_start as a date string (YYYY-MM-DD) for database comparison
    const weekStartStr = input.week_start.toISOString().split('T')[0];

    // Check if assignments already exist for this week
    const existingAssignments = await db.select()
      .from(weeklyAssignmentsTable)
      .where(eq(weeklyAssignmentsTable.week_start, weekStartStr))
      .execute();

    if (existingAssignments.length > 0) {
      // Convert week_start strings back to Date objects and return existing assignments
      return existingAssignments.map(assignment => ({
        ...assignment,
        week_start: new Date(assignment.week_start)
      }));
    }

    // Fetch all available chores
    const chores = await db.select()
      .from(choresTable)
      .execute();

    if (chores.length === 0) {
      // No chores to assign
      return [];
    }

    // Prepare assignment data
    const assignedPeople = input.assigned_people || [];
    const assignments: Array<{
      chore_id: number;
      week_start: string;
      assigned_person: string | null;
      is_completed: boolean;
    }> = [];

    // Create assignments for each chore
    for (let i = 0; i < chores.length; i++) {
      const chore = chores[i];
      let assignedPerson: string | null = null;

      // Assign person randomly if people are provided
      if (assignedPeople.length > 0) {
        const randomIndex = Math.floor(Math.random() * assignedPeople.length);
        assignedPerson = assignedPeople[randomIndex];
      }

      assignments.push({
        chore_id: chore.id,
        week_start: weekStartStr,
        assigned_person: assignedPerson,
        is_completed: false
      });
    }

    // Insert all assignments
    const results = await db.insert(weeklyAssignmentsTable)
      .values(assignments)
      .returning()
      .execute();

    // Convert week_start strings back to Date objects to match the schema
    return results.map(result => ({
      ...result,
      week_start: new Date(result.week_start)
    }));
  } catch (error) {
    console.error('Generate weekly assignments failed:', error);
    throw error;
  }
}
