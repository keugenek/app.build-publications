import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { participantsTable, choresTable, weeksTable, assignmentsTable } from '../db/schema';
import { getCurrentWeekAssignments } from '../handlers/get_current_week_assignments';

// Helper function to calculate ISO week number and year (same as in handler)
function getISOWeek(date: Date): { year: number; week: number } {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  
  return {
    year: d.getUTCFullYear(),
    week: weekNo
  };
}

// Helper function to get start/end dates for ISO week
function getISOWeekDates(year: number, week: number): { start: Date; end: Date } {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4WeekDay = jan4.getUTCDay() || 7;
  const mondayOfWeek1 = new Date(jan4);
  mondayOfWeek1.setUTCDate(jan4.getUTCDate() - jan4WeekDay + 1);
  
  const targetMonday = new Date(mondayOfWeek1);
  targetMonday.setUTCDate(mondayOfWeek1.getUTCDate() + (week - 1) * 7);
  
  const targetSunday = new Date(targetMonday);
  targetSunday.setUTCDate(targetMonday.getUTCDate() + 6);
  
  return {
    start: targetMonday,
    end: targetSunday
  };
}

describe('getCurrentWeekAssignments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no assignments exist for current week', async () => {
    const result = await getCurrentWeekAssignments();
    expect(result).toEqual([]);
  });

  it('should return assignments for current week', async () => {
    // Create test data
    const participantResult = await db.insert(participantsTable)
      .values({ name: 'Test Participant' })
      .returning()
      .execute();

    const choreResult = await db.insert(choresTable)
      .values({ name: 'Test Chore' })
      .returning()
      .execute();

    // Get current week info
    const currentWeek = getISOWeek(new Date());
    const weekDates = getISOWeekDates(currentWeek.year, currentWeek.week);

    const weekResult = await db.insert(weeksTable)
      .values({
        year: currentWeek.year,
        week_number: currentWeek.week,
        start_date: weekDates.start.toISOString().split('T')[0],
        end_date: weekDates.end.toISOString().split('T')[0]
      })
      .returning()
      .execute();

    const assignmentResult = await db.insert(assignmentsTable)
      .values({
        week_id: weekResult[0].id,
        participant_id: participantResult[0].id,
        chore_id: choreResult[0].id,
        is_completed: false
      })
      .returning()
      .execute();

    // Test the handler
    const result = await getCurrentWeekAssignments();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(assignmentResult[0].id);
    expect(result[0].week.year).toBe(currentWeek.year);
    expect(result[0].week.week_number).toBe(currentWeek.week);
    expect(result[0].participant.name).toBe('Test Participant');
    expect(result[0].chore.name).toBe('Test Chore');
    expect(result[0].is_completed).toBe(false);
    expect(result[0].completed_at).toBeNull();
  });

  it('should return multiple assignments for current week', async () => {
    // Create multiple participants and chores
    const participants = await db.insert(participantsTable)
      .values([
        { name: 'Alice' },
        { name: 'Bob' }
      ])
      .returning()
      .execute();

    const chores = await db.insert(choresTable)
      .values([
        { name: 'Dishes' },
        { name: 'Vacuum' }
      ])
      .returning()
      .execute();

    // Create current week
    const currentWeek = getISOWeek(new Date());
    const weekDates = getISOWeekDates(currentWeek.year, currentWeek.week);

    const weekResult = await db.insert(weeksTable)
      .values({
        year: currentWeek.year,
        week_number: currentWeek.week,
        start_date: weekDates.start.toISOString().split('T')[0],
        end_date: weekDates.end.toISOString().split('T')[0]
      })
      .returning()
      .execute();

    // Create multiple assignments
    await db.insert(assignmentsTable)
      .values([
        {
          week_id: weekResult[0].id,
          participant_id: participants[0].id,
          chore_id: chores[0].id,
          is_completed: true,
          completed_at: new Date()
        },
        {
          week_id: weekResult[0].id,
          participant_id: participants[1].id,
          chore_id: chores[1].id,
          is_completed: false
        }
      ])
      .execute();

    const result = await getCurrentWeekAssignments();

    expect(result).toHaveLength(2);
    
    // Sort by participant name for consistent testing
    const sortedResult = result.sort((a, b) => a.participant.name.localeCompare(b.participant.name));

    expect(sortedResult[0].participant.name).toBe('Alice');
    expect(sortedResult[0].chore.name).toBe('Dishes');
    expect(sortedResult[0].is_completed).toBe(true);
    expect(sortedResult[0].completed_at).toBeInstanceOf(Date);

    expect(sortedResult[1].participant.name).toBe('Bob');
    expect(sortedResult[1].chore.name).toBe('Vacuum');
    expect(sortedResult[1].is_completed).toBe(false);
    expect(sortedResult[1].completed_at).toBeNull();
  });

  it('should not return assignments from different weeks', async () => {
    // Create test data for current week
    const participant = await db.insert(participantsTable)
      .values({ name: 'Test Participant' })
      .returning()
      .execute();

    const chore = await db.insert(choresTable)
      .values({ name: 'Test Chore' })
      .returning()
      .execute();

    const currentWeek = getISOWeek(new Date());
    const currentWeekDates = getISOWeekDates(currentWeek.year, currentWeek.week);

    // Create current week and assignment
    const currentWeekResult = await db.insert(weeksTable)
      .values({
        year: currentWeek.year,
        week_number: currentWeek.week,
        start_date: currentWeekDates.start.toISOString().split('T')[0],
        end_date: currentWeekDates.end.toISOString().split('T')[0]
      })
      .returning()
      .execute();

    await db.insert(assignmentsTable)
      .values({
        week_id: currentWeekResult[0].id,
        participant_id: participant[0].id,
        chore_id: chore[0].id,
        is_completed: false
      })
      .execute();

    // Create different week (next week) and assignment
    const nextWeek = currentWeek.week < 52 ? currentWeek.week + 1 : 1;
    const nextWeekYear = nextWeek === 1 ? currentWeek.year + 1 : currentWeek.year;
    const nextWeekDates = getISOWeekDates(nextWeekYear, nextWeek);

    const nextWeekResult = await db.insert(weeksTable)
      .values({
        year: nextWeekYear,
        week_number: nextWeek,
        start_date: nextWeekDates.start.toISOString().split('T')[0],
        end_date: nextWeekDates.end.toISOString().split('T')[0]
      })
      .returning()
      .execute();

    await db.insert(assignmentsTable)
      .values({
        week_id: nextWeekResult[0].id,
        participant_id: participant[0].id,
        chore_id: chore[0].id,
        is_completed: false
      })
      .execute();

    // Test should only return current week assignment
    const result = await getCurrentWeekAssignments();

    expect(result).toHaveLength(1);
    expect(result[0].week.year).toBe(currentWeek.year);
    expect(result[0].week.week_number).toBe(currentWeek.week);
  });

  it('should handle completed and incomplete assignments correctly', async () => {
    const participant = await db.insert(participantsTable)
      .values({ name: 'Test Participant' })
      .returning()
      .execute();

    const chore = await db.insert(choresTable)
      .values({ name: 'Test Chore' })
      .returning()
      .execute();

    const currentWeek = getISOWeek(new Date());
    const weekDates = getISOWeekDates(currentWeek.year, currentWeek.week);

    const weekResult = await db.insert(weeksTable)
      .values({
        year: currentWeek.year,
        week_number: currentWeek.week,
        start_date: weekDates.start.toISOString().split('T')[0],
        end_date: weekDates.end.toISOString().split('T')[0]
      })
      .returning()
      .execute();

    const completedAt = new Date();
    await db.insert(assignmentsTable)
      .values({
        week_id: weekResult[0].id,
        participant_id: participant[0].id,
        chore_id: chore[0].id,
        is_completed: true,
        completed_at: completedAt
      })
      .execute();

    const result = await getCurrentWeekAssignments();

    expect(result).toHaveLength(1);
    expect(result[0].is_completed).toBe(true);
    expect(result[0].completed_at).toBeInstanceOf(Date);
    expect(result[0].completed_at?.getTime()).toBe(completedAt.getTime());
  });

  it('should return proper date objects for all timestamp fields', async () => {
    const participant = await db.insert(participantsTable)
      .values({ name: 'Test Participant' })
      .returning()
      .execute();

    const chore = await db.insert(choresTable)
      .values({ name: 'Test Chore' })
      .returning()
      .execute();

    const currentWeek = getISOWeek(new Date());
    const weekDates = getISOWeekDates(currentWeek.year, currentWeek.week);

    const weekResult = await db.insert(weeksTable)
      .values({
        year: currentWeek.year,
        week_number: currentWeek.week,
        start_date: weekDates.start.toISOString().split('T')[0],
        end_date: weekDates.end.toISOString().split('T')[0]
      })
      .returning()
      .execute();

    await db.insert(assignmentsTable)
      .values({
        week_id: weekResult[0].id,
        participant_id: participant[0].id,
        chore_id: chore[0].id,
        is_completed: false
      })
      .execute();

    const result = await getCurrentWeekAssignments();

    expect(result).toHaveLength(1);
    expect(result[0].week.start_date).toBeInstanceOf(Date);
    expect(result[0].week.end_date).toBeInstanceOf(Date);
    expect(result[0].week.created_at).toBeInstanceOf(Date);
    expect(result[0].participant.created_at).toBeInstanceOf(Date);
    expect(result[0].chore.created_at).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
  });
});
