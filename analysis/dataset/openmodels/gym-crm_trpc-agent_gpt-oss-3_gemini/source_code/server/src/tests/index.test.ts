import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { classesTable } from '../db/schema';
import { getClasses } from '../handlers';
import { type Class } from '../schema';

// Helper to create a class record
const createTestClass = async (overrides?: Partial<Class>) => {
  const base = {
    name: 'Yoga Basics',
    description: 'Introductory yoga class',
    capacity: 20,
    instructor: 'Alice',
    scheduled_at: new Date('2024-01-01T10:00:00Z'),
  };
  const data = { ...base, ...overrides };
  const result = await db.insert(classesTable)
    .values({
      name: data.name,
      description: data.description,
      capacity: data.capacity,
      instructor: data.instructor,
      scheduled_at: data.scheduled_at,
    })
    .returning()
    .execute();
  return result[0];
};

describe('getClasses handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no classes exist', async () => {
    const classes = await getClasses();
    expect(classes).toEqual([]);
  });

  it('should fetch all classes from the database', async () => {
    // Insert two test classes
    const classA = await createTestClass({ name: 'Pilates', instructor: 'Bob' });
    const classB = await createTestClass({ name: 'Spin', instructor: 'Carol' });

    const classes = await getClasses();
    // Expect both records to be returned
    expect(classes).toHaveLength(2);
    const names = classes.map(c => c.name);
    expect(names).toContain('Pilates');
    expect(names).toContain('Spin');

    // Verify fields are correctly typed
    const fetchedA = classes.find(c => c.id === classA.id)!;
    expect(fetchedA.instructor).toBe('Bob');
    expect(fetchedA.capacity).toBe(20);
    expect(fetchedA.scheduled_at).toBeInstanceOf(Date);
    expect(fetchedA.created_at).toBeInstanceOf(Date);
  });
});
