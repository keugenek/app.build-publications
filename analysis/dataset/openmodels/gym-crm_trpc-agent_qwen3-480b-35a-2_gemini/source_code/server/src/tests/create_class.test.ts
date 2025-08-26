import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable } from '../db/schema';
import { type CreateClassInput } from '../schema';
import { createClass } from '../handlers/create_class';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateClassInput = {
  name: 'Yoga Basics',
  description: 'A beginner\'s guide to yoga',
  instructor: 'Jane Smith',
  date: new Date('2023-12-15T00:00:00Z'),
  time: '10:00 AM',
  capacity: 20
};

describe('createClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a class', async () => {
    const result = await createClass(testInput);

    // Basic field validation
    expect(result.name).toEqual('Yoga Basics');
    expect(result.description).toEqual(testInput.description);
    expect(result.instructor).toEqual('Jane Smith');
    expect(result.date).toEqual(testInput.date);
    expect(result.time).toEqual('10:00 AM');
    expect(result.capacity).toEqual(20);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save class to database', async () => {
    const result = await createClass(testInput);

    // Query using proper drizzle syntax
    const classes = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, result.id))
      .execute();

    expect(classes).toHaveLength(1);
    expect(classes[0].name).toEqual('Yoga Basics');
    expect(classes[0].description).toEqual(testInput.description);
    expect(classes[0].instructor).toEqual('Jane Smith');
    expect(classes[0].date).toEqual(testInput.date);
    expect(classes[0].time).toEqual('10:00 AM');
    expect(classes[0].capacity).toEqual(20);
    expect(classes[0].created_at).toBeInstanceOf(Date);
  });
});
