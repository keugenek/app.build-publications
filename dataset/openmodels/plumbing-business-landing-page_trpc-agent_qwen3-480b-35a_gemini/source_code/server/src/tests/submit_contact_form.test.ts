import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contactSubmissionsTable } from '../db/schema';
import { type ContactFormInput } from '../schema';
import { submitContactForm } from '../handlers/submit_contact_form';
import { eq } from 'drizzle-orm';

// Test input
const testInput: ContactFormInput = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  message: 'This is a test message'
};

describe('submitContactForm', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a contact submission', async () => {
    const result = await submitContactForm(testInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual(testInput.email);
    expect(result.phone).toEqual(testInput.phone);
    expect(result.message).toEqual(testInput.message);
    expect(result.id).toBeDefined();
    expect(result.submitted_at).toBeInstanceOf(Date);
  });

  it('should save contact submission to database', async () => {
    const result = await submitContactForm(testInput);

    // Query using proper drizzle syntax
    const submissions = await db.select()
      .from(contactSubmissionsTable)
      .where(eq(contactSubmissionsTable.id, result.id))
      .execute();

    expect(submissions).toHaveLength(1);
    expect(submissions[0].name).toEqual('John Doe');
    expect(submissions[0].email).toEqual(testInput.email);
    expect(submissions[0].phone).toEqual(testInput.phone);
    expect(submissions[0].message).toEqual(testInput.message);
    expect(submissions[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different contact form inputs', async () => {
    const anotherInput: ContactFormInput = {
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+0987654321',
      message: 'Another test message'
    };

    const result = await submitContactForm(anotherInput);

    expect(result.name).toEqual('Jane Smith');
    expect(result.email).toEqual('jane@example.com');
    expect(result.phone).toEqual('+0987654321');
    expect(result.message).toEqual('Another test message');
  });
});
