import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable } from '../db/schema';
import { type UpdateSubjectInput, type CreateSubjectInput } from '../schema';
import { updateSubject } from '../handlers/update_subject';
import { eq } from 'drizzle-orm';

// Helper function to create a test subject
const createTestSubject = async (input: CreateSubjectInput) => {
  const result = await db.insert(subjectsTable)
    .values({
      name: input.name,
      description: input.description || null
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateSubject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update subject name only', async () => {
    // Create initial subject
    const initialSubject = await createTestSubject({
      name: 'Mathematics',
      description: 'Study of numbers and shapes'
    });

    const updateInput: UpdateSubjectInput = {
      id: initialSubject.id,
      name: 'Advanced Mathematics'
    };

    const result = await updateSubject(updateInput);

    expect(result.id).toEqual(initialSubject.id);
    expect(result.name).toEqual('Advanced Mathematics');
    expect(result.description).toEqual('Study of numbers and shapes'); // Should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update subject description only', async () => {
    // Create initial subject
    const initialSubject = await createTestSubject({
      name: 'Physics',
      description: 'Study of matter and energy'
    });

    const updateInput: UpdateSubjectInput = {
      id: initialSubject.id,
      description: 'Study of the natural world through observation and experiment'
    };

    const result = await updateSubject(updateInput);

    expect(result.id).toEqual(initialSubject.id);
    expect(result.name).toEqual('Physics'); // Should remain unchanged
    expect(result.description).toEqual('Study of the natural world through observation and experiment');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update both name and description', async () => {
    // Create initial subject
    const initialSubject = await createTestSubject({
      name: 'Chemistry',
      description: 'Study of chemical reactions'
    });

    const updateInput: UpdateSubjectInput = {
      id: initialSubject.id,
      name: 'Organic Chemistry',
      description: 'Study of carbon-based compounds and their reactions'
    };

    const result = await updateSubject(updateInput);

    expect(result.id).toEqual(initialSubject.id);
    expect(result.name).toEqual('Organic Chemistry');
    expect(result.description).toEqual('Study of carbon-based compounds and their reactions');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should set description to null', async () => {
    // Create initial subject with description
    const initialSubject = await createTestSubject({
      name: 'Biology',
      description: 'Study of living organisms'
    });

    const updateInput: UpdateSubjectInput = {
      id: initialSubject.id,
      description: null
    };

    const result = await updateSubject(updateInput);

    expect(result.id).toEqual(initialSubject.id);
    expect(result.name).toEqual('Biology'); // Should remain unchanged
    expect(result.description).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should handle subject with null description initially', async () => {
    // Create initial subject without description
    const initialSubject = await createTestSubject({
      name: 'History'
    });

    const updateInput: UpdateSubjectInput = {
      id: initialSubject.id,
      description: 'Study of past events and civilizations'
    };

    const result = await updateSubject(updateInput);

    expect(result.id).toEqual(initialSubject.id);
    expect(result.name).toEqual('History');
    expect(result.description).toEqual('Study of past events and civilizations');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should return unchanged subject when no fields provided', async () => {
    // Create initial subject
    const initialSubject = await createTestSubject({
      name: 'Art',
      description: 'Study of creative expression'
    });

    const updateInput: UpdateSubjectInput = {
      id: initialSubject.id
    };

    const result = await updateSubject(updateInput);

    expect(result.id).toEqual(initialSubject.id);
    expect(result.name).toEqual('Art');
    expect(result.description).toEqual('Study of creative expression');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated subject to database', async () => {
    // Create initial subject
    const initialSubject = await createTestSubject({
      name: 'Geography',
      description: 'Study of places and spaces'
    });

    const updateInput: UpdateSubjectInput = {
      id: initialSubject.id,
      name: 'Physical Geography',
      description: 'Study of Earth\'s physical features and processes'
    };

    const result = await updateSubject(updateInput);

    // Verify the update was persisted in database
    const subjects = await db.select()
      .from(subjectsTable)
      .where(eq(subjectsTable.id, result.id))
      .execute();

    expect(subjects).toHaveLength(1);
    expect(subjects[0].name).toEqual('Physical Geography');
    expect(subjects[0].description).toEqual('Study of Earth\'s physical features and processes');
    expect(subjects[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent subject', async () => {
    const updateInput: UpdateSubjectInput = {
      id: 999, // Non-existent ID
      name: 'Non-existent Subject'
    };

    await expect(updateSubject(updateInput)).rejects.toThrow(/Subject with id 999 not found/i);
  });

  it('should preserve created_at timestamp when updating', async () => {
    // Create initial subject
    const initialSubject = await createTestSubject({
      name: 'Literature',
      description: 'Study of written works'
    });

    // Wait a small amount to ensure timestamps would be different
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateSubjectInput = {
      id: initialSubject.id,
      name: 'English Literature'
    };

    const result = await updateSubject(updateInput);

    // The created_at should remain the same as initial
    expect(result.created_at.getTime()).toEqual(initialSubject.created_at.getTime());
    expect(result.name).toEqual('English Literature');
  });
});
