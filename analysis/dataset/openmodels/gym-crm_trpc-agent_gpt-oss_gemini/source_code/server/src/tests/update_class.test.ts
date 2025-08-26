import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable } from '../db/schema';
import { type UpdateClassInput, type Class } from '../schema';
import { updateClass } from '../handlers/update_class';
import { eq } from 'drizzle-orm';

// Helper to insert a class directly into the DB
const insertClass = async (data: Omit<Class, 'id' | 'created_at'>) => {
  const result = await db
    .insert(classesTable)
    .values({
      name: data.name,
      description: data.description,
      start_time: data.start_time,
      end_time: data.end_time,
      capacity: data.capacity,
    })
    .returning()
    .execute();
  return result[0];
};

describe('updateClass handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('updates provided fields and leaves others unchanged', async () => {
    // Insert initial class
    const original = await insertClass({
      name: 'Yoga Basics',
      description: 'Introductory yoga class',
      start_time: new Date('2025-09-01T09:00:00Z'),
      end_time: new Date('2025-09-01T10:00:00Z'),
      capacity: 20,
    });

    const updateInput: UpdateClassInput = {
      id: original.id,
      name: 'Advanced Yoga', // change name
      capacity: 25, // change capacity
      // other fields omitted
    };

    const updated = await updateClass(updateInput);

    // Verify returned object reflects updates
    expect(updated.id).toBe(original.id);
    expect(updated.name).toBe('Advanced Yoga');
    expect(updated.capacity).toBe(25);
    // unchanged fields should remain the same
    expect(updated.description).toBe(original.description);
    expect(updated.start_time.getTime()).toBe(original.start_time.getTime());
    expect(updated.end_time.getTime()).toBe(original.end_time.getTime());

    // Verify DB state matches
    const dbRow = await db
      .select()
      .from(classesTable)
      .where(eq(classesTable.id, original.id))
      .execute();
    expect(dbRow).toHaveLength(1);
    const row = dbRow[0];
    expect(row.name).toBe('Advanced Yoga');
    expect(row.capacity).toBe(25);
    expect(row.description).toBe(original.description);
  });
});
