import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { assignmentsTable, choresTable, membersTable } from '../db/schema';
import { type GenerateWeeklyAssignmentsInput } from '../schema';
import { generateWeeklyAssignments } from '../handlers/generate_weekly_assignments';
import { eq } from 'drizzle-orm';

// Test input
const testInput: GenerateWeeklyAssignmentsInput = {
  week_start: '2024-01-01'
};

describe('generateWeeklyAssignments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate assignments for all chores', async () => {
    // Create test members
    const membersResult = await db.insert(membersTable)
      .values([
        { name: 'Alice' },
        { name: 'Bob' },
        { name: 'Charlie' }
      ])
      .returning()
      .execute();

    // Create test chores
    const choresResult = await db.insert(choresTable)
      .values([
        { name: 'Vacuum living room', description: 'Weekly vacuuming' },
        { name: 'Clean bathroom', description: 'Deep clean bathroom' },
        { name: 'Take out trash', description: null }
      ])
      .returning()
      .execute();

    const result = await generateWeeklyAssignments(testInput);

    // Should create one assignment per chore
    expect(result).toHaveLength(3);
    
    // Each assignment should have required fields
    result.forEach(assignment => {
      expect(assignment.id).toBeDefined();
      expect(assignment.chore_id).toBeDefined();
      expect(assignment.member_id).toBeDefined();
      expect(assignment.week_start).toEqual(new Date('2024-01-01'));
      expect(assignment.is_completed).toBe(false);
      expect(assignment.completed_at).toBeNull();
      expect(assignment.created_at).toBeInstanceOf(Date);
    });

    // All chores should be assigned
    const assignedChoreIds = result.map(a => a.chore_id).sort();
    const expectedChoreIds = choresResult.map(c => c.id).sort();
    expect(assignedChoreIds).toEqual(expectedChoreIds);

    // All assigned members should exist
    const assignedMemberIds = result.map(a => a.member_id);
    const validMemberIds = membersResult.map(m => m.id);
    assignedMemberIds.forEach(memberId => {
      expect(validMemberIds).toContain(memberId);
    });
  });

  it('should save assignments to database', async () => {
    // Create test data
    await db.insert(membersTable)
      .values([{ name: 'Test Member' }])
      .execute();

    await db.insert(choresTable)
      .values([{ name: 'Test Chore', description: 'A test chore' }])
      .execute();

    const result = await generateWeeklyAssignments(testInput);

    // Verify assignment was saved to database
    const savedAssignments = await db.select()
      .from(assignmentsTable)
      .where(eq(assignmentsTable.week_start, '2024-01-01'))
      .execute();

    expect(savedAssignments).toHaveLength(1);
    expect(savedAssignments[0].id).toEqual(result[0].id);
    expect(savedAssignments[0].week_start).toEqual('2024-01-01'); // Database stores as string
    expect(savedAssignments[0].is_completed).toBe(false);
    expect(savedAssignments[0].completed_at).toBeNull();
  });

  it('should distribute chores randomly among members', async () => {
    // Create multiple members
    await db.insert(membersTable)
      .values([
        { name: 'Member 1' },
        { name: 'Member 2' },
        { name: 'Member 3' }
      ])
      .execute();

    // Create many chores to increase chance of distribution
    await db.insert(choresTable)
      .values([
        { name: 'Chore 1', description: null },
        { name: 'Chore 2', description: null },
        { name: 'Chore 3', description: null },
        { name: 'Chore 4', description: null },
        { name: 'Chore 5', description: null },
        { name: 'Chore 6', description: null }
      ])
      .execute();

    const result = await generateWeeklyAssignments(testInput);

    // Should create 6 assignments
    expect(result).toHaveLength(6);

    // Get unique member IDs assigned (should potentially be distributed)
    const uniqueMemberIds = [...new Set(result.map(a => a.member_id))];
    
    // At minimum, assignments should exist and use valid member IDs
    expect(uniqueMemberIds.length).toBeGreaterThan(0);
    expect(uniqueMemberIds.length).toBeLessThanOrEqual(3);
    
    // All assignments should have valid member and chore IDs
    result.forEach(assignment => {
      expect(typeof assignment.member_id).toBe('number');
      expect(typeof assignment.chore_id).toBe('number');
      expect(assignment.member_id).toBeGreaterThan(0);
      expect(assignment.chore_id).toBeGreaterThan(0);
    });
  });

  it('should throw error when assignments already exist for the week', async () => {
    // Create test data
    await db.insert(membersTable)
      .values([{ name: 'Test Member' }])
      .execute();

    await db.insert(choresTable)
      .values([{ name: 'Test Chore', description: null }])
      .execute();

    // Generate assignments first time
    await generateWeeklyAssignments(testInput);

    // Try to generate again for same week - should throw error
    await expect(generateWeeklyAssignments(testInput))
      .rejects.toThrow(/assignments already exist for week starting 2024-01-01/i);
  });

  it('should throw error when no chores exist', async () => {
    // Create members but no chores
    await db.insert(membersTable)
      .values([{ name: 'Test Member' }])
      .execute();

    await expect(generateWeeklyAssignments(testInput))
      .rejects.toThrow(/no chores available to assign/i);
  });

  it('should throw error when no members exist', async () => {
    // Create chores but no members
    await db.insert(choresTable)
      .values([{ name: 'Test Chore', description: null }])
      .execute();

    await expect(generateWeeklyAssignments(testInput))
      .rejects.toThrow(/no members available to assign chores to/i);
  });

  it('should handle different week dates correctly', async () => {
    // Create test data
    await db.insert(membersTable)
      .values([{ name: 'Test Member' }])
      .execute();

    await db.insert(choresTable)
      .values([{ name: 'Test Chore', description: null }])
      .execute();

    // Test different week dates
    const input1: GenerateWeeklyAssignmentsInput = { week_start: '2024-02-05' };
    const input2: GenerateWeeklyAssignmentsInput = { week_start: '2024-02-12' };

    const result1 = await generateWeeklyAssignments(input1);
    const result2 = await generateWeeklyAssignments(input2);

    // Both should succeed with different dates
    expect(result1[0].week_start).toEqual(new Date('2024-02-05'));
    expect(result2[0].week_start).toEqual(new Date('2024-02-12'));

    // Verify both are saved in database
    const allAssignments = await db.select()
      .from(assignmentsTable)
      .execute();

    expect(allAssignments).toHaveLength(2);
    const weekStarts = allAssignments.map(a => a.week_start).sort();
    expect(weekStarts).toEqual(['2024-02-05', '2024-02-12']);
  });
});
