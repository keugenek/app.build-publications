import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, messagesTable } from '../db/schema';
import { type MarkMessageReadInput } from '../schema';
import { markMessageRead } from '../handlers/mark_message_read';
import { eq } from 'drizzle-orm';

// Test data
const testSender = {
  name: 'John Sender',
  email: 'john@example.com',
  skill_level: 'intermediate' as const,
  location: 'New York',
  bio: null
};

const testRecipient = {
  name: 'Jane Recipient',
  email: 'jane@example.com',
  skill_level: 'beginner' as const,
  location: 'Boston',
  bio: null
};

describe('markMessageRead', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let senderId: number;
  let recipientId: number;
  let messageId: number;

  beforeEach(async () => {
    // Create test users
    const senderResult = await db.insert(usersTable)
      .values(testSender)
      .returning()
      .execute();
    senderId = senderResult[0].id;

    const recipientResult = await db.insert(usersTable)
      .values(testRecipient)
      .returning()
      .execute();
    recipientId = recipientResult[0].id;

    // Create a test message
    const messageResult = await db.insert(messagesTable)
      .values({
        sender_id: senderId,
        recipient_id: recipientId,
        content: 'Test message content'
      })
      .returning()
      .execute();
    messageId = messageResult[0].id;
  });

  it('should mark an unread message as read', async () => {
    const input: MarkMessageReadInput = {
      message_id: messageId
    };

    const result = await markMessageRead(recipientId, input);

    // Verify the result
    expect(result.id).toEqual(messageId);
    expect(result.sender_id).toEqual(senderId);
    expect(result.recipient_id).toEqual(recipientId);
    expect(result.content).toEqual('Test message content');
    expect(result.read_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update message in database', async () => {
    const input: MarkMessageReadInput = {
      message_id: messageId
    };

    const beforeUpdate = Date.now();
    await markMessageRead(recipientId, input);
    const afterUpdate = Date.now();

    // Verify database was updated
    const messages = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.id, messageId))
      .execute();

    expect(messages).toHaveLength(1);
    const message = messages[0];
    expect(message.read_at).toBeInstanceOf(Date);
    expect(message.read_at!.getTime()).toBeGreaterThanOrEqual(beforeUpdate);
    expect(message.read_at!.getTime()).toBeLessThanOrEqual(afterUpdate);
  });

  it('should return already read message without updating', async () => {
    // First, mark the message as read
    const firstReadTime = new Date('2024-01-01T12:00:00Z');
    await db.update(messagesTable)
      .set({ read_at: firstReadTime })
      .where(eq(messagesTable.id, messageId))
      .execute();

    const input: MarkMessageReadInput = {
      message_id: messageId
    };

    const result = await markMessageRead(recipientId, input);

    // Should return the message with original read_at time
    expect(result.read_at).toEqual(firstReadTime);

    // Verify database wasn't changed
    const messages = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.id, messageId))
      .execute();

    expect(messages[0].read_at).toEqual(firstReadTime);
  });

  it('should throw error when message does not exist', async () => {
    const input: MarkMessageReadInput = {
      message_id: 99999 // Non-existent message ID
    };

    await expect(markMessageRead(recipientId, input))
      .rejects.toThrow(/message not found or user is not the recipient/i);
  });

  it('should throw error when user is not the recipient', async () => {
    const input: MarkMessageReadInput = {
      message_id: messageId
    };

    // Try to mark message as read using sender ID instead of recipient ID
    await expect(markMessageRead(senderId, input))
      .rejects.toThrow(/message not found or user is not the recipient/i);
  });

  it('should throw error when user tries to mark another users message as read', async () => {
    // Create another user
    const anotherUserResult = await db.insert(usersTable)
      .values({
        name: 'Another User',
        email: 'another@example.com',
        skill_level: 'advanced' as const,
        location: 'Chicago',
        bio: null
      })
      .returning()
      .execute();
    const anotherUserId = anotherUserResult[0].id;

    const input: MarkMessageReadInput = {
      message_id: messageId
    };

    // Try to mark message with wrong user ID
    await expect(markMessageRead(anotherUserId, input))
      .rejects.toThrow(/message not found or user is not the recipient/i);
  });

  it('should handle multiple messages correctly', async () => {
    // Create another message
    const secondMessageResult = await db.insert(messagesTable)
      .values({
        sender_id: senderId,
        recipient_id: recipientId,
        content: 'Second test message'
      })
      .returning()
      .execute();
    const secondMessageId = secondMessageResult[0].id;

    // Mark first message as read
    const firstInput: MarkMessageReadInput = {
      message_id: messageId
    };
    await markMessageRead(recipientId, firstInput);

    // Mark second message as read
    const secondInput: MarkMessageReadInput = {
      message_id: secondMessageId
    };
    const result = await markMessageRead(recipientId, secondInput);

    // Verify both messages are marked as read
    const messages = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.recipient_id, recipientId))
      .execute();

    expect(messages).toHaveLength(2);
    messages.forEach(message => {
      expect(message.read_at).toBeInstanceOf(Date);
    });

    // Verify the returned result is for the second message
    expect(result.id).toEqual(secondMessageId);
    expect(result.content).toEqual('Second test message');
  });
});
