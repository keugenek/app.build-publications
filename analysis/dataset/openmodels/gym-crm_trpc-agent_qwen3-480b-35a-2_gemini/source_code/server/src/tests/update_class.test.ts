import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable } from '../db/schema';
import { type CreateClassInput, type UpdateClassInput } from '../schema';
import { updateClass } from '../handlers/update_class';
import { eq } from 'drizzle-orm';

// Test input for creating a class
const createClassInput: CreateClassInput = {
  name: 'Yoga Class',
  description: 'A relaxing yoga session',
  instructor: 'Jane Smith',
  date: new Date('2023-12-01T10:00:00Z'),
  time: '10:00 AM',
  capacity: 20
};

// Test input for updating a class
const updateClassInput: UpdateClassInput = {
  id: 1,
  name: 'Advanced Yoga Class',
  description: 'An advanced yoga session',
  instructor: 'John Doe',
  date: new Date('2023-12-02T11:00:00Z'),
  time: '11:00 AM',
  capacity: 15
};

describe('updateClass', () => {
  beforeEach(async () => {
    await createDB();
    // Create a test class to update
    await db.insert(classesTable).values(createClassInput).execute();
  });
  
  afterEach(resetDB);

  it('should update a class with all fields provided', async () => {
    const result = await updateClass(updateClassInput);

    // Field validation
    expect(result.id).toEqual(1);
    expect(result.name).toEqual('Advanced Yoga Class');
    expect(result.description).toEqual('An advanced yoga session');
    expect(result.instructor).toEqual('John Doe');
    expect(result.date).toEqual(new Date('2023-12-02T11:00:00Z'));
    expect(result.time).toEqual('11:00 AM');
    expect(result.capacity).toEqual(15);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    // Update only name and capacity
    const partialUpdate: UpdateClassInput = {
      id: 1,
      name: 'Beginner Yoga',
      capacity: 25
    };

    const result = await updateClass(partialUpdate);

    // Updated fields should reflect new values
    expect(result.name).toEqual('Beginner Yoga');
    expect(result.capacity).toEqual(25);
    
    // Other fields should retain original values
    expect(result.description).toEqual('A relaxing yoga session');
    expect(result.instructor).toEqual('Jane Smith');
    expect(result.time).toEqual('10:00 AM');
  });

  it('should save updated class to database', async () => {
    await updateClass(updateClassInput);

    // Query using proper drizzle syntax
    const classes = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, 1))
      .execute();

    expect(classes).toHaveLength(1);
    expect(classes[0].name).toEqual('Advanced Yoga Class');
    expect(classes[0].description).toEqual('An advanced yoga session');
    expect(classes[0].instructor).toEqual('John Doe');
    expect(classes[0].time).toEqual('11:00 AM');
    expect(classes[0].capacity).toEqual(15);
  });

  it('should throw an error when updating a non-existent class', async () => {
    const invalidUpdate: UpdateClassInput = {
      id: 999,
      name: 'Non-existent Class'
    };

    await expect(updateClass(invalidUpdate)).rejects.toThrow(/Class with id 999 not found/);
  });
});
