import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable } from '../db/schema';
import { type CreateClassInput } from '../schema';
import { getClasses, type GetClassesInput } from '../handlers/get_classes';
import { eq } from 'drizzle-orm';

// Test data for classes
const testClasses: CreateClassInput[] = [
  {
    name: 'Morning Yoga',
    description: 'Relaxing yoga session to start your day',
    instructor_name: 'Sarah Johnson',
    duration_minutes: 60,
    max_capacity: 20,
    class_type: 'yoga',
    difficulty_level: 'beginner'
  },
  {
    name: 'Advanced Crossfit',
    description: 'High-intensity crossfit workout',
    instructor_name: 'Mike Wilson',
    duration_minutes: 45,
    max_capacity: 15,
    class_type: 'crossfit',
    difficulty_level: 'advanced'
  },
  {
    name: 'Strength Training 101',
    description: 'Basic strength training for beginners',
    instructor_name: 'Sarah Johnson',
    duration_minutes: 50,
    max_capacity: 12,
    class_type: 'strength',
    difficulty_level: 'beginner'
  },
  {
    name: 'Cardio Blast',
    description: 'High-energy cardio workout',
    instructor_name: 'Alex Brown',
    duration_minutes: 30,
    max_capacity: 25,
    class_type: 'cardio',
    difficulty_level: 'intermediate'
  }
];

describe('getClasses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get all active classes by default', async () => {
    // Insert test classes
    await db.insert(classesTable).values(testClasses);

    const result = await getClasses();

    expect(result).toHaveLength(4);
    expect(result.every(cls => cls.is_active === true)).toBe(true);
    
    // Verify all classes are returned with correct data
    const classNames = result.map(cls => cls.name);
    expect(classNames).toContain('Morning Yoga');
    expect(classNames).toContain('Advanced Crossfit');
    expect(classNames).toContain('Strength Training 101');
    expect(classNames).toContain('Cardio Blast');
  });

  it('should filter classes by class_type', async () => {
    await db.insert(classesTable).values(testClasses);

    const input: GetClassesInput = { class_type: 'yoga' };
    const result = await getClasses(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Morning Yoga');
    expect(result[0].class_type).toEqual('yoga');
    expect(result[0].instructor_name).toEqual('Sarah Johnson');
    expect(result[0].duration_minutes).toEqual(60);
  });

  it('should filter classes by difficulty_level', async () => {
    await db.insert(classesTable).values(testClasses);

    const input: GetClassesInput = { difficulty_level: 'beginner' };
    const result = await getClasses(input);

    expect(result).toHaveLength(2);
    expect(result.every(cls => cls.difficulty_level === 'beginner')).toBe(true);
    
    const classNames = result.map(cls => cls.name);
    expect(classNames).toContain('Morning Yoga');
    expect(classNames).toContain('Strength Training 101');
  });

  it('should filter classes by instructor name (case-insensitive)', async () => {
    await db.insert(classesTable).values(testClasses);

    const input: GetClassesInput = { instructor: 'sarah' };
    const result = await getClasses(input);

    expect(result).toHaveLength(2);
    expect(result.every(cls => cls.instructor_name.toLowerCase().includes('sarah'))).toBe(true);
    
    const classNames = result.map(cls => cls.name);
    expect(classNames).toContain('Morning Yoga');
    expect(classNames).toContain('Strength Training 101');
  });

  it('should filter classes by multiple criteria', async () => {
    await db.insert(classesTable).values(testClasses);

    const input: GetClassesInput = {
      class_type: 'strength',
      difficulty_level: 'beginner',
      instructor: 'Sarah'
    };
    const result = await getClasses(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Strength Training 101');
    expect(result[0].class_type).toEqual('strength');
    expect(result[0].difficulty_level).toEqual('beginner');
    expect(result[0].instructor_name).toEqual('Sarah Johnson');
  });

  it('should return empty array when no classes match filters', async () => {
    await db.insert(classesTable).values(testClasses);

    const input: GetClassesInput = { class_type: 'martial_arts' };
    const result = await getClasses(input);

    expect(result).toHaveLength(0);
  });

  it('should include inactive classes when is_active is false', async () => {
    // Insert classes with mixed active status
    await db.insert(classesTable).values([
      ...testClasses,
      {
        name: 'Inactive Dance Class',
        description: 'This class is inactive',
        instructor_name: 'Jane Doe',
        duration_minutes: 40,
        max_capacity: 18,
        class_type: 'dance',
        difficulty_level: 'intermediate'
      }
    ]);

    // Set one class as inactive
    await db.update(classesTable)
      .set({ is_active: false })
      .where(eq(classesTable.name, 'Inactive Dance Class'));

    const input: GetClassesInput = { is_active: false };
    const result = await getClasses(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Inactive Dance Class');
    expect(result[0].is_active).toBe(false);
  });

  it('should return only active classes when is_active is not specified (defaults to true)', async () => {
    // Insert classes and make one inactive
    await db.insert(classesTable).values([
      ...testClasses,
      {
        name: 'Inactive Pilates',
        description: 'Inactive class',
        instructor_name: 'Test Instructor',
        duration_minutes: 55,
        max_capacity: 10,
        class_type: 'pilates',
        difficulty_level: 'intermediate'
      }
    ]);

    await db.update(classesTable)
      .set({ is_active: false })
      .where(eq(classesTable.name, 'Inactive Pilates'));

    // Query without is_active filter should default to active only
    const result = await getClasses();

    expect(result).toHaveLength(4); // Only active classes
    expect(result.every(cls => cls.is_active === true)).toBe(true);
  });

  it('should handle partial instructor name matching', async () => {
    await db.insert(classesTable).values(testClasses);

    const input: GetClassesInput = { instructor: 'John' };
    const result = await getClasses(input);

    expect(result).toHaveLength(2);
    expect(result.every(cls => cls.instructor_name.includes('Johnson'))).toBe(true);
  });

  it('should return classes with all required fields', async () => {
    await db.insert(classesTable).values([testClasses[0]]);

    const result = await getClasses();

    expect(result).toHaveLength(1);
    const cls = result[0];
    
    expect(cls.id).toBeDefined();
    expect(cls.name).toEqual('Morning Yoga');
    expect(cls.description).toEqual('Relaxing yoga session to start your day');
    expect(cls.instructor_name).toEqual('Sarah Johnson');
    expect(cls.duration_minutes).toEqual(60);
    expect(cls.max_capacity).toEqual(20);
    expect(cls.class_type).toEqual('yoga');
    expect(cls.difficulty_level).toEqual('beginner');
    expect(cls.is_active).toBe(true);
    expect(cls.created_at).toBeInstanceOf(Date);
    expect(cls.updated_at).toBeInstanceOf(Date);
  });
});
