import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contactFormsTable } from '../db/schema';
import { type CreateContactFormInput } from '../schema';
import { createContactForm } from '../handlers/create_contact_form';
import { eq, gte, and } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateContactFormInput = {
  customer_name: 'John Smith',
  email: 'john.smith@email.com',
  phone_number: '555-123-4567',
  message: 'I need help with a leaky faucet in my kitchen. Please call me back.'
};

describe('createContactForm', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a contact form submission', async () => {
    const result = await createContactForm(testInput);

    // Basic field validation
    expect(result.customer_name).toEqual('John Smith');
    expect(result.email).toEqual('john.smith@email.com');
    expect(result.phone_number).toEqual('555-123-4567');
    expect(result.message).toEqual('I need help with a leaky faucet in my kitchen. Please call me back.');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save contact form to database', async () => {
    const result = await createContactForm(testInput);

    // Query the database to verify the record was saved
    const contactForms = await db.select()
      .from(contactFormsTable)
      .where(eq(contactFormsTable.id, result.id))
      .execute();

    expect(contactForms).toHaveLength(1);
    expect(contactForms[0].customer_name).toEqual('John Smith');
    expect(contactForms[0].email).toEqual('john.smith@email.com');
    expect(contactForms[0].phone_number).toEqual('555-123-4567');
    expect(contactForms[0].message).toEqual(testInput.message);
    expect(contactForms[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different customer information correctly', async () => {
    const alternativeInput: CreateContactFormInput = {
      customer_name: 'Maria Garcia',
      email: 'maria.garcia@gmail.com',
      phone_number: '(555) 987-6543',
      message: 'Emergency plumbing needed! My bathroom is flooding. Please help ASAP!'
    };

    const result = await createContactForm(alternativeInput);

    expect(result.customer_name).toEqual('Maria Garcia');
    expect(result.email).toEqual('maria.garcia@gmail.com');
    expect(result.phone_number).toEqual('(555) 987-6543');
    expect(result.message).toEqual('Emergency plumbing needed! My bathroom is flooding. Please help ASAP!');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create multiple contact form submissions', async () => {
    // Create first submission
    const firstResult = await createContactForm(testInput);

    // Create second submission with different data
    const secondInput: CreateContactFormInput = {
      customer_name: 'Bob Johnson',
      email: 'bob.johnson@outlook.com',
      phone_number: '555-456-7890',
      message: 'Need a quote for bathroom renovation plumbing work.'
    };

    const secondResult = await createContactForm(secondInput);

    // Verify both submissions exist and have different IDs
    expect(firstResult.id).not.toEqual(secondResult.id);
    expect(firstResult.customer_name).toEqual('John Smith');
    expect(secondResult.customer_name).toEqual('Bob Johnson');

    // Verify both are saved in database
    const allContactForms = await db.select()
      .from(contactFormsTable)
      .execute();

    expect(allContactForms).toHaveLength(2);
  });

  it('should query contact forms by date range correctly', async () => {
    // Create test contact form
    await createContactForm(testInput);

    // Test date filtering - demonstration of correct date handling
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Query for contact forms created today or later
    const contactForms = await db.select()
      .from(contactFormsTable)
      .where(gte(contactFormsTable.created_at, yesterday))
      .execute();

    expect(contactForms.length).toBeGreaterThan(0);
    contactForms.forEach(form => {
      expect(form.created_at).toBeInstanceOf(Date);
      expect(form.created_at >= yesterday).toBe(true);
    });
  });

  it('should preserve timestamp accuracy', async () => {
    const beforeCreation = new Date();
    const result = await createContactForm(testInput);
    const afterCreation = new Date();

    // Verify the created_at timestamp is within a reasonable range
    expect(result.created_at >= beforeCreation).toBe(true);
    expect(result.created_at <= afterCreation).toBe(true);
  });
});
