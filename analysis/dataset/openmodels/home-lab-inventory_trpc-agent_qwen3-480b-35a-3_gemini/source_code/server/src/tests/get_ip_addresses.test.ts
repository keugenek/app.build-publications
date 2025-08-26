import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ipAddressesTable } from '../db/schema';
import { getIPAddresses } from '../handlers/get_ip_addresses';
import { eq } from 'drizzle-orm';

describe('getIPAddresses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no IP addresses exist', async () => {
    const result = await getIPAddresses();
    expect(result).toEqual([]);
  });

  it('should return all IP addresses from the database', async () => {
    // Insert test data
    const testIPAddresses = [
      {
        address: '192.168.1.1',
        assignedTo: 'Server 1'
      },
      {
        address: '192.168.1.2',
        assignedTo: 'Server 2'
      }
    ];

    // Insert test data into database
    await db.insert(ipAddressesTable).values(testIPAddresses).execute();

    // Fetch IP addresses using the handler
    const result = await getIPAddresses();

    // Validate the results
    expect(result).toHaveLength(2);
    
    // Check that each IP address has the expected properties
    expect(result[0]).toEqual({
      id: expect.any(Number),
      address: '192.168.1.1',
      assignedTo: 'Server 1',
      created_at: expect.any(Date)
    });

    expect(result[1]).toEqual({
      id: expect.any(Number),
      address: '192.168.1.2',
      assignedTo: 'Server 2',
      created_at: expect.any(Date)
    });

    // Verify the data was actually saved to the database
    const dbResults = await db.select()
      .from(ipAddressesTable)
      .where(eq(ipAddressesTable.address, '192.168.1.1'))
      .execute();

    expect(dbResults).toHaveLength(1);
    expect(dbResults[0].address).toEqual('192.168.1.1');
    expect(dbResults[0].assignedTo).toEqual('Server 1');
  });

  it('should properly convert created_at to Date objects', async () => {
    // Insert test data
    await db.insert(ipAddressesTable).values({
      address: '192.168.1.3',
      assignedTo: 'Server 3'
    }).execute();

    // Fetch IP addresses using the handler
    const result = await getIPAddresses();

    // Validate that created_at is a Date object
    expect(result).toHaveLength(1);
    expect(result[0].created_at).toBeInstanceOf(Date);
  });
});
