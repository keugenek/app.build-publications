import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { classesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteClass } from '../handlers/delete_class';
import { type CreateClassInput } from '../schema';

// Helper to insert a class directly
const insertClass = async (input: CreateClassInput) => {
  const result = await db
    .insert(classesTable)
    .values({
      name: input.name,
      description: input.description,
      trainer: input.trainer,
      capacity: input.capacity,
      date: input.date.toISOString().split('T')[0],
      time: input.time,
    })
    .returning()
    .execute();
  return result[0];
};

describe('deleteClass handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing class and return the deleted record', async () => {
    const classInput: CreateClassInput = {
      name: 'Yoga Basics',
      description: 'Introductory yoga class',
      trainer: 'Alice',
      capacity: 20,
      date: new Date('2025-01-01'),
      time: '10:00',
    };

    const inserted = await insertClass(classInput);

    const result = await deleteClass({ id: inserted.id });

    // Verify returned fields match inserted values
    expect(result.id).toBe(inserted.id);
    expect(result.name).toBe(classInput.name);
    expect(result.description).toBe(classInput.description);
    expect(result.trainer).toBe(classInput.trainer);
    expect(result.capacity).toBe(classInput.capacity);
    expect(result.date).toEqual(classInput.date);
    expect(result.time).toBe(classInput.time);

    // Ensure the class is no longer in the database
    const remaining = await db
      .select()
      .from(classesTable)
      .where(eq(classesTable.id, inserted.id))
      .execute();
    expect(remaining).toHaveLength(0);
  });

  it('should throw an error when trying to delete a non‑existent class', async () => {
    await expect(deleteClass({ id: 9999 })).rejects.toThrow(/Class with id 9999 not found/);
  });
});
