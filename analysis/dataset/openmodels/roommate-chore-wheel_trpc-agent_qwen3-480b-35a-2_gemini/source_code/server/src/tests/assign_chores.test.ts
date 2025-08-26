import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, choresTable, weeklyChoreAssignmentsTable } from '../db/schema';
import { assignChores } from '../handlers/assign_chores';
import { eq } from 'drizzle-orm';

describe('assignChores', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test users
    await db.insert(usersTable).values([
      { name: 'Alice' },
      { name: 'Bob' },
      { name: 'Charlie' }
    ]).execute();
    
    // Create test chores
    await db.insert(choresTable).values([
      { name: 'Wash dishes', description: 'Clean all dishes' },
      { name: 'Vacuum', description: 'Vacuum all rooms' },
      { name: 'Take out trash', description: 'Take out all trash bags' }
    ]).execute();
  });
  
  afterEach(resetDB);

  it('should create chore assignments for the week', async () => {
    const weekStartDate = new Date('2023-01-01');
    
    const result = await assignChores({ week_start_date: weekStartDate });
    
    // Should have created assignments for all chores
    expect(result).toHaveLength(3);
    
    // Each assignment should have the correct week start date
    result.forEach(assignment => {
      expect(assignment.week_start_date).toEqual(weekStartDate);
      expect(assignment.is_completed).toBe(false);
      expect(assignment.assigned_at).toBeInstanceOf(Date);
      expect(assignment.completed_at).toBeNull();
    });
    
    // All chores should be assigned
    const choreIds = result.map(a => a.chore_id).sort();
    expect(choreIds).toEqual([1, 2, 3]);
    
    // Users should be assigned (exact users may vary due to randomization)
    const userIds = result.map(a => a.user_id);
    userIds.forEach(id => {
      expect([1, 2, 3]).toContain(id);
    });
  });

  it('should not create duplicate assignments for the same week', async () => {
    const weekStartDate = new Date('2023-01-01');
    
    // First assignment
    const firstResult = await assignChores({ week_start_date: weekStartDate });
    
    // Second assignment for the same week
    const secondResult = await assignChores({ week_start_date: weekStartDate });
    
    // Should return the same assignments
    expect(secondResult).toHaveLength(firstResult.length);
    
    const firstIds = firstResult.map(a => a.id).sort();
    const secondIds = secondResult.map(a => a.id).sort();
    expect(secondIds).toEqual(firstIds);
  });

  it('should save assignments to database', async () => {
    const weekStartDate = new Date('2023-01-01');
    const formattedDate = weekStartDate.toISOString().split('T')[0];
    
    await assignChores({ week_start_date: weekStartDate });
    
    // Query database directly
    const assignments = await db.select()
      .from(weeklyChoreAssignmentsTable)
      .where(eq(weeklyChoreAssignmentsTable.week_start_date, formattedDate))
      .execute();
    
    expect(assignments).toHaveLength(3);
    
    // Verify data integrity
    assignments.forEach(assignment => {
      expect(assignment.week_start_date).toEqual(formattedDate);
      expect(assignment.is_completed).toBe(false);
    });
  });

  it('should handle empty users or chores gracefully', async () => {
    // Reset and recreate empty DB
    await resetDB();
    await createDB();
    
    const weekStartDate = new Date('2023-01-01');
    
    const result = await assignChores({ week_start_date: weekStartDate });
    
    expect(result).toHaveLength(0);
  });
});
