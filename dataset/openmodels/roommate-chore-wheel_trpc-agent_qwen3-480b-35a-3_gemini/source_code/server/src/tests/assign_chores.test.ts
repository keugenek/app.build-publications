import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { choresTable, usersTable, weeklyAssignmentsTable } from '../db/schema';
import { type AssignChoresInput, type CreateChoreInput, type CreateUserInput } from '../schema';
import { assignChores } from '../handlers/assign_chores';
import { eq } from 'drizzle-orm';

describe('assignChores', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper functions to create chores and users for testing
  const createChore = async (input: CreateChoreInput) => {
    return await db.insert(choresTable)
      .values(input)
      .returning()
      .execute()
      .then(res => res[0]);
  };

  const createUser = async (input: CreateUserInput) => {
    return await db.insert(usersTable)
      .values(input)
      .returning()
      .execute()
      .then(res => res[0]);
  };

  it('should create weekly chore assignments', async () => {
    // Create test chore and user
    const chore = await createChore({
      name: 'Clean kitchen',
      description: 'Wash dishes and clean counters'
    });

    const user = await createUser({
      name: 'John Doe',
      email: 'john@example.com'
    });

    // Test input
    const testInput: AssignChoresInput = {
      week_start_date: new Date('2023-10-02'),
      assignments: [
        {
          chore_id: chore.id,
          user_id: user.id
        }
      ]
    };

    // Call handler
    const result = await assignChores(testInput);

    // Validate result
    expect(result).toHaveLength(1);
    expect(result[0].week_start_date).toEqual(testInput.week_start_date);
    expect(result[0].chore_id).toEqual(chore.id);
    expect(result[0].user_id).toEqual(user.id);
    expect(result[0].is_completed).toBe(false);
    expect(result[0].completed_at).toBeNull();
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should save assignments to database', async () => {
    // Create test chore and user
    const chore = await createChore({
      name: 'Vacuum living room',
      description: 'Vacuum all carpets in living room'
    });

    const user = await createUser({
      name: 'Jane Smith',
      email: 'jane@example.com'
    });

    // Test input
    const testInput: AssignChoresInput = {
      week_start_date: new Date('2023-10-09'),
      assignments: [
        {
          chore_id: chore.id,
          user_id: user.id
        }
      ]
    };

    // Call handler
    const result = await assignChores(testInput);

    // Query database to verify assignments were saved
    const assignments = await db.select()
      .from(weeklyAssignmentsTable)
      .where(eq(weeklyAssignmentsTable.id, result[0].id))
      .execute();

    expect(assignments).toHaveLength(1);
    // Compare date strings since database stores dates as strings
    expect(assignments[0].week_start_date).toEqual('2023-10-09');
    expect(assignments[0].chore_id).toEqual(chore.id);
    expect(assignments[0].user_id).toEqual(user.id);
    expect(assignments[0].is_completed).toBe(false);
    expect(assignments[0].completed_at).toBeNull();
    expect(assignments[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple assignments', async () => {
    // Create test chores and users
    const chore1 = await createChore({
      name: 'Mow lawn',
      description: 'Mow the front and back lawn'
    });

    const chore2 = await createChore({
      name: 'Take out trash',
      description: 'Empty all trash bins'
    });

    const user1 = await createUser({
      name: 'Alice Johnson',
      email: 'alice@example.com'
    });

    const user2 = await createUser({
      name: 'Bob Williams',
      email: 'bob@example.com'
    });

    // Test input with multiple assignments
    const testInput: AssignChoresInput = {
      week_start_date: new Date('2023-10-16'),
      assignments: [
        {
          chore_id: chore1.id,
          user_id: user1.id
        },
        {
          chore_id: chore2.id,
          user_id: user2.id
        }
      ]
    };

    // Call handler
    const result = await assignChores(testInput);

    // Validate result
    expect(result).toHaveLength(2);
    
    // Check first assignment
    const assignment1 = result.find(a => a.chore_id === chore1.id);
    expect(assignment1).toBeDefined();
    expect(assignment1!.user_id).toEqual(user1.id);
    expect(assignment1!.week_start_date).toEqual(testInput.week_start_date);
    
    // Check second assignment
    const assignment2 = result.find(a => a.chore_id === chore2.id);
    expect(assignment2).toBeDefined();
    expect(assignment2!.user_id).toEqual(user2.id);
    expect(assignment2!.week_start_date).toEqual(testInput.week_start_date);
  });

  it('should reject assignments with non-existent chores', async () => {
    // Create test user
    const user = await createUser({
      name: 'Test User',
      email: 'test@example.com'
    });

    // Test input with non-existent chore
    const testInput: AssignChoresInput = {
      week_start_date: new Date('2023-10-23'),
      assignments: [
        {
          chore_id: 99999, // Non-existent chore
          user_id: user.id
        }
      ]
    };

    // Should throw an error
    await expect(assignChores(testInput)).rejects.toThrow(/Chores with IDs 99999 do not exist/);
  });

  it('should reject assignments with non-existent users', async () => {
    // Create test chore
    const chore = await createChore({
      name: 'Test chore',
      description: 'Test description'
    });

    // Test input with non-existent user
    const testInput: AssignChoresInput = {
      week_start_date: new Date('2023-10-30'),
      assignments: [
        {
          chore_id: chore.id,
          user_id: 99999 // Non-existent user
        }
      ]
    };

    // Should throw an error
    await expect(assignChores(testInput)).rejects.toThrow(/Users with IDs 99999 do not exist/);
  });
});
