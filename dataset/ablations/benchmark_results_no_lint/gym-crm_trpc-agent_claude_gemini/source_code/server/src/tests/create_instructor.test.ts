import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, instructorsTable } from '../db/schema';
import { type CreateInstructorInput } from '../schema';
import { createInstructor } from '../handlers/create_instructor';
import { eq } from 'drizzle-orm';

describe('createInstructor', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a user with instructor role
  const createInstructorUser = async () => {
    const userResult = await db.insert(usersTable)
      .values({
        name: 'John Instructor',
        email: 'john.instructor@example.com',
        role: 'instructor'
      })
      .returning()
      .execute();
    
    return userResult[0];
  };

  // Helper function to create a user with member role
  const createMemberUser = async () => {
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Jane Member',
        email: 'jane.member@example.com',
        role: 'member'
      })
      .returning()
      .execute();
    
    return userResult[0];
  };

  it('should create an instructor profile with all fields', async () => {
    const user = await createInstructorUser();
    
    const testInput: CreateInstructorInput = {
      user_id: user.id,
      specialization: 'Yoga and Meditation',
      bio: 'Experienced yoga instructor with 10 years of practice'
    };

    const result = await createInstructor(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(user.id);
    expect(result.specialization).toEqual('Yoga and Meditation');
    expect(result.bio).toEqual('Experienced yoga instructor with 10 years of practice');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create an instructor profile with minimal fields', async () => {
    const user = await createInstructorUser();
    
    const testInput: CreateInstructorInput = {
      user_id: user.id
    };

    const result = await createInstructor(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(user.id);
    expect(result.specialization).toBeNull();
    expect(result.bio).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create an instructor profile with null optional fields', async () => {
    const user = await createInstructorUser();
    
    const testInput: CreateInstructorInput = {
      user_id: user.id,
      specialization: null,
      bio: null
    };

    const result = await createInstructor(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(user.id);
    expect(result.specialization).toBeNull();
    expect(result.bio).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save instructor to database', async () => {
    const user = await createInstructorUser();
    
    const testInput: CreateInstructorInput = {
      user_id: user.id,
      specialization: 'Pilates',
      bio: 'Certified Pilates instructor'
    };

    const result = await createInstructor(testInput);

    // Query using proper drizzle syntax
    const instructors = await db.select()
      .from(instructorsTable)
      .where(eq(instructorsTable.id, result.id))
      .execute();

    expect(instructors).toHaveLength(1);
    expect(instructors[0].user_id).toEqual(user.id);
    expect(instructors[0].specialization).toEqual('Pilates');
    expect(instructors[0].bio).toEqual('Certified Pilates instructor');
    expect(instructors[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when user does not exist', async () => {
    const testInput: CreateInstructorInput = {
      user_id: 999, // Non-existent user ID
      specialization: 'Yoga',
      bio: 'Test bio'
    };

    await expect(createInstructor(testInput)).rejects.toThrow(/User not found/i);
  });

  it('should throw error when user does not have instructor role', async () => {
    const user = await createMemberUser(); // Create user with 'member' role
    
    const testInput: CreateInstructorInput = {
      user_id: user.id,
      specialization: 'Yoga',
      bio: 'Test bio'
    };

    await expect(createInstructor(testInput)).rejects.toThrow(/User must have instructor role/i);
  });

  it('should throw error when instructor profile already exists', async () => {
    const user = await createInstructorUser();
    
    const testInput: CreateInstructorInput = {
      user_id: user.id,
      specialization: 'Yoga',
      bio: 'Test bio'
    };

    // Create first instructor profile
    await createInstructor(testInput);

    // Try to create second instructor profile for same user
    await expect(createInstructor(testInput)).rejects.toThrow(/Instructor profile already exists/i);
  });

  it('should handle admin role user trying to create instructor profile', async () => {
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin'
      })
      .returning()
      .execute();

    const testInput: CreateInstructorInput = {
      user_id: userResult[0].id,
      specialization: 'Management',
      bio: 'Administrative role'
    };

    await expect(createInstructor(testInput)).rejects.toThrow(/User must have instructor role/i);
  });
});
