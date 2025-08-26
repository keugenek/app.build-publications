import { db } from '../db';
import { weeksTable, participantsTable, choresTable, assignmentsTable } from '../db/schema';
import { type CreateWeeklyAssignmentInput, type AssignmentWithDetails } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function createWeeklyAssignments(input: CreateWeeklyAssignmentInput): Promise<AssignmentWithDetails[]> {
  try {
    const { year, week_number } = input;

    // Calculate start and end dates for the week (ISO week date system)
    const startDate = getMonday(year, week_number);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6); // Sunday of the same week

    // Step 1: Create or find the week record
    let weekRecord = await db.select()
      .from(weeksTable)
      .where(and(
        eq(weeksTable.year, year),
        eq(weeksTable.week_number, week_number)
      ))
      .execute();

    let week;
    if (weekRecord.length === 0) {
      // Create new week record
      const newWeekResult = await db.insert(weeksTable)
        .values({
          year,
          week_number,
          start_date: startDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
          end_date: endDate.toISOString().split('T')[0] // Format as YYYY-MM-DD
        })
        .returning()
        .execute();
      week = newWeekResult[0];
    } else {
      week = weekRecord[0];
    }

    // Step 2: Fetch all active participants and chores
    const participants = await db.select().from(participantsTable).execute();
    const chores = await db.select().from(choresTable).execute();

    if (participants.length === 0) {
      throw new Error('No participants available for assignment');
    }

    if (chores.length === 0) {
      throw new Error('No chores available for assignment');
    }

    // Check if assignments already exist for this week
    const existingAssignments = await db.select()
      .from(assignmentsTable)
      .where(eq(assignmentsTable.week_id, week.id))
      .execute();

    if (existingAssignments.length > 0) {
      throw new Error(`Assignments already exist for week ${week_number} of ${year}`);
    }

    // Step 3: Randomly assign each chore to a participant
    const shuffledParticipants = [...participants].sort(() => Math.random() - 0.5);
    const assignmentValues = chores.map((chore, index) => {
      const participantIndex = index % shuffledParticipants.length;
      return {
        week_id: week.id,
        participant_id: shuffledParticipants[participantIndex].id,
        chore_id: chore.id,
        is_completed: false
      };
    });

    // Step 4: Create assignment records in the database
    const createdAssignments = await db.insert(assignmentsTable)
      .values(assignmentValues)
      .returning()
      .execute();

    // Step 5: Return the created assignments with full details
    const assignmentsWithDetails = await db.select()
      .from(assignmentsTable)
      .innerJoin(weeksTable, eq(assignmentsTable.week_id, weeksTable.id))
      .innerJoin(participantsTable, eq(assignmentsTable.participant_id, participantsTable.id))
      .innerJoin(choresTable, eq(assignmentsTable.chore_id, choresTable.id))
      .where(eq(assignmentsTable.week_id, week.id))
      .execute();

    // Transform the joined results to match AssignmentWithDetails schema
    return assignmentsWithDetails.map(result => ({
      id: result.assignments.id,
      week: {
        id: result.weeks.id,
        year: result.weeks.year,
        week_number: result.weeks.week_number,
        start_date: new Date(result.weeks.start_date),
        end_date: new Date(result.weeks.end_date),
        created_at: result.weeks.created_at
      },
      participant: {
        id: result.participants.id,
        name: result.participants.name,
        created_at: result.participants.created_at
      },
      chore: {
        id: result.chores.id,
        name: result.chores.name,
        created_at: result.chores.created_at
      },
      is_completed: result.assignments.is_completed,
      completed_at: result.assignments.completed_at,
      created_at: result.assignments.created_at
    }));
  } catch (error) {
    console.error('Weekly assignment creation failed:', error);
    throw error;
  }
}

// Helper function to calculate the Monday of a given ISO week
function getMonday(year: number, week: number): Date {
  // January 4th is always in the first week of the year
  const jan4 = new Date(year, 0, 4);
  const jan4Day = jan4.getDay() || 7; // Sunday = 7, Monday = 1
  
  // Find the Monday of the first week
  const firstMonday = new Date(jan4);
  firstMonday.setDate(jan4.getDate() - jan4Day + 1);
  
  // Calculate the Monday of the requested week
  const targetMonday = new Date(firstMonday);
  targetMonday.setDate(firstMonday.getDate() + (week - 1) * 7);
  
  return targetMonday;
}
