import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Input schema for user registration
export const createUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Input schema for user login
export const loginUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginUserInput = z.infer<typeof loginUserInputSchema>;

// Folder/Category schema
export const folderSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Folder = z.infer<typeof folderSchema>;

// Input schema for creating folders
export const createFolderInputSchema = z.object({
  user_id: z.number(),
  name: z.string().min(1, 'Folder name is required')
});

export type CreateFolderInput = z.infer<typeof createFolderInputSchema>;

// Input schema for updating folders
export const updateFolderInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Folder name is required').optional()
});

export type UpdateFolderInput = z.infer<typeof updateFolderInputSchema>;

// Note schema
export const noteSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  folder_id: z.number().nullable(),
  title: z.string(),
  content: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Note = z.infer<typeof noteSchema>;

// Input schema for creating notes
export const createNoteInputSchema = z.object({
  user_id: z.number(),
  folder_id: z.number().nullable(),
  title: z.string().min(1, 'Note title is required'),
  content: z.string()
});

export type CreateNoteInput = z.infer<typeof createNoteInputSchema>;

// Input schema for updating notes
export const updateNoteInputSchema = z.object({
  id: z.number(),
  folder_id: z.number().nullable().optional(),
  title: z.string().min(1, 'Note title is required').optional(),
  content: z.string().optional()
});

export type UpdateNoteInput = z.infer<typeof updateNoteInputSchema>;

// Input schema for getting notes by folder
export const getNotesByFolderInputSchema = z.object({
  user_id: z.number(),
  folder_id: z.number().nullable()
});

export type GetNotesByFolderInput = z.infer<typeof getNotesByFolderInputSchema>;

// Input schema for getting user's folders
export const getUserFoldersInputSchema = z.object({
  user_id: z.number()
});

export type GetUserFoldersInput = z.infer<typeof getUserFoldersInputSchema>;

// Input schema for getting user's notes
export const getUserNotesInputSchema = z.object({
  user_id: z.number()
});

export type GetUserNotesInput = z.infer<typeof getUserNotesInputSchema>;

// Input schema for deleting notes
export const deleteNoteInputSchema = z.object({
  id: z.number(),
  user_id: z.number()
});

export type DeleteNoteInput = z.infer<typeof deleteNoteInputSchema>;

// Input schema for deleting folders
export const deleteFolderInputSchema = z.object({
  id: z.number(),
  user_id: z.number()
});

export type DeleteFolderInput = z.infer<typeof deleteFolderInputSchema>;
