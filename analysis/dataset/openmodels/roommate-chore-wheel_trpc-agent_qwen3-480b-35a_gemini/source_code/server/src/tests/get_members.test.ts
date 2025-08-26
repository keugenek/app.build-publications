import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable } from '../db/schema';
import { getMembers } from '../handlers/get_members';
import { eq } from 'drizzle-orm';

describe('getMembers', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    await db.insert(membersTable).values([
      { name: 'Alice' },
      { name: 'Bob' },
      { name: 'Charlie' }
    ]).execute();
  });
  
  afterEach(resetDB);

  it('should fetch all members from the database', async () => {
    const members = await getMembers();
    
    expect(members).toHaveLength(3);
    
    // Check that all required fields are present
    members.forEach(member => {
      expect(member).toHaveProperty('id');
      expect(member).toHaveProperty('name');
      expect(member).toHaveProperty('created_at');
      expect(typeof member.id).toBe('number');
      expect(typeof member.name).toBe('string');
      expect(member.created_at).toBeInstanceOf(Date);
    });
    
    // Check specific values
    const names = members.map(m => m.name);
    expect(names).toContain('Alice');
    expect(names).toContain('Bob');
    expect(names).toContain('Charlie');
  });

  it('should return an empty array when no members exist', async () => {
    // Clear the database
    await db.delete(membersTable).execute();
    
    const members = await getMembers();
    expect(members).toHaveLength(0);
    expect(members).toEqual([]);
  });

  it('should correctly map database fields to schema fields', async () => {
    const members = await getMembers();
    const member = members[0];
    
    // Verify the structure matches our schema
    expect(member).toEqual({
      id: expect.any(Number),
      name: expect.any(String),
      created_at: expect.any(Date)
    });
  });
});
