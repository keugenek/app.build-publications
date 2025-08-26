import { db } from '../db';
import { bookmarksTable, tagsTable, bookmarkTagsTable } from '../db/schema';
import { type CreateBookmarkInput, type Bookmark } from '../schema';
import { inArray } from 'drizzle-orm';

export const createBookmark = async (input: CreateBookmarkInput): Promise<Bookmark> => {
  try {
    // Start a transaction to ensure data consistency
    return await db.transaction(async (tx) => {
      // Insert the bookmark
      const bookmarkResult = await tx.insert(bookmarksTable)
        .values({
          user_id: input.user_id,
          title: input.title,
          url: input.url,
          description: input.description,
          is_public: false, // Default value
        })
        .returning()
        .execute();
      
      const bookmark = bookmarkResult[0];
      
      // Handle tags if provided
      if (input.tags && input.tags.length > 0) {
        // Find or create tags
        const tagNames = input.tags;
        let existingTags = await tx.select()
          .from(tagsTable)
          .where(
            inArray(tagsTable.name, tagNames)
          )
          .execute();
        
        // Create missing tags
        const existingTagNames = existingTags.map(tag => tag.name);
        const newTagNames = tagNames.filter(name => !existingTagNames.includes(name));
        
        if (newTagNames.length > 0) {
          const newTagsResult = await tx.insert(tagsTable)
            .values(newTagNames.map(name => ({
              user_id: input.user_id,
              name: name
            })))
            .returning()
            .execute();
          
          existingTags = [...existingTags, ...newTagsResult];
        }
        
        // Create bookmark-tag associations
        const tagIds = existingTags
          .filter(tag => tagNames.includes(tag.name))
          .map(tag => tag.id);
        
        if (tagIds.length > 0) {
          await tx.insert(bookmarkTagsTable)
            .values(tagIds.map(tagId => ({
              bookmark_id: bookmark.id,
              tag_id: tagId
            })))
            .execute();
        }
      }
      
      // Return the bookmark in the expected format
      return {
        id: bookmark.id,
        user_id: bookmark.user_id,
        collection_id: input.collection_id, // This is just for the API response, not stored in DB
        title: bookmark.title,
        url: bookmark.url,
        description: bookmark.description,
        created_at: bookmark.created_at,
        updated_at: bookmark.updated_at,
      };
    });
  } catch (error) {
    console.error('Bookmark creation failed:', error);
    throw error;
  }
};
