import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProfilesTable, messagesTable } from '../db/schema';
import { type SendMessageInput, type CreateUserProfileInput } from '../schema';
import { sendMessage } from '../handlers/send_message';
import { eq } from 'drizzle-orm';

// Helper function to create a user profile for testing
const createUserProfile = async (input: CreateUserProfileInput) => {
  const result = await db.insert(userProfilesTable)
    .values({
      name: input.name,
      email: input.email,
      skill_level: input.skill_level,
      location: input.location,
      bio: input.bio
    })
    .returning()
    .execute();
  
  return result[0];
};

// Test users
const senderInput: CreateUserProfileInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  skill_level: 'intermediate',
  location: 'New York',
  bio: 'I am a tennis player'
};

const recipientInput: CreateUserProfileInput = {
  name: 'Jane Smith',
  email: 'jane.smith@example.com',
  skill_level: 'advanced',
  location: 'Los Angeles',
  bio: 'Professional tennis player'
};

// Test message
const testInput: SendMessageInput = {
  sender_id: 0, // Will be set after creating users
  recipient_id: 0, // Will be set after creating users
  content: 'Hello, would you like to play tennis this weekend?'
};

describe('sendMessage', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test users
    const sender = await createUserProfile(senderInput);
    const recipient = await createUserProfile(recipientInput);
    
    // Update test input with actual user IDs
    testInput.sender_id = sender.id;
    testInput.recipient_id = recipient.id;
  });
  
  afterEach(resetDB);

  it('should send a message', async () => {
    const result = await sendMessage(testInput);

    // Basic field validation
    expect(result.sender_id).toEqual(testInput.sender_id);
    expect(result.recipient_id).toEqual(testInput.recipient_id);
    expect(result.content).toEqual(testInput.content);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save message to database', async () => {
    const result = await sendMessage(testInput);

    // Query using proper drizzle syntax
    const messages = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.id, result.id))
      .execute();

    expect(messages).toHaveLength(1);
    expect(messages[0].sender_id).toEqual(testInput.sender_id);
    expect(messages[0].recipient_id).toEqual(testInput.recipient_id);
    expect(messages[0].content).toEqual(testInput.content);
    expect(messages[0].created_at).toBeInstanceOf(Date);
  });

  it('should fail when sender does not exist', async () => {
    const invalidInput = {
      ...testInput,
      sender_id: 99999 // Non-existent user ID
    };
    
    await expect(sendMessage(invalidInput)).rejects.toThrow(/Sender with ID 99999 not found/);
  });

  it('should fail when recipient does not exist', async () => {
    const invalidInput = {
      ...testInput,
      recipient_id: 99999 // Non-existent user ID
    };
    
    await expect(sendMessage(invalidInput)).rejects.toThrow(/Recipient with ID 99999 not found/);
  });
});
