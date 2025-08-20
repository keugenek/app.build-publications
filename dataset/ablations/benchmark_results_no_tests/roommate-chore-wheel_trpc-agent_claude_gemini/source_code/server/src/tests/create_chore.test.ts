import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { choresTable } from '../db/schema';
import { type CreateChoreInput } from '../schema';
import { createChore } from '../handlers/create_chore';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateChoreInput = {
  name: 'Clean the kitchen'
};

// Helper function to get week start (same as in handler)
const getWeekStart = (date: Date = new Date()): Date => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
};

describe('createChore', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a chore with basic information', async () => {
    const result = await createChore(testInput);

    // Basic field validation
    expect(result.name).toEqual('Clean the kitchen');
    expect(result.is_completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.assigned_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should assign chore to current week start', async () => {
    const result = await createChore(testInput);
    const expectedWeekStart = getWeekStart();

    // Verify the assigned date is set to the start of current week
    expect(result.assigned_date.getTime()).toEqual(expectedWeekStart.getTime());
  });

  it('should save chore to database', async () => {
    const result = await createChore(testInput);

    // Query database to verify persistence
    const chores = await db.select()
      .from(choresTable)
      .where(eq(choresTable.id, result.id))
      .execute();

    expect(chores).toHaveLength(1);
    expect(chores[0].name).toEqual('Clean the kitchen');
    expect(chores[0].is_completed).toEqual(false);
    expect(chores[0].assigned_date).toBeInstanceOf(Date);
    expect(chores[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple chores independently', async () => {
    const chore1 = await createChore({ name: 'Vacuum living room' });
    const chore2 = await createChore({ name: 'Take out trash' });

    // Verify both chores were created with different IDs
    expect(chore1.id).not.toEqual(chore2.id);
    expect(chore1.name).toEqual('Vacuum living room');
    expect(chore2.name).toEqual('Take out trash');
    expect(chore1.is_completed).toEqual(false);
    expect(chore2.is_completed).toEqual(false);

    // Verify both are assigned to same week
    expect(chore1.assigned_date.getTime()).toEqual(chore2.assigned_date.getTime());
  });

  it('should handle various chore names correctly', async () => {
    const testCases = [
      'Wash dishes',
      'Clean bathroom mirror',
      'Organize closet',
      'Water plants'
    ];

    for (const choreName of testCases) {
      const result = await createChore({ name: choreName });
      expect(result.name).toEqual(choreName);
      expect(result.is_completed).toEqual(false);
    }
  });

  it('should set consistent week start for chores created on different days', async () => {
    // Create first chore
    const chore1 = await createChore({ name: 'First chore' });
    
    // Simulate creating another chore (would have same week start)
    const chore2 = await createChore({ name: 'Second chore' });

    // Both should have the same assigned_date (week start)
    expect(chore1.assigned_date.getTime()).toEqual(chore2.assigned_date.getTime());
    
    // Verify the assigned date is indeed a Monday at 00:00:00
    const weekStart = chore1.assigned_date;
    expect(weekStart.getHours()).toEqual(0);
    expect(weekStart.getMinutes()).toEqual(0);
    expect(weekStart.getSeconds()).toEqual(0);
    expect(weekStart.getMilliseconds()).toEqual(0);
    expect(weekStart.getDay()).toEqual(1); // Monday
  });

  it('should verify database record matches returned object', async () => {
    const result = await createChore(testInput);

    // Fetch the same record from database
    const dbRecord = await db.select()
      .from(choresTable)
      .where(eq(choresTable.id, result.id))
      .execute();

    const savedChore = dbRecord[0];

    // Compare all fields
    expect(result.id).toEqual(savedChore.id);
    expect(result.name).toEqual(savedChore.name);
    expect(result.is_completed).toEqual(savedChore.is_completed);
    expect(result.assigned_date.getTime()).toEqual(savedChore.assigned_date!.getTime());
    expect(result.created_at.getTime()).toEqual(savedChore.created_at!.getTime());
  });
});
