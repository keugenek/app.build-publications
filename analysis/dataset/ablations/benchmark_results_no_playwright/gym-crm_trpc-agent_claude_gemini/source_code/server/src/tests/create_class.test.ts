import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable } from '../db/schema';
import { type CreateClassInput } from '../schema';
import { createClass } from '../handlers/create_class';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateClassInput = {
  name: 'Morning Yoga',
  description: 'Relaxing morning yoga class for all levels',
  instructor_name: 'Sarah Johnson',
  duration_minutes: 60,
  max_capacity: 20,
  class_type: 'yoga',
  difficulty_level: 'beginner'
};

// Test input with minimal required fields (null description)
const minimalInput: CreateClassInput = {
  name: 'HIIT Cardio',
  description: null,
  instructor_name: 'Mike Thompson',
  duration_minutes: 45,
  max_capacity: 15,
  class_type: 'cardio',
  difficulty_level: 'intermediate'
};

describe('createClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a class with all fields', async () => {
    const result = await createClass(testInput);

    // Verify all field values
    expect(result.name).toEqual('Morning Yoga');
    expect(result.description).toEqual('Relaxing morning yoga class for all levels');
    expect(result.instructor_name).toEqual('Sarah Johnson');
    expect(result.duration_minutes).toEqual(60);
    expect(result.max_capacity).toEqual(20);
    expect(result.class_type).toEqual('yoga');
    expect(result.difficulty_level).toEqual('beginner');
    expect(result.is_active).toEqual(true); // Default value
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a class with null description', async () => {
    const result = await createClass(minimalInput);

    expect(result.name).toEqual('HIIT Cardio');
    expect(result.description).toBeNull();
    expect(result.instructor_name).toEqual('Mike Thompson');
    expect(result.duration_minutes).toEqual(45);
    expect(result.max_capacity).toEqual(15);
    expect(result.class_type).toEqual('cardio');
    expect(result.difficulty_level).toEqual('intermediate');
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
  });

  it('should save class to database', async () => {
    const result = await createClass(testInput);

    // Query database to verify persistence
    const classes = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, result.id))
      .execute();

    expect(classes).toHaveLength(1);
    expect(classes[0].name).toEqual('Morning Yoga');
    expect(classes[0].description).toEqual('Relaxing morning yoga class for all levels');
    expect(classes[0].instructor_name).toEqual('Sarah Johnson');
    expect(classes[0].duration_minutes).toEqual(60);
    expect(classes[0].max_capacity).toEqual(20);
    expect(classes[0].class_type).toEqual('yoga');
    expect(classes[0].difficulty_level).toEqual('beginner');
    expect(classes[0].is_active).toEqual(true);
    expect(classes[0].created_at).toBeInstanceOf(Date);
    expect(classes[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle all class types correctly', async () => {
    const classTypes = ['cardio', 'strength', 'yoga', 'pilates', 'crossfit', 'dance', 'martial_arts'] as const;
    
    for (const classType of classTypes) {
      const input: CreateClassInput = {
        name: `Test ${classType} Class`,
        description: `A ${classType} class`,
        instructor_name: 'Test Instructor',
        duration_minutes: 60,
        max_capacity: 20,
        class_type: classType,
        difficulty_level: 'intermediate'
      };

      const result = await createClass(input);
      expect(result.class_type).toEqual(classType);
      expect(result.name).toEqual(`Test ${classType} Class`);
    }
  });

  it('should handle all difficulty levels correctly', async () => {
    const difficultyLevels = ['beginner', 'intermediate', 'advanced'] as const;
    
    for (const level of difficultyLevels) {
      const input: CreateClassInput = {
        name: `${level} Class`,
        description: `A ${level} difficulty class`,
        instructor_name: 'Test Instructor',
        duration_minutes: 45,
        max_capacity: 25,
        class_type: 'strength',
        difficulty_level: level
      };

      const result = await createClass(input);
      expect(result.difficulty_level).toEqual(level);
      expect(result.name).toEqual(`${level} Class`);
    }
  });

  it('should create multiple classes with unique IDs', async () => {
    const input1: CreateClassInput = {
      name: 'Yoga Class 1',
      description: 'First yoga class',
      instructor_name: 'Instructor 1',
      duration_minutes: 60,
      max_capacity: 20,
      class_type: 'yoga',
      difficulty_level: 'beginner'
    };

    const input2: CreateClassInput = {
      name: 'Yoga Class 2',
      description: 'Second yoga class',
      instructor_name: 'Instructor 2',
      duration_minutes: 90,
      max_capacity: 15,
      class_type: 'yoga',
      difficulty_level: 'advanced'
    };

    const result1 = await createClass(input1);
    const result2 = await createClass(input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.name).toEqual('Yoga Class 1');
    expect(result2.name).toEqual('Yoga Class 2');
    expect(result1.instructor_name).toEqual('Instructor 1');
    expect(result2.instructor_name).toEqual('Instructor 2');
  });

  it('should set created_at and updated_at timestamps', async () => {
    const beforeCreate = new Date();
    const result = await createClass(testInput);
    const afterCreate = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
  });
});
