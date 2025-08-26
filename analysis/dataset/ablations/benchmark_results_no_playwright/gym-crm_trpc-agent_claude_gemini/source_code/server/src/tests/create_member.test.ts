import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable } from '../db/schema';
import { type CreateMemberInput } from '../schema';
import { createMember } from '../handlers/create_member';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateMemberInput = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  membership_type: 'premium',
  membership_start_date: new Date('2024-01-01'),
  membership_end_date: new Date('2024-12-31')
};

// Test input with null phone (nullable field)
const testInputNullPhone: CreateMemberInput = {
  first_name: 'Jane',
  last_name: 'Smith',
  email: 'jane.smith@example.com',
  phone: null,
  membership_type: 'basic',
  membership_start_date: new Date('2024-02-01'),
  membership_end_date: new Date('2024-12-31')
};

describe('createMember', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a member with all fields', async () => {
    const result = await createMember(testInput);

    // Basic field validation
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.phone).toEqual('+1234567890');
    expect(result.membership_type).toEqual('premium');
    expect(result.membership_start_date).toEqual(new Date('2024-01-01'));
    expect(result.membership_end_date).toEqual(new Date('2024-12-31'));
    expect(result.is_active).toEqual(true); // Default value
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a member with null phone', async () => {
    const result = await createMember(testInputNullPhone);

    expect(result.first_name).toEqual('Jane');
    expect(result.last_name).toEqual('Smith');
    expect(result.email).toEqual('jane.smith@example.com');
    expect(result.phone).toBeNull();
    expect(result.membership_type).toEqual('basic');
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save member to database', async () => {
    const uniqueInput = {
      ...testInput,
      email: 'save.test@example.com'
    };
    const result = await createMember(uniqueInput);

    // Query using proper drizzle syntax
    const members = await db.select()
      .from(membersTable)
      .where(eq(membersTable.id, result.id))
      .execute();

    expect(members).toHaveLength(1);
    expect(members[0].first_name).toEqual('John');
    expect(members[0].last_name).toEqual('Doe');
    expect(members[0].email).toEqual('save.test@example.com');
    expect(members[0].phone).toEqual('+1234567890');
    expect(members[0].membership_type).toEqual('premium');
    expect(members[0].membership_start_date).toEqual('2024-01-01'); // Database stores as string
    expect(members[0].membership_end_date).toEqual('2024-12-31'); // Database stores as string
    expect(members[0].is_active).toEqual(true);
    expect(members[0].created_at).toBeInstanceOf(Date);
    expect(members[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle different membership types', async () => {
    // Test basic membership
    const basicInput: CreateMemberInput = {
      ...testInput,
      email: 'basic@example.com',
      membership_type: 'basic'
    };
    const basicResult = await createMember(basicInput);
    expect(basicResult.membership_type).toEqual('basic');

    // Test VIP membership
    const vipInput: CreateMemberInput = {
      ...testInput,
      email: 'vip@example.com',
      membership_type: 'vip'
    };
    const vipResult = await createMember(vipInput);
    expect(vipResult.membership_type).toEqual('vip');
  });

  it('should handle date objects correctly', async () => {
    const dateInput: CreateMemberInput = {
      ...testInput,
      email: 'date.test@example.com',
      membership_start_date: new Date('2024-06-15'),
      membership_end_date: new Date('2025-06-15')
    };

    const result = await createMember(dateInput);

    expect(result.membership_start_date).toEqual(new Date('2024-06-15'));
    expect(result.membership_end_date).toEqual(new Date('2025-06-15'));

    // Verify dates are stored correctly in database
    const members = await db.select()
      .from(membersTable)
      .where(eq(membersTable.id, result.id))
      .execute();

    expect(members[0].membership_start_date).toEqual('2024-06-15'); // Database stores as string
    expect(members[0].membership_end_date).toEqual('2025-06-15'); // Database stores as string
  });

  it('should throw error for duplicate email', async () => {
    const uniqueInput = {
      ...testInput,
      email: 'duplicate.test@example.com'
    };
    
    // Create first member
    await createMember(uniqueInput);

    // Attempt to create second member with same email
    const duplicateInput: CreateMemberInput = {
      ...uniqueInput,
      first_name: 'Different',
      last_name: 'Name'
    };

    await expect(createMember(duplicateInput)).rejects.toThrow(/unique/i);
  });

  it('should create multiple unique members', async () => {
    const member1Input = {
      ...testInput,
      email: 'member1@example.com'
    };
    const member2Input = {
      ...testInput,
      email: 'member2@example.com'
    };

    const member1 = await createMember(member1Input);
    const member2 = await createMember(member2Input);

    expect(member1.id).not.toEqual(member2.id);
    expect(member1.email).not.toEqual(member2.email);

    // Verify both are in database
    const allMembers = await db.select().from(membersTable).execute();
    expect(allMembers).toHaveLength(2);
  });
});
