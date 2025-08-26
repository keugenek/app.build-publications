import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { getUsers } from '../handlers/get_users';


// Test user inputs
const testUser1: CreateUserInput = {
  email: 'john@example.com',
  password: 'password123',
  first_name: 'John',
  last_name: 'Doe',
  role: 'member',
  phone: '+1234567890',
  date_of_birth: new Date('1990-01-15'),
  membership_start_date: new Date('2024-01-01'),
  membership_end_date: new Date('2024-12-31')
};

const testUser2: CreateUserInput = {
  email: 'jane@example.com',
  password: 'password456',
  first_name: 'Jane',
  last_name: 'Smith',
  role: 'administrator',
  phone: null,
  date_of_birth: null,
  membership_start_date: null,
  membership_end_date: null
};

const testUser3: CreateUserInput = {
  email: 'bob@example.com',
  password: 'password789',
  first_name: 'Bob',
  last_name: 'Johnson',
  role: 'member',
  phone: '+0987654321',
  date_of_birth: new Date('1985-03-20'),
  membership_start_date: new Date('2024-02-15'),
  membership_end_date: new Date('2024-11-15')
};

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all users when they exist', async () => {
    // Create test users with simple password hashes for testing
    const hashedPassword1 = 'hashed_' + testUser1.password;
    const hashedPassword2 = 'hashed_' + testUser2.password;
    
    await db.insert(usersTable).values([
      {
        email: testUser1.email,
        password_hash: hashedPassword1,
        first_name: testUser1.first_name,
        last_name: testUser1.last_name,
        role: testUser1.role,
        phone: testUser1.phone,
        date_of_birth: testUser1.date_of_birth,
        membership_start_date: testUser1.membership_start_date,
        membership_end_date: testUser1.membership_end_date
      },
      {
        email: testUser2.email,
        password_hash: hashedPassword2,
        first_name: testUser2.first_name,
        last_name: testUser2.last_name,
        role: testUser2.role,
        phone: testUser2.phone,
        date_of_birth: testUser2.date_of_birth,
        membership_start_date: testUser2.membership_start_date,
        membership_end_date: testUser2.membership_end_date
      }
    ]).execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      email: testUser1.email,
      first_name: testUser1.first_name,
      last_name: testUser1.last_name,
      role: testUser1.role,
      phone: testUser1.phone,
      is_active: true
    });
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
    expect(result[0].date_of_birth).toBeInstanceOf(Date);
    expect(result[0].membership_start_date).toBeInstanceOf(Date);
    expect(result[0].membership_end_date).toBeInstanceOf(Date);

    expect(result[1]).toMatchObject({
      email: testUser2.email,
      first_name: testUser2.first_name,
      last_name: testUser2.last_name,
      role: testUser2.role,
      phone: null,
      date_of_birth: null,
      membership_start_date: null,
      membership_end_date: null,
      is_active: true
    });
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
    expect(result[1].updated_at).toBeInstanceOf(Date);
  });

  it('should return users with different roles correctly', async () => {
    // Create users with different roles using simple password hashes for testing
    const hashedPassword1 = 'hashed_' + testUser1.password;
    const hashedPassword2 = 'hashed_' + testUser2.password;
    const hashedPassword3 = 'hashed_' + testUser3.password;
    
    await db.insert(usersTable).values([
      {
        email: testUser1.email,
        password_hash: hashedPassword1,
        first_name: testUser1.first_name,
        last_name: testUser1.last_name,
        role: testUser1.role,
        phone: testUser1.phone,
        date_of_birth: testUser1.date_of_birth,
        membership_start_date: testUser1.membership_start_date,
        membership_end_date: testUser1.membership_end_date
      },
      {
        email: testUser2.email,
        password_hash: hashedPassword2,
        first_name: testUser2.first_name,
        last_name: testUser2.last_name,
        role: testUser2.role,
        phone: testUser2.phone,
        date_of_birth: testUser2.date_of_birth,
        membership_start_date: testUser2.membership_start_date,
        membership_end_date: testUser2.membership_end_date
      },
      {
        email: testUser3.email,
        password_hash: hashedPassword3,
        first_name: testUser3.first_name,
        last_name: testUser3.last_name,
        role: testUser3.role,
        phone: testUser3.phone,
        date_of_birth: testUser3.date_of_birth,
        membership_start_date: testUser3.membership_start_date,
        membership_end_date: testUser3.membership_end_date
      }
    ]).execute();

    const result = await getUsers();

    expect(result).toHaveLength(3);

    // Check that we have both members and administrators
    const members = result.filter(user => user.role === 'member');
    const administrators = result.filter(user => user.role === 'administrator');
    
    expect(members).toHaveLength(2);
    expect(administrators).toHaveLength(1);
    
    // Verify administrator
    const admin = administrators[0];
    expect(admin.email).toBe(testUser2.email);
    expect(admin.role).toBe('administrator');
    
    // Verify members
    const member1 = members.find(m => m.email === testUser1.email);
    const member2 = members.find(m => m.email === testUser3.email);
    
    expect(member1).toBeDefined();
    expect(member1?.role).toBe('member');
    expect(member2).toBeDefined();
    expect(member2?.role).toBe('member');
  });

  it('should handle users with inactive status correctly', async () => {
    const hashedPassword = 'hashed_' + testUser1.password;
    
    // Create an inactive user
    await db.insert(usersTable).values({
      email: testUser1.email,
      password_hash: hashedPassword,
      first_name: testUser1.first_name,
      last_name: testUser1.last_name,
      role: testUser1.role,
      phone: testUser1.phone,
      date_of_birth: testUser1.date_of_birth,
      membership_start_date: testUser1.membership_start_date,
      membership_end_date: testUser1.membership_end_date,
      is_active: false
    }).execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    expect(result[0].is_active).toBe(false);
    expect(result[0].email).toBe(testUser1.email);
  });

  it('should preserve all user data fields correctly', async () => {
    const hashedPassword = 'hashed_' + testUser1.password;
    
    await db.insert(usersTable).values({
      email: testUser1.email,
      password_hash: hashedPassword,
      first_name: testUser1.first_name,
      last_name: testUser1.last_name,
      role: testUser1.role,
      phone: testUser1.phone,
      date_of_birth: testUser1.date_of_birth,
      membership_start_date: testUser1.membership_start_date,
      membership_end_date: testUser1.membership_end_date
    }).execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    const user = result[0];
    
    // Verify all fields are present and correctly typed
    expect(typeof user.id).toBe('number');
    expect(typeof user.email).toBe('string');
    expect(typeof user.password_hash).toBe('string');
    expect(typeof user.first_name).toBe('string');
    expect(typeof user.last_name).toBe('string');
    expect(['member', 'administrator']).toContain(user.role);
    expect(typeof user.phone).toBe('string');
    expect(user.date_of_birth).toBeInstanceOf(Date);
    expect(user.membership_start_date).toBeInstanceOf(Date);
    expect(user.membership_end_date).toBeInstanceOf(Date);
    expect(typeof user.is_active).toBe('boolean');
    expect(user.created_at).toBeInstanceOf(Date);
    expect(user.updated_at).toBeInstanceOf(Date);

    // Verify specific values
    expect(user.email).toBe(testUser1.email);
    expect(user.first_name).toBe(testUser1.first_name);
    expect(user.last_name).toBe(testUser1.last_name);
    expect(user.role).toBe(testUser1.role);
    expect(user.phone).toBe(testUser1.phone);
    expect(user.is_active).toBe(true);
  });

  it('should handle null values correctly', async () => {
    const hashedPassword = 'hashed_' + testUser2.password;
    
    await db.insert(usersTable).values({
      email: testUser2.email,
      password_hash: hashedPassword,
      first_name: testUser2.first_name,
      last_name: testUser2.last_name,
      role: testUser2.role,
      phone: testUser2.phone,
      date_of_birth: testUser2.date_of_birth,
      membership_start_date: testUser2.membership_start_date,
      membership_end_date: testUser2.membership_end_date
    }).execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    const user = result[0];
    
    expect(user.phone).toBe(null);
    expect(user.date_of_birth).toBe(null);
    expect(user.membership_start_date).toBe(null);
    expect(user.membership_end_date).toBe(null);
  });
});
