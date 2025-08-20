import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable, classesTable, classSchedulesTable, bookingsTable } from '../db/schema';
import { getMemberBookings } from '../handlers/get_member_bookings';
import { type CreateMemberInput, type CreateClassInput, type CreateClassScheduleInput, type CreateBookingInput } from '../schema';

describe('getMemberBookings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for member with no bookings', async () => {
    // Create a member
    const memberResult = await db.insert(membersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: null,
        membership_type: 'basic',
        membership_start_date: '2024-01-01',
        membership_end_date: '2024-12-31'
      })
      .returning()
      .execute();

    const memberId = memberResult[0].id;
    const bookings = await getMemberBookings(memberId);

    expect(bookings).toEqual([]);
  });

  it('should return all bookings for a member', async () => {
    // Create a member
    const memberResult = await db.insert(membersTable)
      .values({
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        phone: '+1234567890',
        membership_type: 'premium',
        membership_start_date: '2024-01-01',
        membership_end_date: '2024-12-31'
      })
      .returning()
      .execute();

    const memberId = memberResult[0].id;

    // Create a class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Morning Yoga',
        description: 'Relaxing yoga class',
        instructor_name: 'Sarah Wilson',
        duration_minutes: 60,
        max_capacity: 20,
        class_type: 'yoga',
        difficulty_level: 'beginner'
      })
      .returning()
      .execute();

    const classId = classResult[0].id;

    // Create class schedules
    const schedule1Result = await db.insert(classSchedulesTable)
      .values({
        class_id: classId,
        scheduled_date: '2024-12-01',
        start_time: '09:00',
        end_time: '10:00'
      })
      .returning()
      .execute();

    const schedule2Result = await db.insert(classSchedulesTable)
      .values({
        class_id: classId,
        scheduled_date: '2024-12-02',
        start_time: '10:00',
        end_time: '11:00'
      })
      .returning()
      .execute();

    const schedule1Id = schedule1Result[0].id;
    const schedule2Id = schedule2Result[0].id;

    // Create bookings
    const booking1Result = await db.insert(bookingsTable)
      .values({
        member_id: memberId,
        class_schedule_id: schedule1Id,
        booking_status: 'booked'
      })
      .returning()
      .execute();

    const booking2Result = await db.insert(bookingsTable)
      .values({
        member_id: memberId,
        class_schedule_id: schedule2Id,
        booking_status: 'attended'
      })
      .returning()
      .execute();

    const bookings = await getMemberBookings(memberId);

    expect(bookings).toHaveLength(2);
    
    // Verify booking details
    const bookingIds = bookings.map(b => b.id).sort();
    const expectedIds = [booking1Result[0].id, booking2Result[0].id].sort();
    expect(bookingIds).toEqual(expectedIds);

    // Verify member_id is correct for all bookings
    bookings.forEach(booking => {
      expect(booking.member_id).toEqual(memberId);
    });

    // Verify booking statuses
    const statuses = bookings.map(b => b.booking_status).sort();
    expect(statuses).toEqual(['attended', 'booked']);
  });

  it('should order bookings by scheduled date and time (newest first)', async () => {
    // Create a member
    const memberResult = await db.insert(membersTable)
      .values({
        first_name: 'Mike',
        last_name: 'Johnson',
        email: 'mike@example.com',
        phone: null,
        membership_type: 'vip',
        membership_start_date: '2024-01-01',
        membership_end_date: '2024-12-31'
      })
      .returning()
      .execute();

    const memberId = memberResult[0].id;

    // Create a class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Cardio Blast',
        description: 'High-intensity cardio',
        instructor_name: 'Tom Trainer',
        duration_minutes: 45,
        max_capacity: 15,
        class_type: 'cardio',
        difficulty_level: 'intermediate'
      })
      .returning()
      .execute();

    const classId = classResult[0].id;

    // Create class schedules with different dates and times
    const earlyScheduleResult = await db.insert(classSchedulesTable)
      .values({
        class_id: classId,
        scheduled_date: '2024-11-30',
        start_time: '08:00',
        end_time: '08:45'
      })
      .returning()
      .execute();

    const lateScheduleResult = await db.insert(classSchedulesTable)
      .values({
        class_id: classId,
        scheduled_date: '2024-12-02',
        start_time: '18:00',
        end_time: '18:45'
      })
      .returning()
      .execute();

    const middleScheduleResult = await db.insert(classSchedulesTable)
      .values({
        class_id: classId,
        scheduled_date: '2024-12-01',
        start_time: '12:00',
        end_time: '12:45'
      })
      .returning()
      .execute();

    // Create bookings in random order
    await db.insert(bookingsTable)
      .values({
        member_id: memberId,
        class_schedule_id: middleScheduleResult[0].id,
        booking_status: 'booked'
      })
      .execute();

    await db.insert(bookingsTable)
      .values({
        member_id: memberId,
        class_schedule_id: earlyScheduleResult[0].id,
        booking_status: 'attended'
      })
      .execute();

    await db.insert(bookingsTable)
      .values({
        member_id: memberId,
        class_schedule_id: lateScheduleResult[0].id,
        booking_status: 'cancelled'
      })
      .execute();

    const bookings = await getMemberBookings(memberId);

    expect(bookings).toHaveLength(3);
    
    // Verify ordering: latest date/time first
    expect(bookings[0].class_schedule_id).toEqual(lateScheduleResult[0].id); // 2024-12-02 18:00
    expect(bookings[1].class_schedule_id).toEqual(middleScheduleResult[0].id); // 2024-12-01 12:00
    expect(bookings[2].class_schedule_id).toEqual(earlyScheduleResult[0].id); // 2024-11-30 08:00
  });

  it('should handle different booking statuses', async () => {
    // Create a member
    const memberResult = await db.insert(membersTable)
      .values({
        first_name: 'Alice',
        last_name: 'Brown',
        email: 'alice@example.com',
        phone: '+9876543210',
        membership_type: 'basic',
        membership_start_date: '2024-01-01',
        membership_end_date: '2024-12-31'
      })
      .returning()
      .execute();

    const memberId = memberResult[0].id;

    // Create a class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Strength Training',
        description: 'Build muscle and strength',
        instructor_name: 'Max Muscle',
        duration_minutes: 90,
        max_capacity: 12,
        class_type: 'strength',
        difficulty_level: 'advanced'
      })
      .returning()
      .execute();

    const classId = classResult[0].id;

    // Create class schedules
    const scheduleResults = await db.insert(classSchedulesTable)
      .values([
        {
          class_id: classId,
          scheduled_date: '2024-12-01',
          start_time: '09:00',
          end_time: '10:30'
        },
        {
          class_id: classId,
          scheduled_date: '2024-12-02',
          start_time: '09:00',
          end_time: '10:30'
        },
        {
          class_id: classId,
          scheduled_date: '2024-12-03',
          start_time: '09:00',
          end_time: '10:30'
        },
        {
          class_id: classId,
          scheduled_date: '2024-12-04',
          start_time: '09:00',
          end_time: '10:30'
        }
      ])
      .returning()
      .execute();

    // Create bookings with different statuses
    await db.insert(bookingsTable)
      .values([
        {
          member_id: memberId,
          class_schedule_id: scheduleResults[0].id,
          booking_status: 'booked'
        },
        {
          member_id: memberId,
          class_schedule_id: scheduleResults[1].id,
          booking_status: 'cancelled'
        },
        {
          member_id: memberId,
          class_schedule_id: scheduleResults[2].id,
          booking_status: 'attended'
        },
        {
          member_id: memberId,
          class_schedule_id: scheduleResults[3].id,
          booking_status: 'no_show'
        }
      ])
      .execute();

    const bookings = await getMemberBookings(memberId);

    expect(bookings).toHaveLength(4);

    // Verify all statuses are present
    const statuses = bookings.map(b => b.booking_status).sort();
    expect(statuses).toEqual(['attended', 'booked', 'cancelled', 'no_show']);

    // Verify all bookings have required fields
    bookings.forEach(booking => {
      expect(booking.id).toBeDefined();
      expect(booking.member_id).toEqual(memberId);
      expect(booking.class_schedule_id).toBeDefined();
      expect(booking.booking_date).toBeInstanceOf(Date);
      expect(booking.created_at).toBeInstanceOf(Date);
      expect(booking.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should not return bookings from other members', async () => {
    // Create two members
    const member1Result = await db.insert(membersTable)
      .values({
        first_name: 'User',
        last_name: 'One',
        email: 'user1@example.com',
        phone: null,
        membership_type: 'basic',
        membership_start_date: '2024-01-01',
        membership_end_date: '2024-12-31'
      })
      .returning()
      .execute();

    const member2Result = await db.insert(membersTable)
      .values({
        first_name: 'User',
        last_name: 'Two',
        email: 'user2@example.com',
        phone: null,
        membership_type: 'premium',
        membership_start_date: '2024-01-01',
        membership_end_date: '2024-12-31'
      })
      .returning()
      .execute();

    const member1Id = member1Result[0].id;
    const member2Id = member2Result[0].id;

    // Create a class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Mixed Class',
        description: 'Class for testing',
        instructor_name: 'Test Instructor',
        duration_minutes: 60,
        max_capacity: 25,
        class_type: 'pilates',
        difficulty_level: 'beginner'
      })
      .returning()
      .execute();

    const classId = classResult[0].id;

    // Create class schedules
    const scheduleResults = await db.insert(classSchedulesTable)
      .values([
        {
          class_id: classId,
          scheduled_date: '2024-12-01',
          start_time: '10:00',
          end_time: '11:00'
        },
        {
          class_id: classId,
          scheduled_date: '2024-12-02',
          start_time: '10:00',
          end_time: '11:00'
        }
      ])
      .returning()
      .execute();

    // Create bookings for both members
    await db.insert(bookingsTable)
      .values([
        {
          member_id: member1Id,
          class_schedule_id: scheduleResults[0].id,
          booking_status: 'booked'
        },
        {
          member_id: member2Id,
          class_schedule_id: scheduleResults[0].id,
          booking_status: 'booked'
        },
        {
          member_id: member2Id,
          class_schedule_id: scheduleResults[1].id,
          booking_status: 'attended'
        }
      ])
      .execute();

    // Test member1's bookings
    const member1Bookings = await getMemberBookings(member1Id);
    expect(member1Bookings).toHaveLength(1);
    expect(member1Bookings[0].member_id).toEqual(member1Id);

    // Test member2's bookings  
    const member2Bookings = await getMemberBookings(member2Id);
    expect(member2Bookings).toHaveLength(2);
    member2Bookings.forEach(booking => {
      expect(booking.member_id).toEqual(member2Id);
    });
  });

  it('should handle member that does not exist', async () => {
    const nonExistentMemberId = 99999;
    const bookings = await getMemberBookings(nonExistentMemberId);

    expect(bookings).toEqual([]);
  });
});
