import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type SearchPlayersInput } from '../schema';
import { getUsers } from '../handlers/get_users';
import { eq } from 'drizzle-orm';

describe('getUsers', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test users
    await db.insert(usersTable).values([
      {
        name: 'Alice',
        skill_level: 'Beginner',
        location: 'New York',
      },
      {
        name: 'Bob',
        skill_level: 'Intermediate',
        location: 'California',
      },
      {
        name: 'Charlie',
        skill_level: 'Advanced',
        location: 'New York',
      },
      {
        name: 'Diana',
        skill_level: 'Beginner',
        location: 'Texas',
      }
    ]).execute();
  });

  afterEach(resetDB);

  it('should return all users when no search criteria provided', async () => {
    const users = await getUsers();
    
    expect(users).toHaveLength(4);
    expect(users[0]).toMatchObject({
      name: 'Alice',
      skill_level: 'Beginner',
      location: 'New York',
    });
    expect(users[1]).toMatchObject({
      name: 'Bob',
      skill_level: 'Intermediate',
      location: 'California',
    });
    expect(users[2]).toMatchObject({
      name: 'Charlie',
      skill_level: 'Advanced',
      location: 'New York',
    });
    expect(users[3]).toMatchObject({
      name: 'Diana',
      skill_level: 'Beginner',
      location: 'Texas',
    });
    
    // Check that created_at is a Date object
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should filter users by skill level', async () => {
    const searchCriteria: SearchPlayersInput = { skill_level: 'Beginner' };
    const users = await getUsers(searchCriteria);
    
    expect(users).toHaveLength(2);
    expect(users.every(user => user.skill_level === 'Beginner')).toBe(true);
    expect(users.some(user => user.name === 'Alice')).toBe(true);
    expect(users.some(user => user.name === 'Diana')).toBe(true);
  });

  it('should filter users by location', async () => {
    const searchCriteria: SearchPlayersInput = { location: 'New York' };
    const users = await getUsers(searchCriteria);
    
    expect(users).toHaveLength(2);
    expect(users.every(user => user.location === 'New York')).toBe(true);
    expect(users.some(user => user.name === 'Alice')).toBe(true);
    expect(users.some(user => user.name === 'Charlie')).toBe(true);
  });

  it('should filter users by both skill level and location', async () => {
    const searchCriteria: SearchPlayersInput = { 
      skill_level: 'Beginner',
      location: 'New York'
    };
    const users = await getUsers(searchCriteria);
    
    expect(users).toHaveLength(1);
    expect(users[0].name).toBe('Alice');
    expect(users[0].skill_level).toBe('Beginner');
    expect(users[0].location).toBe('New York');
  });

  it('should return empty array when no users match criteria', async () => {
    const searchCriteria: SearchPlayersInput = { 
      skill_level: 'Advanced',
      location: 'Texas'
    };
    const users = await getUsers(searchCriteria);
    
    expect(users).toHaveLength(0);
  });
});
