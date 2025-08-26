import { db } from '../db';
import { catProfilesTable } from '../db/schema';
import { type CreateCatProfileInput, type CatProfile } from '../schema';

export const createCatProfile = async (input: CreateCatProfileInput): Promise<CatProfile> => {
  try {
    // Insert cat profile record
    const result = await db.insert(catProfilesTable)
      .values({
        name: input.name,
        breed: input.breed || null,
        color: input.color || null,
        age_years: input.age_years || null,
        suspicion_level: input.suspicion_level
      })
      .returning()
      .execute();

    // Return the created profile
    const profile = result[0];
    return {
      ...profile,
      age_years: profile.age_years // Integer columns don't need conversion
    };
  } catch (error) {
    console.error('Cat profile creation failed:', error);
    throw error;
  }
};
