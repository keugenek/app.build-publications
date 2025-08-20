import { z } from 'zod';

// Define the skill level enum
export const skillLevelSchema = z.enum(['Beginner', 'Intermediate', 'Advanced']);

export type SkillLevel = z.infer<typeof skillLevelSchema>;

// User profile schema
export const userProfileSchema = z.object({
  id: z.number(),
  name: z.string(),
  skill_level: skillLevelSchema,
  city: z.string(),
  created_at: z.coerce.date()
});

export type UserProfile = z.infer<typeof userProfileSchema>;

// Input schema for creating user profiles
export const createUserProfileInputSchema = z.object({
  name: z.string(),
  skill_level: skillLevelSchema,
  city: z.string()
});

export type CreateUserProfileInput = z.infer<typeof createUserProfileInputSchema>;

// Input schema for searching players
export const searchPlayersInputSchema = z.object({
  skill_level: skillLevelSchema.optional(),
  city: z.string().optional()
});

export type SearchPlayersInput = z.infer<typeof searchPlayersInputSchema>;

// Input schema for updating user profiles
export const updateUserProfileInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  skill_level: skillLevelSchema.optional(),
  city: z.string().optional()
});

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileInputSchema>;
