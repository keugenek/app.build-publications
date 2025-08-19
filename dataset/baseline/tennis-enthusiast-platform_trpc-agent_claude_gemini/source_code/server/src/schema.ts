import { z } from 'zod';

// User profile schema for tennis players
export const userProfileSchema = z.object({
  id: z.number(),
  name: z.string(),
  skill_level: z.string(), // Text description like "Beginner", "Intermediate", "Advanced", etc.
  location: z.string(), // City/State format like "Austin, TX"
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type UserProfile = z.infer<typeof userProfileSchema>;

// Input schema for creating user profiles
export const createUserProfileInputSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  skill_level: z.string().min(1, "Skill level is required").max(200, "Skill level description too long"),
  location: z.string().min(1, "Location is required").max(100, "Location too long")
});

export type CreateUserProfileInput = z.infer<typeof createUserProfileInputSchema>;

// Input schema for updating user profiles
export const updateUserProfileInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(100).optional(),
  skill_level: z.string().min(1).max(200).optional(),
  location: z.string().min(1).max(100).optional()
});

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileInputSchema>;

// Search filters schema for finding tennis partners
export const searchPartnersInputSchema = z.object({
  skill_level: z.string().optional(), // Filter by skill level (partial match)
  location: z.string().optional(), // Filter by location (partial match)
  limit: z.number().int().positive().max(50).optional().default(20) // Limit results
});

export type SearchPartnersInput = z.infer<typeof searchPartnersInputSchema>;

// Schema for getting a single user profile by ID
export const getUserProfileInputSchema = z.object({
  id: z.number()
});

export type GetUserProfileInput = z.infer<typeof getUserProfileInputSchema>;
