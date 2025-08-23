import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { membersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { updateMember } from '../handlers/update_member';
import { type UpdateMemberInput } from '../schema';

// Helper to insert a member directly
const insertMember = async (name: string, email: string) => {
  const result = await db
    .insert(membersTable)
    .values({ name, email })
    .returning()
    .execute();
  return result[0];
};

describe('updateMember handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('updates both name and email', async () => {
    const original = await insertMember('Alice', 'alice@example.com');
    const input: UpdateMemberInput = {
      id: original.id,
      name: 'Alice Updated',
      email: 'alice.updated@example.com',
    };
    const updated = await updateMember(input);
    expect(updated.id).toBe(original.id);
    expect(updated.name).toBe('Alice Updated');
    expect(updated.email).toBe('alice.updated@example.com');
    // Verify persisted
    const fetched = await db
      .select()
      .from(membersTable)
      .where(eq(membersTable.id, original.id))
      .execute();
    expect(fetched[0].name).toBe('Alice Updated');
    expect(fetched[0].email).toBe('alice.updated@example.com');
  });

  it('partial update (only name)', async () => {
    const original = await insertMember('Bob', 'bob@example.com');
    const input: UpdateMemberInput = {
      id: original.id,
      name: 'Bob New',
    };
    const updated = await updateMember(input);
    expect(updated.name).toBe('Bob New');
    expect(updated.email).toBe('bob@example.com');
  });

  it('no fields provided returns existing member', async () => {
    const original = await insertMember('Carol', 'carol@example.com');
    const input: UpdateMemberInput = { id: original.id };
    const result = await updateMember(input);
    expect(result.id).toBe(original.id);
    expect(result.name).toBe('Carol');
    expect(result.email).toBe('carol@example.com');
  });

  it('throws error when member does not exist', async () => {
    const input: UpdateMemberInput = { id: 9999, name: 'Ghost' };
    await expect(updateMember(input)).rejects.toThrow('Member not found');
  });
});
