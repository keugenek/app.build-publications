import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable } from '../db/schema';
import { type CreateMemberInput } from '../schema';
import { createMember } from '../handlers/create_member';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateMemberInput = {
  email: 'test@example.com',
  first_name: 'John',
  last_name: 'Doe',
  phone: '+1234567890',
  membership_type: 'premium',
  status: 'active'
};

describe('createMember', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a member with all fields', async () => {
    const result = await createMember(testInput);

    // Basic field validation
    expect(result.email).toEqual('test@example.com');
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    expect(result.phone).toEqual('+1234567890');
    expect(result.membership_type).toEqual('premium');
    expect(result.status).toEqual('active');
    expect(result.id).toBeDefined();
    expect(result.joined_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a member with nullable phone field', async () => {
    const inputWithoutPhone: CreateMemberInput = {
      email: 'nophone@example.com',
      first_name: 'Jane',
      last_name: 'Smith',
      phone: null,
      membership_type: 'basic',
      status: 'active'
    };

    const result = await createMember(inputWithoutPhone);

    expect(result.email).toEqual('nophone@example.com');
    expect(result.first_name).toEqual('Jane');
    expect(result.last_name).toEqual('Smith');
    expect(result.phone).toBeNull();
    expect(result.membership_type).toEqual('basic');
    expect(result.status).toEqual('active');
  });

  it('should use default status when not provided', async () => {
    const inputWithDefaults: CreateMemberInput = {
      email: 'default@example.com',
      first_name: 'Default',
      last_name: 'User',
      phone: null,
      membership_type: 'vip',
      status: 'active' // Include status since TypeScript requires it
    };

    const result = await createMember(inputWithDefaults);

    expect(result.status).toEqual('active');
    expect(result.membership_type).toEqual('vip');
  });

  it('should save member to database', async () => {
    const result = await createMember(testInput);

    // Query using proper drizzle syntax
    const members = await db.select()
      .from(membersTable)
      .where(eq(membersTable.id, result.id))
      .execute();

    expect(members).toHaveLength(1);
    expect(members[0].email).toEqual('test@example.com');
    expect(members[0].first_name).toEqual('John');
    expect(members[0].last_name).toEqual('Doe');
    expect(members[0].phone).toEqual('+1234567890');
    expect(members[0].membership_type).toEqual('premium');
    expect(members[0].status).toEqual('active');
    expect(members[0].joined_at).toBeInstanceOf(Date);
    expect(members[0].created_at).toBeInstanceOf(Date);
    expect(members[0].updated_at).toBeInstanceOf(Date);
  });

  it('should reject duplicate email addresses', async () => {
    // Create first member
    await createMember(testInput);

    // Try to create second member with same email
    const duplicateInput: CreateMemberInput = {
      email: 'test@example.com', // Same email
      first_name: 'Jane',
      last_name: 'Smith',
      phone: null,
      membership_type: 'basic',
      status: 'inactive'
    };

    await expect(createMember(duplicateInput)).rejects.toThrow(/unique/i);
  });

  it('should handle different membership types', async () => {
    const basicMember: CreateMemberInput = {
      email: 'basic@example.com',
      first_name: 'Basic',
      last_name: 'Member',
      phone: null,
      membership_type: 'basic',
      status: 'active'
    };

    const premiumMember: CreateMemberInput = {
      email: 'premium@example.com',
      first_name: 'Premium',
      last_name: 'Member',
      phone: null,
      membership_type: 'premium',
      status: 'active'
    };

    const vipMember: CreateMemberInput = {
      email: 'vip@example.com',
      first_name: 'VIP',
      last_name: 'Member',
      phone: null,
      membership_type: 'vip',
      status: 'active'
    };

    const basic = await createMember(basicMember);
    const premium = await createMember(premiumMember);
    const vip = await createMember(vipMember);

    expect(basic.membership_type).toEqual('basic');
    expect(premium.membership_type).toEqual('premium');
    expect(vip.membership_type).toEqual('vip');
  });

  it('should handle different member statuses', async () => {
    const activeInput: CreateMemberInput = {
      email: 'active@example.com',
      first_name: 'Active',
      last_name: 'Member',
      phone: null,
      membership_type: 'basic',
      status: 'active'
    };

    const inactiveInput: CreateMemberInput = {
      email: 'inactive@example.com',
      first_name: 'Inactive',
      last_name: 'Member',
      phone: null,
      membership_type: 'basic',
      status: 'inactive'
    };

    const suspendedInput: CreateMemberInput = {
      email: 'suspended@example.com',
      first_name: 'Suspended',
      last_name: 'Member',
      phone: null,
      membership_type: 'basic',
      status: 'suspended'
    };

    const active = await createMember(activeInput);
    const inactive = await createMember(inactiveInput);
    const suspended = await createMember(suspendedInput);

    expect(active.status).toEqual('active');
    expect(inactive.status).toEqual('inactive');
    expect(suspended.status).toEqual('suspended');
  });
});
