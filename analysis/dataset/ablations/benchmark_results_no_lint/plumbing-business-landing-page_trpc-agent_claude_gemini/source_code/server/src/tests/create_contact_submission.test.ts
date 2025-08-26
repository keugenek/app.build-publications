import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contactSubmissionsTable } from '../db/schema';
import { type CreateContactSubmissionInput } from '../schema';
import { createContactSubmission } from '../handlers/create_contact_submission';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateContactSubmissionInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone_number: '(555) 123-4567',
  message: 'I need help with my kitchen sink. It has been leaking for days.'
};

// Test input without optional phone number
const testInputWithoutPhone: CreateContactSubmissionInput = {
  name: 'Jane Smith',
  email: 'jane.smith@example.com',
  phone_number: null,
  message: 'My bathroom faucet needs repair. Please contact me to schedule an appointment.'
};

describe('createContactSubmission', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a contact submission with all fields', async () => {
    const result = await createContactSubmission(testInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.phone_number).toEqual('(555) 123-4567');
    expect(result.message).toEqual('I need help with my kitchen sink. It has been leaking for days.');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a contact submission without phone number', async () => {
    const result = await createContactSubmission(testInputWithoutPhone);

    // Basic field validation
    expect(result.name).toEqual('Jane Smith');
    expect(result.email).toEqual('jane.smith@example.com');
    expect(result.phone_number).toBeNull();
    expect(result.message).toEqual('My bathroom faucet needs repair. Please contact me to schedule an appointment.');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save contact submission to database', async () => {
    const result = await createContactSubmission(testInput);

    // Query using proper drizzle syntax
    const submissions = await db.select()
      .from(contactSubmissionsTable)
      .where(eq(contactSubmissionsTable.id, result.id))
      .execute();

    expect(submissions).toHaveLength(1);
    expect(submissions[0].name).toEqual('John Doe');
    expect(submissions[0].email).toEqual('john.doe@example.com');
    expect(submissions[0].phone_number).toEqual('(555) 123-4567');
    expect(submissions[0].message).toEqual('I need help with my kitchen sink. It has been leaking for days.');
    expect(submissions[0].created_at).toBeInstanceOf(Date);
  });

  it('should save contact submission without phone to database', async () => {
    const result = await createContactSubmission(testInputWithoutPhone);

    // Query using proper drizzle syntax
    const submissions = await db.select()
      .from(contactSubmissionsTable)
      .where(eq(contactSubmissionsTable.id, result.id))
      .execute();

    expect(submissions).toHaveLength(1);
    expect(submissions[0].name).toEqual('Jane Smith');
    expect(submissions[0].email).toEqual('jane.smith@example.com');
    expect(submissions[0].phone_number).toBeNull();
    expect(submissions[0].message).toEqual('My bathroom faucet needs repair. Please contact me to schedule an appointment.');
    expect(submissions[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple contact submissions independently', async () => {
    // Create first submission
    const result1 = await createContactSubmission(testInput);
    
    // Create second submission
    const result2 = await createContactSubmission(testInputWithoutPhone);

    // Verify both were created with different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.name).toEqual('John Doe');
    expect(result2.name).toEqual('Jane Smith');

    // Verify both exist in database
    const allSubmissions = await db.select()
      .from(contactSubmissionsTable)
      .execute();

    expect(allSubmissions).toHaveLength(2);
    
    const johnSubmission = allSubmissions.find(s => s.name === 'John Doe');
    const janeSubmission = allSubmissions.find(s => s.name === 'Jane Smith');
    
    expect(johnSubmission).toBeDefined();
    expect(janeSubmission).toBeDefined();
    expect(johnSubmission!.phone_number).toEqual('(555) 123-4567');
    expect(janeSubmission!.phone_number).toBeNull();
  });
});
