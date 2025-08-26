import { db } from '../db';
import { bookmarksTable, bookmarkTagsTable, collectionsTable, tagsTable } from '../db/schema';
import { type CreateBookmarkInput, type BookmarkWithData } from '../schema';
import { eq, inArray } from 'drizzle-orm';

export const createBookmark = async (input: CreateBookmarkInput): Promise<BookmarkWithData> => {
  try {
    // Verify the user's collection exists (if collection_id provided)
    let collectionName: string | null = null;
    if (input.collection_id) {
      const collections = await db.select()
        .from(collectionsTable)
        .where(eq(collectionsTable.id, input.collection_id))
        .execute();
      
      if (collections.length === 0) {
        throw new Error(`Collection with id ${input.collection_id} not found`);
      }
      collectionName = collections[0].name;
    }

    // Verify tags exist (if tag_ids provided)
    let verifiedTags: any[] = [];
    if (input.tag_ids && input.tag_ids.length > 0) {
      verifiedTags = await db.select()
        .from(tagsTable)
        .where(inArray(tagsTable.id, input.tag_ids))
        .execute();
      
      if (verifiedTags.length !== input.tag_ids.length) {
        throw new Error('One or more tag IDs not found');
      }
    }

    // Insert the bookmark
    const bookmarkResult = await db.insert(bookmarksTable)
      .values({
        url: input.url,
        title: input.title,
        description: input.description,
        user_id: input.user_id,
        collection_id: input.collection_id,
      })
      .returning()
      .execute();

    const bookmark = bookmarkResult[0];

    // Associate tags with the bookmark if provided
    if (input.tag_ids && input.tag_ids.length > 0) {
      const tagAssociations = input.tag_ids.map(tagId => ({
        bookmark_id: bookmark.id,
        tag_id: tagId,
      }));

      await db.insert(bookmarkTagsTable)
        .values(tagAssociations)
        .execute();
    }

    // Return the bookmark with associated data
    return {
      id: bookmark.id,
      url: bookmark.url,
      title: bookmark.title,
      description: bookmark.description,
      user_id: bookmark.user_id,
      collection_id: bookmark.collection_id,
      collection_name: collectionName,
      tags: verifiedTags,
      created_at: bookmark.created_at,
      updated_at: bookmark.updated_at
    };
  } catch (error) {
    console.error('Bookmark creation failed:', error);
    throw error;
  }
};
