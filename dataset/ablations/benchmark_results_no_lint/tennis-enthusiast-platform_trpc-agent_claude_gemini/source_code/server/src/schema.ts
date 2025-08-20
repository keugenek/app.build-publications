import { z } from 'zod';

// Skill level enum
export const skillLevelSchema = z.enum(['beginner', 'intermediate', 'advanced']);
export type SkillLevel = z.infer<typeof skillLevelSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  skill_level: skillLevelSchema,
  location: z.string(),
  bio: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Input schema for creating users
export const createUserInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  skill_level: skillLevelSchema,
  location: z.string().min(1, "Location is required"),
  bio: z.string().nullable().optional()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Input schema for updating users
export const updateUserInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  skill_level: skillLevelSchema.optional(),
  location: z.string().min(1).optional(),
  bio: z.string().nullable().optional()
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

// Search users input schema
export const searchUsersInputSchema = z.object({
  location: z.string().optional(),
  skill_level: skillLevelSchema.optional(),
  exclude_user_id: z.number().optional() // Exclude current user from search results
});

export type SearchUsersInput = z.infer<typeof searchUsersInputSchema>;

// Message schema
export const messageSchema = z.object({
  id: z.number(),
  sender_id: z.number(),
  recipient_id: z.number(),
  content: z.string(),
  created_at: z.coerce.date(),
  read_at: z.coerce.date().nullable()
});

export type Message = z.infer<typeof messageSchema>;

// Input schema for sending messages
export const sendMessageInputSchema = z.object({
  recipient_id: z.number(),
  content: z.string().min(1, "Message content is required").max(1000, "Message too long")
});

export type SendMessageInput = z.infer<typeof sendMessageInputSchema>;

// Input schema for getting conversation
export const getConversationInputSchema = z.object({
  user_id: z.number(), // The other user in the conversation
  limit: z.number().int().positive().max(100).optional().default(50)
});

export type GetConversationInput = z.infer<typeof getConversationInputSchema>;

// Mark message as read input schema
export const markMessageReadInputSchema = z.object({
  message_id: z.number()
});

export type MarkMessageReadInput = z.infer<typeof markMessageReadInputSchema>;

// Get user conversations input schema
export const getUserConversationsInputSchema = z.object({
  limit: z.number().int().positive().max(50).optional().default(20)
});

export type GetUserConversationsInput = z.infer<typeof getUserConversationsInputSchema>;

// Conversation summary type for listing conversations
export const conversationSummarySchema = z.object({
  other_user: userSchema,
  last_message: messageSchema.nullable(),
  unread_count: z.number()
});

export type ConversationSummary = z.infer<typeof conversationSummarySchema>;
