import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable, bookingsTable, membersTable } from '../db/schema';
import { type UpdateClassInput, type CreateClassInput } from '../schema';
import { updateClass } from '../handlers/update_class';
import { eq } from 'drizzle-orm';

// Test data
const testClassData = {
  name: 'Original Yoga',
  description: 'Original description',
  instructor_name: 'Jane Smith',
  duration_minutes: 60,
  max_capacity: 20,
  class_date: '2024-02-15', // Use string format for database insertion
  start_time: '09:00',
  status: 'scheduled' as const
};

const testMemberData = {
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  phone: null,
  membership_type: 'basic' as const,
  status: 'active' as const
};

describe('updateClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update class with all fields', async () => {
    // Create a test class first
    const createResult = await db.insert(classesTable)
      .values(testClassData)
      .returning()
      .execute();
    
    const classId = createResult[0].id;

    const updateInput: UpdateClassInput = {
      id: classId,
      name: 'Updated Pilates',
      description: 'Updated description',
      instructor_name: 'John Doe',
      duration_minutes: 90,
      max_capacity: 25,
      class_date: new Date('2024-02-16'),
      start_time: '10:30',
      status: 'in_progress'
    };

    const result = await updateClass(updateInput);

    // Verify all fields were updated
    expect(result.id).toBe(classId);
    expect(result.name).toBe('Updated Pilates');
    expect(result.description).toBe('Updated description');
    expect(result.instructor_name).toBe('John Doe');
    expect(result.duration_minutes).toBe(90);
    expect(result.max_capacity).toBe(25);
    expect(result.class_date).toEqual(new Date('2024-02-16'));
    expect(result.start_time).toBe('10:30');
    expect(result.status).toBe('in_progress');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update class with partial fields', async () => {
    // Create a test class first
    const createResult = await db.insert(classesTable)
      .values(testClassData)
      .returning()
      .execute();
    
    const classId = createResult[0].id;

    const updateInput: UpdateClassInput = {
      id: classId,
      name: 'Partially Updated Class',
      max_capacity: 15
    };

    const result = await updateClass(updateInput);

    // Verify only specified fields were updated
    expect(result.id).toBe(classId);
    expect(result.name).toBe('Partially Updated Class');
    expect(result.max_capacity).toBe(15);
    
    // Original fields should remain unchanged
    expect(result.description).toBe('Original description');
    expect(result.instructor_name).toBe('Jane Smith');
    expect(result.duration_minutes).toBe(60);
    expect(result.class_date).toEqual(new Date('2024-02-15'));
    expect(result.start_time).toBe('09:00');
    expect(result.status).toBe('scheduled');
  });

  it('should update description to null', async () => {
    // Create a test class first
    const createResult = await db.insert(classesTable)
      .values(testClassData)
      .returning()
      .execute();
    
    const classId = createResult[0].id;

    const updateInput: UpdateClassInput = {
      id: classId,
      description: null
    };

    const result = await updateClass(updateInput);

    expect(result.description).toBeNull();
    expect(result.name).toBe('Original Yoga'); // Other fields unchanged
  });

  it('should save updated class to database', async () => {
    // Create a test class first
    const createResult = await db.insert(classesTable)
      .values(testClassData)
      .returning()
      .execute();
    
    const classId = createResult[0].id;

    const updateInput: UpdateClassInput = {
      id: classId,
      name: 'Database Test Class',
      status: 'completed'
    };

    await updateClass(updateInput);

    // Query database directly to verify changes were persisted
    const updatedClasses = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, classId))
      .execute();

    expect(updatedClasses).toHaveLength(1);
    expect(updatedClasses[0].name).toBe('Database Test Class');
    expect(updatedClasses[0].status).toBe('completed');
    expect(updatedClasses[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when class does not exist', async () => {
    const updateInput: UpdateClassInput = {
      id: 999, // Non-existent ID
      name: 'Non-existent Class'
    };

    await expect(updateClass(updateInput)).rejects.toThrow(/Class with id 999 not found/i);
  });

  it('should prevent reducing capacity below current bookings', async () => {
    // Create a test member first
    const memberResult = await db.insert(membersTable)
      .values(testMemberData)
      .returning()
      .execute();
    
    const memberId = memberResult[0].id;

    // Create a test class
    const classResult = await db.insert(classesTable)
      .values({...testClassData, current_bookings: 5})
      .returning()
      .execute();
    
    const classId = classResult[0].id;

    // Create some bookings to simulate current bookings count
    for (let i = 0; i < 5; i++) {
      await db.insert(bookingsTable)
        .values({
          member_id: memberId,
          class_id: classId,
          status: 'booked'
        })
        .execute();
    }

    const updateInput: UpdateClassInput = {
      id: classId,
      max_capacity: 3 // Less than current bookings (5)
    };

    await expect(updateClass(updateInput)).rejects.toThrow(
      /Cannot reduce max capacity to 3\. Current bookings: 5/i
    );
  });

  it('should allow increasing capacity', async () => {
    // Create a test class with some current bookings
    const createResult = await db.insert(classesTable)
      .values({...testClassData, current_bookings: 5})
      .returning()
      .execute();
    
    const classId = createResult[0].id;

    const updateInput: UpdateClassInput = {
      id: classId,
      max_capacity: 30 // Increase capacity
    };

    const result = await updateClass(updateInput);

    expect(result.max_capacity).toBe(30);
    expect(result.current_bookings).toBe(5); // Should remain unchanged
  });

  it('should allow setting capacity equal to current bookings', async () => {
    // Create a test class with current bookings
    const createResult = await db.insert(classesTable)
      .values({...testClassData, current_bookings: 10})
      .returning()
      .execute();
    
    const classId = createResult[0].id;

    const updateInput: UpdateClassInput = {
      id: classId,
      max_capacity: 10 // Equal to current bookings
    };

    const result = await updateClass(updateInput);

    expect(result.max_capacity).toBe(10);
    expect(result.current_bookings).toBe(10);
  });

  it('should update class status correctly', async () => {
    // Create a test class
    const createResult = await db.insert(classesTable)
      .values(testClassData)
      .returning()
      .execute();
    
    const classId = createResult[0].id;

    // Test each status transition
    const statuses = ['in_progress', 'completed', 'cancelled'] as const;
    
    for (const status of statuses) {
      const updateInput: UpdateClassInput = {
        id: classId,
        status: status
      };

      const result = await updateClass(updateInput);
      expect(result.status).toBe(status);
    }
  });
});
