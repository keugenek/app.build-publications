import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { leadsTable } from '../db/schema';
import { type CreateLeadInput } from '../schema';
import { createLead } from '../handlers/create_lead';
import { eq } from 'drizzle-orm';

const testInput: CreateLeadInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '555-1234',
  message: 'Interested in your product'
};

describe('createLead', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a lead and return correct fields', async () => {
    const result = await createLead(testInput);

    expect(result.id).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
    expect(result.name).toBe(testInput.name);
    expect(result.email).toBe(testInput.email);
    expect(result.phone).toBe(testInput.phone);
    expect(result.message).toBe(testInput.message ?? null);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the lead in the database', async () => {
    const inserted = await createLead(testInput);

    const rows = await db.select().from(leadsTable).where(eq(leadsTable.id, inserted.id)).execute();
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.name).toBe(testInput.name);
    expect(row.email).toBe(testInput.email);
    expect(row.phone).toBe(testInput.phone);
    expect(row.message).toBe(testInput.message ?? null);
    expect(row.created_at).toBeInstanceOf(Date);
  });

  it('should handle optional message field', async () => {
    const inputWithoutMessage: CreateLeadInput = {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '555-9876'
      // message omitted
    };
    const result = await createLead(inputWithoutMessage);
    expect(result.message).toBeNull();

    const rows = await db.select().from(leadsTable).where(eq(leadsTable.id, result.id)).execute();
    expect(rows[0].message).toBeNull();
  });
});
