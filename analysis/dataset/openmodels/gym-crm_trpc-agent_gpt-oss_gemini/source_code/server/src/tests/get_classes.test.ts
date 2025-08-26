import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { classesTable } from '../db/schema';
import { type Class } from '../schema';
import { getClasses } from '../handlers/get_classes';
import { eq } from 'drizzle-orm';

// Helper to insert a class
const insertTestClass = async (name: string) => {
  const now = new Date();
  const start = new Date(now.getTime() + 60 * 60 * 1000); // +1h
  const end = new Date(start.getTime() + 60 * 60 * 1000); // +2h
  const [result] = await db
    .insert(classesTable)
    .values({
      name,
      description: null,
      start_time: start,
      end_time: end,
      capacity: 20
    })
    .returning()
    .execute();
  return result as Class;
};

describe('getClasses handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no classes exist', async () => {
    const classes = await getClasses();
    expect(classes).toBeArray();
    expect(classes).toHaveLength(0);
  });

  it('should retrieve all classes from the database', async () => {
    const classA = await insertTestClass('Yoga');
    const classB = await insertTestClass('Pilates');

    const classes = await getClasses();

    // Ensure both inserted classes are present
    const ids = classes.map(c => c.id);
    expect(ids).toContain(classA.id);
    expect(ids).toContain(classB.id);

    // Validate fields of first class
    const fetchedA = classes.find(c => c.id === classA.id) as Class;
    expect(fetchedA.name).toBe('Yoga');
    expect(fetchedA.capacity).toBe(20);
    expect(fetchedA.start_time).toBeInstanceOf(Date);
    expect(fetchedA.end_time).toBeInstanceOf(Date);
    expect(fetchedA.created_at).toBeInstanceOf(Date);
  });
});
