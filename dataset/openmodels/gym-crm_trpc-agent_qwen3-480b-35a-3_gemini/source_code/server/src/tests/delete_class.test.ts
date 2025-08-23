import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable, instructorsTable, membersTable, reservationsTable } from '../db/schema';
import { deleteClass } from '../handlers/delete_class';
import { eq } from 'drizzle-orm';

describe('deleteClass', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create an instructor first (required for class)
    const instructorResult = await db.insert(instructorsTable)
      .values({
        name: 'Test Instructor',
        email: 'instructor@test.com'
      })
      .returning()
      .execute();
    
    const instructorId = instructorResult[0].id;
    
    // Create a member (required for reservations)
    const memberResult = await db.insert(membersTable)
      .values({
        name: 'Test Member',
        email: 'member@test.com'
      })
      .returning()
      .execute();
    
    const memberId = memberResult[0].id;
    
    // Create a class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'A class for testing',
        date: new Date(),
        duration_minutes: 60,
        instructor_id: instructorId,
        capacity: 10
      })
      .returning()
      .execute();
    
    const classId = classResult[0].id;
    
    // Create a reservation for this class
    await db.insert(reservationsTable)
      .values({
        class_id: classId,
        member_id: memberId
      })
      .returning()
      .execute();
  });

  afterEach(resetDB);

  it('should delete a class and its associated reservations', async () => {
    // First, get the class ID
    const classes = await db.select()
      .from(classesTable)
      .where(eq(classesTable.name, 'Test Class'))
      .execute();
    
    const classId = classes[0].id;
    
    // Verify the class exists before deletion
    expect(classId).toBeDefined();
    
    // Verify there is a reservation for this class
    const reservationsBefore = await db.select()
      .from(reservationsTable)
      .where(eq(reservationsTable.class_id, classId))
      .execute();
    
    expect(reservationsBefore).toHaveLength(1);
    
    // Delete the class
    await deleteClass(classId);
    
    // Verify the class no longer exists
    const classesAfter = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, classId))
      .execute();
    
    expect(classesAfter).toHaveLength(0);
    
    // Verify the reservations for this class are also deleted
    const reservationsAfter = await db.select()
      .from(reservationsTable)
      .where(eq(reservationsTable.class_id, classId))
      .execute();
    
    expect(reservationsAfter).toHaveLength(0);
  });

  it('should throw an error when trying to delete a non-existent class', async () => {
    // Try to delete a class that doesn't exist
    await expect(deleteClass(99999)).rejects.toThrow(/Class with id 99999 not found/);
  });
});
