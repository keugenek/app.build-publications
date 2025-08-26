import { db } from '../db';
import { membersTable, choresTable, weeklyAssignmentsTable } from '../db/schema';
import { type WeeklyAssignment } from '../schema';
import { eq } from 'drizzle-orm';

// Helper function to get the most recent Monday (start of the week)
const getCurrentWeekStartDate = (): string => {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when Sunday
  const monday = new Date(today.setDate(diff));
  monday.setHours(0, 0, 0, 0); // Reset time to midnight
  // Return as ISO date string (YYYY-MM-DD)
  return monday.toISOString().split('T')[0];
};

// Helper function to randomly assign chores to members
const assignChoresToMembers = (members: any[], chores: any[]): { memberId: number; choreId: number }[] => {
  if (members.length === 0 || chores.length === 0) {
    return [];
  }

  // Shuffle members array to randomize assignment
  const shuffledMembers = [...members].sort(() => Math.random() - 0.5);
  
  // Create assignments
  const assignments = [];
  for (let i = 0; i < chores.length; i++) {
    const member = shuffledMembers[i % shuffledMembers.length];
    assignments.push({
      memberId: member.id,
      choreId: chores[i].id
    });
  }
  
  return assignments;
};

export const assignChores = async (): Promise<WeeklyAssignment[]> => {
  try {
    // 1. Get all members and chores from the database
    const members = await db.select().from(membersTable).execute();
    const chores = await db.select().from(choresTable).execute();
    
    // If no members or chores, return empty array
    if (members.length === 0 || chores.length === 0) {
      return [];
    }
    
    // 2. Determine the current week's start date (most recent Monday)
    const weekStartDate = getCurrentWeekStartDate();
    
    // 3. Check if assignments already exist for this week
    const existingAssignments = await db.select()
      .from(weeklyAssignmentsTable)
      .where(eq(weeklyAssignmentsTable.week_start_date, weekStartDate))
      .execute();
    
    // If assignments already exist for this week, return them
    if (existingAssignments.length > 0) {
      return existingAssignments.map(assignment => ({
        ...assignment,
        week_start_date: new Date(assignment.week_start_date)
      }));
    }
    
    // 4. Randomly assign chores to members
    const choreAssignments = assignChoresToMembers(members, chores);
    
    // 5. Save these assignments to the database
    const newAssignments = [];
    for (const assignment of choreAssignments) {
      const [createdAssignment] = await db.insert(weeklyAssignmentsTable)
        .values({
          member_id: assignment.memberId,
          chore_id: assignment.choreId,
          week_start_date: weekStartDate // Date string in YYYY-MM-DD format
        })
        .returning()
        .execute();
      
      newAssignments.push({
        ...createdAssignment,
        week_start_date: new Date(createdAssignment.week_start_date)
      });
    }
    
    return newAssignments;
  } catch (error) {
    console.error('Chore assignment failed:', error);
    throw error;
  }
};
