import { z } from 'zod';

// Skill level enum
export const skillLevelSchema = z.enum(['beginner', 'intermediate', 'advanced']);
export type SkillLevel = z.infer<typeof skillLevelSchema>;

// User profile schema
export const userProfileSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  skill_level: skillLevelSchema,
  location: z.string(),
  bio: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

// Input schema for creating user profiles
export const createUserProfileInputSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  skill_level: skillLevelSchema,
  location: z.string().min(1).max(100),
  bio: z.string().nullable(),
});

export type CreateUserProfileInput = z.infer<typeof createUserProfileInputSchema>;

// Input schema for updating user profiles
export const updateUserProfileInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  skill_level: skillLevelSchema.optional(),
  location: z.string().min(1).max(100).optional(),
  bio: z.string().nullable().optional(),
});

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileInputSchema>;

// Message schema
export const messageSchema = z.object({
  id: z.number(),
  sender_id: z.number(),
  recipient_id: z.number(),
  content: z.string(),
  created_at: z.coerce.date(),
});

export type Message = z.infer<typeof messageSchema>;

// Input schema for sending messages
export const sendMessageInputSchema = z.object({
  sender_id: z.number(),
  recipient_id: z.number(),
  content: z.string().min(1).max(1000),
});

export type SendMessageInput = z.infer<typeof sendMessageInputSchema>;

// Search players input schema
export const searchPlayersInputSchema = z.object({
  location: z.string().optional(),
  skill_level: skillLevelSchema.optional(),
});

export type SearchPlayersInput = z.infer<typeof searchPlayersInputSchema>;
