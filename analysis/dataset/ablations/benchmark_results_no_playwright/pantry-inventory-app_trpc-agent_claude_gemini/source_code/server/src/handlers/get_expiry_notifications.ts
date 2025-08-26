import { db } from '../db';
import { pantryItemsTable, notificationsTable } from '../db/schema';
import { type GetExpiryNotificationsInput, type Notification } from '../schema';
import { eq, lte, gte, and, or, sql } from 'drizzle-orm';

export async function getExpiryNotifications(input: GetExpiryNotificationsInput): Promise<Notification[]> {
  try {
    // Calculate date thresholds
    const now = new Date();
    const futureThreshold = new Date();
    futureThreshold.setDate(now.getDate() + input.days_ahead);

    // First, find pantry items that need notifications
    const conditions = [];

    if (input.include_expired) {
      // Include expired items (expiry_date < now)
      conditions.push(lte(pantryItemsTable.expiry_date, now));
    }

    // Include items expiring within the specified days
    conditions.push(
      and(
        gte(pantryItemsTable.expiry_date, now),
        lte(pantryItemsTable.expiry_date, futureThreshold)
      )
    );

    const pantryItemsNeedingNotifications = await db.select()
      .from(pantryItemsTable)
      .where(or(...conditions))
      .execute();

    // Create notifications for items that don't already have them
    const notificationsToCreate = [];
    
    for (const item of pantryItemsNeedingNotifications) {
      const isExpired = item.expiry_date <= now;
      const notificationType = isExpired ? 'expired' as const : 'expiring_soon' as const;
      
      // Check if notification already exists for this item and type
      const existingNotifications = await db.select()
        .from(notificationsTable)
        .where(
          and(
            eq(notificationsTable.pantry_item_id, item.id),
            eq(notificationsTable.notification_type, notificationType)
          )
        )
        .execute();

      // Only create notification if it doesn't exist
      if (existingNotifications.length === 0) {
        const message = isExpired 
          ? `${item.name} has expired on ${item.expiry_date.toDateString()}`
          : `${item.name} will expire on ${item.expiry_date.toDateString()}`;

        notificationsToCreate.push({
          pantry_item_id: item.id,
          message,
          notification_type: notificationType,
          is_read: false
        });
      }
    }

    // Insert new notifications if any
    if (notificationsToCreate.length > 0) {
      await db.insert(notificationsTable)
        .values(notificationsToCreate)
        .execute();
    }

    // Fetch all relevant notifications (existing + newly created)
    const notificationConditions = [];

    if (input.include_expired) {
      notificationConditions.push(eq(notificationsTable.notification_type, 'expired'));
    }
    
    notificationConditions.push(eq(notificationsTable.notification_type, 'expiring_soon'));

    const notifications = await db.select()
      .from(notificationsTable)
      .innerJoin(pantryItemsTable, eq(notificationsTable.pantry_item_id, pantryItemsTable.id))
      .where(or(...notificationConditions))
      .execute();

    // Filter notifications based on current expiry status
    const validNotifications = notifications.filter(result => {
      const pantryItem = result.pantry_items;
      const notification = result.notifications;
      
      const isExpired = pantryItem.expiry_date <= now;
      const isExpiringSoon = pantryItem.expiry_date > now && pantryItem.expiry_date <= futureThreshold;

      if (notification.notification_type === 'expired' && input.include_expired && isExpired) {
        return true;
      }
      
      if (notification.notification_type === 'expiring_soon' && isExpiringSoon) {
        return true;
      }
      
      return false;
    });

    // Return formatted notifications
    return validNotifications.map(result => ({
      id: result.notifications.id,
      pantry_item_id: result.notifications.pantry_item_id,
      message: result.notifications.message,
      notification_type: result.notifications.notification_type,
      is_read: result.notifications.is_read,
      created_at: result.notifications.created_at
    }));

  } catch (error) {
    console.error('Failed to get expiry notifications:', error);
    throw error;
  }
}
