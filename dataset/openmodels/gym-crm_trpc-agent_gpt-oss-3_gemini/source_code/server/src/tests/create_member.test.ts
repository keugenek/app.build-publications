import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable } from '../db/schema';
import { type CreateMemberInput } from '../schema';
import { createMember } from '../handlers/create_member';
import { eq } from 'drizzle-orm';

const testInput: CreateMemberInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
};

describe('createMember', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a member and return correct fields', async () => {
    const result = await createMember(testInput);
    expect(result.id).toBeGreaterThan(0);
    expect(result.name).toBe(testInput.name);
    expect(result.email).toBe(testInput.email);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the member in the database', async () => {
    const result = await createMember(testInput);
    const members = await db
      .select()
      .from(membersTable)
      .where(eq(membersTable.id, result.id))
      .execute();
    expect(members).toHaveLength(1);
    const member = members[0];
    expect(member.name).toBe(testInput.name);
    expect(member.email).toBe(testInput.email);
    expect(member.created_at).toBeInstanceOf(Date);
  });
});
