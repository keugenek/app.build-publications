import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable } from '../db/schema';
import { getMembers } from '../handlers/get_members';

describe('getMembers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no members exist', async () => {
    const result = await getMembers();

    expect(result).toEqual([]);
  });

  it('should return all members from the database', async () => {
    // Create test members
    await db.insert(membersTable).values([
      { name: 'Alice' },
      { name: 'Bob' },
      { name: 'Charlie' }
    ]).execute();

    const result = await getMembers();

    expect(result).toHaveLength(3);
    expect(result.map(m => m.name)).toContain('Alice');
    expect(result.map(m => m.name)).toContain('Bob');
    expect(result.map(m => m.name)).toContain('Charlie');
  });

  it('should return members with correct structure', async () => {
    // Create a test member
    await db.insert(membersTable).values({
      name: 'Test Member'
    }).execute();

    const result = await getMembers();

    expect(result).toHaveLength(1);
    const member = result[0];
    
    // Verify all required fields are present
    expect(member.id).toBeDefined();
    expect(typeof member.id).toBe('number');
    expect(member.name).toEqual('Test Member');
    expect(member.created_at).toBeInstanceOf(Date);
  });

  it('should return members ordered by id (insertion order)', async () => {
    // Create multiple members in sequence
    const member1 = await db.insert(membersTable)
      .values({ name: 'First Member' })
      .returning()
      .execute();
    
    const member2 = await db.insert(membersTable)
      .values({ name: 'Second Member' })
      .returning()
      .execute();

    const result = await getMembers();

    expect(result).toHaveLength(2);
    // Members should be in insertion order (by id)
    expect(result[0].id).toBeLessThan(result[1].id);
    expect(result[0].name).toEqual('First Member');
    expect(result[1].name).toEqual('Second Member');
  });

  it('should handle members with various name lengths', async () => {
    // Create members with different name characteristics
    await db.insert(membersTable).values([
      { name: 'A' }, // Single character
      { name: 'Very Long Member Name With Many Words' }, // Long name
      { name: 'Member with Special Ch@rs & Numbers 123' } // Special characters
    ]).execute();

    const result = await getMembers();

    expect(result).toHaveLength(3);
    expect(result.some(m => m.name === 'A')).toBe(true);
    expect(result.some(m => m.name === 'Very Long Member Name With Many Words')).toBe(true);
    expect(result.some(m => m.name === 'Member with Special Ch@rs & Numbers 123')).toBe(true);
  });
});
