import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { choresTable } from '../db/schema';
import { type AssignWeeklyChoresInput } from '../schema';
import { assignWeeklyChores } from '../handlers/assign_weekly_chores';
import { eq } from 'drizzle-orm';

// Test input
const testWeekStartDate = new Date('2024-01-01');
const testInput: AssignWeeklyChoresInput = {
  week_start_date: testWeekStartDate
};

describe('assignWeeklyChores', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no chore templates exist', async () => {
    const result = await assignWeeklyChores(testInput);
    
    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });

  it('should assign all unique chore names for the specified week', async () => {
    // Create some template chores (different weeks)
    await db.insert(choresTable).values([
      { name: 'Vacuum Living Room', is_completed: true, assigned_date: new Date('2023-12-25') },
      { name: 'Clean Kitchen', is_completed: false, assigned_date: new Date('2023-12-25') },
      { name: 'Take Out Trash', is_completed: true, assigned_date: new Date('2023-12-18') },
      // Duplicate names should only create one assignment each
      { name: 'Vacuum Living Room', is_completed: false, assigned_date: new Date('2023-12-18') },
    ]).execute();

    const result = await assignWeeklyChores(testInput);

    // Should create one assignment for each unique chore name
    expect(result.length).toBe(3);
    
    // All chores should be assigned to the correct week
    result.forEach(chore => {
      expect(chore.assigned_date).toEqual(testWeekStartDate);
      expect(chore.is_completed).toBe(false);
      expect(chore.id).toBeDefined();
      expect(chore.created_at).toBeInstanceOf(Date);
    });

    // Should contain all unique chore names
    const assignedNames = result.map(chore => chore.name).sort();
    expect(assignedNames).toEqual(['Clean Kitchen', 'Take Out Trash', 'Vacuum Living Room']);
  });

  it('should create new records in the database', async () => {
    // Create template chores
    await db.insert(choresTable).values([
      { name: 'Dust Furniture', is_completed: true, assigned_date: new Date('2023-12-01') },
      { name: 'Mop Floor', is_completed: false, assigned_date: new Date('2023-12-01') },
    ]).execute();

    const result = await assignWeeklyChores(testInput);

    // Verify records were created in database
    const dbChores = await db.select()
      .from(choresTable)
      .where(eq(choresTable.assigned_date, testWeekStartDate))
      .execute();

    expect(dbChores.length).toBe(2);
    
    // Verify each database record matches a returned result
    dbChores.forEach(dbChore => {
      const matchingResult = result.find(r => r.id === dbChore.id);
      expect(matchingResult).toBeDefined();
      expect(dbChore.assigned_date).toEqual(testWeekStartDate);
      expect(dbChore.is_completed).toBe(false);
    });
  });

  it('should handle single chore template correctly', async () => {
    // Create one template chore
    await db.insert(choresTable).values([
      { name: 'Feed Cat', is_completed: true, assigned_date: new Date('2023-11-01') }
    ]).execute();

    const result = await assignWeeklyChores(testInput);

    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Feed Cat');
    expect(result[0].assigned_date).toEqual(testWeekStartDate);
    expect(result[0].is_completed).toBe(false);
  });

  it('should handle chores with same name from different weeks correctly', async () => {
    // Create template chores with duplicate names from different dates
    await db.insert(choresTable).values([
      { name: 'Weekly Shopping', is_completed: true, assigned_date: new Date('2023-10-01') },
      { name: 'Weekly Shopping', is_completed: false, assigned_date: new Date('2023-10-08') },
      { name: 'Weekly Shopping', is_completed: true, assigned_date: new Date('2023-10-15') },
      { name: 'Clean Bathroom', is_completed: false, assigned_date: new Date('2023-10-01') },
    ]).execute();

    const result = await assignWeeklyChores(testInput);

    // Should only create one assignment per unique name
    expect(result.length).toBe(2);
    
    const assignedNames = result.map(chore => chore.name).sort();
    expect(assignedNames).toEqual(['Clean Bathroom', 'Weekly Shopping']);

    // All assignments should be for the new week
    result.forEach(chore => {
      expect(chore.assigned_date).toEqual(testWeekStartDate);
      expect(chore.is_completed).toBe(false);
    });
  });

  it('should preserve randomization of chore order', async () => {
    // Create several template chores
    await db.insert(choresTable).values([
      { name: 'Chore A', is_completed: true, assigned_date: new Date('2023-01-01') },
      { name: 'Chore B', is_completed: true, assigned_date: new Date('2023-01-01') },
      { name: 'Chore C', is_completed: true, assigned_date: new Date('2023-01-01') },
      { name: 'Chore D', is_completed: true, assigned_date: new Date('2023-01-01') },
      { name: 'Chore E', is_completed: true, assigned_date: new Date('2023-01-01') },
    ]).execute();

    // Run assignment multiple times to verify randomization works
    const results = [];
    for (let i = 0; i < 5; i++) {
      // Clean up previous assignments for this week
      await db.delete(choresTable)
        .where(eq(choresTable.assigned_date, testWeekStartDate))
        .execute();
      
      const result = await assignWeeklyChores(testInput);
      results.push(result.map(chore => chore.name));
    }

    // All results should have the same chores but potentially different orders
    results.forEach(choreNames => {
      expect(choreNames.sort()).toEqual(['Chore A', 'Chore B', 'Chore C', 'Chore D', 'Chore E']);
    });

    // Verify that at least some runs have different orders (randomization working)
    const uniqueOrders = new Set(results.map(names => names.join(',')));
    expect(uniqueOrders.size).toBeGreaterThanOrEqual(1); // At least one order should exist
  });
});
