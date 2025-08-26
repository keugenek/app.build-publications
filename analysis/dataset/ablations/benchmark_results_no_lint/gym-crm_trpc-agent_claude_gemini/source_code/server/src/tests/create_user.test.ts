import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test inputs for different roles
const memberInput: CreateUserInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  role: 'member'
};

const adminInput: CreateUserInput = {
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'admin'
};

const instructorInput: CreateUserInput = {
  name: 'Jane Instructor',
  email: 'jane.instructor@example.com',
  role: 'instructor'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a member user', async () => {
    const result = await createUser(memberInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.role).toEqual('member');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create an admin user', async () => {
    const result = await createUser(adminInput);

    expect(result.name).toEqual('Admin User');
    expect(result.email).toEqual('admin@example.com');
    expect(result.role).toEqual('admin');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create an instructor user', async () => {
    const result = await createUser(instructorInput);

    expect(result.name).toEqual('Jane Instructor');
    expect(result.email).toEqual('jane.instructor@example.com');
    expect(result.role).toEqual('instructor');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(memberInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].name).toEqual('John Doe');
    expect(users[0].email).toEqual('john.doe@example.com');
    expect(users[0].role).toEqual('member');
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should assign unique IDs to different users', async () => {
    const user1 = await createUser(memberInput);
    
    const user2Input: CreateUserInput = {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      role: 'admin'
    };
    const user2 = await createUser(user2Input);

    expect(user1.id).not.toEqual(user2.id);
    expect(user1.id).toBeGreaterThan(0);
    expect(user2.id).toBeGreaterThan(0);
  });

  it('should enforce unique email constraint', async () => {
    // Create first user
    await createUser(memberInput);

    // Try to create another user with same email
    const duplicateEmailInput: CreateUserInput = {
      name: 'Different Name',
      email: 'john.doe@example.com', // Same email
      role: 'admin'
    };

    await expect(createUser(duplicateEmailInput)).rejects.toThrow(/unique/i);
  });

  it('should set created_at timestamp automatically', async () => {
    const beforeCreation = new Date();
    const result = await createUser(memberInput);
    const afterCreation = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at >= beforeCreation).toBe(true);
    expect(result.created_at <= afterCreation).toBe(true);
  });
});
