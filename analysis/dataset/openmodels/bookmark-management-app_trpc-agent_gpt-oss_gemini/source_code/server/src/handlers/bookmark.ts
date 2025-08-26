import { type CreateBookmarkInput, type Bookmark } from '../schema';

/** Placeholder for creating a bookmark */
export const createBookmark = async (input: CreateBookmarkInput): Promise<Bookmark> => {
  return {
    id: 0,
    user_id: input.user_id,
    url: input.url,
    title: input.title ?? null,
    description: input.description ?? null,
    collection_id: input.collection_id ?? null,
    created_at: new Date(),
  } as Bookmark;
};

/** Placeholder for fetching bookmarks */
export const getBookmarks = async (): Promise<Bookmark[]> => {
  return [];
};
