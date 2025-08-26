import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contactFormsTable } from '../db/schema';
import { type CreateContactFormInput } from '../schema';
import { submitContactForm } from '../handlers/submit_contact_form';
import { eq } from 'drizzle-orm';

describe('submitContactForm', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a contact form submission', async () => {
    const input: CreateContactFormInput = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '1234567890',
      message: 'This is a test message'
    } as CreateContactFormInput;

    const result = await submitContactForm(input);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.phone).toEqual('1234567890');
    expect(result.message).toEqual('This is a test message');
  });

  it('should save contact form submission to database', async () => {
    const input: CreateContactFormInput = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '1234567890',
      message: 'This is a test message'
    } as CreateContactFormInput;

    await submitContactForm(input);

    // Query using proper drizzle syntax
    const contactForms = await db.select()
      .from(contactFormsTable)
      .where(eq(contactFormsTable.name, 'John Doe'))
      .execute();

    expect(contactForms).toHaveLength(1);
    expect(contactForms[0].name).toEqual('John Doe');
    expect(contactForms[0].email).toEqual('john.doe@example.com');
    expect(contactForms[0].phone).toEqual('1234567890');
    expect(contactForms[0].message).toEqual('This is a test message');
    expect(contactForms[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle minimal valid input', async () => {
    const minimalInput: CreateContactFormInput = {
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '0987654321',
      message: 'Hello!'
    } as CreateContactFormInput;

    const result = await submitContactForm(minimalInput);

    expect(result.name).toEqual('Jane Smith');
    expect(result.email).toEqual('jane@example.com');
    expect(result.phone).toEqual('0987654321');
    expect(result.message).toEqual('Hello!');
  });
});