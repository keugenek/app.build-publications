import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { leadsTable } from '../db/schema';
import { type CreateLeadInput } from '../schema';
import { createLead } from '../handlers/create_lead';
import { eq } from 'drizzle-orm';

const testInput: CreateLeadInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '555-1234',
  message: 'I am interested in your services.',
};

describe('createLead', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a lead and return all fields', async () => {
    const result = await createLead(testInput);
    expect(result.id).toBeGreaterThan(0);
    expect(result.name).toBe(testInput.name);
    expect(result.email).toBe(testInput.email);
    expect(result.phone).toBe(testInput.phone);
    expect(result.message).toBe(testInput.message);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the lead in the database', async () => {
    const result = await createLead(testInput);
    const leads = await db
      .select()
      .from(leadsTable)
      .where(eq(leadsTable.id, result.id))
      .execute();
    expect(leads).toHaveLength(1);
    const dbLead = leads[0];
    expect(dbLead.name).toBe(testInput.name);
    expect(dbLead.email).toBe(testInput.email);
    expect(dbLead.phone).toBe(testInput.phone);
    expect(dbLead.message).toBe(testInput.message);
    expect(dbLead.created_at).toBeInstanceOf(Date);
  });
});
