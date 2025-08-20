import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  password_hash: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

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

// Tag schema
export const tagSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string(),
  color: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Tag = z.infer<typeof tagSchema>;

// Bookmark schema
export const bookmarkSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  collection_id: z.number().nullable(),
  title: z.string(),
  url: z.string().url(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Bookmark = z.infer<typeof bookmarkSchema>;

// Bookmark tag relation schema
export const bookmarkTagSchema = z.object({
  bookmark_id: z.number(),
  tag_id: z.number(),
  created_at: z.coerce.date()
});

export type BookmarkTag = z.infer<typeof bookmarkTagSchema>;

// Input schemas for creating entities
export const createUserInputSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6)
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createCollectionInputSchema = z.object({
  user_id: z.number(),
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional()
});

export type CreateCollectionInput = z.infer<typeof createCollectionInputSchema>;

export const createTagInputSchema = z.object({
  user_id: z.number(),
  name: z.string().min(1).max(50),
  color: z.string().nullable().optional()
});

export type CreateTagInput = z.infer<typeof createTagInputSchema>;

export const createBookmarkInputSchema = z.object({
  user_id: z.number(),
  collection_id: z.number().nullable().optional(),
  title: z.string().min(1).max(200),
  url: z.string().url(),
  description: z.string().nullable().optional(),
  tag_ids: z.array(z.number()).optional()
});

export type CreateBookmarkInput = z.infer<typeof createBookmarkInputSchema>;

// Input schemas for updating entities
export const updateUserInputSchema = z.object({
  id: z.number(),
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional()
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

export const updateCollectionInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().nullable().optional()
});

export type UpdateCollectionInput = z.infer<typeof updateCollectionInputSchema>;

export const updateTagInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(50).optional(),
  color: z.string().nullable().optional()
});

export type UpdateTagInput = z.infer<typeof updateTagInputSchema>;

export const updateBookmarkInputSchema = z.object({
  id: z.number(),
  collection_id: z.number().nullable().optional(),
  title: z.string().min(1).max(200).optional(),
  url: z.string().url().optional(),
  description: z.string().nullable().optional(),
  tag_ids: z.array(z.number()).optional()
});

export type UpdateBookmarkInput = z.infer<typeof updateBookmarkInputSchema>;

// Search schema
export const searchBookmarksInputSchema = z.object({
  user_id: z.number(),
  query: z.string().optional(),
  collection_id: z.number().optional(),
  tag_ids: z.array(z.number()).optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0)
});

export type SearchBookmarksInput = z.infer<typeof searchBookmarksInputSchema>;

// Get by user ID schemas
export const getUserEntityInputSchema = z.object({
  user_id: z.number()
});

export type GetUserEntityInput = z.infer<typeof getUserEntityInputSchema>;

// Delete schemas
export const deleteEntityInputSchema = z.object({
  id: z.number()
});

export type DeleteEntityInput = z.infer<typeof deleteEntityInputSchema>;
