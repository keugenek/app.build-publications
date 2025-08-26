import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string(),
  username: z.string(),
  created_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Input schema for creating users
export const createUserInputSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50)
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Tag schema
export const tagSchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string().nullable(),
  user_id: z.number(),
  created_at: z.coerce.date()
});

export type Tag = z.infer<typeof tagSchema>;

// Input schema for creating tags
export const createTagInputSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().nullable(),
  user_id: z.number()
});

export type CreateTagInput = z.infer<typeof createTagInputSchema>;

// Collection schema
export const collectionSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  user_id: z.number(),
  created_at: z.coerce.date()
});

export type Collection = z.infer<typeof collectionSchema>;

// Input schema for creating collections
export const createCollectionInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullable(),
  user_id: z.number()
});

export type CreateCollectionInput = z.infer<typeof createCollectionInputSchema>;

// Bookmark schema
export const bookmarkSchema = z.object({
  id: z.number(),
  url: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  user_id: z.number(),
  collection_id: z.number().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Bookmark = z.infer<typeof bookmarkSchema>;

// Input schema for creating bookmarks
export const createBookmarkInputSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1).max(500),
  description: z.string().nullable(),
  user_id: z.number(),
  collection_id: z.number().nullable(),
  tag_ids: z.array(z.number()).optional()
});

export type CreateBookmarkInput = z.infer<typeof createBookmarkInputSchema>;

// Input schema for updating bookmarks
export const updateBookmarkInputSchema = z.object({
  id: z.number(),
  url: z.string().url().optional(),
  title: z.string().min(1).max(500).optional(),
  description: z.string().nullable().optional(),
  collection_id: z.number().nullable().optional(),
  tag_ids: z.array(z.number()).optional()
});

export type UpdateBookmarkInput = z.infer<typeof updateBookmarkInputSchema>;

// Bookmark tag relationship schema
export const bookmarkTagSchema = z.object({
  bookmark_id: z.number(),
  tag_id: z.number(),
  created_at: z.coerce.date()
});

export type BookmarkTag = z.infer<typeof bookmarkTagSchema>;

// Search input schema
export const searchBookmarksInputSchema = z.object({
  user_id: z.number(),
  query: z.string().optional(),
  tag_ids: z.array(z.number()).optional(),
  collection_id: z.number().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional()
});

export type SearchBookmarksInput = z.infer<typeof searchBookmarksInputSchema>;

// Extended bookmark schema with related data for responses
export const bookmarkWithDataSchema = z.object({
  id: z.number(),
  url: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  user_id: z.number(),
  collection_id: z.number().nullable(),
  collection_name: z.string().nullable(),
  tags: z.array(tagSchema),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type BookmarkWithData = z.infer<typeof bookmarkWithDataSchema>;
