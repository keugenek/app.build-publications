import { z } from 'zod';

// Define skill level enum
export const skillLevelEnum = z.enum(['Beginner', 'Intermediate', 'Advanced']);
export type SkillLevel = z.infer<typeof skillLevelEnum>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  skill_level: skillLevelEnum,
  location: z.string(),
  created_at: z.coerce.date(),
});

export type User = z.infer<typeof userSchema>;

// Input schema for creating users
export const createUserInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  skill_level: skillLevelEnum,
  location: z.string().min(1, "Location is required"),
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Input schema for updating users
export const updateUserInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Name is required").optional(),
  skill_level: skillLevelEnum.optional(),
  location: z.string().min(1, "Location is required").optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

// Message schema
export const messageSchema = z.object({
  id: z.number(),
  sender_id: z.number(),
  receiver_id: z.number(),
  content: z.string(),
  created_at: z.coerce.date(),
});

export type Message = z.infer<typeof messageSchema>;

// Input schema for sending messages
export const sendMessageInputSchema = z.object({
  sender_id: z.number(),
  receiver_id: z.number(),
  content: z.string().min(1, "Message content is required"),
});

export type SendMessageInput = z.infer<typeof sendMessageInputSchema>;

// Search criteria schema
export const searchPlayersInputSchema = z.object({
  skill_level: skillLevelEnum.optional(),
  location: z.string().optional(),
});

export type SearchPlayersInput = z.infer<typeof searchPlayersInputSchema>;
