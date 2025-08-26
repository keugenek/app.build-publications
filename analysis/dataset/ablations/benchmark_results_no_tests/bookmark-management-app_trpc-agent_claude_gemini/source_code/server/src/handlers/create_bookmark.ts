import { db } from '../db';
import { bookmarksTable, bookmarkTagsTable, usersTable, collectionsTable, tagsTable } from '../db/schema';
import { type CreateBookmarkInput, type Bookmark } from '../schema';
import { eq } from 'drizzle-orm';

export const createBookmark = async (input: CreateBookmarkInput): Promise<Bookmark> => {
  try {
    // Validate that user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();
    
    if (user.length === 0) {
      throw new Error(`User with id ${input.user_id} does not exist`);
    }

    // Validate collection exists if provided
    if (input.collection_id !== null && input.collection_id !== undefined) {
      const collection = await db.select()
        .from(collectionsTable)
        .where(eq(collectionsTable.id, input.collection_id))
        .execute();
      
      if (collection.length === 0) {
        throw new Error(`Collection with id ${input.collection_id} does not exist`);
      }
    }

    // Validate tags exist if provided
    if (input.tag_ids && input.tag_ids.length > 0) {
      const tags = await db.select()
        .from(tagsTable)
        .where(eq(tagsTable.id, input.tag_ids[0]))
        .execute();
      
      // Check each tag individually
      for (const tagId of input.tag_ids) {
        const tag = await db.select()
          .from(tagsTable)
          .where(eq(tagsTable.id, tagId))
          .execute();
        
        if (tag.length === 0) {
          throw new Error(`Tag with id ${tagId} does not exist`);
        }
      }
    }

    // Create the bookmark
    const result = await db.insert(bookmarksTable)
      .values({
        user_id: input.user_id,
        collection_id: input.collection_id || null,
        url: input.url,
        title: input.title,
        description: input.description || null,
        favicon_url: input.favicon_url || null
      })
      .returning()
      .execute();

    const bookmark = result[0];

    // Create bookmark-tag relationships if tag_ids provided
    if (input.tag_ids && input.tag_ids.length > 0) {
      const bookmarkTagValues = input.tag_ids.map(tagId => ({
        bookmark_id: bookmark.id,
        tag_id: tagId
      }));

      await db.insert(bookmarkTagsTable)
        .values(bookmarkTagValues)
        .execute();
    }

    return bookmark;
  } catch (error) {
    console.error('Bookmark creation failed:', error);
    throw error;
  }
};
