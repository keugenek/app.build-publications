import { z } from 'zod';

// ---------- User Schemas ----------
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  created_at: z.coerce.date(),
});
export type User = z.infer<typeof userSchema>;

export const createUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6), // password will be hashed downstream
});
export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
export type LoginInput = z.infer<typeof loginInputSchema>;

// ---------- Folder (Category) Schemas ----------
export const folderSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string(),
  created_at: z.coerce.date(),
});
export type Folder = z.infer<typeof folderSchema>;

export const createFolderInputSchema = z.object({
  name: z.string(),
});
export type CreateFolderInput = z.infer<typeof createFolderInputSchema>;

// ---------- Note Schemas ----------
export const noteSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  folder_id: z.number().nullable().optional(),
  content: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});
export type Note = z.infer<typeof noteSchema>;

export const createNoteInputSchema = z.object({
  content: z.string(),
  folder_id: z.number().nullable().optional(), // optional means can be omitted, nullable means can be null
});
export type CreateNoteInput = z.infer<typeof createNoteInputSchema>;

export const updateNoteInputSchema = z.object({
  id: z.number(),
  content: z.string().optional(),
  folder_id: z.number().nullable().optional(),
});
export type UpdateNoteInput = z.infer<typeof updateNoteInputSchema>;
