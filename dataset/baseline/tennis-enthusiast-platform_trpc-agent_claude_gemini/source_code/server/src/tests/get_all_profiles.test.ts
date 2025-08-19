import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { getAllProfiles } from '../handlers/get_all_profiles';

describe('getAllProfiles', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no profiles exist', async () => {
    const result = await getAllProfiles();
    
    expect(result).toEqual([]);
  });

  it('should return all user profiles', async () => {
    // Create test profiles
    const testProfiles = [
      {
        name: 'John Doe',
        skill_level: 'Intermediate',
        location: 'Austin, TX'
      },
      {
        name: 'Jane Smith',
        skill_level: 'Advanced',
        location: 'Dallas, TX'
      },
      {
        name: 'Mike Wilson',
        skill_level: 'Beginner',
        location: 'Houston, TX'
      }
    ];

    // Insert test profiles
    await db.insert(userProfilesTable)
      .values(testProfiles)
      .execute();

    const result = await getAllProfiles();

    // Verify all profiles are returned
    expect(result).toHaveLength(3);
    
    // Verify profile data
    const names = result.map(p => p.name).sort();
    expect(names).toEqual(['Jane Smith', 'John Doe', 'Mike Wilson']);
    
    // Verify each profile has all required fields
    result.forEach(profile => {
      expect(profile.id).toBeDefined();
      expect(typeof profile.id).toBe('number');
      expect(profile.name).toBeDefined();
      expect(typeof profile.name).toBe('string');
      expect(profile.skill_level).toBeDefined();
      expect(typeof profile.skill_level).toBe('string');
      expect(profile.location).toBeDefined();
      expect(typeof profile.location).toBe('string');
      expect(profile.created_at).toBeInstanceOf(Date);
      expect(profile.updated_at).toBeInstanceOf(Date);
    });

    // Verify specific profile content
    const johnProfile = result.find(p => p.name === 'John Doe');
    expect(johnProfile).toBeDefined();
    expect(johnProfile!.skill_level).toBe('Intermediate');
    expect(johnProfile!.location).toBe('Austin, TX');
  });

  it('should return profiles in order of creation (by ID)', async () => {
    // Create profiles in specific order
    const profile1 = await db.insert(userProfilesTable)
      .values({
        name: 'First Player',
        skill_level: 'Beginner',
        location: 'Austin, TX'
      })
      .returning()
      .execute();

    const profile2 = await db.insert(userProfilesTable)
      .values({
        name: 'Second Player',
        skill_level: 'Intermediate',
        location: 'Dallas, TX'
      })
      .returning()
      .execute();

    const result = await getAllProfiles();

    expect(result).toHaveLength(2);
    // Profiles should maintain database order (by ID)
    expect(result[0].name).toBe('First Player');
    expect(result[1].name).toBe('Second Player');
    expect(result[0].id).toBeLessThan(result[1].id);
  });

  it('should handle large number of profiles', async () => {
    // Create multiple profiles to test performance
    const profileBatch = Array.from({ length: 25 }, (_, i) => ({
      name: `Player ${i + 1}`,
      skill_level: i % 3 === 0 ? 'Beginner' : i % 3 === 1 ? 'Intermediate' : 'Advanced',
      location: `City ${i + 1}, TX`
    }));

    await db.insert(userProfilesTable)
      .values(profileBatch)
      .execute();

    const result = await getAllProfiles();

    expect(result).toHaveLength(25);
    
    // Verify all profiles have unique IDs
    const ids = result.map(p => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(25);

    // Verify profiles maintain proper structure
    result.forEach(profile => {
      expect(profile.name).toMatch(/^Player \d+$/);
      expect(['Beginner', 'Intermediate', 'Advanced']).toContain(profile.skill_level);
      expect(profile.location).toMatch(/^City \d+, TX$/);
    });
  });

  it('should return correct timestamp fields', async () => {
    // Insert profile with known timing
    const beforeInsert = new Date();
    
    await db.insert(userProfilesTable)
      .values({
        name: 'Test Player',
        skill_level: 'Intermediate',
        location: 'Austin, TX'
      })
      .execute();

    const afterInsert = new Date();
    const result = await getAllProfiles();

    expect(result).toHaveLength(1);
    const profile = result[0];

    // Verify timestamps are within expected range
    expect(profile.created_at).toBeInstanceOf(Date);
    expect(profile.updated_at).toBeInstanceOf(Date);
    expect(profile.created_at.getTime()).toBeGreaterThanOrEqual(beforeInsert.getTime() - 1000);
    expect(profile.created_at.getTime()).toBeLessThanOrEqual(afterInsert.getTime() + 1000);
    expect(profile.updated_at.getTime()).toBeGreaterThanOrEqual(beforeInsert.getTime() - 1000);
    expect(profile.updated_at.getTime()).toBeLessThanOrEqual(afterInsert.getTime() + 1000);
  });
});
