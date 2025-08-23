import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable, instructorsTable, classesTable, reservationsTable } from '../db/schema';
import { type CreateReservationInput, type CreateMemberInput, type CreateInstructorInput, type CreateClassInput } from '../schema';
import { createReservation } from '../handlers/create_reservation';
import { eq } from 'drizzle-orm';

describe('createReservation', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a member for testing
    const memberInput: CreateMemberInput = {
      name: 'John Doe',
      email: 'john.doe@example.com'
    };
    
    await db.insert(membersTable)
      .values(memberInput)
      .execute();
    
    // Create an instructor for testing
    const instructorInput: CreateInstructorInput = {
      name: 'Jane Smith',
      email: 'jane.smith@example.com'
    };
    
    const instructorResult = await db.insert(instructorsTable)
      .values(instructorInput)
      .returning()
      .execute();
    
    // Create a class for testing
    const classInput: CreateClassInput = {
      name: 'Yoga Class',
      description: 'Relaxing yoga session',
      date: new Date(),
      duration_minutes: 60,
      instructor_id: instructorResult[0].id,
      capacity: 50
    };
    
    await db.insert(classesTable)
      .values(classInput)
      .execute();
  });
  
  afterEach(resetDB);

  it('should create a reservation', async () => {
    // Get the member and class IDs
    const members = await db.select().from(membersTable).execute();
    const classes = await db.select().from(classesTable).execute();
    
    const testInput: CreateReservationInput = {
      class_id: classes[0].id,
      member_id: members[0].id
    };

    const result = await createReservation(testInput);

    // Basic field validation
    expect(result.class_id).toEqual(testInput.class_id);
    expect(result.member_id).toEqual(testInput.member_id);
    expect(result.id).toBeDefined();
    expect(result.reserved_at).toBeInstanceOf(Date);
    expect(result.cancelled_at).toBeNull();
  });

  it('should save reservation to database', async () => {
    // Get the member and class IDs
    const members = await db.select().from(membersTable).execute();
    const classes = await db.select().from(classesTable).execute();
    
    const testInput: CreateReservationInput = {
      class_id: classes[0].id,
      member_id: members[0].id
    };

    const result = await createReservation(testInput);

    // Query using proper drizzle syntax
    const reservations = await db.select()
      .from(reservationsTable)
      .where(eq(reservationsTable.id, result.id))
      .execute();

    expect(reservations).toHaveLength(1);
    expect(reservations[0].class_id).toEqual(testInput.class_id);
    expect(reservations[0].member_id).toEqual(testInput.member_id);
    expect(reservations[0].reserved_at).toBeInstanceOf(Date);
    expect(reservations[0].cancelled_at).toBeNull();
  });

  it('should throw an error if class does not exist', async () => {
    // Get the member ID
    const members = await db.select().from(membersTable).execute();
    
    const testInput: CreateReservationInput = {
      class_id: 99999, // Non-existent class ID
      member_id: members[0].id
    };

    await expect(createReservation(testInput)).rejects.toThrow(/Class with id 99999 not found/);
  });

  it('should throw an error if member does not exist', async () => {
    // Get the class ID
    const classes = await db.select().from(classesTable).execute();
    
    const testInput: CreateReservationInput = {
      class_id: classes[0].id,
      member_id: 99999 // Non-existent member ID
    };

    await expect(createReservation(testInput)).rejects.toThrow(/Member with id 99999 not found/);
  });
});
