import { type Bookmark } from '../schema';
import { db } from '../db';
import { bookmarks } from '../db/schema';
import { eq } from 'drizzle-orm';

/** Placeholder for deleting a bookmark. */
export const deleteBookmark = async (id: number): Promise<Bookmark> => {
  // In a real implementation, delete from DB and return deleted bookmark.
  // Fetch the bookmark to be deleted
  const bookmark = await db.select().from(bookmarks).where(eq(bookmarks.id, id)).limit(1).execute();
  if (bookmark.length === 0) {
    throw new Error(`Bookmark with id ${id} not found`);
  }
  const toDelete = bookmark[0];

  // Delete the bookmark
  await db.delete(bookmarks).where(eq(bookmarks.id, id)).execute();

  // Return the deleted record (converted to schema type)
  return {
    id: toDelete.id,
    url: toDelete.url,
    title: toDelete.title,
    description: toDelete.description ?? null,
    created_at: toDelete.created_at,
    user_id: toDelete.user_id ?? null,
  } as Bookmark;

  // No extra return
};
