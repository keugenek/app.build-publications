import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type User = z.infer<typeof userSchema>;

// Folder schema
export const folderSchema = z.object({
  id: z.number(),
  name: z.string(),
  user_id: z.number(),
  parent_id: z.number().nullable(), // Nullable for root folders
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Folder = z.infer<typeof folderSchema>;

// Note schema
export const noteSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  user_id: z.number(),
  folder_id: z.number().nullable(), // Nullable for notes not in folders
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Note = z.infer<typeof noteSchema>;

// Input schema for creating users
export const createUserInputSchema = z.object({
  email: z.string().email(),
  name: z.string().nullable(),
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Input schema for creating folders
export const createFolderInputSchema = z.object({
  name: z.string(),
  user_id: z.number(),
  parent_id: z.number().nullable().optional(), // Optional when creating root folders
});

export type CreateFolderInput = z.infer<typeof createFolderInputSchema>;

// Input schema for creating notes
export const createNoteInputSchema = z.object({
  title: z.string(),
  content: z.string(),
  user_id: z.number(),
  folder_id: z.number().nullable().optional(), // Optional for notes not in folders
});

export type CreateNoteInput = z.infer<typeof createNoteInputSchema>;

// Input schema for updating folders
export const updateFolderInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  parent_id: z.number().nullable().optional(),
});

export type UpdateFolderInput = z.infer<typeof updateFolderInputSchema>;

// Input schema for updating notes
export const updateNoteInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  content: z.string().optional(),
  folder_id: z.number().nullable().optional(),
});

export type UpdateNoteInput = z.infer<typeof updateNoteInputSchema>;
