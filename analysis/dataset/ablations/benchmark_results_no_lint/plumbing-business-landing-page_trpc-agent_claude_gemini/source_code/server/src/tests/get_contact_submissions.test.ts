import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contactSubmissionsTable } from '../db/schema';
import { type CreateContactSubmissionInput } from '../schema';
import { getContactSubmissions } from '../handlers/get_contact_submissions';

// Test contact submission inputs
const testSubmission1: CreateContactSubmissionInput = {
  name: 'John Doe',
  email: 'john.doe@email.com',
  phone_number: '555-0123',
  message: 'Need plumbing repair for kitchen sink'
};

const testSubmission2: CreateContactSubmissionInput = {
  name: 'Jane Smith',
  email: 'jane.smith@email.com',
  phone_number: null, // Test nullable phone number
  message: 'Interested in bathroom renovation services'
};

const testSubmission3: CreateContactSubmissionInput = {
  name: 'Bob Wilson',
  email: 'bob.wilson@email.com',
  phone_number: '555-0456',
  message: 'Emergency plumbing needed ASAP'
};

describe('getContactSubmissions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no submissions exist', async () => {
    const result = await getContactSubmissions();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should fetch all contact submissions', async () => {
    // Create test submissions
    await db.insert(contactSubmissionsTable)
      .values([
        testSubmission1,
        testSubmission2,
        testSubmission3
      ])
      .execute();

    const result = await getContactSubmissions();

    expect(result).toHaveLength(3);
    
    // Verify all submissions are returned
    const names = result.map(submission => submission.name);
    expect(names).toContain('John Doe');
    expect(names).toContain('Jane Smith');
    expect(names).toContain('Bob Wilson');
  });

  it('should return submissions ordered by created_at descending', async () => {
    // Insert submissions with slight delay to ensure different timestamps
    await db.insert(contactSubmissionsTable)
      .values(testSubmission1)
      .execute();

    // Small delay to ensure different created_at timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await db.insert(contactSubmissionsTable)
      .values(testSubmission2)
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));
    
    await db.insert(contactSubmissionsTable)
      .values(testSubmission3)
      .execute();

    const result = await getContactSubmissions();

    expect(result).toHaveLength(3);
    
    // Verify order - most recent first
    expect(result[0].name).toBe('Bob Wilson'); // Last inserted
    expect(result[1].name).toBe('Jane Smith'); // Second inserted
    expect(result[2].name).toBe('John Doe');   // First inserted

    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should return complete submission data with all fields', async () => {
    await db.insert(contactSubmissionsTable)
      .values(testSubmission1)
      .execute();

    const result = await getContactSubmissions();

    expect(result).toHaveLength(1);
    
    const submission = result[0];
    expect(submission.id).toBeDefined();
    expect(typeof submission.id).toBe('number');
    expect(submission.name).toBe('John Doe');
    expect(submission.email).toBe('john.doe@email.com');
    expect(submission.phone_number).toBe('555-0123');
    expect(submission.message).toBe('Need plumbing repair for kitchen sink');
    expect(submission.created_at).toBeInstanceOf(Date);
  });

  it('should handle submissions with null phone numbers', async () => {
    await db.insert(contactSubmissionsTable)
      .values(testSubmission2)
      .execute();

    const result = await getContactSubmissions();

    expect(result).toHaveLength(1);
    
    const submission = result[0];
    expect(submission.name).toBe('Jane Smith');
    expect(submission.email).toBe('jane.smith@email.com');
    expect(submission.phone_number).toBeNull();
    expect(submission.message).toBe('Interested in bathroom renovation services');
  });

  it('should verify database persistence of submissions', async () => {
    // Create submissions through handler testing
    await db.insert(contactSubmissionsTable)
      .values(testSubmission1)
      .execute();

    // Query database directly to verify data is persisted
    const directQuery = await db.select()
      .from(contactSubmissionsTable)
      .execute();

    expect(directQuery).toHaveLength(1);
    expect(directQuery[0].name).toBe('John Doe');
    expect(directQuery[0].email).toBe('john.doe@email.com');
    
    // Now test handler returns same data
    const handlerResult = await getContactSubmissions();
    
    expect(handlerResult).toHaveLength(1);
    expect(handlerResult[0]).toEqual(directQuery[0]);
  });
});
