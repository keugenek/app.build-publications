import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable } from '../db/schema';
import { type CreateClassInput } from '../schema';
import { createClass } from '../handlers/create_class';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateClassInput = {
  name: 'Yoga Basics',
  description: 'Introductory yoga class',
  trainer: 'Alice',
  capacity: 20,
  date: new Date('2025-01-01'),
  time: '09:00',
};

describe('createClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a class and return the record', async () => {
    const result = await createClass(testInput);
    expect(result.id).toBeDefined();
    expect(result.name).toBe('Yoga Basics');
    expect(result.description).toBe('Introductory yoga class');
    expect(result.trainer).toBe('Alice');
    expect(result.capacity).toBe(20);
    expect(result.date).toEqual(new Date('2025-01-01'));
    expect(result.time).toBe('09:00');
  });

  it('should persist the class in the database', async () => {
    const result = await createClass(testInput);
    const rows = await db.select().from(classesTable).where(eq(classesTable.id, result.id)).execute();
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.name).toBe('Yoga Basics');
    expect(row.description).toBe('Introductory yoga class');
    expect(row.trainer).toBe('Alice');
    expect(row.capacity).toBe(20);
    expect(new Date(row.date)).toEqual(new Date('2025-01-01'));
    expect(row.time.slice(0,5)).toBe('09:00');
  });
});
