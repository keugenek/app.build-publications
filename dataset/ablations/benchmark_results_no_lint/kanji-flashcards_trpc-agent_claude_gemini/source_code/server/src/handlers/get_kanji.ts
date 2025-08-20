import { db } from '../db';
import { kanjiTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Kanji, type JlptLevel } from '../schema';

export async function getAllKanji(): Promise<Kanji[]> {
  try {
    const results = await db.select()
      .from(kanjiTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch all kanji:', error);
    throw error;
  }
}

export async function getKanjiByLevel(jlptLevel: JlptLevel): Promise<Kanji[]> {
  try {
    const results = await db.select()
      .from(kanjiTable)
      .where(eq(kanjiTable.jlpt_level, jlptLevel))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch kanji by level:', error);
    throw error;
  }
}

export async function getKanjiById(id: number): Promise<Kanji | null> {
  try {
    const results = await db.select()
      .from(kanjiTable)
      .where(eq(kanjiTable.id, id))
      .execute();

    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Failed to fetch kanji by id:', error);
    throw error;
  }
}
