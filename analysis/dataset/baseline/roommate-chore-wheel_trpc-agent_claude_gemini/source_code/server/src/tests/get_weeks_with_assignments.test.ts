import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { participantsTable, choresTable, weeksTable, assignmentsTable } from '../db/schema';
import { getWeeksWithAssignments } from '../handlers/get_weeks_with_assignments';

describe('getWeeksWithAssignments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no weeks have assignments', async () => {
    // Create a week but no assignments
    await db.insert(weeksTable).values({
      year: 2024,
      week_number: 1,
      start_date: '2024-01-01',
      end_date: '2024-01-07'
    }).execute();

    const result = await getWeeksWithAssignments();

    expect(result).toEqual([]);
  });

  it('should return weeks that have assignments', async () => {
    // Create prerequisite data
    const participantResult = await db.insert(participantsTable).values({
      name: 'John Doe'
    }).returning().execute();

    const choreResult = await db.insert(choresTable).values({
      name: 'Dishes'
    }).returning().execute();

    const weekResult = await db.insert(weeksTable).values({
      year: 2024,
      week_number: 1,
      start_date: '2024-01-01',
      end_date: '2024-01-07'
    }).returning().execute();

    // Create assignment
    await db.insert(assignmentsTable).values({
      week_id: weekResult[0].id,
      participant_id: participantResult[0].id,
      chore_id: choreResult[0].id,
      is_completed: false
    }).execute();

    const result = await getWeeksWithAssignments();

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(weekResult[0].id);
    expect(result[0].year).toEqual(2024);
    expect(result[0].week_number).toEqual(1);
    expect(result[0].start_date).toBeInstanceOf(Date);
    expect(result[0].end_date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should not return duplicate weeks when multiple assignments exist for same week', async () => {
    // Create prerequisite data
    const participantResults = await db.insert(participantsTable).values([
      { name: 'John Doe' },
      { name: 'Jane Smith' }
    ]).returning().execute();

    const choreResults = await db.insert(choresTable).values([
      { name: 'Dishes' },
      { name: 'Laundry' }
    ]).returning().execute();

    const weekResult = await db.insert(weeksTable).values({
      year: 2024,
      week_number: 1,
      start_date: '2024-01-01',
      end_date: '2024-01-07'
    }).returning().execute();

    // Create multiple assignments for the same week
    await db.insert(assignmentsTable).values([
      {
        week_id: weekResult[0].id,
        participant_id: participantResults[0].id,
        chore_id: choreResults[0].id,
        is_completed: false
      },
      {
        week_id: weekResult[0].id,
        participant_id: participantResults[1].id,
        chore_id: choreResults[1].id,
        is_completed: true
      }
    ]).execute();

    const result = await getWeeksWithAssignments();

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(weekResult[0].id);
  });

  it('should return weeks ordered by year desc, then week_number desc', async () => {
    // Create prerequisite data
    const participantResult = await db.insert(participantsTable).values({
      name: 'John Doe'
    }).returning().execute();

    const choreResult = await db.insert(choresTable).values({
      name: 'Dishes'
    }).returning().execute();

    // Create weeks in different years and week numbers
    const weekResults = await db.insert(weeksTable).values([
      {
        year: 2023,
        week_number: 52,
        start_date: '2023-12-25',
        end_date: '2023-12-31'
      },
      {
        year: 2024,
        week_number: 1,
        start_date: '2024-01-01',
        end_date: '2024-01-07'
      },
      {
        year: 2024,
        week_number: 2,
        start_date: '2024-01-08',
        end_date: '2024-01-14'
      }
    ]).returning().execute();

    // Create assignments for all weeks
    await db.insert(assignmentsTable).values([
      {
        week_id: weekResults[0].id,
        participant_id: participantResult[0].id,
        chore_id: choreResult[0].id,
        is_completed: false
      },
      {
        week_id: weekResults[1].id,
        participant_id: participantResult[0].id,
        chore_id: choreResult[0].id,
        is_completed: false
      },
      {
        week_id: weekResults[2].id,
        participant_id: participantResult[0].id,
        chore_id: choreResult[0].id,
        is_completed: false
      }
    ]).execute();

    const result = await getWeeksWithAssignments();

    expect(result).toHaveLength(3);
    
    // Should be ordered by year desc, week_number desc
    // So: 2024 week 2, 2024 week 1, 2023 week 52
    expect(result[0].year).toEqual(2024);
    expect(result[0].week_number).toEqual(2);
    
    expect(result[1].year).toEqual(2024);
    expect(result[1].week_number).toEqual(1);
    
    expect(result[2].year).toEqual(2023);
    expect(result[2].week_number).toEqual(52);
  });

  it('should handle date conversion correctly', async () => {
    // Create prerequisite data
    const participantResult = await db.insert(participantsTable).values({
      name: 'John Doe'
    }).returning().execute();

    const choreResult = await db.insert(choresTable).values({
      name: 'Dishes'
    }).returning().execute();

    const weekResult = await db.insert(weeksTable).values({
      year: 2024,
      week_number: 1,
      start_date: '2024-01-01',
      end_date: '2024-01-07'
    }).returning().execute();

    await db.insert(assignmentsTable).values({
      week_id: weekResult[0].id,
      participant_id: participantResult[0].id,
      chore_id: choreResult[0].id,
      is_completed: false
    }).execute();

    const result = await getWeeksWithAssignments();

    expect(result).toHaveLength(1);
    
    // Verify all date fields are proper Date objects
    expect(result[0].start_date).toBeInstanceOf(Date);
    expect(result[0].end_date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
    
    // Verify date values are correct
    expect(result[0].start_date.toISOString().split('T')[0]).toEqual('2024-01-01');
    expect(result[0].end_date.toISOString().split('T')[0]).toEqual('2024-01-07');
  });

  it('should exclude weeks without any assignments', async () => {
    // Create prerequisite data
    const participantResult = await db.insert(participantsTable).values({
      name: 'John Doe'
    }).returning().execute();

    const choreResult = await db.insert(choresTable).values({
      name: 'Dishes'
    }).returning().execute();

    // Create two weeks
    const weekResults = await db.insert(weeksTable).values([
      {
        year: 2024,
        week_number: 1,
        start_date: '2024-01-01',
        end_date: '2024-01-07'
      },
      {
        year: 2024,
        week_number: 2,
        start_date: '2024-01-08',
        end_date: '2024-01-14'
      }
    ]).returning().execute();

    // Create assignment for only the first week
    await db.insert(assignmentsTable).values({
      week_id: weekResults[0].id,
      participant_id: participantResult[0].id,
      chore_id: choreResult[0].id,
      is_completed: false
    }).execute();

    const result = await getWeeksWithAssignments();

    // Should only return the week that has assignments
    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(weekResults[0].id);
    expect(result[0].week_number).toEqual(1);
  });
});
