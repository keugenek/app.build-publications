import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable } from '../db/schema';
import { type CreateMemberInput } from '../schema';
import { getMembers, type GetMembersFilters } from '../handlers/get_members';

// Test data
const testMembers: CreateMemberInput[] = [
  {
    email: 'alice@example.com',
    first_name: 'Alice',
    last_name: 'Johnson',
    phone: '+1234567890',
    membership_type: 'basic',
    status: 'active'
  },
  {
    email: 'bob@example.com',
    first_name: 'Bob',
    last_name: 'Smith',
    phone: null,
    membership_type: 'premium',
    status: 'active'
  },
  {
    email: 'charlie@example.com',
    first_name: 'Charlie',
    last_name: 'Brown',
    phone: '+1987654321',
    membership_type: 'vip',
    status: 'inactive'
  },
  {
    email: 'diana@example.com',
    first_name: 'Diana',
    last_name: 'Wilson',
    phone: '+1555666777',
    membership_type: 'basic',
    status: 'suspended'
  }
];

describe('getMembers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all members when no filters are provided', async () => {
    // Create test members
    await db.insert(membersTable).values(testMembers).execute();

    const result = await getMembers();

    expect(result).toHaveLength(4);
    expect(result.map(m => m.email).sort()).toEqual([
      'alice@example.com',
      'bob@example.com',
      'charlie@example.com',
      'diana@example.com'
    ]);

    // Verify member properties
    const alice = result.find(m => m.email === 'alice@example.com');
    expect(alice).toBeDefined();
    expect(alice!.first_name).toBe('Alice');
    expect(alice!.last_name).toBe('Johnson');
    expect(alice!.phone).toBe('+1234567890');
    expect(alice!.membership_type).toBe('basic');
    expect(alice!.status).toBe('active');
    expect(alice!.id).toBeDefined();
    expect(alice!.joined_at).toBeInstanceOf(Date);
    expect(alice!.created_at).toBeInstanceOf(Date);
    expect(alice!.updated_at).toBeInstanceOf(Date);
  });

  it('should return empty array when no members exist', async () => {
    const result = await getMembers();

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should filter members by status', async () => {
    // Create test members
    await db.insert(membersTable).values(testMembers).execute();

    // Test active members
    const activeFilters: GetMembersFilters = { status: 'active' };
    const activeResult = await getMembers(activeFilters);

    expect(activeResult).toHaveLength(2);
    expect(activeResult.every(m => m.status === 'active')).toBe(true);
    expect(activeResult.map(m => m.email).sort()).toEqual([
      'alice@example.com',
      'bob@example.com'
    ]);

    // Test inactive members
    const inactiveFilters: GetMembersFilters = { status: 'inactive' };
    const inactiveResult = await getMembers(inactiveFilters);

    expect(inactiveResult).toHaveLength(1);
    expect(inactiveResult[0].email).toBe('charlie@example.com');
    expect(inactiveResult[0].status).toBe('inactive');

    // Test suspended members
    const suspendedFilters: GetMembersFilters = { status: 'suspended' };
    const suspendedResult = await getMembers(suspendedFilters);

    expect(suspendedResult).toHaveLength(1);
    expect(suspendedResult[0].email).toBe('diana@example.com');
    expect(suspendedResult[0].status).toBe('suspended');
  });

  it('should filter members by membership type', async () => {
    // Create test members
    await db.insert(membersTable).values(testMembers).execute();

    // Test basic membership
    const basicFilters: GetMembersFilters = { membership_type: 'basic' };
    const basicResult = await getMembers(basicFilters);

    expect(basicResult).toHaveLength(2);
    expect(basicResult.every(m => m.membership_type === 'basic')).toBe(true);
    expect(basicResult.map(m => m.email).sort()).toEqual([
      'alice@example.com',
      'diana@example.com'
    ]);

    // Test premium membership
    const premiumFilters: GetMembersFilters = { membership_type: 'premium' };
    const premiumResult = await getMembers(premiumFilters);

    expect(premiumResult).toHaveLength(1);
    expect(premiumResult[0].email).toBe('bob@example.com');
    expect(premiumResult[0].membership_type).toBe('premium');

    // Test VIP membership
    const vipFilters: GetMembersFilters = { membership_type: 'vip' };
    const vipResult = await getMembers(vipFilters);

    expect(vipResult).toHaveLength(1);
    expect(vipResult[0].email).toBe('charlie@example.com');
    expect(vipResult[0].membership_type).toBe('vip');
  });

  it('should filter members by both status and membership type', async () => {
    // Create test members
    await db.insert(membersTable).values(testMembers).execute();

    // Test active basic members
    const activeBasicFilters: GetMembersFilters = {
      status: 'active',
      membership_type: 'basic'
    };
    const activeBasicResult = await getMembers(activeBasicFilters);

    expect(activeBasicResult).toHaveLength(1);
    expect(activeBasicResult[0].email).toBe('alice@example.com');
    expect(activeBasicResult[0].status).toBe('active');
    expect(activeBasicResult[0].membership_type).toBe('basic');

    // Test inactive VIP members
    const inactiveVipFilters: GetMembersFilters = {
      status: 'inactive',
      membership_type: 'vip'
    };
    const inactiveVipResult = await getMembers(inactiveVipFilters);

    expect(inactiveVipResult).toHaveLength(1);
    expect(inactiveVipResult[0].email).toBe('charlie@example.com');
    expect(inactiveVipResult[0].status).toBe('inactive');
    expect(inactiveVipResult[0].membership_type).toBe('vip');

    // Test combination with no matches
    const noMatchFilters: GetMembersFilters = {
      status: 'active',
      membership_type: 'vip'
    };
    const noMatchResult = await getMembers(noMatchFilters);

    expect(noMatchResult).toHaveLength(0);
  });

  it('should handle null phone numbers correctly', async () => {
    // Create test members
    await db.insert(membersTable).values(testMembers).execute();

    const result = await getMembers();
    
    const bobMember = result.find(m => m.email === 'bob@example.com');
    expect(bobMember).toBeDefined();
    expect(bobMember!.phone).toBeNull();

    const aliceMember = result.find(m => m.email === 'alice@example.com');
    expect(aliceMember).toBeDefined();
    expect(aliceMember!.phone).toBe('+1234567890');
  });

  it('should preserve proper date types', async () => {
    // Create test members
    await db.insert(membersTable).values([testMembers[0]]).execute();

    const result = await getMembers();

    expect(result).toHaveLength(1);
    const member = result[0];

    expect(member.joined_at).toBeInstanceOf(Date);
    expect(member.created_at).toBeInstanceOf(Date);
    expect(member.updated_at).toBeInstanceOf(Date);

    // Verify dates are reasonable (not in the future, not too old)
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    expect(member.joined_at.getTime()).toBeGreaterThan(oneHourAgo.getTime());
    expect(member.joined_at.getTime()).toBeLessThanOrEqual(now.getTime());
    expect(member.created_at.getTime()).toBeGreaterThan(oneHourAgo.getTime());
    expect(member.created_at.getTime()).toBeLessThanOrEqual(now.getTime());
  });
});
