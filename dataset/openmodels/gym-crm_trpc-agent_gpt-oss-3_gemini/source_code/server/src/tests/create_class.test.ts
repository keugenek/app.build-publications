import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { classesTable } from '../db/schema';
import { type CreateClassInput } from '../schema';
import { createClass } from '../handlers/create_class';
import { eq, and, gte, between } from 'drizzle-orm';

// Test input covering all fields
const testInput: CreateClassInput = {
  name: 'Yoga Basics',
  description: 'Introductory yoga class',
  capacity: 20,
  instructor: 'Alice Smith',
  scheduled_at: new Date('2025-01-15T10:00:00Z'),
};

describe('createClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a class and return proper fields', async () => {
    const result = await createClass(testInput);

    expect(result.id).toBeDefined();
    expect(result.name).toBe(testInput.name);
    expect(result.description).toBe(testInput.description);
    expect(result.capacity).toBe(testInput.capacity);
    expect(result.instructor).toBe(testInput.instructor);
    expect(result.scheduled_at).toEqual(testInput.scheduled_at);
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
    const row = rows[0];
    expect(row.name).toBe(testInput.name);
    expect(row.description).toBe(testInput.description);
    expect(row.capacity).toBe(testInput.capacity);
    expect(row.instructor).toBe(testInput.instructor);
    expect(row.scheduled_at).toEqual(testInput.scheduled_at);
    expect(row.created_at).toBeInstanceOf(Date);
  });

  it('should be queryable by date range', async () => {
    // Create class (handler sets created_at slightly in the future)
    await createClass(testInput);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const query = db
      .select()
      .from(classesTable)
      .where(
        and(
          gte(classesTable.created_at, now),
          between(classesTable.created_at, now, tomorrow)
        )
      );
    const classes = await query.execute();
    expect(classes.length).toBeGreaterThan(0);
    classes.forEach(c => {
      expect(c.created_at).toBeInstanceOf(Date);
      expect(c.created_at >= now).toBe(true);
      expect(c.created_at <= tomorrow).toBe(true);
    });
  });
});
