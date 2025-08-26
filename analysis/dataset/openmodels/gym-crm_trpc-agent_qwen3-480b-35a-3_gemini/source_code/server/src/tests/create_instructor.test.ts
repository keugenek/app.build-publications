import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { instructorsTable } from '../db/schema';
import { type CreateInstructorInput } from '../schema';
import { createInstructor } from '../handlers/create_instructor';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateInstructorInput = {
  name: 'Test Instructor',
  email: 'test@example.com'
};

describe('createInstructor', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an instructor', async () => {
    const result = await createInstructor(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Instructor');
    expect(result.email).toEqual(testInput.email);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save instructor to database', async () => {
    const result = await createInstructor(testInput);

    // Query using proper drizzle syntax
    const instructors = await db.select()
      .from(instructorsTable)
      .where(eq(instructorsTable.id, result.id))
      .execute();

    expect(instructors).toHaveLength(1);
    expect(instructors[0].name).toEqual('Test Instructor');
    expect(instructors[0].email).toEqual(testInput.email);
    expect(instructors[0].created_at).toBeInstanceOf(Date);
  });
});
