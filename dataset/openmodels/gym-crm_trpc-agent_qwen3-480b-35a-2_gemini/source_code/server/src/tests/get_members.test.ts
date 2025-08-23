import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable } from '../db/schema';
import { getMembers } from '../handlers/get_members';
import { type CreateMemberInput } from '../schema';

describe('getMembers', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    await db.insert(membersTable).values([
      {
        name: 'John Doe',
        email: 'john@example.com',
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
      },
      {
        name: 'Bob Johnson',
        email: 'bob@example.com',
      }
    ]).execute();
  });
  
  afterEach(resetDB);

  it('should fetch all members', async () => {
    const members = await getMembers();
    
    expect(members).toHaveLength(3);
    
    // Check that all expected members are returned
    const memberNames = members.map(m => m.name);
    expect(memberNames).toContain('John Doe');
    expect(memberNames).toContain('Jane Smith');
    expect(memberNames).toContain('Bob Johnson');
    
    // Check that all members have the expected properties
    members.forEach(member => {
      expect(member).toHaveProperty('id');
      expect(member).toHaveProperty('name');
      expect(member).toHaveProperty('email');
      expect(member).toHaveProperty('created_at');
      expect(member.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return empty array when no members exist', async () => {
    // Clear the database
    await resetDB();
    await createDB();
    
    const members = await getMembers();
    
    expect(members).toHaveLength(0);
    expect(members).toEqual([]);
  });

  it('should return members with correct data types', async () => {
    const members = await getMembers();
    
    const john = members.find(m => m.name === 'John Doe');
    expect(john).toBeDefined();
    
    if (john) {
      expect(typeof john.id).toBe('number');
      expect(typeof john.name).toBe('string');
      expect(typeof john.email).toBe('string');
      expect(john.created_at).toBeInstanceOf(Date);
    }
  });
});
