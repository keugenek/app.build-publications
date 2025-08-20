import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable } from '../db/schema';
import { type UpdateMemberInput } from '../schema';
import { updateMember } from '../handlers/update_member';
import { eq } from 'drizzle-orm';

describe('updateMember', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test member
  const createTestMember = async () => {
    const result = await db.insert(membersTable)
      .values({
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        phone: '555-1234',
        membership_type: 'basic',
        status: 'active'
      })
      .returning()
      .execute();
    
    return result[0];
  };

  it('should update a member successfully', async () => {
    const testMember = await createTestMember();

    const updateInput: UpdateMemberInput = {
      id: testMember.id,
      email: 'updated@example.com',
      first_name: 'Jane',
      last_name: 'Smith',
      membership_type: 'premium',
      status: 'inactive'
    };

    const result = await updateMember(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(testMember.id);
    expect(result.email).toEqual('updated@example.com');
    expect(result.first_name).toEqual('Jane');
    expect(result.last_name).toEqual('Smith');
    expect(result.membership_type).toEqual('premium');
    expect(result.status).toEqual('inactive');
    expect(result.phone).toEqual('555-1234'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testMember.updated_at).toBe(true);
  });

  it('should update only provided fields', async () => {
    const testMember = await createTestMember();

    const updateInput: UpdateMemberInput = {
      id: testMember.id,
      email: 'newemail@example.com',
      membership_type: 'vip'
    };

    const result = await updateMember(updateInput);

    // Verify only specified fields were updated
    expect(result.email).toEqual('newemail@example.com');
    expect(result.membership_type).toEqual('vip');
    
    // Verify other fields remained unchanged
    expect(result.first_name).toEqual(testMember.first_name);
    expect(result.last_name).toEqual(testMember.last_name);
    expect(result.phone).toEqual(testMember.phone);
    expect(result.status).toEqual(testMember.status);
    expect(result.joined_at).toEqual(testMember.joined_at);
    expect(result.created_at).toEqual(testMember.created_at);
  });

  it('should update phone to null', async () => {
    const testMember = await createTestMember();

    const updateInput: UpdateMemberInput = {
      id: testMember.id,
      phone: null
    };

    const result = await updateMember(updateInput);

    expect(result.phone).toBeNull();
    expect(result.email).toEqual(testMember.email); // Should remain unchanged
  });

  it('should save changes to database', async () => {
    const testMember = await createTestMember();

    const updateInput: UpdateMemberInput = {
      id: testMember.id,
      first_name: 'Updated',
      status: 'suspended'
    };

    await updateMember(updateInput);

    // Verify changes were persisted to database
    const dbMember = await db.select()
      .from(membersTable)
      .where(eq(membersTable.id, testMember.id))
      .execute();

    expect(dbMember).toHaveLength(1);
    expect(dbMember[0].first_name).toEqual('Updated');
    expect(dbMember[0].status).toEqual('suspended');
    expect(dbMember[0].updated_at).toBeInstanceOf(Date);
    expect(dbMember[0].updated_at > testMember.updated_at).toBe(true);
  });

  it('should throw error when member does not exist', async () => {
    const updateInput: UpdateMemberInput = {
      id: 99999, // Non-existent ID
      email: 'test@example.com'
    };

    await expect(updateMember(updateInput)).rejects.toThrow(/Member with id 99999 not found/i);
  });

  it('should handle all membership types', async () => {
    const testMember = await createTestMember();

    // Test basic membership
    let result = await updateMember({
      id: testMember.id,
      membership_type: 'basic'
    });
    expect(result.membership_type).toEqual('basic');

    // Test premium membership
    result = await updateMember({
      id: testMember.id,
      membership_type: 'premium'
    });
    expect(result.membership_type).toEqual('premium');

    // Test VIP membership
    result = await updateMember({
      id: testMember.id,
      membership_type: 'vip'
    });
    expect(result.membership_type).toEqual('vip');
  });

  it('should handle all member statuses', async () => {
    const testMember = await createTestMember();

    // Test active status
    let result = await updateMember({
      id: testMember.id,
      status: 'active'
    });
    expect(result.status).toEqual('active');

    // Test inactive status
    result = await updateMember({
      id: testMember.id,
      status: 'inactive'
    });
    expect(result.status).toEqual('inactive');

    // Test suspended status
    result = await updateMember({
      id: testMember.id,
      status: 'suspended'
    });
    expect(result.status).toEqual('suspended');
  });

  it('should preserve joined_at and created_at timestamps', async () => {
    const testMember = await createTestMember();

    const result = await updateMember({
      id: testMember.id,
      email: 'newemail@example.com'
    });

    expect(result.joined_at).toEqual(testMember.joined_at);
    expect(result.created_at).toEqual(testMember.created_at);
  });

  it('should update with empty update (only updated_at changes)', async () => {
    const testMember = await createTestMember();

    const updateInput: UpdateMemberInput = {
      id: testMember.id
    };

    const result = await updateMember(updateInput);

    // All fields should be the same except updated_at
    expect(result.email).toEqual(testMember.email);
    expect(result.first_name).toEqual(testMember.first_name);
    expect(result.last_name).toEqual(testMember.last_name);
    expect(result.phone).toEqual(testMember.phone);
    expect(result.membership_type).toEqual(testMember.membership_type);
    expect(result.status).toEqual(testMember.status);
    expect(result.joined_at).toEqual(testMember.joined_at);
    expect(result.created_at).toEqual(testMember.created_at);
    expect(result.updated_at > testMember.updated_at).toBe(true);
  });
});
