import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { membersTable } from '../db/schema';
import { type Member } from '../schema';
import { getMembers } from '../handlers/get_members';
import { eq } from 'drizzle-orm';

// Sample members for testing
const member1 = {
  name: 'Alice Smith',
  email: 'alice@example.com',
  phone: '555-1234',
} as const;

const member2 = {
  name: 'Bob Johnson',
  email: 'bob@example.com',
  phone: '555-5678',
} as const;

describe('getMembers handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no members exist', async () => {
    const result = await getMembers();
    expect(Array.isArray(result)).toBeTrue();
    expect(result).toHaveLength(0);
  });

  it('should retrieve all members from the database', async () => {
    // Insert test members directly via DB
    const inserted: Member[] = await db
      .insert(membersTable)
      .values([member1, member2])
      .returning()
      .execute();

    // Verify insertion succeeded
    expect(inserted).toHaveLength(2);
    // Call the handler
    const result = await getMembers();
    expect(result).toHaveLength(2);

    // Ensure each returned member matches one of the inserted rows
    const ids = inserted.map((m) => m.id);
    result.forEach((member) => {
      expect(ids).toContain(member.id);
      // Verify the other fields match the original input
      // Determine original by matching email
      // Since we don't know which id corresponds, match by email
      const matchingOriginal = [member1, member2].find((o) => o.email === member.email);
      expect(matchingOriginal).toBeDefined();
      if (matchingOriginal) {
        expect(member.name).toBe(matchingOriginal.name);
        expect(member.phone).toBe(matchingOriginal.phone);
      }
    });
  });
});
