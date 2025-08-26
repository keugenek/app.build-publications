import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable } from '../db/schema';
import { type CreateMemberInput } from '../schema';
import { getMembers } from '../handlers/get_members';
import { eq } from 'drizzle-orm';

// Sample member data
const member1: CreateMemberInput = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '123-456-7890'
};

const member2: CreateMemberInput = {
  first_name: 'Jane',
  last_name: 'Smith',
  email: 'jane.smith@example.com',
  phone: null
};

describe('getMembers handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no members exist', async () => {
    const result = await getMembers();
    expect(Array.isArray(result)).toBeTrue();
    expect(result).toHaveLength(0);
  });

  it('should fetch all members from the database', async () => {
    // Insert two members directly using the DB client
    await db.insert(membersTable).values(member1).execute();
    await db.insert(membersTable).values(member2).execute();

    const result = await getMembers();

    // Basic array checks
    expect(result).toHaveLength(2);

    // Verify each member's fields and types
    const fetchedMember1 = result.find(m => m.email === member1.email);
    const fetchedMember2 = result.find(m => m.email === member2.email);

    expect(fetchedMember1).toBeDefined();
    expect(fetchedMember1?.first_name).toBe(member1.first_name);
    expect(fetchedMember1?.phone).toBe(member1.phone);
    expect(fetchedMember1?.created_at).toBeInstanceOf(Date);

    expect(fetchedMember2).toBeDefined();
    expect(fetchedMember2?.first_name).toBe(member2.first_name);
    expect(fetchedMember2?.phone).toBeNull();
    expect(fetchedMember2?.created_at).toBeInstanceOf(Date);
  });

  it('should reflect updates made directly in the DB', async () => {
    // Insert a member
    const insertResult = await db
      .insert(membersTable)
      .values(member1)
      .returning()
      .execute();
    const inserted = insertResult[0];

    // Update the member's phone directly
    await db
      .update(membersTable)
      .set({ phone: '999-999-9999' })
      .where(eq(membersTable.id, inserted.id))
      .execute();

    const result = await getMembers();
    const updated = result.find(m => m.id === inserted.id);
    expect(updated).toBeDefined();
    expect(updated?.phone).toBe('999-999-9999');
  });
});
