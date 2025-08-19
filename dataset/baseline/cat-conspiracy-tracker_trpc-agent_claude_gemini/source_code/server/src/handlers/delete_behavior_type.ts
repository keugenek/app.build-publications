import { db } from '../db';
import { behaviorTypesTable, catActivitiesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteBehaviorType(id: number): Promise<void> {
  try {
    // First check if the behavior type exists and is custom
    const behaviorTypes = await db.select()
      .from(behaviorTypesTable)
      .where(eq(behaviorTypesTable.id, id))
      .execute();

    if (behaviorTypes.length === 0) {
      throw new Error(`Behavior type with id ${id} not found`);
    }

    const behaviorType = behaviorTypes[0];
    
    // Only allow deletion of custom behavior types
    if (!behaviorType.is_custom) {
      throw new Error('Cannot delete predefined behavior types');
    }

    // Check if there are any activities referencing this behavior type
    const activities = await db.select()
      .from(catActivitiesTable)
      .where(eq(catActivitiesTable.behavior_type_id, id))
      .execute();

    if (activities.length > 0) {
      throw new Error(`Cannot delete behavior type: ${activities.length} activities are using this behavior type`);
    }

    // Delete the behavior type
    await db.delete(behaviorTypesTable)
      .where(eq(behaviorTypesTable.id, id))
      .execute();

  } catch (error) {
    console.error('Behavior type deletion failed:', error);
    throw error;
  }
}
