import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { getProfile } from '../handlers/get_user_profile';
import { eq } from 'drizzle-orm';

describe('getProfile', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test user profile
    await db.insert(userProfilesTable).values({
      name: 'John Doe',
      email: 'john.doe@example.com',
      skill_level: 'intermediate',
      location: 'New York',
      bio: 'Tennis enthusiast looking for matches'
    }).execute();
  });
  
  afterEach(resetDB);

  it('should fetch a user profile by ID', async () => {
    // First, get the ID of the created user
    const users = await db.select({ id: userProfilesTable.id })
      .from(userProfilesTable)
      .where(eq(userProfilesTable.email, 'john.doe@example.com'))
      .execute();
    
    const userId = users[0].id;
    
    // Test the handler
    const result = await getProfile(userId);

    // Validate the result
    expect(result.id).toBe(userId);
    expect(result.name).toBe('John Doe');
    expect(result.email).toBe('john.doe@example.com');
    expect(result.skill_level).toBe('intermediate');
    expect(result.location).toBe('New York');
    expect(result.bio).toBe('Tennis enthusiast looking for matches');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should throw an error when user profile is not found', async () => {
    // Try to fetch a non-existent user ID
    const nonExistentId = 99999;
    
    await expect(getProfile(nonExistentId))
      .rejects
      .toThrow(/not found/i);
  });
});
