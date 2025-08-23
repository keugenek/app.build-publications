import { z } from 'zod';

// ---------- User Schemas ----------
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(), // Stored hash, never exposed to client
  created_at: z.coerce.date(),
});
export type User = z.infer<typeof userSchema>;

export const createUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6), // Plain password, will be hashed before persisting
});
export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const loginUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
export type LoginUserInput = z.infer<typeof loginUserInputSchema>;

// ---------- Bookmark Schemas ----------
export const bookmarkSchema = z.object({
  id: z.number(),
  url: z.string().url(),
  title: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  user_id: z.number().nullable(),
});
export type Bookmark = z.infer<typeof bookmarkSchema>;

export const createBookmarkInputSchema = z.object({
  url: z.string().url(),
  title: z.string(),
  description: z.string().nullable().optional(),
  // tags and collections are assigned via separate handlers
});
export type CreateBookmarkInput = z.infer<typeof createBookmarkInputSchema>;

export const updateBookmarkInputSchema = z.object({
  id: z.number(),
  url: z.string().url().optional(),
  title: z.string().optional(),
  description: z.string().nullable().optional(),
});
export type UpdateBookmarkInput = z.infer<typeof updateBookmarkInputSchema>;

// ---------- Tag Schemas ----------
export const tagSchema = z.object({
  id: z.number(),
  name: z.string(),
  user_id: z.number().nullable(),
  created_at: z.coerce.date(),
});
export type Tag = z.infer<typeof tagSchema>;

export const createTagInputSchema = z.object({
  name: z.string(),
});
export type CreateTagInput = z.infer<typeof createTagInputSchema>;

export const updateTagInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
});
export type UpdateTagInput = z.infer<typeof updateTagInputSchema>;

// ---------- Collection Schemas ----------
export const collectionSchema = z.object({
  id: z.number(),
  name: z.string(),
  user_id: z.number().nullable(),
  created_at: z.coerce.date(),
});
export type Collection = z.infer<typeof collectionSchema>;

export const createCollectionInputSchema = z.object({
  name: z.string(),
});
export type CreateCollectionInput = z.infer<typeof createCollectionInputSchema>;

export const updateCollectionInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
});
export type UpdateCollectionInput = z.infer<typeof updateCollectionInputSchema>;

// ---------- Linking Schemas (input only) ----------
export const assignTagToBookmarkInputSchema = z.object({
  bookmark_id: z.number(),
  tag_id: z.number(),
});
export type AssignTagToBookmarkInput = z.infer<typeof assignTagToBookmarkInputSchema>;

export const assignCollectionToBookmarkInputSchema = z.object({
  bookmark_id: z.number(),
  collection_id: z.number(),
});
export type AssignCollectionToBookmarkInput = z.infer<typeof assignCollectionToBookmarkInputSchema>;
