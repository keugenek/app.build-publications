import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { classesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteClass } from '../handlers/delete_class';

// Helper to create a class directly in DB
const createClassInDB = async () => {
  const now = new Date();
  const result = await db
    .insert(classesTable)
    .values({
      name: 'Yoga Basics',
      description: 'Introductory yoga class',
      capacity: 20,
      instructor: 'Alice',
      scheduled_at: now,
    })
    .returning()
    .execute();
  return result[0];
};

describe('deleteClass handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing class and return its data', async () => {
    const created = await createClassInDB();
    const deleted = await deleteClass(created.id);

    // Verify returned data matches inserted record
    expect(deleted.id).toBe(created.id);
    expect(deleted.name).toBe(created.name);
    expect(deleted.description).toBe(created.description);
    expect(deleted.capacity).toBe(created.capacity);
    expect(deleted.instructor).toBe(created.instructor);
    expect(deleted.scheduled_at.getTime()).toBe(created.scheduled_at.getTime());
    expect(deleted.created_at.getTime()).toBe(created.created_at.getTime());

    // Verify the class no longer exists in DB
    const remaining = await db
      .select()
      .from(classesTable)
      .where(eq(classesTable.id, created.id))
      .execute();
    expect(remaining).toHaveLength(0);
  });

  it('should throw an error when trying to delete a non‑existent class', async () => {
    await expect(deleteClass(9999)).rejects.toThrow(/not found/i);
  });
});
