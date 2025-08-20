import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable, classesTable, bookingsTable } from '../db/schema';
import { getMemberBookings } from '../handlers/get_member_bookings';

describe('getMemberBookings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for member with no bookings', async () => {
    // Create member with no bookings
    const [member] = await db.insert(membersTable)
      .values({
        email: 'member@example.com',
        first_name: 'Test',
        last_name: 'Member',
        phone: null,
        membership_type: 'basic',
        status: 'active'
      })
      .returning()
      .execute();

    const result = await getMemberBookings(member.id);

    expect(result).toHaveLength(0);
  });

  it('should return member bookings with class details', async () => {
    // Create member
    const [member] = await db.insert(membersTable)
      .values({
        email: 'member@example.com',
        first_name: 'Test',
        last_name: 'Member',
        phone: null,
        membership_type: 'basic',
        status: 'active'
      })
      .returning()
      .execute();

    // Create class
    const [fitnessClass] = await db.insert(classesTable)
      .values({
        name: 'Morning Yoga',
        description: 'Relaxing yoga session',
        instructor_name: 'Jane Smith',
        duration_minutes: 60,
        max_capacity: 20,
        current_bookings: 1,
        class_date: '2024-03-15',
        start_time: '09:00',
        status: 'scheduled'
      })
      .returning()
      .execute();

    // Create booking
    const [booking] = await db.insert(bookingsTable)
      .values({
        member_id: member.id,
        class_id: fitnessClass.id,
        status: 'booked'
      })
      .returning()
      .execute();

    const result = await getMemberBookings(member.id);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: booking.id,
      class_id: fitnessClass.id,
      class_name: 'Morning Yoga',
      instructor_name: 'Jane Smith',
      class_date: new Date('2024-03-15'),
      start_time: '09:00:00',
      duration_minutes: 60,
      status: 'booked',
      booked_at: expect.any(Date)
    });
  });

  it('should return multiple bookings ordered by booked_at descending', async () => {
    // Create member
    const [member] = await db.insert(membersTable)
      .values({
        email: 'member@example.com',
        first_name: 'Test',
        last_name: 'Member',
        phone: null,
        membership_type: 'premium',
        status: 'active'
      })
      .returning()
      .execute();

    // Create multiple classes
    const classes = await db.insert(classesTable)
      .values([
        {
          name: 'Morning Yoga',
          description: 'Relaxing yoga session',
          instructor_name: 'Jane Smith',
          duration_minutes: 60,
          max_capacity: 20,
          current_bookings: 1,
          class_date: '2024-03-15',
          start_time: '09:00',
          status: 'scheduled'
        },
        {
          name: 'Evening Pilates',
          description: 'Core strengthening workout',
          instructor_name: 'Mike Johnson',
          duration_minutes: 45,
          max_capacity: 15,
          current_bookings: 1,
          class_date: '2024-03-16',
          start_time: '18:00',
          status: 'scheduled'
        },
        {
          name: 'HIIT Training',
          description: 'High intensity interval training',
          instructor_name: 'Sarah Connor',
          duration_minutes: 30,
          max_capacity: 12,
          current_bookings: 1,
          class_date: '2024-03-17',
          start_time: '07:00',
          status: 'scheduled'
        }
      ])
      .returning()
      .execute();

    // Create bookings at different times (simulate booking order)
    const firstBooking = new Date();
    const secondBooking = new Date(firstBooking.getTime() + 1000); // 1 second later
    const thirdBooking = new Date(firstBooking.getTime() + 2000); // 2 seconds later

    await db.insert(bookingsTable)
      .values([
        {
          member_id: member.id,
          class_id: classes[0].id,
          status: 'booked',
          booked_at: firstBooking
        },
        {
          member_id: member.id,
          class_id: classes[1].id,
          status: 'attended',
          booked_at: secondBooking
        },
        {
          member_id: member.id,
          class_id: classes[2].id,
          status: 'cancelled',
          booked_at: thirdBooking
        }
      ])
      .execute();

    const result = await getMemberBookings(member.id);

    expect(result).toHaveLength(3);

    // Should be ordered by booked_at descending (most recent first)
    expect(result[0].class_name).toBe('HIIT Training');
    expect(result[0].status).toBe('cancelled');
    expect(result[1].class_name).toBe('Evening Pilates');
    expect(result[1].status).toBe('attended');
    expect(result[2].class_name).toBe('Morning Yoga');
    expect(result[2].status).toBe('booked');
  });

  it('should only return bookings for the specified member', async () => {
    // Create two members
    const [member1] = await db.insert(membersTable)
      .values({
        email: 'member1@example.com',
        first_name: 'Member',
        last_name: 'One',
        phone: null,
        membership_type: 'basic',
        status: 'active'
      })
      .returning()
      .execute();

    const [member2] = await db.insert(membersTable)
      .values({
        email: 'member2@example.com',
        first_name: 'Member',
        last_name: 'Two',
        phone: null,
        membership_type: 'premium',
        status: 'active'
      })
      .returning()
      .execute();

    // Create class
    const [fitnessClass] = await db.insert(classesTable)
      .values({
        name: 'Morning Yoga',
        description: 'Relaxing yoga session',
        instructor_name: 'Jane Smith',
        duration_minutes: 60,
        max_capacity: 20,
        current_bookings: 2,
        class_date: '2024-03-15',
        start_time: '09:00',
        status: 'scheduled'
      })
      .returning()
      .execute();

    // Create bookings for both members
    await db.insert(bookingsTable)
      .values([
        {
          member_id: member1.id,
          class_id: fitnessClass.id,
          status: 'booked'
        },
        {
          member_id: member2.id,
          class_id: fitnessClass.id,
          status: 'attended'
        }
      ])
      .execute();

    // Get bookings for member1 only
    const result = await getMemberBookings(member1.id);

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('booked');

    // Get bookings for member2 only
    const result2 = await getMemberBookings(member2.id);

    expect(result2).toHaveLength(1);
    expect(result2[0].status).toBe('attended');
  });

  it('should handle different booking statuses correctly', async () => {
    // Create member
    const [member] = await db.insert(membersTable)
      .values({
        email: 'member@example.com',
        first_name: 'Test',
        last_name: 'Member',
        phone: null,
        membership_type: 'vip',
        status: 'active'
      })
      .returning()
      .execute();

    // Create classes for different booking statuses
    const classes = await db.insert(classesTable)
      .values([
        {
          name: 'Booked Class',
          instructor_name: 'Instructor A',
          duration_minutes: 45,
          max_capacity: 10,
          current_bookings: 1,
          class_date: '2024-03-15',
          start_time: '10:00',
          status: 'scheduled'
        },
        {
          name: 'Attended Class',
          instructor_name: 'Instructor B',
          duration_minutes: 60,
          max_capacity: 15,
          current_bookings: 1,
          class_date: '2024-03-14',
          start_time: '11:00',
          status: 'completed'
        },
        {
          name: 'No Show Class',
          instructor_name: 'Instructor C',
          duration_minutes: 30,
          max_capacity: 8,
          current_bookings: 1,
          class_date: '2024-03-13',
          start_time: '16:00',
          status: 'completed'
        },
        {
          name: 'Cancelled Class',
          instructor_name: 'Instructor D',
          duration_minutes: 90,
          max_capacity: 20,
          current_bookings: 0,
          class_date: '2024-03-18',
          start_time: '19:00',
          status: 'cancelled'
        }
      ])
      .returning()
      .execute();

    // Create bookings with different statuses
    await db.insert(bookingsTable)
      .values([
        {
          member_id: member.id,
          class_id: classes[0].id,
          status: 'booked'
        },
        {
          member_id: member.id,
          class_id: classes[1].id,
          status: 'attended'
        },
        {
          member_id: member.id,
          class_id: classes[2].id,
          status: 'no_show'
        },
        {
          member_id: member.id,
          class_id: classes[3].id,
          status: 'cancelled'
        }
      ])
      .execute();

    const result = await getMemberBookings(member.id);

    expect(result).toHaveLength(4);

    // Check that all booking statuses are preserved
    const statuses = result.map(booking => booking.status).sort();
    expect(statuses).toEqual(['attended', 'booked', 'cancelled', 'no_show']);
  });

  it('should handle non-existent member gracefully', async () => {
    const result = await getMemberBookings(99999);
    expect(result).toHaveLength(0);
  });
});
