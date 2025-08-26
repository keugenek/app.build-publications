import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable } from '../db/schema';
import { type CreateMemberInput } from '../schema';
import { createMember } from '../handlers/create_member';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateMemberInput = {
  name: 'John Doe'
};

describe('createMember', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a member', async () => {
    const result = await createMember(testInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save member to database', async () => {
    const result = await createMember(testInput);

    // Query using proper drizzle syntax
    const members = await db.select()
      .from(membersTable)
      .where(eq(membersTable.id, result.id))
      .execute();

    expect(members).toHaveLength(1);
    expect(members[0].name).toEqual('John Doe');
    expect(members[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple members with unique IDs', async () => {
    const firstMember = await createMember({ name: 'Alice Smith' });
    const secondMember = await createMember({ name: 'Bob Jones' });

    expect(firstMember.id).not.toEqual(secondMember.id);
    expect(firstMember.name).toEqual('Alice Smith');
    expect(secondMember.name).toEqual('Bob Jones');

    // Verify both are saved to database
    const members = await db.select()
      .from(membersTable)
      .execute();

    expect(members).toHaveLength(2);
    const names = members.map(m => m.name).sort();
    expect(names).toEqual(['Alice Smith', 'Bob Jones']);
  });

  it('should handle empty string name gracefully', async () => {
    // Note: The Zod schema validation would normally catch this,
    // but testing what happens if it gets through
    const emptyNameInput: CreateMemberInput = { name: '' };
    
    const result = await createMember(emptyNameInput);
    
    expect(result.name).toEqual('');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create members with names containing special characters', async () => {
    const specialInput: CreateMemberInput = {
      name: "María José O'Connor-Smith"
    };

    const result = await createMember(specialInput);

    expect(result.name).toEqual("María José O'Connor-Smith");
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify it's saved correctly in database
    const members = await db.select()
      .from(membersTable)
      .where(eq(membersTable.id, result.id))
      .execute();

    expect(members[0].name).toEqual("María José O'Connor-Smith");
  });
});
