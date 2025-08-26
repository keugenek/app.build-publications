import { type AssignTagToBookmarkInput, type Bookmark } from '../schema';
import { db } from '../db';
import { bookmarkTags, bookmarks } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Assign a tag to a bookmark by inserting a row into the linking table.
 * Returns the full bookmark record after the association is created.
 * Throws an error if the bookmark does not exist.
 */
export const assignTagToBookmark = async (
  input: AssignTagToBookmarkInput,
): Promise<Bookmark> => {
  // Ensure the bookmark exists before creating the association.
  const bookmarkRows = await db
    .select()
    .from(bookmarks)
    .where(eq(bookmarks.id, input.bookmark_id))
    .limit(1)
    .execute();

  const bookmark = bookmarkRows[0];
  if (!bookmark) {
    throw new Error(`Bookmark with id ${input.bookmark_id} not found`);
  }

  // Insert the linking record.
  await db
    .insert(bookmarkTags)
    .values({
      bookmark_id: input.bookmark_id,
      tag_id: input.tag_id,
    })
    .execute();

  // Return the existing bookmark.
  return bookmark as Bookmark;
};
