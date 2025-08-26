import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable } from '../db/schema';
import { type UpdateClassInput, type CreateClassInput } from '../schema';
import { updateClass } from '../handlers/update_class';
import { eq } from 'drizzle-orm';

// Helper function to create a test class
const createTestClass = async (): Promise<number> => {
  const testClassData: CreateClassInput = {
    name: 'Original Class',
    description: 'Original description',
    instructor_name: 'Original Instructor',
    duration_minutes: 60,
    max_capacity: 20,
    class_type: 'cardio',
    difficulty_level: 'beginner'
  };

  const result = await db.insert(classesTable)
    .values({
      ...testClassData,
      is_active: true
    })
    .returning()
    .execute();

  return result[0].id;
};

describe('updateClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a class with all fields', async () => {
    // Create test class
    const classId = await createTestClass();

    const updateInput: UpdateClassInput = {
      id: classId,
      name: 'Updated Class',
      description: 'Updated description',
      instructor_name: 'Updated Instructor',
      duration_minutes: 90,
      max_capacity: 25,
      class_type: 'strength',
      difficulty_level: 'advanced',
      is_active: false
    };

    const result = await updateClass(updateInput);

    // Verify all fields were updated
    expect(result.id).toEqual(classId);
    expect(result.name).toEqual('Updated Class');
    expect(result.description).toEqual('Updated description');
    expect(result.instructor_name).toEqual('Updated Instructor');
    expect(result.duration_minutes).toEqual(90);
    expect(result.max_capacity).toEqual(25);
    expect(result.class_type).toEqual('strength');
    expect(result.difficulty_level).toEqual('advanced');
    expect(result.is_active).toEqual(false);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    // Create test class
    const classId = await createTestClass();

    // Update only name and capacity
    const updateInput: UpdateClassInput = {
      id: classId,
      name: 'Partially Updated Class',
      max_capacity: 30
    };

    const result = await updateClass(updateInput);

    // Verify only specified fields were updated
    expect(result.name).toEqual('Partially Updated Class');
    expect(result.max_capacity).toEqual(30);
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.instructor_name).toEqual('Original Instructor'); // Should remain unchanged
    expect(result.duration_minutes).toEqual(60); // Should remain unchanged
    expect(result.class_type).toEqual('cardio'); // Should remain unchanged
    expect(result.difficulty_level).toEqual('beginner'); // Should remain unchanged
    expect(result.is_active).toEqual(true); // Should remain unchanged
  });

  it('should update description to null', async () => {
    // Create test class
    const classId = await createTestClass();

    const updateInput: UpdateClassInput = {
      id: classId,
      description: null
    };

    const result = await updateClass(updateInput);

    expect(result.description).toBeNull();
    expect(result.name).toEqual('Original Class'); // Should remain unchanged
  });

  it('should update is_active status', async () => {
    // Create test class
    const classId = await createTestClass();

    const updateInput: UpdateClassInput = {
      id: classId,
      is_active: false
    };

    const result = await updateClass(updateInput);

    expect(result.is_active).toEqual(false);
    expect(result.name).toEqual('Original Class'); // Should remain unchanged
  });

  it('should save changes to database', async () => {
    // Create test class
    const classId = await createTestClass();

    const updateInput: UpdateClassInput = {
      id: classId,
      name: 'Database Updated Class',
      instructor_name: 'Database Instructor'
    };

    await updateClass(updateInput);

    // Verify changes were saved to database
    const classFromDb = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, classId))
      .execute();

    expect(classFromDb).toHaveLength(1);
    expect(classFromDb[0].name).toEqual('Database Updated Class');
    expect(classFromDb[0].instructor_name).toEqual('Database Instructor');
    expect(classFromDb[0].description).toEqual('Original description'); // Unchanged
    expect(classFromDb[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent class', async () => {
    const updateInput: UpdateClassInput = {
      id: 999999, // Non-existent ID
      name: 'Should Fail'
    };

    await expect(updateClass(updateInput)).rejects.toThrow(/Class with id 999999 not found/i);
  });

  it('should handle all class types', async () => {
    // Create test class
    const classId = await createTestClass();

    const classTypes = ['cardio', 'strength', 'yoga', 'pilates', 'crossfit', 'dance', 'martial_arts'] as const;

    for (const classType of classTypes) {
      const updateInput: UpdateClassInput = {
        id: classId,
        class_type: classType
      };

      const result = await updateClass(updateInput);
      expect(result.class_type).toEqual(classType);
    }
  });

  it('should handle all difficulty levels', async () => {
    // Create test class
    const classId = await createTestClass();

    const difficultyLevels = ['beginner', 'intermediate', 'advanced'] as const;

    for (const difficulty of difficultyLevels) {
      const updateInput: UpdateClassInput = {
        id: classId,
        difficulty_level: difficulty
      };

      const result = await updateClass(updateInput);
      expect(result.difficulty_level).toEqual(difficulty);
    }
  });

  it('should update updated_at timestamp', async () => {
    // Create test class
    const classId = await createTestClass();

    // Get original timestamp
    const originalClass = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, classId))
      .execute();

    const originalUpdatedAt = originalClass[0].updated_at;

    // Wait a tiny bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1));

    const updateInput: UpdateClassInput = {
      id: classId,
      name: 'Updated Name'
    };

    const result = await updateClass(updateInput);

    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should preserve created_at timestamp', async () => {
    // Create test class
    const classId = await createTestClass();

    // Get original created_at
    const originalClass = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, classId))
      .execute();

    const originalCreatedAt = originalClass[0].created_at;

    const updateInput: UpdateClassInput = {
      id: classId,
      name: 'Updated Name'
    };

    const result = await updateClass(updateInput);

    expect(result.created_at).toEqual(originalCreatedAt);
  });
});
