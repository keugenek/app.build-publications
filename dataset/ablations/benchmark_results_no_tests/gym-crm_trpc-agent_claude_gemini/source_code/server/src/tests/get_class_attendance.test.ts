import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable, classesTable, bookingsTable } from '../db/schema';
import { getClassAttendance } from '../handlers/get_class_attendance';

const testMember1 = {
  email: 'john.doe@example.com',
  first_name: 'John',
  last_name: 'Doe',
  phone: '555-1234',
  membership_type: 'premium' as const,
  status: 'active' as const
};

const testMember2 = {
  email: 'jane.smith@example.com',
  first_name: 'Jane',
  last_name: 'Smith',
  phone: null,
  membership_type: 'basic' as const,
  status: 'active' as const
};

const testClass = {
  name: 'Morning Yoga',
  description: 'Relaxing yoga session',
  instructor_name: 'Sarah Wilson',
  duration_minutes: 60,
  max_capacity: 20,
  current_bookings: 0,
  class_date: '2024-01-15',
  start_time: '09:00:00',
  status: 'scheduled' as const
};

describe('getClassAttendance', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return attendance data for a class with bookings', async () => {
    // Create test members
    const [member1, member2] = await db.insert(membersTable)
      .values([testMember1, testMember2])
      .returning()
      .execute();

    // Create test class
    const [testClassRecord] = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();

    // Create test bookings
    await db.insert(bookingsTable)
      .values([
        {
          member_id: member1.id,
          class_id: testClassRecord.id,
          status: 'booked' as const
        },
        {
          member_id: member2.id,
          class_id: testClassRecord.id,
          status: 'attended' as const
        }
      ])
      .execute();

    const result = await getClassAttendance(testClassRecord.id);

    expect(result).toHaveLength(2);
    
    // Check first attendance record
    const johnAttendance = result.find(a => a.member_name === 'John Doe');
    expect(johnAttendance).toBeDefined();
    expect(johnAttendance!.booking_id).toBeDefined();
    expect(johnAttendance!.member_id).toEqual(member1.id);
    expect(johnAttendance!.class_id).toEqual(testClassRecord.id);
    expect(johnAttendance!.class_name).toEqual('Morning Yoga');
    expect(johnAttendance!.class_date).toEqual(new Date('2024-01-15'));
    expect(johnAttendance!.start_time).toEqual('09:00:00');
    expect(johnAttendance!.status).toEqual('booked');

    // Check second attendance record
    const janeAttendance = result.find(a => a.member_name === 'Jane Smith');
    expect(janeAttendance).toBeDefined();
    expect(janeAttendance!.member_id).toEqual(member2.id);
    expect(janeAttendance!.status).toEqual('attended');
  });

  it('should return empty array for class with no bookings', async () => {
    // Create test class without any bookings
    const [testClassRecord] = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();

    const result = await getClassAttendance(testClassRecord.id);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should return empty array for non-existent class', async () => {
    const result = await getClassAttendance(999);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should include all booking statuses', async () => {
    // Create test member
    const [member] = await db.insert(membersTable)
      .values(testMember1)
      .returning()
      .execute();

    // Create test class
    const [testClassRecord] = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();

    // Create bookings with different statuses
    await db.insert(bookingsTable)
      .values([
        {
          member_id: member.id,
          class_id: testClassRecord.id,
          status: 'booked' as const
        },
        {
          member_id: member.id,
          class_id: testClassRecord.id,
          status: 'attended' as const
        },
        {
          member_id: member.id,
          class_id: testClassRecord.id,
          status: 'no_show' as const
        },
        {
          member_id: member.id,
          class_id: testClassRecord.id,
          status: 'cancelled' as const
        }
      ])
      .execute();

    const result = await getClassAttendance(testClassRecord.id);

    expect(result).toHaveLength(4);
    
    const statuses = result.map(r => r.status);
    expect(statuses).toContain('booked');
    expect(statuses).toContain('attended');
    expect(statuses).toContain('no_show');
    expect(statuses).toContain('cancelled');
  });

  it('should handle multiple members with same first/last name combination', async () => {
    // Create test members with identical names
    const [member1, member2] = await db.insert(membersTable)
      .values([
        { ...testMember1, email: 'john1@example.com' },
        { ...testMember1, email: 'john2@example.com' }
      ])
      .returning()
      .execute();

    // Create test class
    const [testClassRecord] = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();

    // Create bookings for both members
    await db.insert(bookingsTable)
      .values([
        {
          member_id: member1.id,
          class_id: testClassRecord.id,
          status: 'booked' as const
        },
        {
          member_id: member2.id,
          class_id: testClassRecord.id,
          status: 'attended' as const
        }
      ])
      .execute();

    const result = await getClassAttendance(testClassRecord.id);

    expect(result).toHaveLength(2);
    
    // Both should have the same name but different member IDs and statuses
    const johnRecords = result.filter(r => r.member_name === 'John Doe');
    expect(johnRecords).toHaveLength(2);
    
    const memberIds = johnRecords.map(r => r.member_id);
    expect(memberIds).toContain(member1.id);
    expect(memberIds).toContain(member2.id);
    
    const statuses = johnRecords.map(r => r.status);
    expect(statuses).toContain('booked');
    expect(statuses).toContain('attended');
  });

  it('should correctly format member names', async () => {
    // Create test member
    const [member] = await db.insert(membersTable)
      .values({
        ...testMember1,
        first_name: 'María José',
        last_name: 'González-Smith'
      })
      .returning()
      .execute();

    // Create test class
    const [testClassRecord] = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();

    // Create test booking
    await db.insert(bookingsTable)
      .values({
        member_id: member.id,
        class_id: testClassRecord.id,
        status: 'booked' as const
      })
      .execute();

    const result = await getClassAttendance(testClassRecord.id);

    expect(result).toHaveLength(1);
    expect(result[0].member_name).toEqual('María José González-Smith');
  });
});
