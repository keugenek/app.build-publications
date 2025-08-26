import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contactLeadsTable } from '../db/schema';
import { type CreateContactLeadInput } from '../schema';
import { createContactLead } from '../handlers/create_contact_lead';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateContactLeadInput = {
  customer_name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  message: 'I am interested in your services. Please contact me.'
};

describe('createContactLead', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a contact lead successfully', async () => {
    const result = await createContactLead(testInput);

    // Validate response structure
    expect(result.success).toBe(true);
    expect(result.message).toEqual('Thank you for your inquiry! We will contact you soon.');
    expect(result.leadId).toBeDefined();
    expect(typeof result.leadId).toBe('number');
    expect(result.leadId!).toBeGreaterThan(0);
  });

  it('should save contact lead to database with correct data', async () => {
    const result = await createContactLead(testInput);

    // Query the database to verify the record was saved
    expect(result.leadId).toBeDefined();
    const leadId = result.leadId!;
    const savedLeads = await db.select()
      .from(contactLeadsTable)
      .where(eq(contactLeadsTable.id, leadId))
      .execute();

    expect(savedLeads).toHaveLength(1);
    
    const savedLead = savedLeads[0];
    expect(savedLead.customer_name).toEqual('John Doe');
    expect(savedLead.email).toEqual('john.doe@example.com');
    expect(savedLead.phone).toEqual('+1234567890');
    expect(savedLead.message).toEqual('I am interested in your services. Please contact me.');
    expect(savedLead.created_at).toBeInstanceOf(Date);
    expect(savedLead.id).toEqual(leadId);
  });

  it('should handle different input variations correctly', async () => {
    const variations = [
      {
        customer_name: 'Jane Smith',
        email: 'jane.smith@test.org',
        phone: '555-0123',
        message: 'Short message'
      },
      {
        customer_name: 'Robert Johnson Jr.',
        email: 'robert.johnson+business@company.co.uk',
        phone: '(555) 123-4567 ext. 890',
        message: 'This is a much longer message with multiple sentences. I would like to discuss potential partnerships and business opportunities. Please call me at your earliest convenience.'
      }
    ];

    for (const variation of variations) {
      const result = await createContactLead(variation);
      
      expect(result.success).toBe(true);
      expect(result.leadId).toBeDefined();

      // Verify data was saved correctly
      const leadId = result.leadId!;
      const savedLeads = await db.select()
        .from(contactLeadsTable)
        .where(eq(contactLeadsTable.id, leadId))
        .execute();

      expect(savedLeads).toHaveLength(1);
      expect(savedLeads[0].customer_name).toEqual(variation.customer_name);
      expect(savedLeads[0].email).toEqual(variation.email);
      expect(savedLeads[0].phone).toEqual(variation.phone);
      expect(savedLeads[0].message).toEqual(variation.message);
    }
  });

  it('should create multiple contact leads with unique IDs', async () => {
    const inputs = [
      {
        customer_name: 'Alice Brown',
        email: 'alice@example.com',
        phone: '111-222-3333',
        message: 'First inquiry'
      },
      {
        customer_name: 'Bob Wilson',
        email: 'bob@example.com',
        phone: '444-555-6666',
        message: 'Second inquiry'
      },
      {
        customer_name: 'Carol Davis',
        email: 'carol@example.com',
        phone: '777-888-9999',
        message: 'Third inquiry'
      }
    ];

    const results = [];
    
    // Create multiple leads
    for (const input of inputs) {
      const result = await createContactLead(input);
      results.push(result);
    }

    // Verify all were successful
    results.forEach(result => {
      expect(result.success).toBe(true);
      expect(result.leadId).toBeDefined();
    });

    // Verify unique IDs
    const leadIds = results.map(r => r.leadId!);
    const uniqueIds = new Set(leadIds);
    expect(uniqueIds.size).toEqual(leadIds.length);

    // Verify all records exist in database
    const allLeads = await db.select()
      .from(contactLeadsTable)
      .execute();

    expect(allLeads).toHaveLength(3);
    
    // Verify each lead has correct data
    allLeads.forEach((lead, index) => {
      expect(lead.customer_name).toEqual(inputs[index].customer_name);
      expect(lead.email).toEqual(inputs[index].email);
      expect(lead.phone).toEqual(inputs[index].phone);
      expect(lead.message).toEqual(inputs[index].message);
      expect(lead.created_at).toBeInstanceOf(Date);
    });
  });

  it('should handle timestamp creation correctly', async () => {
    const beforeCreation = new Date();
    
    const result = await createContactLead(testInput);
    
    const afterCreation = new Date();

    // Get the created record
    expect(result.leadId).toBeDefined();
    const leadId = result.leadId!;
    const savedLeads = await db.select()
      .from(contactLeadsTable)
      .where(eq(contactLeadsTable.id, leadId))
      .execute();

    const savedLead = savedLeads[0];
    
    // Verify timestamp is within expected range
    expect(savedLead.created_at).toBeInstanceOf(Date);
    expect(savedLead.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(savedLead.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });
});
