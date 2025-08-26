import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { reservationsTable, membersTable, classesTable } from '../db/schema';
import { getReservations } from '../handlers/get_reservations';
import { eq } from 'drizzle-orm';

describe('getReservations', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test member
    const [member] = await db.insert(membersTable)
      .values({
        name: 'Test Member',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    
    // Create test class
    const [classObj] = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'A class for testing',
        instructor: 'Test Instructor',
        date: new Date('2023-12-01T10:00:00Z'),
        time: '10:00 AM',
        capacity: 10
      })
      .returning()
      .execute();
    
    // Create test reservation
    await db.insert(reservationsTable)
      .values({
        memberId: member.id,
        classId: classObj.id
      })
      .returning()
      .execute();
  });
  
  afterEach(resetDB);

  it('should fetch all reservations', async () => {
    const reservations = await getReservations();
    
    expect(reservations).toHaveLength(1);
    expect(reservations[0]).toMatchObject({
      memberId: expect.any(Number),
      classId: expect.any(Number),
      reservedAt: expect.any(Date)
    });
    expect(reservations[0].id).toBeDefined();
  });

  it('should return an empty array when no reservations exist', async () => {
    // Clear all reservations
    await db.delete(reservationsTable).execute();
    
    const reservations = await getReservations();
    
    expect(reservations).toHaveLength(0);
  });

  it('should fetch multiple reservations correctly', async () => {
    // Create another member
    const [member2] = await db.insert(membersTable)
      .values({
        name: 'Test Member 2',
        email: 'test2@example.com'
      })
      .returning()
      .execute();
    
    // Create another class
    const [class2] = await db.insert(classesTable)
      .values({
        name: 'Test Class 2',
        description: 'Another class for testing',
        instructor: 'Test Instructor 2',
        date: new Date('2023-12-02T14:00:00Z'),
        time: '2:00 PM',
        capacity: 15
      })
      .returning()
      .execute();
    
    // Create another reservation
    await db.insert(reservationsTable)
      .values({
        memberId: member2.id,
        classId: class2.id
      })
      .returning()
      .execute();
    
    const reservations = await getReservations();
    
    expect(reservations).toHaveLength(2);
    
    // Check that both reservations are returned with correct properties
    reservations.forEach(reservation => {
      expect(reservation).toMatchObject({
        id: expect.any(Number),
        memberId: expect.any(Number),
        classId: expect.any(Number),
        reservedAt: expect.any(Date)
      });
    });
  });
});
