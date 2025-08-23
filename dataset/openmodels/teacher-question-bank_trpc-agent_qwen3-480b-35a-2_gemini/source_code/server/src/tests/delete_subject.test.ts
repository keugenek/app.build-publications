import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable } from '../db/schema';
import { deleteSubject } from '../handlers/delete_subject';
import { eq } from 'drizzle-orm';

describe('deleteSubject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing subject', async () => {
    // First create a subject to delete
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'Test Subject' })
      .returning()
      .execute();
    
    const subjectId = subjectResult[0].id;
    
    // Delete the subject
    const result = await deleteSubject(subjectId);
    
    // Verify deletion was successful
    expect(result).toBe(true);
    
    // Verify subject no longer exists in database
    const subjects = await db.select()
      .from(subjectsTable)
      .where(eq(subjectsTable.id, subjectId))
      .execute();
    
    expect(subjects).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent subject', async () => {
    // Try to delete a subject that doesn't exist
    const result = await deleteSubject(99999);
    
    // Should return false since no subject was deleted
    expect(result).toBe(false);
  });

  it('should handle deletion of subject with zero ID correctly', async () => {
    // Try to delete a subject with ID 0 (which shouldn't exist)
    const result = await deleteSubject(0);
    
    // Should return false since no subject was deleted
    expect(result).toBe(false);
  });
});
