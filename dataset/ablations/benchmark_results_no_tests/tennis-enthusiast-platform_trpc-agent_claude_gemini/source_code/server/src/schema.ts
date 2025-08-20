import { z } from 'zod';

// Skill level enum
export const skillLevelEnum = z.enum(['Beginner', 'Intermediate', 'Advanced']);
export type SkillLevel = z.infer<typeof skillLevelEnum>;

// User profile schema
export const userProfileSchema = z.object({
  id: z.number(),
  name: z.string(),
  skill_level: skillLevelEnum,
  city: z.string(),
  state: z.string(),
  bio: z.string(),
  created_at: z.coerce.date()
});

export type UserProfile = z.infer<typeof userProfileSchema>;

// Input schema for creating user profiles
export const createUserProfileInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  skill_level: skillLevelEnum,
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  bio: z.string().max(500, 'Bio must be 500 characters or less')
});

export type CreateUserProfileInput = z.infer<typeof createUserProfileInputSchema>;

// Input schema for updating user profiles
export const updateUserProfileInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Name is required').optional(),
  skill_level: skillLevelEnum.optional(),
  city: z.string().min(1, 'City is required').optional(),
  state: z.string().min(1, 'State is required').optional(),
  bio: z.string().max(500, 'Bio must be 500 characters or less').optional()
});

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileInputSchema>;

// Search filters schema
export const searchFiltersSchema = z.object({
  skill_level: skillLevelEnum.optional(),
  city: z.string().optional(),
  state: z.string().optional()
});

export type SearchFilters = z.infer<typeof searchFiltersSchema>;

// Connection schema for expressing interest
export const connectionSchema = z.object({
  id: z.number(),
  requester_id: z.number(),
  target_id: z.number(),
  status: z.enum(['pending', 'accepted', 'declined']),
  created_at: z.coerce.date()
});

export type Connection = z.infer<typeof connectionSchema>;

// Input schema for creating connections
export const createConnectionInputSchema = z.object({
  requester_id: z.number(),
  target_id: z.number()
});

export type CreateConnectionInput = z.infer<typeof createConnectionInputSchema>;

// Input schema for updating connection status
export const updateConnectionStatusInputSchema = z.object({
  connection_id: z.number(),
  status: z.enum(['accepted', 'declined'])
});

export type UpdateConnectionStatusInput = z.infer<typeof updateConnectionStatusInputSchema>;
