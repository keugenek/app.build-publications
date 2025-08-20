import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { birthdayCardsTable } from '../db/schema';
import { getAllBirthdayCards } from '../handlers/get_all_birthday_cards';

describe('getAllBirthdayCards', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no birthday cards exist', async () => {
    const result = await getAllBirthdayCards();
    
    expect(result).toEqual([]);
  });

  it('should return all birthday cards ordered by created_at desc', async () => {
    // Create test birthday cards with different creation times
    const firstCard = await db.insert(birthdayCardsTable)
      .values({
        recipient_name: 'Alice',
        message: 'Happy Birthday Alice!',
        sender_name: 'Bob',
        theme: 'confetti'
      })
      .returning()
      .execute();

    // Wait a small amount to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondCard = await db.insert(birthdayCardsTable)
      .values({
        recipient_name: 'Charlie',
        message: 'Have a great day!',
        sender_name: 'Diana',
        theme: 'balloons'
      })
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const thirdCard = await db.insert(birthdayCardsTable)
      .values({
        recipient_name: 'Eve',
        message: 'Wishing you happiness!',
        sender_name: 'Frank',
        theme: 'sparkles'
      })
      .returning()
      .execute();

    const result = await getAllBirthdayCards();

    // Should return all 3 cards
    expect(result).toHaveLength(3);

    // Should be ordered by created_at desc (newest first)
    expect(result[0].id).toEqual(thirdCard[0].id);
    expect(result[1].id).toEqual(secondCard[0].id);
    expect(result[2].id).toEqual(firstCard[0].id);

    // Verify all fields are present and correct
    expect(result[0].recipient_name).toEqual('Eve');
    expect(result[0].message).toEqual('Wishing you happiness!');
    expect(result[0].sender_name).toEqual('Frank');
    expect(result[0].theme).toEqual('sparkles');
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].recipient_name).toEqual('Charlie');
    expect(result[1].message).toEqual('Have a great day!');
    expect(result[1].sender_name).toEqual('Diana');
    expect(result[1].theme).toEqual('balloons');

    expect(result[2].recipient_name).toEqual('Alice');
    expect(result[2].message).toEqual('Happy Birthday Alice!');
    expect(result[2].sender_name).toEqual('Bob');
    expect(result[2].theme).toEqual('confetti');
  });

  it('should handle single birthday card correctly', async () => {
    const singleCard = await db.insert(birthdayCardsTable)
      .values({
        recipient_name: 'John',
        message: 'Another year older, another year wiser!',
        sender_name: 'Jane',
        theme: 'balloons'
      })
      .returning()
      .execute();

    const result = await getAllBirthdayCards();

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(singleCard[0].id);
    expect(result[0].recipient_name).toEqual('John');
    expect(result[0].message).toEqual('Another year older, another year wiser!');
    expect(result[0].sender_name).toEqual('Jane');
    expect(result[0].theme).toEqual('balloons');
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should verify correct date ordering with explicit timestamps', async () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Create cards with specific timestamps (oldest first)
    await db.insert(birthdayCardsTable)
      .values({
        recipient_name: 'Oldest Card',
        message: 'Created last week',
        sender_name: 'Test',
        theme: 'confetti',
        created_at: lastWeek,
        updated_at: lastWeek
      })
      .execute();

    await db.insert(birthdayCardsTable)
      .values({
        recipient_name: 'Middle Card', 
        message: 'Created yesterday',
        sender_name: 'Test',
        theme: 'balloons',
        created_at: yesterday,
        updated_at: yesterday
      })
      .execute();

    await db.insert(birthdayCardsTable)
      .values({
        recipient_name: 'Newest Card',
        message: 'Created now',
        sender_name: 'Test',
        theme: 'sparkles',
        created_at: now,
        updated_at: now
      })
      .execute();

    const result = await getAllBirthdayCards();

    expect(result).toHaveLength(3);
    
    // Should be ordered newest to oldest
    expect(result[0].recipient_name).toEqual('Newest Card');
    expect(result[1].recipient_name).toEqual('Middle Card');
    expect(result[2].recipient_name).toEqual('Oldest Card');

    // Verify timestamps are correct
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should handle all theme types correctly', async () => {
    const themes = ['confetti', 'balloons', 'sparkles'] as const;
    
    // Create one card for each theme
    for (let i = 0; i < themes.length; i++) {
      await db.insert(birthdayCardsTable)
        .values({
          recipient_name: `Recipient ${i}`,
          message: `Message for ${themes[i]} theme`,
          sender_name: `Sender ${i}`,
          theme: themes[i]
        })
        .execute();
    }

    const result = await getAllBirthdayCards();

    expect(result).toHaveLength(3);
    
    // Verify all themes are represented
    const resultThemes = result.map(card => card.theme).sort();
    expect(resultThemes).toEqual(['balloons', 'confetti', 'sparkles']);
  });
});
