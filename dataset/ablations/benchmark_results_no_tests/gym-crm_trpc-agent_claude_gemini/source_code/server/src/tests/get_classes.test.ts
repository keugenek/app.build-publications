import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable } from '../db/schema';
import { type CreateClassInput } from '../schema';
import { getClasses, type GetClassesFilters } from '../handlers/get_classes';

// Test data
const testClass1: CreateClassInput = {
  name: 'Morning Yoga',
  description: 'Relaxing morning yoga session',
  instructor_name: 'Sarah Johnson',
  duration_minutes: 60,
  max_capacity: 20,
  class_date: new Date('2024-01-15'),
  start_time: '08:00',
  status: 'scheduled'
};

const testClass2: CreateClassInput = {
  name: 'Evening Pilates',
  description: 'Core strengthening pilates class',
  instructor_name: 'Mike Davis',
  duration_minutes: 45,
  max_capacity: 15,
  class_date: new Date('2024-01-16'),
  start_time: '18:00',
  status: 'completed'
};

const testClass3: CreateClassInput = {
  name: 'HIIT Training',
  description: null,
  instructor_name: 'Sarah Johnson',
  duration_minutes: 30,
  max_capacity: 25,
  class_date: new Date('2024-01-17'),
  start_time: '19:00',
  status: 'cancelled'
};

describe('getClasses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const createTestClass = async (input: CreateClassInput) => {
    const result = await db.insert(classesTable)
      .values({
        name: input.name,
        description: input.description,
        instructor_name: input.instructor_name,
        duration_minutes: input.duration_minutes,
        max_capacity: input.max_capacity,
        class_date: input.class_date.toISOString().split('T')[0],
        start_time: input.start_time,
        status: input.status
      })
      .returning()
      .execute();
    
    return result[0];
  };

  it('should get all classes when no filters provided', async () => {
    // Create test classes
    await createTestClass(testClass1);
    await createTestClass(testClass2);
    await createTestClass(testClass3);

    const results = await getClasses();

    expect(results).toHaveLength(3);
    expect(results[0].name).toBeDefined();
    expect(results[0].instructor_name).toBeDefined();
    expect(results[0].class_date).toBeInstanceOf(Date);
    expect(results[0].created_at).toBeInstanceOf(Date);
    expect(results[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return empty array when no classes exist', async () => {
    const results = await getClasses();

    expect(results).toHaveLength(0);
    expect(Array.isArray(results)).toBe(true);
  });

  it('should filter classes by date range', async () => {
    // Create test classes
    await createTestClass(testClass1); // 2024-01-15
    await createTestClass(testClass2); // 2024-01-16
    await createTestClass(testClass3); // 2024-01-17

    const filters: GetClassesFilters = {
      start_date: new Date('2024-01-16'),
      end_date: new Date('2024-01-16')
    };

    const results = await getClasses(filters);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('Evening Pilates');
    expect(results[0].class_date).toEqual(new Date('2024-01-16'));
  });

  it('should filter classes by start_date only', async () => {
    // Create test classes
    await createTestClass(testClass1); // 2024-01-15
    await createTestClass(testClass2); // 2024-01-16
    await createTestClass(testClass3); // 2024-01-17

    const filters: GetClassesFilters = {
      start_date: new Date('2024-01-16')
    };

    const results = await getClasses(filters);

    expect(results).toHaveLength(2);
    expect(results.some(c => c.name === 'Evening Pilates')).toBe(true);
    expect(results.some(c => c.name === 'HIIT Training')).toBe(true);
    expect(results.every(c => c.class_date >= new Date('2024-01-16'))).toBe(true);
  });

  it('should filter classes by end_date only', async () => {
    // Create test classes
    await createTestClass(testClass1); // 2024-01-15
    await createTestClass(testClass2); // 2024-01-16
    await createTestClass(testClass3); // 2024-01-17

    const filters: GetClassesFilters = {
      end_date: new Date('2024-01-16')
    };

    const results = await getClasses(filters);

    expect(results).toHaveLength(2);
    expect(results.some(c => c.name === 'Morning Yoga')).toBe(true);
    expect(results.some(c => c.name === 'Evening Pilates')).toBe(true);
    expect(results.every(c => c.class_date <= new Date('2024-01-16'))).toBe(true);
  });

  it('should filter classes by status', async () => {
    // Create test classes
    await createTestClass(testClass1); // scheduled
    await createTestClass(testClass2); // completed
    await createTestClass(testClass3); // cancelled

    const filters: GetClassesFilters = {
      status: 'scheduled'
    };

    const results = await getClasses(filters);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('Morning Yoga');
    expect(results[0].status).toEqual('scheduled');
  });

  it('should filter classes by instructor name', async () => {
    // Create test classes
    await createTestClass(testClass1); // Sarah Johnson
    await createTestClass(testClass2); // Mike Davis
    await createTestClass(testClass3); // Sarah Johnson

    const filters: GetClassesFilters = {
      instructor_name: 'Sarah Johnson'
    };

    const results = await getClasses(filters);

    expect(results).toHaveLength(2);
    expect(results.every(c => c.instructor_name === 'Sarah Johnson')).toBe(true);
    expect(results.some(c => c.name === 'Morning Yoga')).toBe(true);
    expect(results.some(c => c.name === 'HIIT Training')).toBe(true);
  });

  it('should apply multiple filters correctly', async () => {
    // Create test classes
    await createTestClass(testClass1); // Sarah Johnson, 2024-01-15, scheduled
    await createTestClass(testClass2); // Mike Davis, 2024-01-16, completed
    await createTestClass(testClass3); // Sarah Johnson, 2024-01-17, cancelled

    const filters: GetClassesFilters = {
      instructor_name: 'Sarah Johnson',
      status: 'cancelled',
      start_date: new Date('2024-01-17'),
      end_date: new Date('2024-01-17')
    };

    const results = await getClasses(filters);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('HIIT Training');
    expect(results[0].instructor_name).toEqual('Sarah Johnson');
    expect(results[0].status).toEqual('cancelled');
    expect(results[0].class_date).toEqual(new Date('2024-01-17'));
  });

  it('should return empty array when filters match no classes', async () => {
    // Create test classes
    await createTestClass(testClass1);
    await createTestClass(testClass2);

    const filters: GetClassesFilters = {
      status: 'in_progress'
    };

    const results = await getClasses(filters);

    expect(results).toHaveLength(0);
    expect(Array.isArray(results)).toBe(true);
  });

  it('should order results by date and time descending', async () => {
    // Create classes in different order
    await createTestClass(testClass2); // 2024-01-16 18:00
    await createTestClass(testClass1); // 2024-01-15 08:00
    await createTestClass(testClass3); // 2024-01-17 19:00

    const results = await getClasses();

    expect(results).toHaveLength(3);
    // Should be ordered by date desc, then time desc
    expect(results[0].name).toEqual('HIIT Training'); // 2024-01-17
    expect(results[1].name).toEqual('Evening Pilates'); // 2024-01-16
    expect(results[2].name).toEqual('Morning Yoga'); // 2024-01-15
  });

  it('should handle classes with null descriptions', async () => {
    await createTestClass(testClass3); // Has null description

    const results = await getClasses();

    expect(results).toHaveLength(1);
    expect(results[0].description).toBeNull();
    expect(results[0].name).toEqual('HIIT Training');
  });

  it('should return correct data types', async () => {
    await createTestClass(testClass1);

    const results = await getClasses();

    expect(results).toHaveLength(1);
    const classResult = results[0];
    
    expect(typeof classResult.id).toBe('number');
    expect(typeof classResult.name).toBe('string');
    expect(typeof classResult.instructor_name).toBe('string');
    expect(typeof classResult.duration_minutes).toBe('number');
    expect(typeof classResult.max_capacity).toBe('number');
    expect(typeof classResult.current_bookings).toBe('number');
    expect(typeof classResult.start_time).toBe('string');
    expect(classResult.class_date).toBeInstanceOf(Date);
    expect(classResult.created_at).toBeInstanceOf(Date);
    expect(classResult.updated_at).toBeInstanceOf(Date);
  });
});
