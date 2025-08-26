import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input for member user
const memberInput: CreateUserInput = {
  email: 'john.doe@example.com',
  password: 'securepass123',
  first_name: 'John',
  last_name: 'Doe',
  role: 'member',
  phone: '+1234567890',
  date_of_birth: new Date('1990-05-15'),
  membership_start_date: new Date('2024-01-01'),
  membership_end_date: new Date('2024-12-31')
};

// Test input for administrator user
const adminInput: CreateUserInput = {
  email: 'admin@fitnessstudio.com',
  password: 'adminpass456',
  first_name: 'Jane',
  last_name: 'Smith',
  role: 'administrator',
  phone: null,
  date_of_birth: null,
  membership_start_date: null,
  membership_end_date: null
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a member user with all fields', async () => {
    const result = await createUser(memberInput);

    // Basic field validation
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    expect(result.role).toEqual('member');
    expect(result.phone).toEqual('+1234567890');
    expect(result.date_of_birth).toEqual(new Date('1990-05-15'));
    expect(result.membership_start_date).toEqual(new Date('2024-01-01'));
    expect(result.membership_end_date).toEqual(new Date('2024-12-31'));
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual(memberInput.password);
  });

  it('should create an administrator user with minimal fields', async () => {
    const result = await createUser(adminInput);

    // Basic field validation
    expect(result.email).toEqual('admin@fitnessstudio.com');
    expect(result.first_name).toEqual('Jane');
    expect(result.last_name).toEqual('Smith');
    expect(result.role).toEqual('administrator');
    expect(result.phone).toBeNull();
    expect(result.date_of_birth).toBeNull();
    expect(result.membership_start_date).toBeNull();
    expect(result.membership_end_date).toBeNull();
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should hash the password correctly', async () => {
    const result = await createUser(memberInput);

    // Password should be hashed
    expect(result.password_hash).not.toEqual(memberInput.password);
    expect(result.password_hash).toMatch(/^\$argon2/); // Bun uses Argon2 by default
    expect(result.password_hash.length).toBeGreaterThan(50);

    // Verify password can be verified
    const isValid = await Bun.password.verify(memberInput.password, result.password_hash);
    expect(isValid).toBe(true);
  });

  it('should save user to database', async () => {
    const result = await createUser(memberInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('john.doe@example.com');
    expect(users[0].first_name).toEqual('John');
    expect(users[0].last_name).toEqual('Doe');
    expect(users[0].role).toEqual('member');
    expect(users[0].phone).toEqual('+1234567890');
    expect(users[0].is_active).toEqual(true);
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should enforce unique email constraint', async () => {
    // Create first user
    await createUser(memberInput);

    // Try to create another user with same email
    const duplicateInput = {
      ...memberInput,
      first_name: 'Different',
      last_name: 'Person'
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/unique/i);
  });

  it('should handle users with different roles correctly', async () => {
    // Create both member and admin users
    const member = await createUser(memberInput);
    const admin = await createUser(adminInput);

    expect(member.role).toEqual('member');
    expect(admin.role).toEqual('administrator');
    expect(member.id).not.toEqual(admin.id);

    // Verify both are saved to database
    const allUsers = await db.select().from(usersTable).execute();
    expect(allUsers).toHaveLength(2);

    const roles = allUsers.map(user => user.role).sort();
    expect(roles).toEqual(['administrator', 'member']);
  });
});
