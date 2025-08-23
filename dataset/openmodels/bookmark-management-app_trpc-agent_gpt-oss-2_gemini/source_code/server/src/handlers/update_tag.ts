import { db } from '../db';
import { tags } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { UpdateTagInput, Tag } from '../schema';

/**
 * Updates a tag's fields.
 *
 * This function updates the tag identified by `input.id` with any provided fields.
 * It returns the updated tag record as defined by the Zod schema `Tag`.
 * Throws an error if the tag does not exist.
 */
export const updateTag = async (input: UpdateTagInput): Promise<Tag> => {
  try {
    // Build the update payload, only include fields that are defined.
    const updatePayload: Partial<typeof tags.$inferInsert> = {};
    if (input.name !== undefined) {
      updatePayload.name = input.name;
    }

    const result = await db
      .update(tags)
      .set(updatePayload)
      .where(eq(tags.id, input.id))
      .returning()
      .execute();

    const updated = result[0];
    if (!updated) {
      throw new Error('Tag not found');
    }

    // Return shape matching Tag schema
    return {
      id: updated.id,
      name: updated.name,
      user_id: updated.user_id ?? null,
      created_at: updated.created_at,
    } as Tag;
  } catch (error) {
    console.error('Failed to update tag:', error);
    throw error;
  }
};
