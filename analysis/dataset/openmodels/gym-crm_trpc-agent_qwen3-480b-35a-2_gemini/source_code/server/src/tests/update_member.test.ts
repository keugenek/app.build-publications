import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable } from '../db/schema';
import { type CreateMemberInput, type UpdateMemberInput } from '../schema';
import { updateMember } from '../handlers/update_member';
import { eq } from 'drizzle-orm';

// Test inputs
const createInput: CreateMemberInput = {
  name: 'John Doe',
  email: 'john.doe@example.com'
};

const updateInput: UpdateMemberInput = {
  id: 1,
  name: 'Jane Doe',
  email: 'jane.doe@example.com'
};

describe('updateMember', () => {
  beforeEach(async () => {
    await createDB();
    // Create a member to update
    await db.insert(membersTable).values(createInput).execute();
  });
  
  afterEach(resetDB);

  it('should update a member with all fields', async () => {
    const result = await updateMember(updateInput);

    // Basic field validation
    expect(result.id).toEqual(1);
    expect(result.name).toEqual('Jane Doe');
    expect(result.email).toEqual('jane.doe@example.com');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only the name field', async () => {
    const updateNameInput: UpdateMemberInput = {
      id: 1,
      name: 'Jane Smith'
    };

    const result = await updateMember(updateNameInput);

    // Should update name but keep original email
    expect(result.id).toEqual(1);
    expect(result.name).toEqual('Jane Smith');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only the email field', async () => {
    const updateEmailInput: UpdateMemberInput = {
      id: 1,
      email: 'jane.smith@example.com'
    };

    const result = await updateMember(updateEmailInput);

    // Should update email but keep original name
    expect(result.id).toEqual(1);
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('jane.smith@example.com');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated member to database', async () => {
    await updateMember(updateInput);

    // Query the updated member
    const members = await db.select()
      .from(membersTable)
      .where(eq(membersTable.id, 1))
      .execute();

    expect(members).toHaveLength(1);
    expect(members[0].name).toEqual('Jane Doe');
    expect(members[0].email).toEqual('jane.doe@example.com');
    expect(members[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw an error when member is not found', async () => {
    const invalidUpdateInput: UpdateMemberInput = {
      id: 999,
      name: 'Non-existent Member'
    };

    await expect(updateMember(invalidUpdateInput)).rejects.toThrow(/Member with id 999 not found/);
  });
});
