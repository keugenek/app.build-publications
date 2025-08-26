import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable } from '../db/schema';
import { getClasses } from '../handlers/get_classes';

describe('getClasses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return active classes by default', async () => {
    // Create test classes - one active, one inactive
    await db.insert(classesTable).values([
      {
        name: 'Active Yoga',
        description: 'A relaxing yoga class',
        class_type: 'yoga',
        instructor_name: 'Jane Smith',
        max_capacity: 20,
        duration_minutes: 60,
        price: '25.00',
        is_active: true
      },
      {
        name: 'Inactive Pilates',
        description: 'A pilates class',
        class_type: 'pilates',
        instructor_name: 'John Doe',
        max_capacity: 15,
        duration_minutes: 45,
        price: '30.00',
        is_active: false
      }
    ]).execute();

    const result = await getClasses();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Active Yoga');
    expect(result[0].is_active).toBe(true);
    expect(typeof result[0].price).toBe('number');
    expect(result[0].price).toEqual(25.00);
  });

  it('should return all classes when includeInactive is true', async () => {
    // Create test classes - one active, one inactive
    await db.insert(classesTable).values([
      {
        name: 'Active CrossFit',
        description: 'High intensity workout',
        class_type: 'crossfit',
        instructor_name: 'Mike Johnson',
        max_capacity: 12,
        duration_minutes: 50,
        price: '35.00',
        is_active: true
      },
      {
        name: 'Inactive Cardio',
        description: 'Cardio workout',
        class_type: 'cardio',
        instructor_name: 'Sarah Wilson',
        max_capacity: 25,
        duration_minutes: 40,
        price: '20.00',
        is_active: false
      }
    ]).execute();

    const result = await getClasses({ includeInactive: true });

    expect(result).toHaveLength(2);
    
    // Check that both active and inactive classes are returned
    const classNames = result.map(c => c.name);
    expect(classNames).toContain('Active CrossFit');
    expect(classNames).toContain('Inactive Cardio');

    // Verify numeric conversion for all results
    result.forEach(classData => {
      expect(typeof classData.price).toBe('number');
    });
  });

  it('should return empty array when no classes exist', async () => {
    const result = await getClasses();

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return complete class data with all fields', async () => {
    // Create a comprehensive test class
    await db.insert(classesTable).values({
      name: 'Complete HIIT Class',
      description: 'High intensity interval training',
      class_type: 'hiit',
      instructor_name: 'Alex Brown',
      max_capacity: 18,
      duration_minutes: 45,
      price: '28.50',
      is_active: true
    }).execute();

    const result = await getClasses();

    expect(result).toHaveLength(1);
    
    const classData = result[0];
    expect(classData.id).toBeDefined();
    expect(classData.name).toEqual('Complete HIIT Class');
    expect(classData.description).toEqual('High intensity interval training');
    expect(classData.class_type).toEqual('hiit');
    expect(classData.instructor_name).toEqual('Alex Brown');
    expect(classData.max_capacity).toEqual(18);
    expect(classData.duration_minutes).toEqual(45);
    expect(classData.price).toEqual(28.50);
    expect(typeof classData.price).toBe('number');
    expect(classData.is_active).toBe(true);
    expect(classData.created_at).toBeInstanceOf(Date);
    expect(classData.updated_at).toBeInstanceOf(Date);
  });

  it('should handle multiple active classes correctly', async () => {
    // Create multiple active classes
    await db.insert(classesTable).values([
      {
        name: 'Morning Yoga',
        description: 'Start your day with yoga',
        class_type: 'yoga',
        instructor_name: 'Lisa Chen',
        max_capacity: 20,
        duration_minutes: 60,
        price: '25.00',
        is_active: true
      },
      {
        name: 'Evening Strength',
        description: 'Build strength in the evening',
        class_type: 'strength',
        instructor_name: 'Mark Davis',
        max_capacity: 15,
        duration_minutes: 55,
        price: '32.00',
        is_active: true
      },
      {
        name: 'Lunch Zumba',
        description: 'Dance your way to fitness',
        class_type: 'zumba',
        instructor_name: 'Maria Garcia',
        max_capacity: 30,
        duration_minutes: 50,
        price: '22.00',
        is_active: true
      }
    ]).execute();

    const result = await getClasses();

    expect(result).toHaveLength(3);
    
    // Verify all classes are active
    result.forEach(classData => {
      expect(classData.is_active).toBe(true);
      expect(typeof classData.price).toBe('number');
    });

    // Verify we have the expected class names
    const classNames = result.map(c => c.name);
    expect(classNames).toContain('Morning Yoga');
    expect(classNames).toContain('Evening Strength');
    expect(classNames).toContain('Lunch Zumba');
  });

  it('should handle classes with null descriptions', async () => {
    // Create a class with null description
    await db.insert(classesTable).values({
      name: 'Spinning Class',
      description: null,
      class_type: 'spinning',
      instructor_name: 'Tom Wilson',
      max_capacity: 20,
      duration_minutes: 45,
      price: '27.00',
      is_active: true
    }).execute();

    const result = await getClasses();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Spinning Class');
    expect(result[0].description).toBeNull();
    expect(result[0].price).toEqual(27.00);
  });
});
