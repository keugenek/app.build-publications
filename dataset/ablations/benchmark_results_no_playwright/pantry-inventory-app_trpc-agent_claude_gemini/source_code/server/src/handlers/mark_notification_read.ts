import { db } from '../db';
import { notificationsTable } from '../db/schema';
import { type MarkNotificationReadInput, type Notification } from '../schema';
import { eq } from 'drizzle-orm';

export const markNotificationRead = async (input: MarkNotificationReadInput): Promise<Notification> => {
  try {
    // Update the notification to mark it as read
    const result = await db.update(notificationsTable)
      .set({ is_read: true })
      .where(eq(notificationsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Notification with id ${input.id} not found`);
    }

    const notification = result[0];
    return {
      id: notification.id,
      pantry_item_id: notification.pantry_item_id,
      message: notification.message,
      notification_type: notification.notification_type,
      is_read: notification.is_read,
      created_at: notification.created_at
    };
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    throw error;
  }
};
