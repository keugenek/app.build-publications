import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { getExpiringItems } from '../handlers/get_expiring_items';
import { sql } from 'drizzle-orm';

describe('getExpiringItems', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - 1);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pantry_items (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        expiry_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      INSERT INTO pantry_items (name, quantity, expiry_date) VALUES 
      ('Milk', 2, ${tomorrow.toISOString().split('T')[0]}),
      ('Bread', 1, ${nextWeek.toISOString().split('T')[0]}),
      ('Cheese', 3, ${pastDate.toISOString().split('T')[0]})
    `);
  });
  
  afterEach(resetDB);

  it('should return items expiring within the next 7 days', async () => {
    const result = await getExpiringItems();
    
    // Should include milk (expiring tomorrow) and bread (expiring in 7 days)
    // Should not include cheese (already expired)
    expect(result).toHaveLength(2);
    
    // Check that items are properly typed
    expect(result[0]).toMatchObject({
      name: 'Milk',
      quantity: 2
    });
    
    expect(result[1]).toMatchObject({
      name: 'Bread',
      quantity: 1
    });
    
    // Verify date fields are Date objects
    expect(result[0].expiry_date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return items ordered by expiry date', async () => {
    const result = await getExpiringItems();
    
    // Milk expires before bread, so it should come first
    expect(result[0].name).toBe('Milk');
    expect(result[1].name).toBe('Bread');
    
    // Verify the order by checking dates
    expect(result[0].expiry_date.getTime()).toBeLessThan(result[1].expiry_date.getTime());
  });
});
