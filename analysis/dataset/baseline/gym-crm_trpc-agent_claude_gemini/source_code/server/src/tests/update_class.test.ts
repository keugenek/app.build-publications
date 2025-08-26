import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable } from '../db/schema';
import { type CreateClassInput, type UpdateClassInput } from '../schema';
import { updateClass } from '../handlers/update_class';
import { eq } from 'drizzle-orm';

// Helper to create a test class
const createTestClass = async (): Promise<number> => {
  const testClass: CreateClassInput = {
    name: 'Original Yoga Class',
    description: 'Original description',
    class_type: 'yoga',
    instructor_name: 'Original Instructor',
    max_capacity: 20,
    duration_minutes: 60,
    price: 25.00
  };

  const result = await db.insert(classesTable)
    .values({
      ...testClass,
      price: testClass.price.toString()
    })
    .returning()
    .execute();

  return result[0].id;
};

describe('updateClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a class with all fields', async () => {
    const classId = await createTestClass();

    const updateInput: UpdateClassInput = {
      id: classId,
      name: 'Updated Yoga Class',
      description: 'Updated description',
      class_type: 'pilates',
      instructor_name: 'Updated Instructor',
      max_capacity: 15,
      duration_minutes: 90,
      price: 30.00,
      is_active: false
    };

    const result = await updateClass(updateInput);

    // Verify all fields were updated
    expect(result.id).toEqual(classId);
    expect(result.name).toEqual('Updated Yoga Class');
    expect(result.description).toEqual('Updated description');
    expect(result.class_type).toEqual('pilates');
    expect(result.instructor_name).toEqual('Updated Instructor');
    expect(result.max_capacity).toEqual(15);
    expect(result.duration_minutes).toEqual(90);
    expect(result.price).toEqual(30.00);
    expect(typeof result.price).toEqual('number');
    expect(result.is_active).toEqual(false);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    const classId = await createTestClass();

    const updateInput: UpdateClassInput = {
      id: classId,
      name: 'Partially Updated Class',
      price: 35.50
    };

    const result = await updateClass(updateInput);

    // Verify only specified fields were updated
    expect(result.name).toEqual('Partially Updated Class');
    expect(result.price).toEqual(35.50);
    expect(typeof result.price).toEqual('number');
    
    // Verify other fields remain unchanged
    expect(result.description).toEqual('Original description');
    expect(result.class_type).toEqual('yoga');
    expect(result.instructor_name).toEqual('Original Instructor');
    expect(result.max_capacity).toEqual(20);
    expect(result.duration_minutes).toEqual(60);
    expect(result.is_active).toEqual(true);
  });

  it('should handle nullable description field', async () => {
    const classId = await createTestClass();

    const updateInput: UpdateClassInput = {
      id: classId,
      description: null
    };

    const result = await updateClass(updateInput);

    expect(result.description).toBeNull();
    expect(result.name).toEqual('Original Yoga Class'); // Other fields unchanged
  });

  it('should update is_active status', async () => {
    const classId = await createTestClass();

    const updateInput: UpdateClassInput = {
      id: classId,
      is_active: false
    };

    const result = await updateClass(updateInput);

    expect(result.is_active).toEqual(false);
    expect(result.name).toEqual('Original Yoga Class'); // Other fields unchanged
  });

  it('should save updated class to database', async () => {
    const classId = await createTestClass();

    const updateInput: UpdateClassInput = {
      id: classId,
      name: 'Database Updated Class',
      price: 40.00,
      max_capacity: 25
    };

    await updateClass(updateInput);

    // Verify changes were persisted to database
    const classes = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, classId))
      .execute();

    expect(classes).toHaveLength(1);
    const dbClass = classes[0];
    expect(dbClass.name).toEqual('Database Updated Class');
    expect(parseFloat(dbClass.price)).toEqual(40.00);
    expect(dbClass.max_capacity).toEqual(25);
    expect(dbClass.updated_at).toBeInstanceOf(Date);
  });

  it('should update class with different class types', async () => {
    const classId = await createTestClass();

    // Test updating to different class types
    const classTypes = ['pilates', 'crossfit', 'cardio', 'strength', 'zumba', 'spinning', 'hiit'] as const;

    for (const classType of classTypes) {
      const updateInput: UpdateClassInput = {
        id: classId,
        class_type: classType
      };

      const result = await updateClass(updateInput);
      expect(result.class_type).toEqual(classType);
    }
  });

  it('should handle price precision correctly', async () => {
    const classId = await createTestClass();

    const updateInput: UpdateClassInput = {
      id: classId,
      price: 29.99
    };

    const result = await updateClass(updateInput);

    expect(result.price).toEqual(29.99);
    expect(typeof result.price).toEqual('number');

    // Verify precision in database
    const classes = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, classId))
      .execute();

    expect(parseFloat(classes[0].price)).toEqual(29.99);
  });

  it('should throw error for non-existent class', async () => {
    const updateInput: UpdateClassInput = {
      id: 99999,
      name: 'Non-existent Class'
    };

    await expect(updateClass(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should update updated_at timestamp', async () => {
    const classId = await createTestClass();

    // Get original timestamp
    const originalClass = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, classId))
      .execute();

    const originalUpdatedAt = originalClass[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateClassInput = {
      id: classId,
      name: 'Timestamp Test'
    };

    const result = await updateClass(updateInput);

    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});
