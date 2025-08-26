import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kanjiTable } from '../db/schema';
import { type CreateKanjiInput } from '../schema';
import { createKanji } from '../handlers/create_kanji';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateKanjiInput = {
  character: '一',
  meaning: 'one',
  kunReading: 'ひと(つ)',
  onReading: 'イチ/イツ',
  jlptLevel: 'N5'
};

describe('createKanji', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a kanji', async () => {
    const result = await createKanji(testInput);

    // Basic field validation
    expect(result.character).toEqual('一');
    expect(result.meaning).toEqual('one');
    expect(result.kunReading).toEqual('ひと(つ)');
    expect(result.onReading).toEqual('イチ/イツ');
    expect(result.jlptLevel).toEqual('N5');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save kanji to database', async () => {
    const result = await createKanji(testInput);

    // Query using proper drizzle syntax
    const kanjiRecords = await db.select()
      .from(kanjiTable)
      .where(eq(kanjiTable.id, result.id))
      .execute();

    expect(kanjiRecords).toHaveLength(1);
    expect(kanjiRecords[0].character).toEqual('一');
    expect(kanjiRecords[0].meaning).toEqual('one');
    expect(kanjiRecords[0].kunReading).toEqual('ひと(つ)');
    expect(kanjiRecords[0].onReading).toEqual('イチ/イツ');
    expect(kanjiRecords[0].jlptLevel).toEqual('N5');
    expect(kanjiRecords[0].createdAt).toBeInstanceOf(Date);
  });

  it('should handle kanji with missing readings', async () => {
    const inputWithoutReadings: CreateKanjiInput = {
      character: '名',
      meaning: 'name',
      kunReading: null,
      onReading: null,
      jlptLevel: 'N5'
    };

    const result = await createKanji(inputWithoutReadings);

    expect(result.character).toEqual('名');
    expect(result.meaning).toEqual('name');
    expect(result.kunReading).toBeNull();
    expect(result.onReading).toBeNull();
    expect(result.jlptLevel).toEqual('N5');
  });
});
