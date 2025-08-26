import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { membersTable } from '../db/schema';
import { type CreateMemberInput } from '../schema';
import { createMember } from '../handlers/create_member';
import { eq } from 'drizzle-orm';

// Test input covering all fields (including nullable phone)
const testInput: CreateMemberInput = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: null,
};

describe('createMember', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a member and return correct data', async () => {
    const result = await createMember(testInput);

    // Validate returned object structure
    expect(result.id).toBeDefined();
    expect(result.first_name).toBe(testInput.first_name);
    expect(result.last_name).toBe(testInput.last_name);
    expect(result.email).toBe(testInput.email);
    expect(result.phone).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the member in the database', async () => {
    const result = await createMember(testInput);

    const records = await db.select().from(membersTable).where(eq(membersTable.id, result.id)).execute();
    expect(records).toHaveLength(1);
    const saved = records[0];
    expect(saved.first_name).toBe(testInput.first_name);
    expect(saved.last_name).toBe(testInput.last_name);
    expect(saved.email).toBe(testInput.email);
    expect(saved.phone).toBeNull();
    expect(saved.created_at).toBeInstanceOf(Date);
  });
});
