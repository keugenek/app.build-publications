import { z } from 'zod';

// Enums
export const skillLevelEnum = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);
export type SkillLevel = z.infer<typeof skillLevelEnum>;

export const matchStatusEnum = z.enum(['PENDING', 'ACCEPTED', 'COMPLETED']);
export type MatchStatus = z.infer<typeof matchStatusEnum>;

// User schemas
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  skill_level: skillLevelEnum,
  location: z.string(),
  profile_picture_url: z.string().nullable(),
  created_at: z.coerce.date(),
});
export type User = z.infer<typeof userSchema>;

export const createUserInputSchema = z.object({
  username: z.string(),
  skill_level: skillLevelEnum,
  location: z.string(),
  profile_picture_url: z.string().nullable().optional(), // optional when creating
});
export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const updateUserInputSchema = z.object({
  id: z.number(),
  username: z.string().optional(),
  skill_level: skillLevelEnum.optional(),
  location: z.string().optional(),
  profile_picture_url: z.string().nullable().optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

// Search input (simple)
export const searchPlayersInputSchema = z.object({
  skill_level: skillLevelEnum.optional(),
  location: z.string().optional(),
});
export type SearchPlayersInput = z.infer<typeof searchPlayersInputSchema>;

// Match schemas
export const matchSchema = z.object({
  id: z.number(),
  player_one_id: z.number(),
  player_two_id: z.number(),
  scheduled_at: z.coerce.date(),
  status: matchStatusEnum,
  created_at: z.coerce.date(),
});
export type Match = z.infer<typeof matchSchema>;

export const createMatchInputSchema = z.object({
  player_one_id: z.number(),
  player_two_id: z.number(),
  scheduled_at: z.coerce.date(),
});
export type CreateMatchInput = z.infer<typeof createMatchInputSchema>;

// Message schemas
export const messageSchema = z.object({
  id: z.number(),
  match_id: z.number(),
  sender_id: z.number(),
  content: z.string(),
  sent_at: z.coerce.date(),
});
export type Message = z.infer<typeof messageSchema>;

export const sendMessageInputSchema = z.object({
  match_id: z.number(),
  sender_id: z.number(),
  content: z.string(),
});
export type SendMessageInput = z.infer<typeof sendMessageInputSchema>;
