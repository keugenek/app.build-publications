import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { membersTable } from '../db/schema';
import { type Member } from '../schema';
import { getMembers } from '../handlers/get_members';
import { eq } from 'drizzle-orm';

// Test data
const testMember: Omit<Member, 'id' | 'created_at'> = {
  name: 'John Doe',
  email: 'john.doe@example.com',
};

describe('getMembers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no members exist', async () => {
    const result = await getMembers();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('should fetch all members from the database', async () => {
    // Insert a member directly via DB
    const inserted = await db
      .insert(membersTable)
      .values({
        name: testMember.name,
        email: testMember.email,
      })
      .returning()
      .execute();

    const insertedMember = inserted[0];

    const result = await getMembers();

    expect(result).toHaveLength(1);
    const member = result[0];
    expect(member.id).toBeDefined();
    expect(member.name).toBe(testMember.name);
    expect(member.email).toBe(testMember.email);
    expect(member.created_at).toBeInstanceOf(Date);
    // Verify that the fetched record matches the inserted one
    expect(member.id).toEqual(insertedMember.id);
  });

  it('should return multiple members correctly', async () => {
    const membersToInsert = [
      { name: 'Alice', email: 'alice@example.com' },
      { name: 'Bob', email: 'bob@example.com' },
    ];

    await Promise.all(
      membersToInsert.map(m =>
        db.insert(membersTable).values(m).execute()
      )
    );

    const result = await getMembers();
    expect(result).toHaveLength(2);
    const emails = result.map(m => m.email);
    expect(emails).toContain('alice@example.com');
    expect(emails).toContain('bob@example.com');
  });
});
