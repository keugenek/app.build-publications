import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable } from '../db/schema';
import { type CreateMemberInput } from '../schema';
import { createMember } from '../handlers/create_member';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateMemberInput = {
  name: 'John Doe',
  email: 'john.doe@example.com'
};

describe('createMember', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a member', async () => {
    const result = await createMember(testInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save member to database', async () => {
    const result = await createMember(testInput);

    // Query using proper drizzle syntax
    const members = await db.select()
      .from(membersTable)
      .where(eq(membersTable.id, result.id))
      .execute();

    expect(members).toHaveLength(1);
    expect(members[0].name).toEqual('John Doe');
    expect(members[0].email).toEqual('john.doe@example.com');
    expect(members[0].created_at).toBeInstanceOf(Date);
  });

  it('should reject duplicate email', async () => {
    // Create first member
    await createMember(testInput);

    // Try to create another member with the same email
    const duplicateInput: CreateMemberInput = {
      name: 'Jane Doe',
      email: 'john.doe@example.com' // Same email
    };

    await expect(createMember(duplicateInput)).rejects.toThrow(/unique constraint/i);
  });
});
