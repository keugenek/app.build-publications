import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable } from '../db/schema';
import { type CreateMemberInput } from '../schema';
import { getMemberById } from '../handlers/get_member_by_id';

// Test member data
const testMember: CreateMemberInput = {
  email: 'john.doe@example.com',
  first_name: 'John',
  last_name: 'Doe',
  phone: '+1234567890',
  membership_type: 'premium',
  status: 'active'
};

describe('getMemberById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return member when found', async () => {
    // Create test member
    const insertResult = await db.insert(membersTable)
      .values({
        email: testMember.email,
        first_name: testMember.first_name,
        last_name: testMember.last_name,
        phone: testMember.phone,
        membership_type: testMember.membership_type,
        status: testMember.status
      })
      .returning()
      .execute();

    const createdMember = insertResult[0];
    
    // Test the handler
    const result = await getMemberById(createdMember.id);

    // Verify result
    expect(result).not.toBeNull();
    expect(result!.id).toBe(createdMember.id);
    expect(result!.email).toBe(testMember.email);
    expect(result!.first_name).toBe(testMember.first_name);
    expect(result!.last_name).toBe(testMember.last_name);
    expect(result!.phone).toBe(testMember.phone);
    expect(result!.membership_type).toBe(testMember.membership_type);
    expect(result!.status).toBe(testMember.status);
    expect(result!.joined_at).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when member not found', async () => {
    // Test with non-existent ID
    const result = await getMemberById(999);
    
    expect(result).toBeNull();
  });

  it('should handle member with null phone', async () => {
    // Create member without phone
    const memberWithoutPhone: CreateMemberInput = {
      email: 'jane.smith@example.com',
      first_name: 'Jane',
      last_name: 'Smith',
      phone: null,
      membership_type: 'basic',
      status: 'active'
    };

    const insertResult = await db.insert(membersTable)
      .values({
        email: memberWithoutPhone.email,
        first_name: memberWithoutPhone.first_name,
        last_name: memberWithoutPhone.last_name,
        phone: memberWithoutPhone.phone,
        membership_type: memberWithoutPhone.membership_type,
        status: memberWithoutPhone.status
      })
      .returning()
      .execute();

    const createdMember = insertResult[0];
    
    // Test the handler
    const result = await getMemberById(createdMember.id);

    expect(result).not.toBeNull();
    expect(result!.phone).toBeNull();
    expect(result!.email).toBe(memberWithoutPhone.email);
    expect(result!.membership_type).toBe('basic');
    expect(result!.status).toBe('active');
  });

  it('should handle different membership types and statuses', async () => {
    // Create VIP member with inactive status
    const vipMember: CreateMemberInput = {
      email: 'vip.member@example.com',
      first_name: 'VIP',
      last_name: 'Member',
      phone: '+9876543210',
      membership_type: 'vip',
      status: 'inactive'
    };

    const insertResult = await db.insert(membersTable)
      .values({
        email: vipMember.email,
        first_name: vipMember.first_name,
        last_name: vipMember.last_name,
        phone: vipMember.phone,
        membership_type: vipMember.membership_type,
        status: vipMember.status
      })
      .returning()
      .execute();

    const createdMember = insertResult[0];
    
    const result = await getMemberById(createdMember.id);

    expect(result).not.toBeNull();
    expect(result!.membership_type).toBe('vip');
    expect(result!.status).toBe('inactive');
  });

  it('should verify database consistency', async () => {
    // Create multiple members
    const member1Data: CreateMemberInput = {
      email: 'member1@example.com',
      first_name: 'Member',
      last_name: 'One',
      phone: '+1111111111',
      membership_type: 'basic',
      status: 'active'
    };

    const member2Data: CreateMemberInput = {
      email: 'member2@example.com',
      first_name: 'Member',
      last_name: 'Two',
      phone: '+2222222222',
      membership_type: 'premium',
      status: 'suspended'
    };

    const insertResults = await db.insert(membersTable)
      .values([
        {
          email: member1Data.email,
          first_name: member1Data.first_name,
          last_name: member1Data.last_name,
          phone: member1Data.phone,
          membership_type: member1Data.membership_type,
          status: member1Data.status
        },
        {
          email: member2Data.email,
          first_name: member2Data.first_name,
          last_name: member2Data.last_name,
          phone: member2Data.phone,
          membership_type: member2Data.membership_type,
          status: member2Data.status
        }
      ])
      .returning()
      .execute();

    const [member1, member2] = insertResults;

    // Test fetching first member
    const result1 = await getMemberById(member1.id);
    expect(result1).not.toBeNull();
    expect(result1!.email).toBe(member1Data.email);
    expect(result1!.membership_type).toBe('basic');

    // Test fetching second member  
    const result2 = await getMemberById(member2.id);
    expect(result2).not.toBeNull();
    expect(result2!.email).toBe(member2Data.email);
    expect(result2!.membership_type).toBe('premium');
    expect(result2!.status).toBe('suspended');

    // Verify they are different members
    expect(result1!.id).not.toBe(result2!.id);
  });
});
