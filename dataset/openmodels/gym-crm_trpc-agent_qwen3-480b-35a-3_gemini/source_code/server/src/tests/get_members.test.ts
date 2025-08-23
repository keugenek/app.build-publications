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
      {
        name: 'John Doe',
        email: 'john@example.com'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com'
      },
      {
        name: 'Bob Johnson',
        email: 'bob@example.com'
      }
    ]).execute();
  });
  
  afterEach(resetDB);

  it('should return all members', async () => {
    const members = await getMembers();

    expect(members).toHaveLength(3);
    
    // Check that all expected members are returned
    const memberNames = members.map(m => m.name);
    expect(memberNames).toContain('John Doe');
    expect(memberNames).toContain('Jane Smith');
    expect(memberNames).toContain('Bob Johnson');
  });

  it('should return members with correct properties', async () => {
    const members = await getMembers();
    
    for (const member of members) {
      expect(member).toHaveProperty('id');
      expect(member).toHaveProperty('name');
      expect(member).toHaveProperty('email');
      expect(member).toHaveProperty('created_at');
      
      // Verify types
      expect(typeof member.id).toBe('number');
      expect(typeof member.name).toBe('string');
      expect(typeof member.email).toBe('string');
      expect(member.created_at).toBeInstanceOf(Date);
    }
  });

  it('should return members in the correct format', async () => {
    const members = await getMembers();
    
    const john = members.find(m => m.name === 'John Doe');
    expect(john).toBeDefined();
    expect(john?.email).toBe('john@example.com');
    
    const jane = members.find(m => m.name === 'Jane Smith');
    expect(jane).toBeDefined();
    expect(jane?.email).toBe('jane@example.com');
  });

  it('should return an empty array when no members exist', async () => {
    // Clear all members
    await db.delete(membersTable).execute();
    
    const members = await getMembers();
    expect(members).toHaveLength(0);
    expect(members).toEqual([]);
  });
});
