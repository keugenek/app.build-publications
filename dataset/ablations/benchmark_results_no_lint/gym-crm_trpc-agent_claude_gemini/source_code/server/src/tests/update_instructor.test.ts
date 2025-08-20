import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, instructorsTable } from '../db/schema';
import { type UpdateInstructorInput } from '../schema';
import { updateInstructor } from '../handlers/update_instructor';
import { eq } from 'drizzle-orm';

describe('updateInstructor', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const createTestUser = async () => {
    const result = await db.insert(usersTable)
      .values({
        name: 'John Instructor',
        email: 'john@example.com',
        role: 'instructor'
      })
      .returning()
      .execute();
    return result[0];
  };

  const createTestInstructor = async (userId: number) => {
    const result = await db.insert(instructorsTable)
      .values({
        user_id: userId,
        specialization: 'Yoga',
        bio: 'Experienced yoga instructor'
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should update instructor specialization', async () => {
    const user = await createTestUser();
    const instructor = await createTestInstructor(user.id);
    
    const input: UpdateInstructorInput = {
      id: instructor.id,
      specialization: 'Pilates'
    };

    const result = await updateInstructor(input);

    expect(result.id).toEqual(instructor.id);
    expect(result.user_id).toEqual(user.id);
    expect(result.specialization).toEqual('Pilates');
    expect(result.bio).toEqual('Experienced yoga instructor'); // Should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update instructor bio', async () => {
    const user = await createTestUser();
    const instructor = await createTestInstructor(user.id);
    
    const input: UpdateInstructorInput = {
      id: instructor.id,
      bio: 'Updated bio with new experience'
    };

    const result = await updateInstructor(input);

    expect(result.id).toEqual(instructor.id);
    expect(result.user_id).toEqual(user.id);
    expect(result.specialization).toEqual('Yoga'); // Should remain unchanged
    expect(result.bio).toEqual('Updated bio with new experience');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields at once', async () => {
    const user = await createTestUser();
    const instructor = await createTestInstructor(user.id);
    
    const input: UpdateInstructorInput = {
      id: instructor.id,
      specialization: 'Crossfit',
      bio: 'CrossFit Level 1 certified trainer'
    };

    const result = await updateInstructor(input);

    expect(result.id).toEqual(instructor.id);
    expect(result.user_id).toEqual(user.id);
    expect(result.specialization).toEqual('Crossfit');
    expect(result.bio).toEqual('CrossFit Level 1 certified trainer');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should set fields to null when explicitly provided', async () => {
    const user = await createTestUser();
    const instructor = await createTestInstructor(user.id);
    
    const input: UpdateInstructorInput = {
      id: instructor.id,
      specialization: null,
      bio: null
    };

    const result = await updateInstructor(input);

    expect(result.id).toEqual(instructor.id);
    expect(result.user_id).toEqual(user.id);
    expect(result.specialization).toBeNull();
    expect(result.bio).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should return unchanged instructor when no fields provided', async () => {
    const user = await createTestUser();
    const instructor = await createTestInstructor(user.id);
    
    const input: UpdateInstructorInput = {
      id: instructor.id
    };

    const result = await updateInstructor(input);

    expect(result.id).toEqual(instructor.id);
    expect(result.user_id).toEqual(user.id);
    expect(result.specialization).toEqual('Yoga');
    expect(result.bio).toEqual('Experienced yoga instructor');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    const user = await createTestUser();
    const instructor = await createTestInstructor(user.id);
    
    const input: UpdateInstructorInput = {
      id: instructor.id,
      specialization: 'Swimming',
      bio: 'Professional swimming coach'
    };

    await updateInstructor(input);

    // Verify changes are persisted in database
    const dbInstructor = await db.select()
      .from(instructorsTable)
      .where(eq(instructorsTable.id, instructor.id))
      .execute();

    expect(dbInstructor).toHaveLength(1);
    expect(dbInstructor[0].specialization).toEqual('Swimming');
    expect(dbInstructor[0].bio).toEqual('Professional swimming coach');
  });

  it('should throw error when instructor does not exist', async () => {
    const input: UpdateInstructorInput = {
      id: 999,
      specialization: 'NonExistent'
    };

    await expect(updateInstructor(input)).rejects.toThrow(/instructor with id 999 not found/i);
  });

  it('should handle instructor with null specialization and bio', async () => {
    const user = await createTestUser();
    
    // Create instructor with null values
    const instructor = await db.insert(instructorsTable)
      .values({
        user_id: user.id,
        specialization: null,
        bio: null
      })
      .returning()
      .execute();
    
    const input: UpdateInstructorInput = {
      id: instructor[0].id,
      specialization: 'Dance'
    };

    const result = await updateInstructor(input);

    expect(result.id).toEqual(instructor[0].id);
    expect(result.specialization).toEqual('Dance');
    expect(result.bio).toBeNull(); // Should remain null
  });
});
