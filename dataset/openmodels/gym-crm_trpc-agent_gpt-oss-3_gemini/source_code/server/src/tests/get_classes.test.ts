import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { classesTable } from '../db/schema';
import { type Class } from '../schema';
import { getClasses } from '../handlers/get_classes';
import { eq } from 'drizzle-orm';

/**
 * Helper to insert a class directly via the DB.
 */
const insertClass = async (input: Omit<Class, 'id' | 'created_at'>) => {
  const [row] = await db
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
  return row;
};

describe('getClasses handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no classes exist', async () => {
    const result = await getClasses();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('should return all classes from the database', async () => {
    // Insert two classes
    const class1 = await insertClass({
      name: 'Yoga Basics',
      description: 'Introductory yoga class',
      capacity: 20,
      instructor: 'Alice',
      scheduled_at: new Date('2024-01-01T10:00:00Z'),
    });
    const class2 = await insertClass({
      name: 'Advanced Spin',
      description: null,
      capacity: 15,
      instructor: 'Bob',
      scheduled_at: new Date('2024-01-02T18:30:00Z'),
    });

    const result = await getClasses();

    // Expect two classes returned
    expect(result).toHaveLength(2);

    // Find by name for clarity
    const fetched1 = result.find((c) => c.name === 'Yoga Basics');
    const fetched2 = result.find((c) => c.name === 'Advanced Spin');

    expect(fetched1).toBeDefined();
    expect(fetched2).toBeDefined();

    // Validate fields for class1
    expect(fetched1?.description).toBe('Introductory yoga class');
    expect(fetched1?.capacity).toBe(20);
    expect(fetched1?.instructor).toBe('Alice');
    expect(fetched1?.scheduled_at).toEqual(new Date('2024-01-01T10:00:00Z'));
    expect(fetched1?.id).toBeDefined();
    expect(fetched1?.created_at).toBeInstanceOf(Date);

    // Validate fields for class2 (null description)
    expect(fetched2?.description).toBeNull();
    expect(fetched2?.capacity).toBe(15);
    expect(fetched2?.instructor).toBe('Bob');
    expect(fetched2?.scheduled_at).toEqual(new Date('2024-01-02T18:30:00Z'));
    expect(fetched2?.id).toBeDefined();
    expect(fetched2?.created_at).toBeInstanceOf(Date);
  });
});
