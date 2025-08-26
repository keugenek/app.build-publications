import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { classesTable } from '../db/schema';
import { type Class } from '../schema';
import { getClasses } from '../handlers/get_classes';


// Sample class input for insertion
const sampleClass = {
  name: 'Yoga Basics',
  description: 'Introductory yoga class',
  trainer: 'Alice',
  capacity: 20,
  date: '2023-01-01', // YYYY-MM-DD format for date column
  time: '10:30:00', // HH:MM:SS format for time column
};

describe('getClasses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no classes exist', async () => {
    const result = await getClasses();
    expect(result).toBeInstanceOf(Array);
    expect(result).toHaveLength(0);
  });

  it('should fetch all classes from the database', async () => {
    // Insert a class directly via db
    const inserted = await db
      .insert(classesTable)
      .values(sampleClass)
      .returning()
      .execute();

    const classId = inserted[0].id;

    const classes = await getClasses();
    expect(classes).toBeInstanceOf(Array);
    expect(classes).toHaveLength(1);

    const fetched = classes[0] as Class;
    expect(fetched.id).toBe(classId);
    expect(fetched.name).toBe(sampleClass.name);
    expect(fetched.description).toBe(sampleClass.description);
    expect(fetched.trainer).toBe(sampleClass.trainer);
    expect(fetched.capacity).toBe(sampleClass.capacity);
    // Date column should be a Date instance
    expect(fetched.date).toBeInstanceOf(Date);
    // Time should be trimmed to HH:mm format
    expect(fetched.time).toBe('10:30');
  });

  it('should fetch multiple classes correctly', async () => {
    const classesToInsert = [
      { ...sampleClass, name: 'Pilates', time: '12:00:00' },
      { ...sampleClass, name: 'Spin', time: '14:15:00' },
    ];

    await db.insert(classesTable).values(classesToInsert).execute();

    const fetched = await getClasses();
    expect(fetched).toHaveLength(2);
    const names = fetched.map(c => c.name).sort();
    expect(names).toEqual(['Pilates', 'Spin']);
    // Verify time format for each
    fetched.forEach(c => {
      expect(c.time).toMatch(/^\d{2}:\d{2}$/);
    });
  });
});
