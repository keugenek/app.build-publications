import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable } from '../db/schema';
import { type UpdateMemberInput, type CreateMemberInput } from '../schema';
import { updateMember } from '../handlers/update_member';
import { eq } from 'drizzle-orm';

// Helper function to create a test member
const createTestMember = async (memberData: Partial<CreateMemberInput> = {}) => {
  const defaultMemberData: CreateMemberInput = {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '555-1234',
    membership_type: 'basic',
    membership_start_date: new Date('2024-01-01'),
    membership_end_date: new Date('2024-12-31'),
    ...memberData
  };

  const result = await db.insert(membersTable)
    .values({
      ...defaultMemberData,
      membership_start_date: defaultMemberData.membership_start_date.toISOString().split('T')[0],
      membership_end_date: defaultMemberData.membership_end_date.toISOString().split('T')[0]
    })
    .returning()
    .execute();

  // Convert date strings back to Date objects for consistency
  const member = result[0];
  return {
    ...member,
    membership_start_date: new Date(member.membership_start_date),
    membership_end_date: new Date(member.membership_end_date)
  };
};

describe('updateMember', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a member with all fields', async () => {
    // Create a test member
    const member = await createTestMember();

    const updateInput: UpdateMemberInput = {
      id: member.id,
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      phone: '555-9876',
      membership_type: 'premium',
      membership_start_date: new Date('2024-02-01'),
      membership_end_date: new Date('2025-01-31'),
      is_active: false
    };

    const result = await updateMember(updateInput);

    // Verify the returned member has updated fields
    expect(result.id).toEqual(member.id);
    expect(result.first_name).toEqual('Jane');
    expect(result.last_name).toEqual('Smith');
    expect(result.email).toEqual('jane.smith@example.com');
    expect(result.phone).toEqual('555-9876');
    expect(result.membership_type).toEqual('premium');
    expect(result.membership_start_date).toEqual(new Date('2024-02-01'));
    expect(result.membership_end_date).toEqual(new Date('2025-01-31'));
    expect(result.is_active).toEqual(false);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toEqual(member.created_at);
  });

  it('should update only specified fields', async () => {
    // Create a test member
    const member = await createTestMember();

    const updateInput: UpdateMemberInput = {
      id: member.id,
      first_name: 'Jane',
      membership_type: 'vip'
    };

    const result = await updateMember(updateInput);

    // Verify only specified fields are updated
    expect(result.id).toEqual(member.id);
    expect(result.first_name).toEqual('Jane');
    expect(result.membership_type).toEqual('vip');
    
    // Other fields should remain unchanged
    expect(result.last_name).toEqual(member.last_name);
    expect(result.email).toEqual(member.email);
    expect(result.phone).toEqual(member.phone);
    expect(result.membership_start_date).toEqual(member.membership_start_date);
    expect(result.membership_end_date).toEqual(member.membership_end_date);
    expect(result.is_active).toEqual(member.is_active);
    expect(result.created_at).toEqual(member.created_at);
    
    // Updated timestamp should be newer
    expect(result.updated_at > member.updated_at).toBe(true);
  });

  it('should save updated member to database', async () => {
    // Create a test member
    const member = await createTestMember();

    const updateInput: UpdateMemberInput = {
      id: member.id,
      first_name: 'Jane',
      email: 'jane.updated@example.com',
      is_active: false
    };

    await updateMember(updateInput);

    // Query database directly to verify changes were persisted
    const updatedMember = await db.select()
      .from(membersTable)
      .where(eq(membersTable.id, member.id))
      .execute();

    expect(updatedMember).toHaveLength(1);
    expect(updatedMember[0].first_name).toEqual('Jane');
    expect(updatedMember[0].email).toEqual('jane.updated@example.com');
    expect(updatedMember[0].is_active).toEqual(false);
    expect(updatedMember[0].last_name).toEqual(member.last_name); // Unchanged
  });

  it('should handle phone number update to null', async () => {
    // Create a test member with a phone number
    const member = await createTestMember({ phone: '555-1234' });

    const updateInput: UpdateMemberInput = {
      id: member.id,
      phone: null
    };

    const result = await updateMember(updateInput);

    expect(result.phone).toBeNull();
  });

  it('should handle membership type changes', async () => {
    // Create a basic member
    const member = await createTestMember({ membership_type: 'basic' });

    // Upgrade to premium
    let updateInput: UpdateMemberInput = {
      id: member.id,
      membership_type: 'premium'
    };

    let result = await updateMember(updateInput);
    expect(result.membership_type).toEqual('premium');

    // Upgrade to VIP
    updateInput = {
      id: member.id,
      membership_type: 'vip'
    };

    result = await updateMember(updateInput);
    expect(result.membership_type).toEqual('vip');
  });

  it('should handle date updates correctly', async () => {
    // Create a test member
    const member = await createTestMember();

    const newStartDate = new Date('2024-03-01T00:00:00.000Z');
    const newEndDate = new Date('2025-02-28T00:00:00.000Z');

    const updateInput: UpdateMemberInput = {
      id: member.id,
      membership_start_date: newStartDate,
      membership_end_date: newEndDate
    };

    const result = await updateMember(updateInput);

    expect(result.membership_start_date).toEqual(newStartDate);
    expect(result.membership_end_date).toEqual(newEndDate);
  });

  it('should throw error when member does not exist', async () => {
    const updateInput: UpdateMemberInput = {
      id: 99999, // Non-existent ID
      first_name: 'Jane'
    };

    expect(updateMember(updateInput)).rejects.toThrow(/Member with id 99999 not found/i);
  });

  it('should handle email uniqueness constraint', async () => {
    // Create two test members
    const member1 = await createTestMember({ email: 'member1@example.com' });
    const member2 = await createTestMember({ email: 'member2@example.com' });

    const updateInput: UpdateMemberInput = {
      id: member2.id,
      email: 'member1@example.com' // Try to use member1's email
    };

    // This should fail due to unique constraint
    expect(updateMember(updateInput)).rejects.toThrow();
  });

  it('should always update the updated_at timestamp', async () => {
    // Create a test member
    const member = await createTestMember();
    const originalUpdatedAt = member.updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1));

    const updateInput: UpdateMemberInput = {
      id: member.id,
      first_name: 'Updated Name'
    };

    const result = await updateMember(updateInput);

    // Verify updated_at timestamp was changed
    expect(result.updated_at > originalUpdatedAt).toBe(true);
  });

  it('should handle boolean field updates correctly', async () => {
    // Create an active member
    const member = await createTestMember();
    expect(member.is_active).toBe(true);

    // Deactivate the member
    let updateInput: UpdateMemberInput = {
      id: member.id,
      is_active: false
    };

    let result = await updateMember(updateInput);
    expect(result.is_active).toBe(false);

    // Reactivate the member
    updateInput = {
      id: member.id,
      is_active: true
    };

    result = await updateMember(updateInput);
    expect(result.is_active).toBe(true);
  });
});
