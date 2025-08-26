import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable } from '../db/schema';
import { type GetMembersInput, type CreateMemberInput } from '../schema';
import { getMembers } from '../handlers/get_members';

// Helper function to create test member
const createTestMember = async (memberData: Partial<CreateMemberInput> = {}) => {
  const defaultMember: CreateMemberInput = {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    membership_type: 'basic',
    membership_start_date: new Date('2024-01-01'),
    membership_end_date: new Date('2024-12-31'),
    ...memberData
  };

  // Convert Date objects to strings for database insertion
  const dbMember = {
    ...defaultMember,
    membership_start_date: defaultMember.membership_start_date.toISOString().split('T')[0],
    membership_end_date: defaultMember.membership_end_date.toISOString().split('T')[0]
  };

  const result = await db.insert(membersTable)
    .values(dbMember)
    .returning()
    .execute();

  return result[0];
};

describe('getMembers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all members when no filters provided', async () => {
    // Create test members
    await createTestMember({ first_name: 'John', email: 'john@example.com' });
    await createTestMember({ first_name: 'Jane', email: 'jane@example.com' });
    await createTestMember({ first_name: 'Bob', email: 'bob@example.com' });

    const result = await getMembers();

    expect(result).toHaveLength(3);
    expect(result[0].first_name).toBeDefined();
    expect(result[0].email).toBeDefined();
    expect(result[0].membership_type).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return empty array when no members exist', async () => {
    const result = await getMembers();
    expect(result).toHaveLength(0);
  });

  it('should filter by is_active status', async () => {
    // Create active and inactive members
    await createTestMember({ first_name: 'Active1', email: 'active1@example.com' });
    await createTestMember({ first_name: 'Active2', email: 'active2@example.com' });
    
    // Create inactive member by inserting with is_active = false
    await db.insert(membersTable).values({
      first_name: 'Inactive',
      last_name: 'User',
      email: 'inactive@example.com',
      phone: null,
      membership_type: 'basic',
      membership_start_date: '2024-01-01',
      membership_end_date: '2024-12-31',
      is_active: false
    }).execute();

    const filters: GetMembersInput = { is_active: true };
    const result = await getMembers(filters);

    expect(result).toHaveLength(2);
    expect(result.every(member => member.is_active === true)).toBe(true);

    // Test inactive filter
    const inactiveFilters: GetMembersInput = { is_active: false };
    const inactiveResult = await getMembers(inactiveFilters);

    expect(inactiveResult).toHaveLength(1);
    expect(inactiveResult[0].first_name).toEqual('Inactive');
    expect(inactiveResult[0].is_active).toBe(false);
  });

  it('should filter by membership_type', async () => {
    await createTestMember({ 
      first_name: 'Basic', 
      email: 'basic@example.com', 
      membership_type: 'basic' 
    });
    await createTestMember({ 
      first_name: 'Premium', 
      email: 'premium@example.com', 
      membership_type: 'premium' 
    });
    await createTestMember({ 
      first_name: 'VIP', 
      email: 'vip@example.com', 
      membership_type: 'vip' 
    });

    const filters: GetMembersInput = { membership_type: 'premium' };
    const result = await getMembers(filters);

    expect(result).toHaveLength(1);
    expect(result[0].first_name).toEqual('Premium');
    expect(result[0].membership_type).toEqual('premium');
  });

  it('should search by first name (case insensitive)', async () => {
    await createTestMember({ 
      first_name: 'Alexander', 
      last_name: 'Smith',
      email: 'alex@example.com' 
    });
    await createTestMember({ 
      first_name: 'John', 
      last_name: 'Doe',
      email: 'john@example.com' 
    });

    const filters: GetMembersInput = { search: 'alex' };
    const result = await getMembers(filters);

    expect(result).toHaveLength(1);
    expect(result[0].first_name).toEqual('Alexander');

    // Test case insensitivity
    const upperFilters: GetMembersInput = { search: 'ALEX' };
    const upperResult = await getMembers(upperFilters);
    expect(upperResult).toHaveLength(1);
  });

  it('should search by last name (case insensitive)', async () => {
    await createTestMember({ 
      first_name: 'John', 
      last_name: 'Smith',
      email: 'john.smith@example.com' 
    });
    await createTestMember({ 
      first_name: 'Jane', 
      last_name: 'Johnson',
      email: 'jane.johnson@example.com' 
    });

    const filters: GetMembersInput = { search: 'smith' };
    const result = await getMembers(filters);

    expect(result).toHaveLength(1);
    expect(result[0].last_name).toEqual('Smith');
  });

  it('should search by email (case insensitive)', async () => {
    await createTestMember({ 
      first_name: 'John', 
      email: 'john.special@example.com' 
    });
    await createTestMember({ 
      first_name: 'Jane', 
      email: 'jane@example.com' 
    });

    const filters: GetMembersInput = { search: 'special' };
    const result = await getMembers(filters);

    expect(result).toHaveLength(1);
    expect(result[0].email).toEqual('john.special@example.com');
  });

  it('should handle partial matches in search', async () => {
    await createTestMember({ 
      first_name: 'Christopher', 
      email: 'chris@example.com' 
    });

    const filters: GetMembersInput = { search: 'chris' };
    const result = await getMembers(filters);

    expect(result).toHaveLength(1);
    expect(result[0].first_name).toEqual('Christopher');
  });

  it('should return empty array when search finds no matches', async () => {
    await createTestMember({ 
      first_name: 'John', 
      email: 'john@example.com' 
    });

    const filters: GetMembersInput = { search: 'nonexistent' };
    const result = await getMembers(filters);

    expect(result).toHaveLength(0);
  });

  it('should combine multiple filters correctly', async () => {
    // Create test members with different combinations
    await createTestMember({ 
      first_name: 'John', 
      email: 'john@example.com',
      membership_type: 'premium'
    });
    
    await db.insert(membersTable).values({
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      phone: null,
      membership_type: 'premium',
      membership_start_date: '2024-01-01',
      membership_end_date: '2024-12-31',
      is_active: false
    }).execute();

    await createTestMember({ 
      first_name: 'Bob', 
      email: 'bob@example.com',
      membership_type: 'basic'
    });

    // Filter: active premium members with 'john' in name/email
    const filters: GetMembersInput = { 
      is_active: true,
      membership_type: 'premium',
      search: 'john'
    };
    const result = await getMembers(filters);

    expect(result).toHaveLength(1);
    expect(result[0].first_name).toEqual('John');
    expect(result[0].membership_type).toEqual('premium');
    expect(result[0].is_active).toBe(true);
  });

  it('should return all fields for each member', async () => {
    await createTestMember({
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      phone: '+1234567890',
      membership_type: 'vip',
      membership_start_date: new Date('2024-01-01'),
      membership_end_date: new Date('2024-12-31')
    });

    const result = await getMembers();

    expect(result).toHaveLength(1);
    const member = result[0];
    
    expect(member.id).toBeDefined();
    expect(member.first_name).toEqual('Test');
    expect(member.last_name).toEqual('User');
    expect(member.email).toEqual('test@example.com');
    expect(member.phone).toEqual('+1234567890');
    expect(member.membership_type).toEqual('vip');
    expect(member.membership_start_date).toBeInstanceOf(Date);
    expect(member.membership_end_date).toBeInstanceOf(Date);
    expect(member.is_active).toBe(true);
    expect(member.created_at).toBeInstanceOf(Date);
    expect(member.updated_at).toBeInstanceOf(Date);
  });
});
