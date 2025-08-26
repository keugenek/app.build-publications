import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contactLeadsTable } from '../db/schema';
import { type CreateContactLeadInput } from '../schema';
import { getContactLeads } from '../handlers/get_contact_leads';

// Test data for creating contact leads
const testLead1: CreateContactLeadInput = {
  customer_name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  message: 'I am interested in your services.'
};

const testLead2: CreateContactLeadInput = {
  customer_name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '+0987654321',
  message: 'Please contact me about pricing.'
};

const testLead3: CreateContactLeadInput = {
  customer_name: 'Bob Wilson',
  email: 'bob@example.com',
  phone: '+5555555555',
  message: 'Looking for more information about your products.'
};

describe('getContactLeads', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no leads exist', async () => {
    const result = await getContactLeads();

    expect(result).toEqual([]);
  });

  it('should return single contact lead', async () => {
    // Insert test lead
    await db.insert(contactLeadsTable)
      .values(testLead1)
      .execute();

    const result = await getContactLeads();

    expect(result).toHaveLength(1);
    expect(result[0].customer_name).toEqual('John Doe');
    expect(result[0].email).toEqual('john@example.com');
    expect(result[0].phone).toEqual('+1234567890');
    expect(result[0].message).toEqual('I am interested in your services.');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return multiple contact leads', async () => {
    // Insert multiple test leads
    await db.insert(contactLeadsTable)
      .values([testLead1, testLead2, testLead3])
      .execute();

    const result = await getContactLeads();

    expect(result).toHaveLength(3);
    
    // Verify all leads are present
    const customerNames = result.map(lead => lead.customer_name);
    expect(customerNames).toContain('John Doe');
    expect(customerNames).toContain('Jane Smith');
    expect(customerNames).toContain('Bob Wilson');

    // Verify all have required fields
    result.forEach(lead => {
      expect(lead.id).toBeDefined();
      expect(lead.customer_name).toBeDefined();
      expect(lead.email).toBeDefined();
      expect(lead.phone).toBeDefined();
      expect(lead.message).toBeDefined();
      expect(lead.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return leads ordered by creation date (most recent first)', async () => {
    // Insert first lead
    await db.insert(contactLeadsTable)
      .values(testLead1)
      .execute();

    // Wait a small amount to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Insert second lead
    await db.insert(contactLeadsTable)
      .values(testLead2)
      .execute();

    // Wait again
    await new Promise(resolve => setTimeout(resolve, 10));

    // Insert third lead
    await db.insert(contactLeadsTable)
      .values(testLead3)
      .execute();

    const result = await getContactLeads();

    expect(result).toHaveLength(3);

    // Verify ordering (most recent first)
    expect(result[0].customer_name).toEqual('Bob Wilson'); // Last inserted
    expect(result[1].customer_name).toEqual('Jane Smith'); // Second inserted
    expect(result[2].customer_name).toEqual('John Doe');   // First inserted

    // Verify timestamps are in descending order
    expect(result[0].created_at.getTime()).toBeGreaterThan(result[1].created_at.getTime());
    expect(result[1].created_at.getTime()).toBeGreaterThan(result[2].created_at.getTime());
  });

  it('should handle leads with special characters in messages', async () => {
    const specialLead: CreateContactLeadInput = {
      customer_name: 'María José',
      email: 'maria@example.com',
      phone: '+34-123-456-789',
      message: 'Hello! I need help with "special pricing" & more info... Can you help? 😊'
    };

    await db.insert(contactLeadsTable)
      .values(specialLead)
      .execute();

    const result = await getContactLeads();

    expect(result).toHaveLength(1);
    expect(result[0].customer_name).toEqual('María José');
    expect(result[0].message).toEqual('Hello! I need help with "special pricing" & more info... Can you help? 😊');
  });

  it('should handle large number of leads efficiently', async () => {
    // Create 50 test leads
    const manyLeads: CreateContactLeadInput[] = Array.from({ length: 50 }, (_, i) => ({
      customer_name: `Customer ${i + 1}`,
      email: `customer${i + 1}@example.com`,
      phone: `+1234567${String(i + 1).padStart(3, '0')}`,
      message: `This is test message number ${i + 1}.`
    }));

    await db.insert(contactLeadsTable)
      .values(manyLeads)
      .execute();

    const result = await getContactLeads();

    expect(result).toHaveLength(50);
    
    // Verify all leads have unique IDs
    const ids = result.map(lead => lead.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toEqual(50);

    // Verify ordering is maintained
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].created_at.getTime()).toBeGreaterThanOrEqual(result[i + 1].created_at.getTime());
    }
  });
});
