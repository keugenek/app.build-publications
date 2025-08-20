import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable } from '../db/schema';
import { type CreateClassInput } from '../schema';
import { createClass } from '../handlers/create_class';
import { eq } from 'drizzle-orm';

// Test input for creating a class
const testInput: CreateClassInput = {
  name: 'Yoga Basics',
  description: 'Introductory yoga class',
  start_time: new Date('2025-09-01T09:00:00Z'),
  end_time: new Date('2025-09-01T10:00:00Z'),
  capacity: 20,
};

describe('createClass handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a class and return the inserted record', async () => {
    const result = await createClass(testInput);

    // Verify returned fields match input and have generated fields
    expect(result.id).toBeGreaterThan(0);
    expect(result.name).toBe(testInput.name);
    expect(result.description).toBe(testInput.description);
    expect(result.start_time).toEqual(testInput.start_time);
    expect(result.end_time).toEqual(testInput.end_time);
    expect(result.capacity).toBe(testInput.capacity);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the class in the database', async () => {
    const result = await createClass(testInput);

    const rows = await db
      .select()
      .from(classesTable)
      .where(eq(classesTable.id, result.id))
      .execute();

    expect(rows).toHaveLength(1);
    const saved = rows[0];
    expect(saved.name).toBe(testInput.name);
    expect(saved.description).toBe(testInput.description);
    expect(saved.start_time).toEqual(testInput.start_time);
    expect(saved.end_time).toEqual(testInput.end_time);
    expect(saved.capacity).toBe(testInput.capacity);
    expect(saved.created_at).toBeInstanceOf(Date);
  });
});
