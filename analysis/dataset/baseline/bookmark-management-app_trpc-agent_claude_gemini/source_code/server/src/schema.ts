import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  password_hash: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Input schemas for user operations
export const createUserInputSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8)
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const loginInputSchema = z.object({
  username: z.string(),
  password: z.string()
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Collection schema
export const collectionSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  user_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Collection = z.infer<typeof collectionSchema>;

// Input schemas for collection operations
export const createCollectionInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullable(),
  user_id: z.number()
});

export type CreateCollectionInput = z.infer<typeof createCollectionInputSchema>;

export const updateCollectionInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().nullable().optional()
});

export type UpdateCollectionInput = z.infer<typeof updateCollectionInputSchema>;

// Tag schema
export const tagSchema = z.object({
  id: z.number(),
  name: z.string(),
  user_id: z.number(),
  created_at: z.coerce.date()
});

export type Tag = z.infer<typeof tagSchema>;

// Input schemas for tag operations
export const createTagInputSchema = z.object({
  name: z.string().min(1).max(50),
  user_id: z.number()
});

export type CreateTagInput = z.infer<typeof createTagInputSchema>;

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

// Input schemas for bookmark operations
export const createBookmarkInputSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1).max(255),
  description: z.string().nullable(),
  user_id: z.number(),
  collection_id: z.number().nullable(),
  tag_ids: z.array(z.number()).optional()
});

export type CreateBookmarkInput = z.infer<typeof createBookmarkInputSchema>;

export const updateBookmarkInputSchema = z.object({
  id: z.number(),
  url: z.string().url().optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  collection_id: z.number().nullable().optional(),
  tag_ids: z.array(z.number()).optional()
});

export type UpdateBookmarkInput = z.infer<typeof updateBookmarkInputSchema>;

// Bookmark tag association schema
export const bookmarkTagSchema = z.object({
  id: z.number(),
  bookmark_id: z.number(),
  tag_id: z.number(),
  created_at: z.coerce.date()
});

export type BookmarkTag = z.infer<typeof bookmarkTagSchema>;

// Search schema
export const searchBookmarksInputSchema = z.object({
  user_id: z.number(),
  query: z.string().min(1),
  collection_id: z.number().optional(),
  tag_ids: z.array(z.number()).optional()
});

export type SearchBookmarksInput = z.infer<typeof searchBookmarksInputSchema>;

// Extended bookmark with tags and collection
export const bookmarkWithDetailsSchema = z.object({
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

export type BookmarkWithDetails = z.infer<typeof bookmarkWithDetailsSchema>;
