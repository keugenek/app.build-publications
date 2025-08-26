import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable, instructorsTable, classesTable, reservationsTable } from '../db/schema';
import { type CancelReservationInput } from '../schema';
import { cancelReservation } from '../handlers/cancel_reservation';
import { eq } from 'drizzle-orm';

describe('cancelReservation', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create prerequisite data
    const memberResult = await db.insert(membersTable)
      .values({
        name: 'Test Member',
        email: 'member@test.com'
      })
      .returning();
    
    const instructorResult = await db.insert(instructorsTable)
      .values({
        name: 'Test Instructor',
        email: 'instructor@test.com'
      })
      .returning();
    
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'A class for testing',
        date: new Date(),
        duration_minutes: 60,
        instructor_id: instructorResult[0].id,
        capacity: 10
      })
      .returning();
    
    // Create a reservation to cancel
    await db.insert(reservationsTable)
      .values({
        class_id: classResult[0].id,
        member_id: memberResult[0].id
      })
      .returning();
  });
  
  afterEach(resetDB);

  it('should cancel a reservation', async () => {
    // Get the reservation to cancel
    const existingReservations = await db.select()
      .from(reservationsTable)
      .execute();
    
    const reservationToCancel = existingReservations[0];
    
    // Test the handler
    const input: CancelReservationInput = {
      reservation_id: reservationToCancel.id
    };
    
    const result = await cancelReservation(input);
    
    // Validate result
    expect(result.id).toEqual(reservationToCancel.id);
    expect(result.class_id).toEqual(reservationToCancel.class_id);
    expect(result.member_id).toEqual(reservationToCancel.member_id);
    expect(result.reserved_at).toEqual(reservationToCancel.reserved_at);
    expect(result.cancelled_at).toBeDefined();
    expect(result.cancelled_at).toBeInstanceOf(Date);
  });

  it('should update the reservation in the database', async () => {
    // Get the reservation to cancel
    const existingReservations = await db.select()
      .from(reservationsTable)
      .execute();
    
    const reservationToCancel = existingReservations[0];
    
    // Test the handler
    const input: CancelReservationInput = {
      reservation_id: reservationToCancel.id
    };
    
    await cancelReservation(input);
    
    // Check that the reservation was updated in the database
    const updatedReservations = await db.select()
      .from(reservationsTable)
      .where(eq(reservationsTable.id, reservationToCancel.id))
      .execute();
    
    expect(updatedReservations).toHaveLength(1);
    expect(updatedReservations[0].id).toEqual(reservationToCancel.id);
    expect(updatedReservations[0].cancelled_at).toBeDefined();
    expect(updatedReservations[0].cancelled_at).toBeInstanceOf(Date);
  });

  it('should throw an error when trying to cancel a non-existent reservation', async () => {
    const input: CancelReservationInput = {
      reservation_id: 99999 // Non-existent ID
    };
    
    await expect(cancelReservation(input))
      .rejects
      .toThrow(/Reservation with id 99999 not found/);
  });
});
