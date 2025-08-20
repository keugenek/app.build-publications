import { db } from '../db';
import { plantsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdatePlantInput, type Plant } from '../schema';

/**
 * Updates a plant record in the database and returns the updated plant with the computed mood.
 *
 * Steps:
 * 1. Retrieve the existing plant row by `id`.
 * 2. Apply any provided updates (name, species, last_watered_at).
 * 3. Persist the changes using an UPDATE query.
 * 4. Re‑fetch the updated row (returning()) and compute the mood based on the
 *    `last_watered_at` timestamp – if the plant hasn't been watered for more than
 *    7 days it is considered "thirsty", otherwise "happy".
 *
 * Errors:
 * - Throws an error if the plant with the supplied `id` does not exist.
 */
export const updatePlant = async (input: UpdatePlantInput): Promise<Plant> => {
  // 1️⃣ Fetch the existing plant
  const existing = await db
    .select()
    .from(plantsTable)
    .where(eq(plantsTable.id, input.id))
    .limit(1)
    .execute();

  if (existing.length === 0) {
    throw new Error(`Plant with id ${input.id} not found`);
  }

  const current = existing[0];

  // 2️⃣ Build the update payload – keep current values when a field is omitted
  const updatePayload = {
    name: input.name ?? current.name,
    species: input.species ?? current.species,
    last_watered_at: input.last_watered_at ?? current.last_watered_at,
  } as const;

  // 3️⃣ Persist the changes and get the updated row back
  const updatedRows = await db
    .update(plantsTable)
    .set(updatePayload)
    .where(eq(plantsTable.id, input.id))
    .returning()
    .execute();

  const updated = updatedRows[0];

  // 4️⃣ Compute mood based on days since last watered
  const daysSinceWatered =
    (Date.now() - new Date(updated.last_watered_at).getTime()) /
    (1000 * 60 * 60 * 24);

  const mood: Plant['mood'] = daysSinceWatered > 7 ? 'thirsty' : 'happy';

  // Return the full Plant shape expected by the API/schema
  return {
    ...updated,
    mood,
  } as Plant;
};
