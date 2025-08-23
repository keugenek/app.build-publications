import { z } from 'zod';

// User output schema (represents a user record from the database)
export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  skill_level: z.string(),
  location: z.string(),
  created_at: z.coerce.date(),
});

export type User = z.infer<typeof userSchema>;

// Input schema for creating a new user
export const createUserInputSchema = z.object({
  name: z.string().min(1),
  skill_level: z.string().min(1),
  location: z.string().min(1),
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Input schema for searching users by location and/or skill level
export const searchUsersInputSchema = z.object({
  location: z.string().optional(),
  skill_level: z.string().optional(),
});

export type SearchUsersInput = z.infer<typeof searchUsersInputSchema>;
