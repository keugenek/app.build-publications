import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contactInquiriesTable } from '../db/schema';
import { type CreateContactInquiryInput } from '../schema';
import { createContactInquiry } from '../handlers/create_contact_inquiry';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateContactInquiryInput = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '555-123-4567',
  service_needed: 'Emergency Repair',
  message: 'I have a burst pipe in my basement and need immediate assistance.',
  is_urgent: true
};

// Test input with minimal required fields
const minimalInput: CreateContactInquiryInput = {
  first_name: 'Jane',
  last_name: 'Smith',
  email: 'jane.smith@example.com',
  phone: null,
  service_needed: null,
  message: 'Looking for general plumbing consultation.',
  is_urgent: false
};

describe('createContactInquiry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a contact inquiry with all fields', async () => {
    const result = await createContactInquiry(testInput);

    // Basic field validation
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.phone).toEqual('555-123-4567');
    expect(result.service_needed).toEqual('Emergency Repair');
    expect(result.message).toEqual('I have a burst pipe in my basement and need immediate assistance.');
    expect(result.is_urgent).toEqual(true);
    expect(result.status).toEqual('new');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a contact inquiry with minimal fields', async () => {
    const result = await createContactInquiry(minimalInput);

    // Basic field validation
    expect(result.first_name).toEqual('Jane');
    expect(result.last_name).toEqual('Smith');
    expect(result.email).toEqual('jane.smith@example.com');
    expect(result.phone).toBeNull();
    expect(result.service_needed).toBeNull();
    expect(result.message).toEqual('Looking for general plumbing consultation.');
    expect(result.is_urgent).toEqual(false);
    expect(result.status).toEqual('new');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save contact inquiry to database', async () => {
    const result = await createContactInquiry(testInput);

    // Query using proper drizzle syntax
    const inquiries = await db.select()
      .from(contactInquiriesTable)
      .where(eq(contactInquiriesTable.id, result.id))
      .execute();

    expect(inquiries).toHaveLength(1);
    expect(inquiries[0].first_name).toEqual('John');
    expect(inquiries[0].last_name).toEqual('Doe');
    expect(inquiries[0].email).toEqual('john.doe@example.com');
    expect(inquiries[0].phone).toEqual('555-123-4567');
    expect(inquiries[0].service_needed).toEqual('Emergency Repair');
    expect(inquiries[0].message).toEqual('I have a burst pipe in my basement and need immediate assistance.');
    expect(inquiries[0].is_urgent).toEqual(true);
    expect(inquiries[0].status).toEqual('new');
    expect(inquiries[0].created_at).toBeInstanceOf(Date);
    expect(inquiries[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle urgent and non-urgent inquiries correctly', async () => {
    const urgentResult = await createContactInquiry(testInput);
    const normalResult = await createContactInquiry(minimalInput);

    expect(urgentResult.is_urgent).toBe(true);
    expect(normalResult.is_urgent).toBe(false);
  });

  it('should default status to new for all inquiries', async () => {
    const result1 = await createContactInquiry(testInput);
    const result2 = await createContactInquiry(minimalInput);

    expect(result1.status).toEqual('new');
    expect(result2.status).toEqual('new');
  });

  it('should handle null values for optional fields', async () => {
    const inputWithNulls: CreateContactInquiryInput = {
      first_name: 'Bob',
      last_name: 'Wilson',
      email: 'bob@example.com',
      phone: null,
      service_needed: null,
      message: 'Just a simple question about your services.',
      is_urgent: false
    };

    const result = await createContactInquiry(inputWithNulls);

    expect(result.phone).toBeNull();
    expect(result.service_needed).toBeNull();
    expect(result.first_name).toEqual('Bob');
    expect(result.last_name).toEqual('Wilson');
    expect(result.email).toEqual('bob@example.com');
    expect(result.message).toEqual('Just a simple question about your services.');
    expect(result.is_urgent).toEqual(false);
  });
});
