import { z } from 'zod';

// ---------- User Schemas ----------
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(), // stored hash, never returned to client
  created_at: z.coerce.date(),
});
export type User = z.infer<typeof userSchema>;

export const createUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6), // raw password, will be hashed in real impl
});
export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const loginUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
export type LoginUserInput = z.infer<typeof loginUserInputSchema>;

// ---------- Collection Schemas ----------
export const collectionSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string(),
  created_at: z.coerce.date(),
});
export type Collection = z.infer<typeof collectionSchema>;

export const createCollectionInputSchema = z.object({
  user_id: z.number(),
  name: z.string(),
});
export type CreateCollectionInput = z.infer<typeof createCollectionInputSchema>;

// ---------- Tag Schemas ----------
export const tagSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string(),
  created_at: z.coerce.date(),
});
export type Tag = z.infer<typeof tagSchema>;

export const createTagInputSchema = z.object({
  user_id: z.number(),
  name: z.string(),
});
export type CreateTagInput = z.infer<typeof createTagInputSchema>;

// ---------- Bookmark Schemas ----------
export const bookmarkSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  collection_id: z.number().nullable(), // a bookmark can belong to no collection
  url: z.string().url(),
  title: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
});
export type Bookmark = z.infer<typeof bookmarkSchema>;

export const createBookmarkInputSchema = z.object({
  user_id: z.number(),
  collection_id: z.number().nullable().optional(),
  url: z.string().url(),
  title: z.string(),
  description: z.string().nullable().optional(),
  tag_ids: z.array(z.number()).optional(), // IDs of tags to associate
});
export type CreateBookmarkInput = z.infer<typeof createBookmarkInputSchema>;

export const getBookmarksInputSchema = z.object({
  user_id: z.number(),
  search: z.string().optional(), // free text search across url, title, description, tags
  tag_ids: z.array(z.number()).optional(),
  collection_id: z.number().nullable().optional(),
});
export type GetBookmarksInput = z.infer<typeof getBookmarksInputSchema>;
