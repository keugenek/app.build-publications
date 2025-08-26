import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable } from '../db/schema';
import { type CreateClassInput } from '../schema';
import { getClasses } from '../handlers/get_classes';

// Test data
const testClass1: CreateClassInput = {
  name: 'Yoga Class',
  description: 'Relaxing yoga session',
  instructor: 'Jane Smith',
  date: new Date('2023-06-15T10:00:00Z'),
  time: '10:00 AM',
  capacity: 20
};

const testClass2: CreateClassInput = {
  name: 'Pilates Class',
  description: 'Core strengthening Pilates',
  instructor: 'John Doe',
  date: new Date('2023-06-16T14:00:00Z'),
  time: '2:00 PM',
  capacity: 15
};

describe('getClasses', () => {
  beforeEach(async () => {
    await createDB();
  });
  
  afterEach(resetDB);

  it('should return an empty array when no classes exist', async () => {
    const classes = await getClasses();
    
    expect(classes).toEqual([]);
  });

  it('should return all classes when classes exist', async () => {
    // Insert test classes
    await db.insert(classesTable).values(testClass1).execute();
    await db.insert(classesTable).values(testClass2).execute();
    
    const classes = await getClasses();
    
    expect(classes).toHaveLength(2);
    
    const yogaClass = classes.find(c => c.name === 'Yoga Class');
    const pilatesClass = classes.find(c => c.name === 'Pilates Class');
    
    expect(yogaClass).toBeDefined();
    expect(pilatesClass).toBeDefined();
    
    // Check yoga class properties
    expect(yogaClass?.name).toBe('Yoga Class');
    expect(yogaClass?.description).toBe('Relaxing yoga session');
    expect(yogaClass?.instructor).toBe('Jane Smith');
    expect(yogaClass?.date).toEqual(new Date('2023-06-15T10:00:00Z'));
    expect(yogaClass?.time).toBe('10:00 AM');
    expect(yogaClass?.capacity).toBe(20);
    expect(yogaClass?.created_at).toBeInstanceOf(Date);
    
    // Check pilates class properties
    expect(pilatesClass?.name).toBe('Pilates Class');
    expect(pilatesClass?.description).toBe('Core strengthening Pilates');
    expect(pilatesClass?.instructor).toBe('John Doe');
    expect(pilatesClass?.date).toEqual(new Date('2023-06-16T14:00:00Z'));
    expect(pilatesClass?.time).toBe('2:00 PM');
    expect(pilatesClass?.capacity).toBe(15);
    expect(pilatesClass?.created_at).toBeInstanceOf(Date);
  });
});
