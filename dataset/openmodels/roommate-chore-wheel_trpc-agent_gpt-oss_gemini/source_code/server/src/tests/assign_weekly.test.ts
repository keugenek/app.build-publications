import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { usersTable, choresTable, assignmentsTable } from '../db/schema';
import { assignWeekly } from '../handlers/assign_weekly';
import { eq } from 'drizzle-orm';

// Helper to create users
const createUsers = async (count: number) => {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push({ name: `User${i + 1}` });
  }
  const inserted = await db.insert(usersTable).values(users).returning().execute();
  return inserted;
};

// Helper to create chores
const createChores = async (count: number) => {
  const chores = [];
  for (let i = 0; i < count; i++) {
    chores.push({ title: `Chore${i + 1}`, description: null });
  }
  const inserted = await db.insert(choresTable).values(chores).returning().execute();
  return inserted;
};

describe('assignWeekly', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('assigns chores to users in round-robin order', async () => {
    const users = await createUsers(2);
    const chores = await createChores(3);
    const weekStart = new Date('2025-01-06'); // Monday // Monday

    const assignments = await assignWeekly({ week_start: weekStart });

    expect(assignments).toHaveLength(3);
    // Verify round-robin mapping
    expect(assignments[0].chore_id).toBe(chores[0].id);
    expect(assignments[0].user_id).toBe(users[0].id);
    expect(assignments[1].chore_id).toBe(chores[1].id);
    expect(assignments[1].user_id).toBe(users[1].id);
    expect(assignments[2].chore_id).toBe(chores[2].id);
    expect(assignments[2].user_id).toBe(users[0].id);

    // Verify stored in DB
    const dbAssignments = await db.select().from(assignmentsTable).where(eq(assignmentsTable.week_start, weekStart.toISOString().split('T')[0])).execute();
    expect(dbAssignments).toHaveLength(3);
    // Check each matches the returned assignments
    for (const a of assignments) {
      const match = dbAssignments.find((d) => d.id === a.id);
      expect(match).toBeDefined();
      expect(match?.chore_id).toBe(a.chore_id);
      expect(match?.user_id).toBe(a.user_id);
    }
  });

  it('returns empty array when there are no users', async () => {
    await createChores(2);
    const weekStart = new Date();
    const assignments = await assignWeekly({ week_start: weekStart });
    expect(assignments).toEqual([]);
  });

  it('returns empty array when there are no chores', async () => {
    await createUsers(2);
    const weekStart = new Date();
    const assignments = await assignWeekly({ week_start: weekStart });
    expect(assignments).toEqual([]);
  });
});
