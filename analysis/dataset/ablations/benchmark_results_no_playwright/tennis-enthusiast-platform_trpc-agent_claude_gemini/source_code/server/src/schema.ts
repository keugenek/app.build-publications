import { z } from 'zod';

// Enum for tennis skill levels
export const skillLevelEnum = z.enum(['Beginner', 'Intermediate', 'Advanced']);
export type SkillLevel = z.infer<typeof skillLevelEnum>;

// User profile schema
export const userProfileSchema = z.object({
  id: z.number(),
  name: z.string(),
  bio: z.string().nullable(),
  skill_level: skillLevelEnum,
  location: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type UserProfile = z.infer<typeof userProfileSchema>;

// Input schema for creating user profiles
export const createUserProfileInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').nullable(),
  skill_level: skillLevelEnum,
  location: z.string().min(1, 'Location is required').max(100, 'Location must be less than 100 characters')
});

export type CreateUserProfileInput = z.infer<typeof createUserProfileInputSchema>;

// Input schema for updating user profiles
export const updateUserProfileInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).nullable().optional(),
  skill_level: skillLevelEnum.optional(),
  location: z.string().min(1).max(100).optional()
});

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileInputSchema>;

// Search filters schema
export const searchUsersInputSchema = z.object({
  skill_level: skillLevelEnum.optional(),
  location: z.string().optional()
});

export type SearchUsersInput = z.infer<typeof searchUsersInputSchema>;

// Connection request schema
export const connectionRequestSchema = z.object({
  id: z.number(),
  requester_id: z.number(),
  receiver_id: z.number(),
  status: z.enum(['pending', 'accepted', 'declined']),
  message: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type ConnectionRequest = z.infer<typeof connectionRequestSchema>;

// Input schema for creating connection requests
export const createConnectionRequestInputSchema = z.object({
  receiver_id: z.number(),
  message: z.string().max(300, 'Message must be less than 300 characters').nullable()
});

export type CreateConnectionRequestInput = z.infer<typeof createConnectionRequestInputSchema>;

// Input schema for responding to connection requests
export const respondToConnectionRequestInputSchema = z.object({
  request_id: z.number(),
  status: z.enum(['accepted', 'declined'])
});

export type RespondToConnectionRequestInput = z.infer<typeof respondToConnectionRequestInputSchema>;
