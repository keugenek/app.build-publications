import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable, classesTable, instructorsTable, reservationsTable } from '../db/schema';
import { type Reservation } from '../schema';
import { getReservations, getClassReservations, getMemberReservations } from '../handlers/get_reservations';

describe('getReservations', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test data
    const instructorResult = await db.insert(instructorsTable)
      .values({ name: 'John Doe', email: 'john@example.com' })
      .returning();
    const instructorId = instructorResult[0].id;
    
    const memberResult = await db.insert(membersTable)
      .values({ name: 'Jane Smith', email: 'jane@example.com' })
      .returning();
    const memberId = memberResult[0].id;
    
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Yoga Class',
        description: 'Morning yoga session',
        date: new Date('2023-05-15T10:00:00Z'),
        duration_minutes: 60,
        instructor_id: instructorId,
        capacity: 10
      })
      .returning();
    const classId = classResult[0].id;
    
    // Create reservations
    await db.insert(reservationsTable)
      .values({
        class_id: classId,
        member_id: memberId,
        reserved_at: new Date('2023-05-10T10:00:00Z')
      });
      
    await db.insert(reservationsTable)
      .values({
        class_id: classId,
        member_id: memberId,
        reserved_at: new Date('2023-05-11T10:00:00Z'),
        cancelled_at: new Date('2023-05-12T10:00:00Z')
      });
  });
  
  afterEach(resetDB);

  it('should get all reservations', async () => {
    const reservations = await getReservations();
    
    expect(reservations).toHaveLength(2);
    
    // Check first reservation
    expect(reservations[0]).toEqual({
      id: expect.any(Number),
      class_id: expect.any(Number),
      member_id: expect.any(Number),
      reserved_at: expect.any(Date),
      cancelled_at: null
    });
    
    // Check second reservation
    expect(reservations[1]).toEqual({
      id: expect.any(Number),
      class_id: expect.any(Number),
      member_id: expect.any(Number),
      reserved_at: expect.any(Date),
      cancelled_at: expect.any(Date)
    });
  });

  it('should get reservations for a specific class', async () => {
    // First get the class ID
    const classes = await db.select().from(classesTable).execute();
    const classId = classes[0].id;
    
    const reservations = await getClassReservations(classId);
    
    expect(reservations).toHaveLength(2);
    expect(reservations.every(r => r.class_id === classId)).toBe(true);
  });

  it('should get reservations for a specific member', async () => {
    // First get the member ID
    const members = await db.select().from(membersTable).execute();
    const memberId = members[0].id;
    
    const reservations = await getMemberReservations(memberId);
    
    expect(reservations).toHaveLength(2);
    expect(reservations.every(r => r.member_id === memberId)).toBe(true);
  });
  
  it('should return empty array when no reservations exist for a class', async () => {
    // Create a new class with no reservations
    const instructorResult = await db.insert(instructorsTable)
      .values({ name: 'Bob Johnson', email: 'bob@example.com' })
      .returning();
    
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Pilates Class',
        description: 'Core strength class',
        date: new Date('2023-05-16T10:00:00Z'),
        duration_minutes: 45,
        instructor_id: instructorResult[0].id,
        capacity: 8
      })
      .returning();
    
    const reservations = await getClassReservations(classResult[0].id);
    
    expect(reservations).toHaveLength(0);
  });
  
  it('should return empty array when no reservations exist for a member', async () => {
    // Create a new member with no reservations
    const memberResult = await db.insert(membersTable)
      .values({ name: 'Alice Williams', email: 'alice@example.com' })
      .returning();
    
    const reservations = await getMemberReservations(memberResult[0].id);
    
    expect(reservations).toHaveLength(0);
  });
});
