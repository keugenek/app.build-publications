import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { habitsTable } from '../db/schema';
import { type CreateHabitInput } from '../schema';
import { createHabit } from '../handlers/create_habit';
import { eq } from 'drizzle-orm';

// Test inputs
const habitWithDescription: CreateHabitInput = {
  name: 'Read a book',
  description: 'Read at least 30 pages',
};

const habitWithoutDescription: CreateHabitInput = {
  name: 'Morning run',
  // description omitted (undefined)
};

describe('createHabit handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('creates a habit with description', async () => {
    const result = await createHabit(habitWithDescription);

    expect(result.id).toBeDefined();
    expect(result.name).toBe(habitWithDescription.name);
    expect(result.description).toBe(habitWithDescription.description!);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('creates a habit without description (null)', async () => {
    const result = await createHabit(habitWithoutDescription);

    expect(result.id).toBeDefined();
    expect(result.name).toBe(habitWithoutDescription.name);
    // When description is omitted, DB should store null
    expect(result.description).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('persists habit in database', async () => {
    const created = await createHabit(habitWithDescription);

    const rows = await db
      .select()
      .from(habitsTable)
      .where(eq(habitsTable.id, created.id))
      .execute();

    expect(rows).toHaveLength(1);
    const dbHabit = rows[0];
    expect(dbHabit.name).toBe(habitWithDescription.name);
    expect(dbHabit.description).toBe(habitWithDescription.description!);
    expect(dbHabit.created_at).toBeInstanceOf(Date);
  });
});
