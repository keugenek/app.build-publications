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
  description: 'A relaxing morning yoga class',
  class_type: 'yoga',
  instructor_name: 'Jane Smith',
  max_capacity: 20,
  duration_minutes: 60,
  price: 25.99
};

describe('createClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a class with all fields', async () => {
    const result = await createClass(testInput);

    // Basic field validation
    expect(result.name).toEqual('Morning Yoga');
    expect(result.description).toEqual('A relaxing morning yoga class');
    expect(result.class_type).toEqual('yoga');
    expect(result.instructor_name).toEqual('Jane Smith');
    expect(result.max_capacity).toEqual(20);
    expect(result.duration_minutes).toEqual(60);
    expect(result.price).toEqual(25.99);
    expect(typeof result.price).toEqual('number'); // Verify numeric conversion
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save class to database', async () => {
    const result = await createClass(testInput);

    // Query using proper drizzle syntax
    const classes = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, result.id))
      .execute();

    expect(classes).toHaveLength(1);
    const savedClass = classes[0];
    expect(savedClass.name).toEqual('Morning Yoga');
    expect(savedClass.description).toEqual('A relaxing morning yoga class');
    expect(savedClass.class_type).toEqual('yoga');
    expect(savedClass.instructor_name).toEqual('Jane Smith');
    expect(savedClass.max_capacity).toEqual(20);
    expect(savedClass.duration_minutes).toEqual(60);
    expect(parseFloat(savedClass.price)).toEqual(25.99);
    expect(savedClass.is_active).toEqual(true);
    expect(savedClass.created_at).toBeInstanceOf(Date);
    expect(savedClass.updated_at).toBeInstanceOf(Date);
  });

  it('should create class with null description', async () => {
    const inputWithNullDescription: CreateClassInput = {
      ...testInput,
      description: null
    };

    const result = await createClass(inputWithNullDescription);

    expect(result.description).toBeNull();
    expect(result.name).toEqual('Morning Yoga');
    expect(result.class_type).toEqual('yoga');
  });

  it('should create different class types', async () => {
    const pilatesInput: CreateClassInput = {
      name: 'Advanced Pilates',
      description: 'High intensity pilates workout',
      class_type: 'pilates',
      instructor_name: 'Mike Johnson',
      max_capacity: 15,
      duration_minutes: 45,
      price: 30.00
    };

    const result = await createClass(pilatesInput);

    expect(result.name).toEqual('Advanced Pilates');
    expect(result.class_type).toEqual('pilates');
    expect(result.instructor_name).toEqual('Mike Johnson');
    expect(result.max_capacity).toEqual(15);
    expect(result.duration_minutes).toEqual(45);
    expect(result.price).toEqual(30.00);
  });

  it('should handle various price formats correctly', async () => {
    const freeClassInput: CreateClassInput = {
      name: 'Free Community Class',
      description: 'Open to all community members',
      class_type: 'cardio',
      instructor_name: 'Sarah Lee',
      max_capacity: 50,
      duration_minutes: 30,
      price: 0
    };

    const result = await createClass(freeClassInput);

    expect(result.price).toEqual(0);
    expect(typeof result.price).toEqual('number');

    // Verify database storage
    const classes = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, result.id))
      .execute();

    expect(parseFloat(classes[0].price)).toEqual(0);
  });

  it('should handle high precision prices', async () => {
    const precisePrice = 19.99;
    const precisePriceInput: CreateClassInput = {
      name: 'HIIT Training',
      description: 'High intensity interval training',
      class_type: 'hiit',
      instructor_name: 'Alex Rodriguez',
      max_capacity: 12,
      duration_minutes: 30,
      price: precisePrice
    };

    const result = await createClass(precisePriceInput);

    expect(result.price).toEqual(19.99);
    expect(typeof result.price).toEqual('number');
  });

  it('should create multiple classes independently', async () => {
    const class1: CreateClassInput = {
      name: 'Morning Strength',
      description: 'Build muscle and strength',
      class_type: 'strength',
      instructor_name: 'John Doe',
      max_capacity: 25,
      duration_minutes: 50,
      price: 28.50
    };

    const class2: CreateClassInput = {
      name: 'Evening Zumba',
      description: 'Dance fitness class',
      class_type: 'zumba',
      instructor_name: 'Maria Garcia',
      max_capacity: 30,
      duration_minutes: 55,
      price: 22.00
    };

    const result1 = await createClass(class1);
    const result2 = await createClass(class2);

    // Verify both classes were created with different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.name).toEqual('Morning Strength');
    expect(result1.class_type).toEqual('strength');
    expect(result2.name).toEqual('Evening Zumba');
    expect(result2.class_type).toEqual('zumba');

    // Verify both are saved in database
    const allClasses = await db.select()
      .from(classesTable)
      .execute();

    expect(allClasses).toHaveLength(2);
  });
});
