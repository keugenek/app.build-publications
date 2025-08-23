import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable, instructorsTable, membersTable } from '../db/schema';
import { type CreateClassInput, type CreateInstructorInput, type CreateMemberInput } from '../schema';
import { getClasses, getUpcomingClasses } from '../handlers/get_classes';
import { eq } from 'drizzle-orm';

// Test data
const testInstructorInput: CreateInstructorInput = {
  name: 'John Doe',
  email: 'john@example.com'
};

const pastClassInput: CreateClassInput = {
  name: 'Yoga Class',
  description: 'Relaxing yoga session',
  date: new Date(Date.now() - 86400000), // Yesterday
  duration_minutes: 60,
  instructor_id: 1, // Will be updated after creation
  capacity: 20
};

const futureClassInput: CreateClassInput = {
  name: 'Pilates Class',
  description: 'Core strengthening exercises',
  date: new Date(Date.now() + 86400000), // Tomorrow
  duration_minutes: 45,
  instructor_id: 1, // Will be updated after creation
  capacity: 15
};

describe('getClasses', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create instructor first
    const instructorResult = await db.insert(instructorsTable)
      .values(testInstructorInput)
      .returning()
      .execute();
    
    const instructorId = instructorResult[0].id;
    
    // Update class inputs with correct instructor ID
    const updatedPastClass = { ...pastClassInput, instructor_id: instructorId };
    const updatedFutureClass = { ...futureClassInput, instructor_id: instructorId };
    
    // Create test classes
    await db.insert(classesTable)
      .values(updatedPastClass)
      .execute();
      
    await db.insert(classesTable)
      .values(updatedFutureClass)
      .execute();
  });
  
  afterEach(resetDB);

  it('should return all classes', async () => {
    const result = await getClasses();

    expect(result).toHaveLength(2);
    
    // Check that all required fields are present
    result.forEach(classItem => {
      expect(classItem).toHaveProperty('id');
      expect(classItem).toHaveProperty('name');
      expect(classItem).toHaveProperty('description');
      expect(classItem).toHaveProperty('date');
      expect(classItem).toHaveProperty('duration_minutes');
      expect(classItem).toHaveProperty('instructor_id');
      expect(classItem).toHaveProperty('capacity');
      expect(classItem).toHaveProperty('created_at');
      
      expect(typeof classItem.id).toBe('number');
      expect(typeof classItem.name).toBe('string');
      expect(typeof classItem.duration_minutes).toBe('number');
      expect(typeof classItem.instructor_id).toBe('number');
      expect(typeof classItem.capacity).toBe('number');
      expect(classItem.date).toBeInstanceOf(Date);
      expect(classItem.created_at).toBeInstanceOf(Date);
    });
    
    // Should be ordered by date descending
    expect(result[0].date.getTime()).toBeGreaterThan(result[1].date.getTime());
  });

  it('should return classes from database', async () => {
    const result = await getClasses();
    
    // Find the pilates class (future class)
    const pilatesClass = result.find(c => c.name === 'Pilates Class');
    expect(pilatesClass).toBeDefined();
    expect(pilatesClass!.description).toBe('Core strengthening exercises');
    expect(pilatesClass!.duration_minutes).toBe(45);
    expect(pilatesClass!.capacity).toBe(15);
    
    // Find the yoga class (past class)
    const yogaClass = result.find(c => c.name === 'Yoga Class');
    expect(yogaClass).toBeDefined();
    expect(yogaClass!.description).toBe('Relaxing yoga session');
    expect(yogaClass!.duration_minutes).toBe(60);
    expect(yogaClass!.capacity).toBe(20);
  });
});

describe('getUpcomingClasses', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create instructor first
    const instructorResult = await db.insert(instructorsTable)
      .values(testInstructorInput)
      .returning()
      .execute();
    
    const instructorId = instructorResult[0].id;
    
    // Update class inputs with correct instructor ID
    const updatedPastClass = { ...pastClassInput, instructor_id: instructorId };
    const updatedFutureClass = { ...futureClassInput, instructor_id: instructorId };
    
    // Create test classes
    await db.insert(classesTable)
      .values(updatedPastClass)
      .execute();
      
    await db.insert(classesTable)
      .values(updatedFutureClass)
      .execute();
  });
  
  afterEach(resetDB);

  it('should return only upcoming classes', async () => {
    const result = await getUpcomingClasses();
    
    expect(result).toHaveLength(1);
    
    // Should only return the future class
    expect(result[0].name).toBe('Pilates Class');
    expect(result[0].date.getTime()).toBeGreaterThan(Date.now());
    
    // Check that all required fields are present
    const classItem = result[0];
    expect(classItem).toHaveProperty('id');
    expect(classItem).toHaveProperty('name');
    expect(classItem).toHaveProperty('description');
    expect(classItem).toHaveProperty('date');
    expect(classItem).toHaveProperty('duration_minutes');
    expect(classItem).toHaveProperty('instructor_id');
    expect(classItem).toHaveProperty('capacity');
    expect(classItem).toHaveProperty('created_at');
    
    expect(typeof classItem.id).toBe('number');
    expect(typeof classItem.name).toBe('string');
    expect(typeof classItem.duration_minutes).toBe('number');
    expect(typeof classItem.instructor_id).toBe('number');
    expect(typeof classItem.capacity).toBe('number');
    expect(classItem.date).toBeInstanceOf(Date);
    expect(classItem.created_at).toBeInstanceOf(Date);
  });

  it('should return empty array when no upcoming classes', async () => {
    // Update all classes to be in the past
    await db.update(classesTable)
      .set({ date: new Date(Date.now() - 86400000) })
      .execute();
    
    const result = await getUpcomingClasses();
    expect(result).toHaveLength(0);
  });
});
