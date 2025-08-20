import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable } from '../db/schema';
import { type CreateMemberInput } from '../schema';
import { createMember } from '../handlers/create_member';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateMemberInput = {
  name: 'Test Member'
};

describe('createMember', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a member', async () => {
    const result = await createMember(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Member');
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
    expect(members[0].name).toEqual('Test Member');
    expect(members[0].created_at).toBeInstanceOf(Date);
  });
});
