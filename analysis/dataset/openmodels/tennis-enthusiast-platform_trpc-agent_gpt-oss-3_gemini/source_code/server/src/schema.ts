import { z } from 'zod';

// -----------------------------------------------------------------------------
// Skill level enum – matches the database enum definition
// -----------------------------------------------------------------------------
export const skillLevelEnum = ['Beginner', 'Intermediate', 'Advanced'] as const;
export const skillLevelSchema = z.enum(skillLevelEnum);

// -----------------------------------------------------------------------------
// User schema – represents a user record as stored in the database
// -----------------------------------------------------------------------------
export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  bio: z.string().nullable(), // explicit null allowed, not optional
  skill_level: skillLevelSchema,
  city: z.string(),
  state: z.string(),
  created_at: z.coerce.date(),
});

export type User = z.infer<typeof userSchema>;

// -----------------------------------------------------------------------------
// Input schema for creating a user – all required except optional bio
// -----------------------------------------------------------------------------
export const createUserInputSchema = z.object({
  name: z.string(),
  bio: z.string().nullable().optional(), // can be omitted or set to null
  skill_level: skillLevelSchema,
  city: z.string(),
  state: z.string(),
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// -----------------------------------------------------------------------------
// Input schema for updating a user – all fields optional, bio nullable
// -----------------------------------------------------------------------------
export const updateUserInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  bio: z.string().nullable().optional(),
  skill_level: skillLevelSchema.optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

// -----------------------------------------------------------------------------
// Message schema – represents a direct message between two users
// -----------------------------------------------------------------------------
export const messageSchema = z.object({
  id: z.number(),
  sender_id: z.number(),
  receiver_id: z.number(),
  content: z.string(),
  created_at: z.coerce.date(),
});

export type Message = z.infer<typeof messageSchema>;

// -----------------------------------------------------------------------------
// Input schema for sending a message – all required
// -----------------------------------------------------------------------------
export const createMessageInputSchema = z.object({
  sender_id: z.number(),
  receiver_id: z.number(),
  content: z.string(),
});

export type CreateMessageInput = z.infer<typeof createMessageInputSchema>;

// -----------------------------------------------------------------------------
// Input schema for filtering users when browsing profiles
// -----------------------------------------------------------------------------
export const browseUsersInputSchema = z.object({
  skill_level: skillLevelSchema.optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

export type BrowseUsersInput = z.infer<typeof browseUsersInputSchema>;

// -----------------------------------------------------------------------------
// Input schema for retrieving messages between two users
// -----------------------------------------------------------------------------
export const browseMessagesInputSchema = z.object({
  user_id: z.number(),
  other_user_id: z.number(),
});

export type BrowseMessagesInput = z.infer<typeof browseMessagesInputSchema>;
