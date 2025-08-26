import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contactInquiriesTable } from '../db/schema';
import { getContactInquiries, getNewContactInquiries } from '../handlers/get_contact_inquiries';

describe('getContactInquiries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no inquiries exist', async () => {
    const result = await getContactInquiries();
    expect(result).toEqual([]);
  });

  it('should return all contact inquiries ordered by creation date (newest first)', async () => {
    // Create test inquiries with different timestamps
    const firstInquiry = await db.insert(contactInquiriesTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        service_needed: 'Emergency Repair',
        message: 'Need urgent plumbing repair',
        is_urgent: true,
        status: 'new'
      })
      .returning()
      .execute();

    // Add a small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 1));

    const secondInquiry = await db.insert(contactInquiriesTable)
      .values({
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        phone: null,
        service_needed: 'Routine Maintenance',
        message: 'Schedule maintenance check for next week',
        is_urgent: false,
        status: 'contacted'
      })
      .returning()
      .execute();

    const result = await getContactInquiries();

    expect(result).toHaveLength(2);
    
    // Should be ordered by creation date (newest first)
    expect(result[0].id).toEqual(secondInquiry[0].id);
    expect(result[0].first_name).toEqual('Jane');
    expect(result[0].status).toEqual('contacted');
    
    expect(result[1].id).toEqual(firstInquiry[0].id);
    expect(result[1].first_name).toEqual('John');
    expect(result[1].status).toEqual('new');

    // Verify all fields are present
    expect(result[0].email).toEqual('jane@example.com');
    expect(result[0].phone).toBeNull();
    expect(result[0].service_needed).toEqual('Routine Maintenance');
    expect(result[0].message).toEqual('Schedule maintenance check for next week');
    expect(result[0].is_urgent).toBe(false);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return inquiries with all status types', async () => {
    const statuses: ('new' | 'contacted' | 'scheduled' | 'completed' | 'cancelled')[] = ['new', 'contacted', 'scheduled', 'completed', 'cancelled'];
    
    // Create one inquiry for each status
    for (let i = 0; i < statuses.length; i++) {
      await db.insert(contactInquiriesTable)
        .values({
          first_name: `Customer${i + 1}`,
          last_name: 'Test',
          email: `customer${i + 1}@example.com`,
          phone: `123-456-789${i}`,
          service_needed: 'Test Service',
          message: `Test message for ${statuses[i]} status`,
          is_urgent: false,
          status: statuses[i]
        })
        .execute();
    }

    const result = await getContactInquiries();

    expect(result).toHaveLength(5);
    
    // Verify all status types are included
    const returnedStatuses = result.map(inquiry => inquiry.status).sort();
    expect(returnedStatuses).toEqual(statuses.sort());
  });
});

describe('getNewContactInquiries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no new inquiries exist', async () => {
    // Create a non-new inquiry
    await db.insert(contactInquiriesTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        service_needed: 'Emergency Repair',
        message: 'Already contacted inquiry',
        is_urgent: false,
        status: 'contacted'
      })
      .execute();

    const result = await getNewContactInquiries();
    expect(result).toEqual([]);
  });

  it('should return only inquiries with status "new"', async () => {
    // Create inquiries with different statuses
    await db.insert(contactInquiriesTable)
      .values([
        {
          first_name: 'John',
          last_name: 'New',
          email: 'john.new@example.com',
          phone: '123-456-7890',
          service_needed: 'Emergency Repair',
          message: 'New urgent inquiry',
          is_urgent: true,
          status: 'new'
        },
        {
          first_name: 'Jane',
          last_name: 'Contacted',
          email: 'jane.contacted@example.com',
          phone: '123-456-7891',
          service_needed: 'Routine Check',
          message: 'Already contacted inquiry',
          is_urgent: false,
          status: 'contacted'
        },
        {
          first_name: 'Bob',
          last_name: 'AlsoNew',
          email: 'bob.new@example.com',
          phone: null,
          service_needed: 'Installation',
          message: 'Another new inquiry',
          is_urgent: false,
          status: 'new'
        }
      ])
      .execute();

    const result = await getNewContactInquiries();

    expect(result).toHaveLength(2);
    
    // All results should have status 'new'
    result.forEach(inquiry => {
      expect(inquiry.status).toEqual('new');
    });

    // Verify we got the correct inquiries
    const firstNames = result.map(inquiry => inquiry.first_name).sort();
    expect(firstNames).toEqual(['Bob', 'John']);
  });

  it('should order by urgency first, then creation date (newest first)', async () => {
    // Create inquiries with different urgency and timestamps
    const regularInquiry1 = await db.insert(contactInquiriesTable)
      .values({
        first_name: 'Regular1',
        last_name: 'User',
        email: 'regular1@example.com',
        phone: '123-456-7890',
        service_needed: 'Regular Service',
        message: 'Non-urgent inquiry created first',
        is_urgent: false,
        status: 'new'
      })
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 1));

    const urgentInquiry = await db.insert(contactInquiriesTable)
      .values({
        first_name: 'Urgent',
        last_name: 'User',
        email: 'urgent@example.com',
        phone: '123-456-7891',
        service_needed: 'Emergency Repair',
        message: 'Urgent inquiry created second',
        is_urgent: true,
        status: 'new'
      })
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 1));

    const regularInquiry2 = await db.insert(contactInquiriesTable)
      .values({
        first_name: 'Regular2',
        last_name: 'User',
        email: 'regular2@example.com',
        phone: '123-456-7892',
        service_needed: 'Regular Service',
        message: 'Non-urgent inquiry created last',
        is_urgent: false,
        status: 'new'
      })
      .returning()
      .execute();

    const result = await getNewContactInquiries();

    expect(result).toHaveLength(3);

    // First should be urgent inquiry
    expect(result[0].first_name).toEqual('Urgent');
    expect(result[0].is_urgent).toBe(true);

    // Next should be regular inquiries ordered by creation date (newest first)
    expect(result[1].first_name).toEqual('Regular2');
    expect(result[1].is_urgent).toBe(false);
    expect(result[1].created_at > result[2].created_at).toBe(true);

    expect(result[2].first_name).toEqual('Regular1');
    expect(result[2].is_urgent).toBe(false);
  });

  it('should handle multiple urgent inquiries ordered by creation date', async () => {
    // Create multiple urgent inquiries
    await db.insert(contactInquiriesTable)
      .values({
        first_name: 'Urgent1',
        last_name: 'First',
        email: 'urgent1@example.com',
        phone: '123-456-7890',
        service_needed: 'Emergency',
        message: 'First urgent inquiry',
        is_urgent: true,
        status: 'new'
      })
      .execute();

    await new Promise(resolve => setTimeout(resolve, 1));

    await db.insert(contactInquiriesTable)
      .values({
        first_name: 'Urgent2',
        last_name: 'Second',
        email: 'urgent2@example.com',
        phone: '123-456-7891',
        service_needed: 'Emergency',
        message: 'Second urgent inquiry',
        is_urgent: true,
        status: 'new'
      })
      .execute();

    const result = await getNewContactInquiries();

    expect(result).toHaveLength(2);
    
    // Both should be urgent
    expect(result[0].is_urgent).toBe(true);
    expect(result[1].is_urgent).toBe(true);
    
    // Should be ordered by creation date (newest first)
    expect(result[0].first_name).toEqual('Urgent2');
    expect(result[1].first_name).toEqual('Urgent1');
  });
});
