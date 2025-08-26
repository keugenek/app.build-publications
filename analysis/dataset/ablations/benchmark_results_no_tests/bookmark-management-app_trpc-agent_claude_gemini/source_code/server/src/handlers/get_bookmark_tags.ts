import { db } from '../db';
import { bookmarkTagsTable, tagsTable } from '../db/schema';
import { type Tag } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getBookmarkTags = async (bookmarkId: number): Promise<Tag[]> => {
  try {
    // Join bookmark_tags with tags to get all tags for the bookmark
    const results = await db.select({
      id: tagsTable.id,
      user_id: tagsTable.user_id,
      name: tagsTable.name,
      color: tagsTable.color,
      created_at: tagsTable.created_at
    })
      .from(bookmarkTagsTable)
      .innerJoin(tagsTable, eq(bookmarkTagsTable.tag_id, tagsTable.id))
      .where(eq(bookmarkTagsTable.bookmark_id, bookmarkId))
      .orderBy(asc(tagsTable.name))
      .execute();

    return results;
  } catch (error) {
    console.error('Get bookmark tags failed:', error);
    throw error;
  }
};
