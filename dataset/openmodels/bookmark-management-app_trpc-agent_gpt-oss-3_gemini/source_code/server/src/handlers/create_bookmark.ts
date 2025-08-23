import { type CreateBookmarkInput, type Bookmark } from '../schema';

/** Stub for creating a bookmark */
export const createBookmark = async (input: CreateBookmarkInput): Promise<Bookmark> => {
  return {
    id: 0,
    user_id: input.user_id,
    collection_id: input.collection_id ?? null,
    url: input.url,
    title: input.title,
    description: input.description ?? null,
    created_at: new Date(),
  } as Bookmark;
};
