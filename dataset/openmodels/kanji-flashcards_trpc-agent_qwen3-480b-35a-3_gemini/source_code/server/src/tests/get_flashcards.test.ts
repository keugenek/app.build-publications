import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kanjiTable, srsEntriesTable } from '../db/schema';
import { getFlashcards } from '../handlers/get_flashcards';

describe('getFlashcards', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test kanji entries
    const kanjiEntries = await db.insert(kanjiTable).values([
      {
        kanji: '一',
        meaning: 'one',
        onyomi: 'ichi',
        kunyomi: 'hito',
        jlpt_level: 'N5',
      },
      {
        kanji: '二',
        meaning: 'two',
        onyomi: 'ni',
        kunyomi: 'futa',
        jlpt_level: 'N5',
      },
    ]).returning();
    
    // Create test SRS entries
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateString = yesterday.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    if (kanjiEntries.length >= 2) {
      await db.insert(srsEntriesTable).values([
        {
          user_id: 1,
          kanji_id: kanjiEntries[0].id,
          familiarity_level: 2,
          next_review_date: dateString,
        },
        {
          user_id: 2,
          kanji_id: kanjiEntries[1].id,
          familiarity_level: 4,
          next_review_date: dateString,
        }
      ]);
    }
  });

  afterEach(resetDB);

  it('should fetch all flashcards with their SRS entries', async () => {
    const flashcards = await getFlashcards();
    
    // Should return 2 flashcards
    expect(flashcards).toHaveLength(2);
    
    // Check the structure of the first flashcard
    const firstCard = flashcards[0];
    expect(firstCard).toHaveProperty('id');
    expect(firstCard).toHaveProperty('kanji');
    expect(firstCard).toHaveProperty('srs_entry');
    
    // Check kanji data
    expect(firstCard.kanji.kanji).toBe('一');
    expect(firstCard.kanji.meaning).toBe('one');
    expect(firstCard.kanji.onyomi).toBe('ichi');
    expect(firstCard.kanji.kunyomi).toBe('hito');
    expect(firstCard.kanji.jlpt_level).toBe('N5');
    
    // Check SRS entry data
    expect(firstCard.srs_entry).not.toBeNull();
    if (firstCard.srs_entry) {
      expect(firstCard.srs_entry.user_id).toBe(1);
      expect(firstCard.srs_entry.familiarity_level).toBe(2);
      expect(firstCard.srs_entry.next_review_date).toBeInstanceOf(Date);
    }
  });

  it('should handle kanji without SRS entries', async () => {
    // Create a kanji without SRS entry
    await db.insert(kanjiTable).values({
      kanji: '三',
      meaning: 'three',
      onyomi: 'san',
      kunyomi: 'mi',
      jlpt_level: 'N5',
    });
    
    const flashcards = await getFlashcards();
    
    // Should now have 3 flashcards
    expect(flashcards).toHaveLength(3);
    
    // Find the new card
    const newCard = flashcards.find(card => card.kanji.kanji === '三');
    expect(newCard).toBeDefined();
    if (newCard) {
      expect(newCard.kanji.kanji).toBe('三');
      expect(newCard.srs_entry).toBeNull();
    }
  });
});
