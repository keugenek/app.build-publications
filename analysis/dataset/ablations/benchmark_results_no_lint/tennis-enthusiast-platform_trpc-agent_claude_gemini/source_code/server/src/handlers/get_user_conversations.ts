import { db } from '../db';
import { usersTable, messagesTable } from '../db/schema';
import { type GetUserConversationsInput, type ConversationSummary } from '../schema';
import { eq, or, and, desc, isNull, sql } from 'drizzle-orm';

export async function getUserConversations(userId: number, input: GetUserConversationsInput): Promise<ConversationSummary[]> {
  try {
    // Get all unique users that the current user has had conversations with
    // This includes both sent and received messages
    const conversationUsersQuery = db
      .selectDistinct({
        other_user_id: sql<number>`
          CASE 
            WHEN ${messagesTable.sender_id} = ${userId} THEN ${messagesTable.recipient_id}
            ELSE ${messagesTable.sender_id}
          END
        `.as('other_user_id')
      })
      .from(messagesTable)
      .where(
        or(
          eq(messagesTable.sender_id, userId),
          eq(messagesTable.recipient_id, userId)
        )
      );

    const conversationUsers = await conversationUsersQuery.execute();
    
    if (conversationUsers.length === 0) {
      return [];
    }

    // Get conversation summaries for each user
    const conversations: ConversationSummary[] = [];

    for (const { other_user_id } of conversationUsers) {
      // Get other user's info
      const otherUserResult = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, other_user_id))
        .execute();

      if (otherUserResult.length === 0) continue;

      const otherUser = otherUserResult[0];

      // Get the last message in the conversation
      const lastMessageResult = await db
        .select()
        .from(messagesTable)
        .where(
          or(
            and(
              eq(messagesTable.sender_id, userId),
              eq(messagesTable.recipient_id, other_user_id)
            ),
            and(
              eq(messagesTable.sender_id, other_user_id),
              eq(messagesTable.recipient_id, userId)
            )
          )
        )
        .orderBy(desc(messagesTable.created_at))
        .limit(1)
        .execute();

      const lastMessage = lastMessageResult.length > 0 ? lastMessageResult[0] : null;

      // Count unread messages from the other user to current user
      const unreadCountResult = await db
        .select({
          count: sql<number>`count(*)`
        })
        .from(messagesTable)
        .where(
          and(
            eq(messagesTable.sender_id, other_user_id),
            eq(messagesTable.recipient_id, userId),
            isNull(messagesTable.read_at)
          )
        )
        .execute();

      const unreadCount = Number(unreadCountResult[0]?.count || 0);

      conversations.push({
        other_user: otherUser,
        last_message: lastMessage,
        unread_count: unreadCount
      });
    }

    // Sort conversations by last message timestamp (most recent first)
    // Conversations with no messages go to the end
    conversations.sort((a, b) => {
      if (!a.last_message && !b.last_message) return 0;
      if (!a.last_message) return 1;
      if (!b.last_message) return -1;
      return b.last_message.created_at.getTime() - a.last_message.created_at.getTime();
    });

    // Apply limit
    return conversations.slice(0, input.limit);
  } catch (error) {
    console.error('Get user conversations failed:', error);
    throw error;
  }
}
