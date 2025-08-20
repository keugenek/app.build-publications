import { db } from '../db';
import { tagsTable, bookmarkTagsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export async function deleteTag(tagId: number, userId: number): Promise<boolean> {
  try {
    // First verify the tag exists and belongs to the user
    const existingTags = await db.select()
      .from(tagsTable)
      .where(and(
        eq(tagsTable.id, tagId),
        eq(tagsTable.user_id, userId)
      ))
      .execute();

    if (existingTags.length === 0) {
      return false; // Tag doesn't exist or doesn't belong to user
    }

    // Delete all bookmark-tag relationships first (due to foreign key constraints)
    await db.delete(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.tag_id, tagId))
      .execute();

    // Delete the tag itself
    const deleteResult = await db.delete(tagsTable)
      .where(and(
        eq(tagsTable.id, tagId),
        eq(tagsTable.user_id, userId)
      ))
      .execute();

    return (deleteResult.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Tag deletion failed:', error);
    throw error;
  }
}
