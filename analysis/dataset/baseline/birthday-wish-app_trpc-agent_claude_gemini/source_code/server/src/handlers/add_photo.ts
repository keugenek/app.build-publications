import { db } from '../db';
import { photosTable, birthdayCardsTable } from '../db/schema';
import { type CreatePhotoInput, type Photo } from '../schema';
import { eq } from 'drizzle-orm';

export async function addPhoto(input: CreatePhotoInput): Promise<Photo> {
  try {
    // First, validate that the birthday card exists
    const existingCard = await db.select()
      .from(birthdayCardsTable)
      .where(eq(birthdayCardsTable.id, input.card_id))
      .execute();

    if (existingCard.length === 0) {
      throw new Error(`Birthday card with ID ${input.card_id} not found`);
    }

    // Insert photo record
    const result = await db.insert(photosTable)
      .values({
        card_id: input.card_id,
        filename: input.filename,
        original_name: input.original_name,
        file_size: input.file_size,
        mime_type: input.mime_type,
        caption: input.caption,
        display_order: input.display_order
      })
      .returning()
      .execute();

    const photo = result[0];
    return photo;
  } catch (error) {
    console.error('Photo addition failed:', error);
    throw error;
  }
}
