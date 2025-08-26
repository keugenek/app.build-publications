import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contactInquiriesTable } from '../db/schema';
import { type UpdateContactInquiryStatusInput, type CreateContactInquiryInput } from '../schema';
import { updateContactInquiryStatus } from '../handlers/update_contact_inquiry_status';
import { eq } from 'drizzle-orm';

// Test input for creating a contact inquiry
const testCreateInput: CreateContactInquiryInput = {
  first_name: 'Jane',
  last_name: 'Smith',
  email: 'jane.smith@example.com',
  phone: '+1-555-123-4567',
  service_needed: 'Emergency Repair',
  message: 'Need urgent plumbing repair for a burst pipe',
  is_urgent: true
};

describe('updateContactInquiryStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update contact inquiry status successfully', async () => {
    // First create a contact inquiry
    const createResult = await db.insert(contactInquiriesTable)
      .values({
        ...testCreateInput,
        status: 'new' // Default status
      })
      .returning()
      .execute();

    const createdInquiry = createResult[0];

    // Prepare update input
    const updateInput: UpdateContactInquiryStatusInput = {
      id: createdInquiry.id,
      status: 'contacted'
    };

    // Update the status
    const result = await updateContactInquiryStatus(updateInput);

    // Verify the update
    expect(result.id).toEqual(createdInquiry.id);
    expect(result.status).toEqual('contacted');
    expect(result.first_name).toEqual('Jane');
    expect(result.last_name).toEqual('Smith');
    expect(result.email).toEqual('jane.smith@example.com');
    expect(result.phone).toEqual('+1-555-123-4567');
    expect(result.service_needed).toEqual('Emergency Repair');
    expect(result.message).toEqual('Need urgent plumbing repair for a burst pipe');
    expect(result.is_urgent).toEqual(true);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Verify updated_at is newer than created_at
    expect(result.updated_at.getTime()).toBeGreaterThan(result.created_at.getTime());
  });

  it('should save updated status to database', async () => {
    // Create a contact inquiry
    const createResult = await db.insert(contactInquiriesTable)
      .values({
        ...testCreateInput,
        status: 'new'
      })
      .returning()
      .execute();

    const createdInquiry = createResult[0];
    const originalUpdatedAt = createdInquiry.updated_at;

    // Wait a tiny bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateContactInquiryStatusInput = {
      id: createdInquiry.id,
      status: 'scheduled'
    };

    await updateContactInquiryStatus(updateInput);

    // Query the database directly to verify changes
    const inquiries = await db.select()
      .from(contactInquiriesTable)
      .where(eq(contactInquiriesTable.id, createdInquiry.id))
      .execute();

    expect(inquiries).toHaveLength(1);
    expect(inquiries[0].status).toEqual('scheduled');
    expect(inquiries[0].updated_at).toBeInstanceOf(Date);
    expect(inquiries[0].updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should handle all valid status transitions', async () => {
    // Create a contact inquiry
    const createResult = await db.insert(contactInquiriesTable)
      .values({
        ...testCreateInput,
        status: 'new'
      })
      .returning()
      .execute();

    const inquiryId = createResult[0].id;
    const statuses: Array<'contacted' | 'scheduled' | 'completed' | 'cancelled'> = ['contacted', 'scheduled', 'completed', 'cancelled'];

    for (const status of statuses) {
      const updateInput: UpdateContactInquiryStatusInput = {
        id: inquiryId,
        status: status
      };

      const result = await updateContactInquiryStatus(updateInput);
      expect(result.status).toEqual(status);
      expect(result.id).toEqual(inquiryId);
    }
  });

  it('should throw error for non-existent contact inquiry', async () => {
    const updateInput: UpdateContactInquiryStatusInput = {
      id: 99999, // Non-existent ID
      status: 'contacted'
    };

    await expect(updateContactInquiryStatus(updateInput))
      .rejects.toThrow(/Contact inquiry with ID 99999 not found/i);
  });

  it('should preserve all original data when updating status', async () => {
    // Create inquiry with all fields populated
    const fullTestInput: CreateContactInquiryInput = {
      first_name: 'Michael',
      last_name: 'Johnson',
      email: 'michael.johnson@email.com',
      phone: '+1-555-987-6543',
      service_needed: 'Regular Maintenance',
      message: 'Schedule regular maintenance check for HVAC system in commercial building',
      is_urgent: false
    };

    const createResult = await db.insert(contactInquiriesTable)
      .values({
        ...fullTestInput,
        status: 'new'
      })
      .returning()
      .execute();

    const createdInquiry = createResult[0];

    const updateInput: UpdateContactInquiryStatusInput = {
      id: createdInquiry.id,
      status: 'completed'
    };

    const result = await updateContactInquiryStatus(updateInput);

    // Verify all original data is preserved
    expect(result.first_name).toEqual('Michael');
    expect(result.last_name).toEqual('Johnson');
    expect(result.email).toEqual('michael.johnson@email.com');
    expect(result.phone).toEqual('+1-555-987-6543');
    expect(result.service_needed).toEqual('Regular Maintenance');
    expect(result.message).toEqual('Schedule regular maintenance check for HVAC system in commercial building');
    expect(result.is_urgent).toEqual(false);
    expect(result.created_at).toEqual(createdInquiry.created_at);
    
    // Only status and updated_at should change
    expect(result.status).toEqual('completed');
    expect(result.updated_at.getTime()).toBeGreaterThan(createdInquiry.updated_at.getTime());
  });

  it('should handle nullable fields correctly', async () => {
    // Create inquiry with minimal required fields (nullable fields as null)
    const minimalInput = {
      first_name: 'Sarah',
      last_name: 'Wilson',
      email: 'sarah.wilson@test.com',
      phone: null,
      service_needed: null,
      message: 'Simple inquiry message for testing purposes',
      is_urgent: false
    };

    const createResult = await db.insert(contactInquiriesTable)
      .values({
        ...minimalInput,
        status: 'new'
      })
      .returning()
      .execute();

    const createdInquiry = createResult[0];

    const updateInput: UpdateContactInquiryStatusInput = {
      id: createdInquiry.id,
      status: 'contacted'
    };

    const result = await updateContactInquiryStatus(updateInput);

    // Verify nullable fields remain null
    expect(result.phone).toBeNull();
    expect(result.service_needed).toBeNull();
    expect(result.status).toEqual('contacted');
    expect(result.first_name).toEqual('Sarah');
    expect(result.email).toEqual('sarah.wilson@test.com');
  });
});
