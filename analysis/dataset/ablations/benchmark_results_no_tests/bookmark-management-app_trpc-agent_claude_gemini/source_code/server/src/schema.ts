import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  display_name: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Input schemas for user operations
export const createUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  display_name: z.string().min(1)
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const loginUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginUserInput = z.infer<typeof loginUserInputSchema>;

// Collection schema
export const collectionSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Collection = z.infer<typeof collectionSchema>;

export const createCollectionInputSchema = z.object({
  user_id: z.number(),
  name: z.string().min(1),
  description: z.string().nullable().optional()
});

export type CreateCollectionInput = z.infer<typeof createCollectionInputSchema>;

export const updateCollectionInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional()
});

export type UpdateCollectionInput = z.infer<typeof updateCollectionInputSchema>;

// Tag schema
export const tagSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string(),
  color: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Tag = z.infer<typeof tagSchema>;

export const createTagInputSchema = z.object({
  user_id: z.number(),
  name: z.string().min(1),
  color: z.string().nullable().optional()
});

export type CreateTagInput = z.infer<typeof createTagInputSchema>;

// Bookmark schema
export const bookmarkSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  collection_id: z.number().nullable(),
  url: z.string().url(),
  title: z.string(),
  description: z.string().nullable(),
  favicon_url: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Bookmark = z.infer<typeof bookmarkSchema>;

export const createBookmarkInputSchema = z.object({
  user_id: z.number(),
  collection_id: z.number().nullable().optional(),
  url: z.string().url(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  favicon_url: z.string().url().nullable().optional(),
  tag_ids: z.array(z.number()).optional()
});

export type CreateBookmarkInput = z.infer<typeof createBookmarkInputSchema>;

export const updateBookmarkInputSchema = z.object({
  id: z.number(),
  collection_id: z.number().nullable().optional(),
  url: z.string().url().optional(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  favicon_url: z.string().url().nullable().optional(),
  tag_ids: z.array(z.number()).optional()
});

export type UpdateBookmarkInput = z.infer<typeof updateBookmarkInputSchema>;

// Bookmark-Tag relationship schema (for many-to-many)
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
  collection_id: z.number().optional(),
  tag_ids: z.array(z.number()).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0)
});

export type SearchBookmarksInput = z.infer<typeof searchBookmarksInputSchema>;

// Extended bookmark schema with relations for search results
export const bookmarkWithRelationsSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  collection_id: z.number().nullable(),
  url: z.string().url(),
  title: z.string(),
  description: z.string().nullable(),
  favicon_url: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  collection: collectionSchema.nullable().optional(),
  tags: z.array(tagSchema).optional()
});

export type BookmarkWithRelations = z.infer<typeof bookmarkWithRelationsSchema>;

// User statistics schema
export const userStatsSchema = z.object({
  user_id: z.number(),
  total_bookmarks: z.number(),
  total_collections: z.number(),
  total_tags: z.number()
});

export type UserStats = z.infer<typeof userStatsSchema>;
