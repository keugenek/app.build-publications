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

// Collection schema
export const collectionSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Collection = z.infer<typeof collectionSchema>;

// Bookmark schema
export const bookmarkSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  collection_id: z.number().nullable(),
  title: z.string(),
  url: z.string().url(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Bookmark = z.infer<typeof bookmarkSchema>;

// Tag schema
export const tagSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export type Tag = z.infer<typeof tagSchema>;

// Bookmark-Tag junction schema
export const bookmarkTagSchema = z.object({
  bookmark_id: z.number(),
  tag_id: z.number(),
});

export type BookmarkTag = z.infer<typeof bookmarkTagSchema>;

// Input schema for creating users
export const createUserInputSchema = z.object({
  email: z.string().email(),
  name: z.string().nullable(),
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Input schema for creating collections
export const createCollectionInputSchema = z.object({
  user_id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
});

export type CreateCollectionInput = z.infer<typeof createCollectionInputSchema>;

// Input schema for creating bookmarks
export const createBookmarkInputSchema = z.object({
  user_id: z.number(),
  collection_id: z.number().nullable(),
  title: z.string(),
  url: z.string().url(),
  description: z.string().nullable(),
  tags: z.array(z.string()).optional(), // Array of tag names
});

export type CreateBookmarkInput = z.infer<typeof createBookmarkInputSchema>;

// Input schema for updating bookmarks
export const updateBookmarkInputSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  collection_id: z.number().nullable().optional(),
  title: z.string().optional(),
  url: z.string().url().optional(),
  description: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export type UpdateBookmarkInput = z.infer<typeof updateBookmarkInputSchema>;

// Input schema for creating tags
export const createTagInputSchema = z.object({
  name: z.string(),
});

export type CreateTagInput = z.infer<typeof createTagInputSchema>;

// Search input schema
export const searchBookmarksInputSchema = z.object({
  user_id: z.number(),
  query: z.string(),
});

export type SearchBookmarksInput = z.infer<typeof searchBookmarksInputSchema>;
