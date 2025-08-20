import { z } from 'zod';

// ---------- User ----------
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(), // stored hash, not exposed in input schemas
  created_at: z.coerce.date(),
});
export type User = z.infer<typeof userSchema>;

export const createUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6), // plain password, will be hashed in real impl
});
export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// ---------- Collection ----------
export const collectionSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
});
export type Collection = z.infer<typeof collectionSchema>;

export const createCollectionInputSchema = z.object({
  user_id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
});
export type CreateCollectionInput = z.infer<typeof createCollectionInputSchema>;

// ---------- Tag ----------
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

// ---------- Bookmark ----------
export const bookmarkSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  url: z.string().url(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  collection_id: z.number().nullable(),
  created_at: z.coerce.date(),
});
export type Bookmark = z.infer<typeof bookmarkSchema>;

export const createBookmarkInputSchema = z.object({
  user_id: z.number(),
  url: z.string().url(),
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  collection_id: z.number().nullable().optional(),
});
export type CreateBookmarkInput = z.infer<typeof createBookmarkInputSchema>;

// ---------- Assign Tag to Bookmark ----------
export const assignTagInputSchema = z.object({
  bookmark_id: z.number(),
  tag_id: z.number(),
});
export type AssignTagInput = z.infer<typeof assignTagInputSchema>;

// ---------- Search Bookmarks ----------
export const searchBookmarksInputSchema = z.object({
  user_id: z.number(),
  query: z.string(), // free text search on title/url/description
  tag_ids: z.array(z.number()).optional(),
  collection_id: z.number().optional(),
});
export type SearchBookmarksInput = z.infer<typeof searchBookmarksInputSchema>;
