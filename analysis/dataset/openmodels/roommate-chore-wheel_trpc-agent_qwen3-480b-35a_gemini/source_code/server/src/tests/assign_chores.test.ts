import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable, choresTable, weeklyAssignmentsTable } from '../db/schema';
import { assignChores } from '../handlers/assign_chores';
import { eq } from 'drizzle-orm';

describe('assignChores', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create new assignments when none exist for the week', async () => {
    // Create test members
    const [member1] = await db.insert(membersTable)
      .values({ name: 'Alice' })
      .returning()
      .execute();
      
    const [member2] = await db.insert(membersTable)
      .values({ name: 'Bob' })
      .returning()
      .execute();

    // Create test chores
    const [chore1] = await db.insert(choresTable)
      .values({ name: 'Clean kitchen', description: 'Wash dishes and wipe counters' })
      .returning()
      .execute();
      
    const [chore2] = await db.insert(choresTable)
      .values({ name: 'Take out trash', description: 'Empty all trash bins' })
      .returning()
      .execute();

    // Assign chores
    const assignments = await assignChores();

    // Validate assignments
    expect(assignments).toHaveLength(2);
    expect(assignments[0].week_start_date).toBeInstanceOf(Date);
    expect(assignments[1].week_start_date).toBeInstanceOf(Date);
    
    // Check that assignments were saved to database
    const savedAssignments = await db.select()
      .from(weeklyAssignmentsTable)
      .execute();
      
    expect(savedAssignments).toHaveLength(2);
    
    // Verify assignments are linked to existing members and chores
    for (const assignment of assignments) {
      expect([member1.id, member2.id]).toContain(assignment.member_id);
      expect([chore1.id, chore2.id]).toContain(assignment.chore_id);
      expect(assignment.is_completed).toBe(false);
      expect(assignment.completed_at).toBeNull();
    }
  });

  it('should return existing assignments if they already exist for the week', async () => {
    // Create test members
    const [member] = await db.insert(membersTable)
      .values({ name: 'Alice' })
      .returning()
      .execute();

    // Create test chores
    const [chore] = await db.insert(choresTable)
      .values({ name: 'Clean kitchen' })
      .returning()
      .execute();
      
    // Create existing assignment for this week
    const weekStartDate = getMostRecentMonday();
    const [existingAssignment] = await db.insert(weeklyAssignmentsTable)
      .values({
        member_id: member.id,
        chore_id: chore.id,
        week_start_date: weekStartDate, // String in YYYY-MM-DD format
        is_completed: true,
        completed_at: new Date()
      })
      .returning()
      .execute();

    // Assign chores again
    const assignments = await assignChores();
    
    // Should return the existing assignment
    expect(assignments).toHaveLength(1);
    expect(assignments[0].id).toBe(existingAssignment.id);
    expect(assignments[0].is_completed).toBe(true);
  });

  it('should handle case with no members or chores', async () => {
    // Assign chores when there are no members or chores
    const assignments = await assignChores();
    
    // Should return empty array
    expect(assignments).toHaveLength(0);
  });

  it('should properly distribute chores among members', async () => {
    // Create more chores than members to test distribution
    const members = [];
    for (let i = 0; i < 2; i++) {
      const [member] = await db.insert(membersTable)
        .values({ name: `Member ${i + 1}` })
        .returning()
        .execute();
      members.push(member);
    }
    
    const chores = [];
    for (let i = 0; i < 5; i++) {
      const [chore] = await db.insert(choresTable)
        .values({ name: `Chore ${i + 1}` })
        .returning()
        .execute();
      chores.push(chore);
    }

    // Assign chores
    const assignments = await assignChores();
    
    // Should have created assignments for all chores
    expect(assignments).toHaveLength(5);
    
    // Count assignments per member to ensure fair distribution
    const assignmentCount: Record<number, number> = {};
    assignments.forEach(assignment => {
      assignmentCount[assignment.member_id] = (assignmentCount[assignment.member_id] || 0) + 1;
    });
    
    // Both members should have been assigned chores
    expect(Object.keys(assignmentCount)).toHaveLength(2);
  });
});

// Helper function to get the most recent Monday as a string (YYYY-MM-DD)
const getMostRecentMonday = (): string => {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when Sunday
  const monday = new Date(today.setDate(diff));
  monday.setHours(0, 0, 0, 0); // Reset time to midnight
  return monday.toISOString().split('T')[0]; // Return as ISO date string (YYYY-MM-DD)
};
