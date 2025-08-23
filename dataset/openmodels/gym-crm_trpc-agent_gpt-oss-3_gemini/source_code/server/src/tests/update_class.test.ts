import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { classesTable } from '../db/schema';
import { type CreateClassInput, type UpdateClassInput } from '../schema';
import { updateClass } from '../handlers/update_class';
import { eq } from 'drizzle-orm';

// Helper to create a class directly in DB for testing
const createTestClass = async (input: CreateClassInput) => {
  const result = await db
    .insert(classesTable)
    .values({
      name: input.name,
      description: input.description,
      capacity: input.capacity,
      instructor: input.instructor,
      scheduled_at: input.scheduled_at,
    })
    .returning()
    .execute();
  return result[0];
};

const initialClass: CreateClassInput = {
  name: 'Yoga Basics',
  description: 'Introductory yoga class',
  capacity: 20,
  instructor: 'Alice',
  scheduled_at: new Date('2025-01-01T10:00:00Z'),
};

describe('updateClass handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('updates provided fields and returns the updated class', async () => {
    const created = await createTestClass(initialClass);

    const updateInput: UpdateClassInput = {
      id: created.id,
      name: 'Advanced Yoga',
      capacity: 25,
    };

    const updated = await updateClass(updateInput);

    // Verify returned object reflects changes
    expect(updated.id).toBe(created.id);
    expect(updated.name).toBe('Advanced Yoga');
    expect(updated.capacity).toBe(25);
    // Unchanged fields should remain the same
    expect(updated.description).toBe(initialClass.description);
    expect(updated.instructor).toBe(initialClass.instructor);
    expect(updated.scheduled_at.getTime()).toBe(initialClass.scheduled_at.getTime());
    expect(updated.created_at).toBeInstanceOf(Date);

    // Verify database row is updated
    const dbRow = await db
      .select()
      .from(classesTable)
      .where(eq(classesTable.id, created.id))
      .execute();

    expect(dbRow).toHaveLength(1);
    const row = dbRow[0];
    expect(row.name).toBe('Advanced Yoga');
    expect(row.capacity).toBe(25);
    // Other columns unchanged
    expect(row.description).toBe(initialClass.description);
    expect(row.instructor).toBe(initialClass.instructor);
  });

  it('throws an error when trying to update a non‑existent class', async () => {
    const fakeUpdate: UpdateClassInput = {
      id: 9999,
      name: 'Ghost Class',
    };

    await expect(updateClass(fakeUpdate)).rejects.toThrow(/not found/i);
  });
});
