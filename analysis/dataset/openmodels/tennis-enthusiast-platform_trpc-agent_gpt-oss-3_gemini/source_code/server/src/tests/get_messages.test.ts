import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { users, messages } from '../db/schema';
import { type CreateUserInput, type CreateMessageInput } from '../schema';
import { getMessages } from '../handlers/get_messages';
import { eq } from 'drizzle-orm';

// Helper to create a user and return its id
const createUser = async (input: CreateUserInput) => {
  const [user] = await db
    .insert(users)
    .values({
      name: input.name,
      bio: input.bio ?? null,
      skill_level: input.skill_level,
      city: input.city,
      state: input.state,
    })
    .returning()
    .execute();
  return user.id;
};

// Helper to create a message
const createMessage = async (input: CreateMessageInput) => {
  const [msg] = await db
    .insert(messages)
    .values({
      sender_id: input.sender_id,
      receiver_id: input.receiver_id,
      content: input.content,
    })
    .returning()
    .execute();
  return msg.id;
};

describe('getMessages', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve messages exchanged between two users ordered by newest first', async () => {
    // Create two users
    const userAId = await createUser({
      name: 'Alice',
      skill_level: 'Beginner',
      city: 'CityA',
      state: 'StateA',
    });
    const userBId = await createUser({
      name: 'Bob',
      skill_level: 'Intermediate',
      city: 'CityB',
      state: 'StateB',
    });

    // Insert messages: A -> B, then B -> A (so B->A is newer)
    await createMessage({
      sender_id: userAId,
      receiver_id: userBId,
      content: 'Hello from Alice',
    });
    // Slight delay to ensure timestamp difference (optional)
    await new Promise(r => setTimeout(r, 10));
    await createMessage({
      sender_id: userBId,
      receiver_id: userAId,
      content: 'Reply from Bob',
    });

    const msgs = await getMessages({ user_id: userAId, other_user_id: userBId });

    expect(msgs).toHaveLength(2);
    // Newest message first
    expect(msgs[0].content).toBe('Reply from Bob');
    expect(msgs[1].content).toBe('Hello from Alice');
    // Verify sender/receiver pairs are correct
    expect(msgs[0].sender_id).toBe(userBId);
    expect(msgs[0].receiver_id).toBe(userAId);
    expect(msgs[1].sender_id).toBe(userAId);
    expect(msgs[1].receiver_id).toBe(userBId);
  });

  it('should not return messages from other user pairs', async () => {
    const userAId = await createUser({
      name: 'Alice',
      skill_level: 'Beginner',
      city: 'CityA',
      state: 'StateA',
    });
    const userBId = await createUser({
      name: 'Bob',
      skill_level: 'Intermediate',
      city: 'CityB',
      state: 'StateB',
    });
    const userCId = await createUser({
      name: 'Carol',
      skill_level: 'Advanced',
      city: 'CityC',
      state: 'StateC',
    });

    // Messages between A and B
    await createMessage({ sender_id: userAId, receiver_id: userBId, content: 'A->B' });
    // Message between A and C (should be ignored)
    await createMessage({ sender_id: userAId, receiver_id: userCId, content: 'A->C' });

    const msgs = await getMessages({ user_id: userAId, other_user_id: userBId });
    expect(msgs).toHaveLength(1);
    expect(msgs[0].content).toBe('A->B');
  });
});
