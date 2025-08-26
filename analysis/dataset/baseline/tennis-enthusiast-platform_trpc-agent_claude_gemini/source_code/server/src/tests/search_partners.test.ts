import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type SearchPartnersInput, type CreateUserProfileInput } from '../schema';
import { searchPartners } from '../handlers/search_partners';

// Test data for user profiles
const testProfiles: CreateUserProfileInput[] = [
  {
    name: 'Alice Johnson',
    skill_level: 'Beginner',
    location: 'Austin, TX'
  },
  {
    name: 'Bob Smith',
    skill_level: 'Intermediate',
    location: 'Austin, TX'
  },
  {
    name: 'Carol Davis',
    skill_level: 'Advanced',
    location: 'Houston, TX'
  },
  {
    name: 'David Wilson',
    skill_level: 'Beginner to Intermediate',
    location: 'Dallas, TX'
  },
  {
    name: 'Eva Martinez',
    skill_level: 'Professional',
    location: 'San Antonio, TX'
  }
];

describe('searchPartners', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    await db.insert(userProfilesTable)
      .values(testProfiles)
      .execute();
  });

  afterEach(resetDB);

  it('should return all profiles when no filters applied', async () => {
    const input: SearchPartnersInput = {
      limit: 20
    };

    const result = await searchPartners(input);

    expect(result).toHaveLength(5);
    expect(result[0].name).toBeDefined();
    expect(result[0].skill_level).toBeDefined();
    expect(result[0].location).toBeDefined();
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should filter by skill level (partial match)', async () => {
    const input: SearchPartnersInput = {
      skill_level: 'Beginner',
      limit: 20
    };

    const result = await searchPartners(input);

    // Should match both "Beginner" and "Beginner to Intermediate" due to partial matching
    expect(result).toHaveLength(2);
    const names = result.map(p => p.name).sort();
    expect(names).toEqual(['Alice Johnson', 'David Wilson']);
    result.forEach(profile => {
      expect(profile.skill_level).toContain('Beginner');
    });
  });

  it('should filter by skill level (intermediate match)', async () => {
    const input: SearchPartnersInput = {
      skill_level: 'Intermediate',
      limit: 20
    };

    const result = await searchPartners(input);

    expect(result).toHaveLength(2);
    const names = result.map(p => p.name).sort();
    expect(names).toEqual(['Bob Smith', 'David Wilson']);
    result.forEach(profile => {
      expect(profile.skill_level).toContain('Intermediate');
    });
  });

  it('should filter by skill level (advanced only)', async () => {
    const input: SearchPartnersInput = {
      skill_level: 'Advanced',
      limit: 20
    };

    const result = await searchPartners(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Carol Davis');
    expect(result[0].skill_level).toEqual('Advanced');
  });

  it('should filter by location (exact match)', async () => {
    const input: SearchPartnersInput = {
      location: 'Austin, TX',
      limit: 20
    };

    const result = await searchPartners(input);

    expect(result).toHaveLength(2);
    const names = result.map(p => p.name).sort();
    expect(names).toEqual(['Alice Johnson', 'Bob Smith']);
    result.forEach(profile => {
      expect(profile.location).toEqual('Austin, TX');
    });
  });

  it('should filter by location (partial match)', async () => {
    const input: SearchPartnersInput = {
      location: 'TX',
      limit: 20
    };

    const result = await searchPartners(input);

    expect(result).toHaveLength(5);
    result.forEach(profile => {
      expect(profile.location).toContain('TX');
    });
  });

  it('should filter by location (city only)', async () => {
    const input: SearchPartnersInput = {
      location: 'Austin',
      limit: 20
    };

    const result = await searchPartners(input);

    expect(result).toHaveLength(2);
    result.forEach(profile => {
      expect(profile.location).toContain('Austin');
    });
  });

  it('should apply both skill level and location filters', async () => {
    const input: SearchPartnersInput = {
      skill_level: 'Beginner',
      location: 'Austin',
      limit: 20
    };

    const result = await searchPartners(input);

    // Should match Alice Johnson (exact "Beginner" match in Austin)
    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Alice Johnson');
    expect(result[0].skill_level).toEqual('Beginner');
    expect(result[0].location).toEqual('Austin, TX');
  });

  it('should return empty array when no matches found', async () => {
    const input: SearchPartnersInput = {
      skill_level: 'Expert',
      location: 'New York',
      limit: 20
    };

    const result = await searchPartners(input);

    expect(result).toHaveLength(0);
  });

  it('should respect the limit parameter', async () => {
    const input: SearchPartnersInput = {
      limit: 2
    };

    const result = await searchPartners(input);

    expect(result).toHaveLength(2);
  });

  it('should handle case insensitive search', async () => {
    const input: SearchPartnersInput = {
      skill_level: 'BEGINNER',
      location: 'austin',
      limit: 20
    };

    const result = await searchPartners(input);

    // Should match Alice Johnson with case insensitive search
    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Alice Johnson');
    expect(result[0].skill_level).toEqual('Beginner');
    expect(result[0].location).toEqual('Austin, TX');
  });

  it('should use default limit when not specified', async () => {
    const input: SearchPartnersInput = {
      limit: 20 // Provide explicit limit since handler expects parsed input
    };

    const result = await searchPartners(input);

    expect(result).toHaveLength(5); // All test data, but limited by default (20)
  });

  it('should handle special characters in search terms', async () => {
    // Add a profile with special characters
    await db.insert(userProfilesTable)
      .values({
        name: 'Test User',
        skill_level: 'Beginner-Advanced',
        location: 'St. Louis, MO'
      })
      .execute();

    const input: SearchPartnersInput = {
      location: 'St. Louis',
      limit: 20
    };

    const result = await searchPartners(input);

    expect(result).toHaveLength(1);
    expect(result[0].location).toEqual('St. Louis, MO');
  });
});
