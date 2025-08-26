// Zod schema definitions for the minimal notes application
import { z } from 'zod';

// ---------- User ----------
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(), // Stored hash, never null in DB
  created_at: z.coerce.date(),
});
export type User = z.infer<typeof userSchema>;

export const createUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6), // Plain password, will be hashed later
});
export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const updateUserInputSchema = z.object({
  id: z.number(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(), // New password if changing
});
export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

// ---------- Folder ----------
export const folderSchema = z.object({
  id: z.number(),
  name: z.string(),
  user_id: z.number(),
  created_at: z.coerce.date(),
});
export type Folder = z.infer<typeof folderSchema>;

export const createFolderInputSchema = z.object({
  name: z.string(),
  user_id: z.number(),
});
export type CreateFolderInput = z.infer<typeof createFolderInputSchema>;

export const updateFolderInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
});
export type UpdateFolderInput = z.infer<typeof updateFolderInputSchema>;

// ---------- Note ----------
export const noteSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  folder_id: z.number().nullable(), // Nullable: note may be at root
  user_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});
export type Note = z.infer<typeof noteSchema>;

export const createNoteInputSchema = z.object({
  title: z.string(),
  content: z.string(),
  folder_id: z.number().nullable().optional(), // Optional on create, can be omitted (treated as null)
  user_id: z.number(),
});
export type CreateNoteInput = z.infer<typeof createNoteInputSchema>;

export const updateNoteInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  content: z.string().optional(),
  folder_id: z.number().nullable().optional(),
});
export type UpdateNoteInput = z.infer<typeof updateNoteInputSchema>;

// ---------- Simple ID input schemas for delete operations ----------
export const deleteByIdInputSchema = z.object({
  id: z.number(),
});
export type DeleteByIdInput = z.infer<typeof deleteByIdInputSchema>;
