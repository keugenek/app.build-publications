import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, choresTable, weeklyChoreAssignmentsTable } from '../db/schema';
import { type GetUserChoresInput } from '../schema';
import { getUserChores } from '../handlers/get_user_chores';
import { eq } from 'drizzle-orm';

describe('getUserChores', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test data
  const testUser = {
    name: 'Test User'
  };

  const testChore = {
    name: 'Test Chore',
    description: 'A chore for testing'
  };

  const weekStartDate = new Date('2023-01-02'); // Monday
  const weekStartDateStr = '2023-01-02'; // Date string format for database

  it('should return an empty array when user has no assigned chores', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    
    const input: GetUserChoresInput = {
      user_id: userId,
      week_start_date: weekStartDate
    };

    const result = await getUserChores(input);
    
    expect(result).toEqual([]);
  });

  it('should return chores assigned to a user for a specific week', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create a chore
    const choreResult = await db.insert(choresTable)
      .values(testChore)
      .returning()
      .execute();
    
    const choreId = choreResult[0].id;

    // Create chore assignment
    const assignmentData = {
      user_id: userId,
      chore_id: choreId,
      week_start_date: weekStartDateStr,
      is_completed: false
    };

    const assignmentResult = await db.insert(weeklyChoreAssignmentsTable)
      .values(assignmentData)
      .returning()
      .execute();

    const assignmentId = assignmentResult[0].id;

    const input: GetUserChoresInput = {
      user_id: userId,
      week_start_date: weekStartDate
    };

    const result = await getUserChores(input);
    
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(assignmentId);
    expect(result[0].user_id).toBe(userId);
    expect(result[0].chore_id).toBe(choreId);
    expect(result[0].week_start_date).toEqual(weekStartDate);
    expect(result[0].is_completed).toBe(false);
    expect(result[0].completed_at).toBeNull();
    expect(result[0].assigned_at).toBeInstanceOf(Date);
  });

  it('should only return chores for the specified week', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create chores
    const choreResult = await db.insert(choresTable)
      .values(testChore)
      .returning()
      .execute();
    
    const choreId = choreResult[0].id;

    // Create chore assignments for different weeks
    const week1DateStr = '2023-01-02';
    const week2DateStr = '2023-01-09';

    await db.insert(weeklyChoreAssignmentsTable)
      .values({
        user_id: userId,
        chore_id: choreId,
        week_start_date: week1DateStr,
        is_completed: false
      })
      .execute();

    await db.insert(weeklyChoreAssignmentsTable)
      .values({
        user_id: userId,
        chore_id: choreId,
        week_start_date: week2DateStr,
        is_completed: false
      })
      .execute();

    // Query for week 1
    const input: GetUserChoresInput = {
      user_id: userId,
      week_start_date: weekStartDate
    };

    const result = await getUserChores(input);
    
    expect(result).toHaveLength(1);
    expect(result[0].week_start_date).toEqual(weekStartDate);
  });

  it('should only return chores for the specified user', async () => {
    // Create two users
    const user1Result = await db.insert(usersTable)
      .values({ name: 'User 1' })
      .returning()
      .execute();
    
    const user1Id = user1Result[0].id;

    const user2Result = await db.insert(usersTable)
      .values({ name: 'User 2' })
      .returning()
      .execute();
    
    const user2Id = user2Result[0].id;

    // Create a chore
    const choreResult = await db.insert(choresTable)
      .values(testChore)
      .returning()
      .execute();
    
    const choreId = choreResult[0].id;

    // Create chore assignments for different users
    await db.insert(weeklyChoreAssignmentsTable)
      .values({
        user_id: user1Id,
        chore_id: choreId,
        week_start_date: weekStartDateStr,
        is_completed: false
      })
      .execute();

    await db.insert(weeklyChoreAssignmentsTable)
      .values({
        user_id: user2Id,
        chore_id: choreId,
        week_start_date: weekStartDateStr,
        is_completed: false
      })
      .execute();

    // Query for user 1
    const input: GetUserChoresInput = {
      user_id: user1Id,
      week_start_date: weekStartDate
    };

    const result = await getUserChores(input);
    
    expect(result).toHaveLength(1);
    expect(result[0].user_id).toBe(user1Id);
  });

  it('should properly handle completed chores with completed_at timestamp', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create a chore
    const choreResult = await db.insert(choresTable)
      .values(testChore)
      .returning()
      .execute();
    
    const choreId = choreResult[0].id;

    // Create a completed chore assignment
    const completedAt = new Date();
    const assignmentData = {
      user_id: userId,
      chore_id: choreId,
      week_start_date: weekStartDateStr,
      is_completed: true,
      completed_at: completedAt
    };

    await db.insert(weeklyChoreAssignmentsTable)
      .values(assignmentData)
      .execute();

    const input: GetUserChoresInput = {
      user_id: userId,
      week_start_date: weekStartDate
    };

    const result = await getUserChores(input);
    
    expect(result).toHaveLength(1);
    expect(result[0].is_completed).toBe(true);
    expect(result[0].completed_at).toBeInstanceOf(Date);
    // Compare timestamps ignoring milliseconds
    expect(Math.abs(result[0].completed_at!.getTime() - completedAt.getTime())).toBeLessThan(1000);
  });
});
