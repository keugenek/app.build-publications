import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contactFormsTable } from '../db/schema';
import { type CreateContactFormInput } from '../schema';
import { getContactForms } from '../handlers/get_contact_forms';

// Test data for contact form submissions
const testContactForm1: CreateContactFormInput = {
  customer_name: 'John Smith',
  email: 'john.smith@email.com',
  phone_number: '555-123-4567',
  message: 'I need help with a leaky faucet in my kitchen. Please call me to schedule a service.'
};

const testContactForm2: CreateContactFormInput = {
  customer_name: 'Sarah Johnson',
  email: 'sarah.j@email.com',
  phone_number: '555-987-6543',
  message: 'Emergency! My basement is flooding and I need immediate assistance.'
};

const testContactForm3: CreateContactFormInput = {
  customer_name: 'Mike Williams',
  email: 'mike.w@email.com',
  phone_number: '555-456-7890',
  message: 'Looking for a quote on bathroom renovation plumbing work.'
};

describe('getContactForms', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no contact forms exist', async () => {
    const result = await getContactForms();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all contact forms ordered by created_at DESC', async () => {
    // Insert test contact forms with slight delays to ensure different timestamps
    await db.insert(contactFormsTable).values(testContactForm1).execute();
    
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    await db.insert(contactFormsTable).values(testContactForm2).execute();
    
    await new Promise(resolve => setTimeout(resolve, 10));
    await db.insert(contactFormsTable).values(testContactForm3).execute();

    const result = await getContactForms();

    expect(result).toHaveLength(3);
    
    // Verify all expected fields are present
    result.forEach(form => {
      expect(form.id).toBeDefined();
      expect(form.customer_name).toBeDefined();
      expect(form.email).toBeDefined();
      expect(form.phone_number).toBeDefined();
      expect(form.message).toBeDefined();
      expect(form.created_at).toBeInstanceOf(Date);
    });

    // Verify data integrity
    const customerNames = result.map(form => form.customer_name);
    expect(customerNames).toContain('John Smith');
    expect(customerNames).toContain('Sarah Johnson');
    expect(customerNames).toContain('Mike Williams');

    // Verify ordering (newest first - DESC order by created_at)
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].created_at.getTime()).toBeGreaterThanOrEqual(
        result[i + 1].created_at.getTime()
      );
    }

    // The last inserted form (Mike Williams) should be first
    expect(result[0].customer_name).toBe('Mike Williams');
    expect(result[2].customer_name).toBe('John Smith');
  });

  it('should handle single contact form correctly', async () => {
    await db.insert(contactFormsTable).values(testContactForm1).execute();

    const result = await getContactForms();

    expect(result).toHaveLength(1);
    expect(result[0].customer_name).toBe('John Smith');
    expect(result[0].email).toBe('john.smith@email.com');
    expect(result[0].phone_number).toBe('555-123-4567');
    expect(result[0].message).toBe('I need help with a leaky faucet in my kitchen. Please call me to schedule a service.');
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].id).toBeDefined();
  });

  it('should verify contact forms are saved to database correctly', async () => {
    // Insert a contact form
    await db.insert(contactFormsTable).values(testContactForm2).execute();

    // Fetch using the handler
    const handlerResult = await getContactForms();

    // Also fetch directly from database to verify consistency
    const directResult = await db.select()
      .from(contactFormsTable)
      .execute();

    expect(handlerResult).toHaveLength(1);
    expect(directResult).toHaveLength(1);
    expect(handlerResult[0].customer_name).toBe(directResult[0].customer_name);
    expect(handlerResult[0].email).toBe(directResult[0].email);
    expect(handlerResult[0].message).toBe(directResult[0].message);
  });
});
