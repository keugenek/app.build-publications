import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { leadsTable } from '../db/schema';
import { getLeads } from '../handlers/get_leads';


const testLead = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '123-456-7890',
  message: 'Hello, this is a test message.'
};

describe('getLeads handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no leads exist', async () => {
    const leads = await getLeads();
    expect(leads).toEqual([]);
  });

  it('should fetch all leads from the database', async () => {
    // Insert a lead directly
    await db.insert(leadsTable).values(testLead).execute();

    const leads = await getLeads();
    expect(leads).toHaveLength(1);
    const lead = leads[0];
    expect(lead.name).toBe(testLead.name);
    expect(lead.email).toBe(testLead.email);
    expect(lead.phone).toBe(testLead.phone);
    expect(lead.message).toBe(testLead.message);
    expect(lead.id).toBeDefined();
    expect(lead.created_at).toBeInstanceOf(Date);
  });

  it('should fetch multiple leads correctly', async () => {
    const leadsData = [
      { name: 'Alice', email: 'alice@example.com', phone: '111-222-3333', message: null },
      { name: 'Bob', email: 'bob@example.com', phone: '444-555-6666', message: 'Inquiry' }
    ];
    // Insert multiple leads
    for (const data of leadsData) {
      await db.insert(leadsTable).values(data).execute();
    }

    const leads = await getLeads();
    expect(leads).toHaveLength(2);
    // Ensure each inserted lead is present
    for (const expected of leadsData) {
      const found = leads.find(l => l.email === expected.email);
      expect(found).toBeDefined();
      expect(found?.name).toBe(expected.name);
      expect(found?.phone).toBe(expected.phone);
      expect(found?.message).toBe(expected.message);
    }
  });
});
