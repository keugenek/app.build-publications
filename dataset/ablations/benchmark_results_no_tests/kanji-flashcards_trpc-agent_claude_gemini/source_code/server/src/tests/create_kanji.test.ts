import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kanjiTable } from '../db/schema';
import { type CreateKanjiInput } from '../schema';
import { createKanji } from '../handlers/create_kanji';
import { eq } from 'drizzle-orm';

// Test inputs with different JLPT levels and reading combinations
const testInputN5: CreateKanjiInput = {
  character: '水',
  meaning: 'water',
  on_reading: 'スイ',
  kun_reading: 'みず',
  jlpt_level: 'N5'
};

const testInputN1: CreateKanjiInput = {
  character: '憂',
  meaning: 'melancholy, grieve',
  on_reading: 'ユウ',
  kun_reading: 'うれ.える',
  jlpt_level: 'N1'
};

const testInputNullReadings: CreateKanjiInput = {
  character: '々',
  meaning: 'iteration mark',
  on_reading: null,
  kun_reading: null,
  jlpt_level: 'N3'
};

const testInputPartialReadings: CreateKanjiInput = {
  character: '一',
  meaning: 'one',
  on_reading: 'イチ、イツ',
  kun_reading: null,
  jlpt_level: 'N5'
};

describe('createKanji', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a kanji with all readings', async () => {
    const result = await createKanji(testInputN5);

    // Basic field validation
    expect(result.character).toEqual('水');
    expect(result.meaning).toEqual('water');
    expect(result.on_reading).toEqual('スイ');
    expect(result.kun_reading).toEqual('みず');
    expect(result.jlpt_level).toEqual('N5');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save kanji to database', async () => {
    const result = await createKanji(testInputN5);

    // Query using proper drizzle syntax
    const kanji = await db.select()
      .from(kanjiTable)
      .where(eq(kanjiTable.id, result.id))
      .execute();

    expect(kanji).toHaveLength(1);
    expect(kanji[0].character).toEqual('水');
    expect(kanji[0].meaning).toEqual('water');
    expect(kanji[0].on_reading).toEqual('スイ');
    expect(kanji[0].kun_reading).toEqual('みず');
    expect(kanji[0].jlpt_level).toEqual('N5');
    expect(kanji[0].created_at).toBeInstanceOf(Date);
  });

  it('should create kanji with different JLPT levels', async () => {
    const resultN1 = await createKanji(testInputN1);

    expect(resultN1.character).toEqual('憂');
    expect(resultN1.meaning).toEqual('melancholy, grieve');
    expect(resultN1.on_reading).toEqual('ユウ');
    expect(resultN1.kun_reading).toEqual('うれ.える');
    expect(resultN1.jlpt_level).toEqual('N1');
  });

  it('should handle null readings correctly', async () => {
    const result = await createKanji(testInputNullReadings);

    expect(result.character).toEqual('々');
    expect(result.meaning).toEqual('iteration mark');
    expect(result.on_reading).toBeNull();
    expect(result.kun_reading).toBeNull();
    expect(result.jlpt_level).toEqual('N3');

    // Verify null values are saved to database
    const kanji = await db.select()
      .from(kanjiTable)
      .where(eq(kanjiTable.id, result.id))
      .execute();

    expect(kanji[0].on_reading).toBeNull();
    expect(kanji[0].kun_reading).toBeNull();
  });

  it('should handle partial readings (only on_reading)', async () => {
    const result = await createKanji(testInputPartialReadings);

    expect(result.character).toEqual('一');
    expect(result.meaning).toEqual('one');
    expect(result.on_reading).toEqual('イチ、イツ');
    expect(result.kun_reading).toBeNull();
    expect(result.jlpt_level).toEqual('N5');
  });

  it('should enforce unique character constraint', async () => {
    // Create first kanji
    await createKanji(testInputN5);

    // Attempt to create duplicate should fail
    await expect(createKanji(testInputN5)).rejects.toThrow(/unique/i);
  });

  it('should handle complex kanji with multiple readings', async () => {
    const complexKanji: CreateKanjiInput = {
      character: '生',
      meaning: 'life, birth, live',
      on_reading: 'セイ、ショウ',
      kun_reading: 'い.きる、い.かす、い.ける、う.まれる、うま.れる、う.む、お.う、は.える、は.やす、き、なま',
      jlpt_level: 'N4'
    };

    const result = await createKanji(complexKanji);

    expect(result.character).toEqual('生');
    expect(result.meaning).toEqual('life, birth, live');
    expect(result.on_reading).toEqual('セイ、ショウ');
    expect(result.kun_reading).toEqual('い.きる、い.かす、い.ける、う.まれる、うま.れる、う.む、お.う、は.える、は.やす、き、なま');
    expect(result.jlpt_level).toEqual('N4');
  });

  it('should create multiple different kanji successfully', async () => {
    // Create multiple kanji to test batch operations
    const kanji1 = await createKanji(testInputN5);
    const kanji2 = await createKanji(testInputN1);
    const kanji3 = await createKanji(testInputNullReadings);

    // Verify all have unique IDs
    expect(kanji1.id).not.toEqual(kanji2.id);
    expect(kanji2.id).not.toEqual(kanji3.id);
    expect(kanji1.id).not.toEqual(kanji3.id);

    // Verify all were saved to database
    const allKanji = await db.select()
      .from(kanjiTable)
      .execute();

    expect(allKanji).toHaveLength(3);

    // Verify characters are present
    const characters = allKanji.map(k => k.character);
    expect(characters).toContain('水');
    expect(characters).toContain('憂');
    expect(characters).toContain('々');
  });
});
