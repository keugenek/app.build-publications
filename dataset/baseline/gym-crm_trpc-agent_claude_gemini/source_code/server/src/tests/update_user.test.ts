import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type CreateUserInput } from '../schema';
import { updateUser } from '../handlers/update_user';
import { eq } from 'drizzle-orm';
// Helper to create a test user in the database
const createTestUser = async (): Promise<number> => {
  const passwordHash = 'hashed_password_123';
  
  const result = await db.insert(usersTable)
    .values({
      email: 'test@example.com',
      password_hash: passwordHash,
      first_name: 'John',
      last_name: 'Doe',
      role: 'member',
      phone: '555-1234',
      date_of_birth: new Date('1990-01-01'),
      membership_start_date: new Date('2024-01-01'),
      membership_end_date: new Date('2024-12-31'),
      is_active: true
    })
    .returning()
    .execute();
  
  return result[0].id;
};

describe('updateUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update basic user information', async () => {
    const userId = await createTestUser();

    const input: UpdateUserInput = {
      id: userId,
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com'
    };

    const result = await updateUser(input);

    expect(result.id).toEqual(userId);
    expect(result.first_name).toEqual('Jane');
    expect(result.last_name).toEqual('Smith');
    expect(result.email).toEqual('jane.smith@example.com');
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Verify unchanged fields remain the same
    expect(result.phone).toEqual('555-1234');
    expect(result.role).toEqual('member');
    expect(result.is_active).toEqual(true);
  });

  it('should update phone number', async () => {
    const userId = await createTestUser();

    const input: UpdateUserInput = {
      id: userId,
      phone: '555-9999'
    };

    const result = await updateUser(input);

    expect(result.id).toEqual(userId);
    expect(result.phone).toEqual('555-9999');
    expect(result.first_name).toEqual('John'); // Unchanged
    expect(result.last_name).toEqual('Doe'); // Unchanged
  });

  it('should set phone to null', async () => {
    const userId = await createTestUser();

    const input: UpdateUserInput = {
      id: userId,
      phone: null
    };

    const result = await updateUser(input);

    expect(result.id).toEqual(userId);
    expect(result.phone).toBeNull();
  });

  it('should update membership dates', async () => {
    const userId = await createTestUser();

    const newStartDate = new Date('2024-06-01');
    const newEndDate = new Date('2025-05-31');

    const input: UpdateUserInput = {
      id: userId,
      membership_start_date: newStartDate,
      membership_end_date: newEndDate
    };

    const result = await updateUser(input);

    expect(result.id).toEqual(userId);
    expect(result.membership_start_date).toEqual(newStartDate);
    expect(result.membership_end_date).toEqual(newEndDate);
  });

  it('should update date of birth', async () => {
    const userId = await createTestUser();

    const newBirthDate = new Date('1985-05-15');

    const input: UpdateUserInput = {
      id: userId,
      date_of_birth: newBirthDate
    };

    const result = await updateUser(input);

    expect(result.id).toEqual(userId);
    expect(result.date_of_birth).toEqual(newBirthDate);
  });

  it('should set date of birth to null', async () => {
    const userId = await createTestUser();

    const input: UpdateUserInput = {
      id: userId,
      date_of_birth: null
    };

    const result = await updateUser(input);

    expect(result.id).toEqual(userId);
    expect(result.date_of_birth).toBeNull();
  });

  it('should update user active status', async () => {
    const userId = await createTestUser();

    const input: UpdateUserInput = {
      id: userId,
      is_active: false
    };

    const result = await updateUser(input);

    expect(result.id).toEqual(userId);
    expect(result.is_active).toEqual(false);
  });

  it('should update multiple fields at once', async () => {
    const userId = await createTestUser();

    const input: UpdateUserInput = {
      id: userId,
      first_name: 'Updated',
      last_name: 'User',
      email: 'updated@example.com',
      phone: '555-0000',
      is_active: false
    };

    const result = await updateUser(input);

    expect(result.id).toEqual(userId);
    expect(result.first_name).toEqual('Updated');
    expect(result.last_name).toEqual('User');
    expect(result.email).toEqual('updated@example.com');
    expect(result.phone).toEqual('555-0000');
    expect(result.is_active).toEqual(false);
  });

  it('should persist changes in database', async () => {
    const userId = await createTestUser();

    const input: UpdateUserInput = {
      id: userId,
      first_name: 'Database',
      last_name: 'Test'
    };

    await updateUser(input);

    // Query database directly to verify changes were persisted
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].first_name).toEqual('Database');
    expect(users[0].last_name).toEqual('Test');
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update updated_at timestamp', async () => {
    const userId = await createTestUser();

    // Get original timestamp
    const originalUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    const originalTimestamp = originalUser[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdateUserInput = {
      id: userId,
      first_name: 'Updated Name'
    };

    const result = await updateUser(input);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalTimestamp.getTime());
  });

  it('should throw error for non-existent user', async () => {
    const input: UpdateUserInput = {
      id: 99999,
      first_name: 'Non-existent'
    };

    await expect(updateUser(input)).rejects.toThrow(/User with id 99999 not found/i);
  });

  it('should handle partial updates correctly', async () => {
    const userId = await createTestUser();

    // Update only email
    const input: UpdateUserInput = {
      id: userId,
      email: 'only.email@example.com'
    };

    const result = await updateUser(input);

    // Verify only email was updated, other fields remain unchanged
    expect(result.email).toEqual('only.email@example.com');
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    expect(result.phone).toEqual('555-1234');
    expect(result.is_active).toEqual(true);
  });

  it('should handle empty update (only timestamp change)', async () => {
    const userId = await createTestUser();

    // Update with only required id field
    const input: UpdateUserInput = {
      id: userId
    };

    const result = await updateUser(input);

    // Should return user with updated timestamp but same other data
    expect(result.id).toEqual(userId);
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});
