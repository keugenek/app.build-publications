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

// Bookmark schema
export const bookmarkSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  url: z.string().url(),
  title: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Bookmark = z.infer<typeof bookmarkSchema>;

// Tag schema
export const tagSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string(),
  created_at: z.coerce.date(),
});

export type Tag = z.infer<typeof tagSchema>;

// Collection schema
export const collectionSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
});

export type Collection = z.infer<typeof collectionSchema>;

// Bookmark-Tag junction schema
export const bookmarkTagSchema = z.object({
  bookmark_id: z.number(),
  tag_id: z.number(),
});

export type BookmarkTag = z.infer<typeof bookmarkTagSchema>;

// Bookmark-Collection junction schema
export const bookmarkCollectionSchema = z.object({
  bookmark_id: z.number(),
  collection_id: z.number(),
});

export type BookmarkCollection = z.infer<typeof bookmarkCollectionSchema>;

// Input schemas for creating entities
export const createUserInputSchema = z.object({
  email: z.string().email(),
  name: z.string().nullable(),
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createBookmarkInputSchema = z.object({
  user_id: z.number(),
  url: z.string().url(),
  title: z.string(),
  description: z.string().nullable(),
});

export type CreateBookmarkInput = z.infer<typeof createBookmarkInputSchema>;

export const createTagInputSchema = z.object({
  user_id: z.number(),
  name: z.string(),
});

export type CreateTagInput = z.infer<typeof createTagInputSchema>;

export const createCollectionInputSchema = z.object({
  user_id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
});

export type CreateCollectionInput = z.infer<typeof createCollectionInputSchema>;

export const addTagToBookmarkInputSchema = z.object({
  bookmark_id: z.number(),
  tag_id: z.number(),
});

export type AddTagToBookmarkInput = z.infer<typeof addTagToBookmarkInputSchema>;

export const addBookmarkToCollectionInputSchema = z.object({
  bookmark_id: z.number(),
  collection_id: z.number(),
});

export type AddBookmarkToCollectionInput = z.infer<typeof addBookmarkToCollectionInputSchema>;

export const searchBookmarksInputSchema = z.object({
  user_id: z.number(),
  query: z.string(),
});

export type SearchBookmarksInput = z.infer<typeof searchBookmarksInputSchema>;
