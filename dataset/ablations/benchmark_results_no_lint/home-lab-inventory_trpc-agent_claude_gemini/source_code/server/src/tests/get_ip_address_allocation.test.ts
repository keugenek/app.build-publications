import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ipAddressAllocationsTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { getIpAddressAllocation } from '../handlers/get_ip_address_allocation';

describe('getIpAddressAllocation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve an IP address allocation by ID', async () => {
    // Create test IP address allocation
    const testAllocation = await db.insert(ipAddressAllocationsTable)
      .values({
        ip_address: '192.168.1.100',
        purpose: 'Web Server',
        assigned_hardware_id: null,
        assigned_software_id: null,
        status: 'allocated'
      })
      .returning()
      .execute();

    const input: DeleteInput = { id: testAllocation[0].id };
    const result = await getIpAddressAllocation(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testAllocation[0].id);
    expect(result!.ip_address).toEqual('192.168.1.100');
    expect(result!.purpose).toEqual('Web Server');
    expect(result!.assigned_hardware_id).toBeNull();
    expect(result!.assigned_software_id).toBeNull();
    expect(result!.status).toEqual('allocated');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent IP address allocation', async () => {
    const input: DeleteInput = { id: 999 };
    const result = await getIpAddressAllocation(input);

    expect(result).toBeNull();
  });

  it('should retrieve IP address allocation with assigned hardware ID', async () => {
    // Create test IP address allocation with hardware assignment
    const testAllocation = await db.insert(ipAddressAllocationsTable)
      .values({
        ip_address: '10.0.0.50',
        purpose: 'Database Server',
        assigned_hardware_id: 123,
        assigned_software_id: null,
        status: 'in_use'
      })
      .returning()
      .execute();

    const input: DeleteInput = { id: testAllocation[0].id };
    const result = await getIpAddressAllocation(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testAllocation[0].id);
    expect(result!.ip_address).toEqual('10.0.0.50');
    expect(result!.purpose).toEqual('Database Server');
    expect(result!.assigned_hardware_id).toEqual(123);
    expect(result!.assigned_software_id).toBeNull();
    expect(result!.status).toEqual('in_use');
  });

  it('should retrieve IP address allocation with assigned software ID', async () => {
    // Create test IP address allocation with software assignment
    const testAllocation = await db.insert(ipAddressAllocationsTable)
      .values({
        ip_address: '172.16.0.25',
        purpose: 'Application Instance',
        assigned_hardware_id: null,
        assigned_software_id: 456,
        status: 'reserved'
      })
      .returning()
      .execute();

    const input: DeleteInput = { id: testAllocation[0].id };
    const result = await getIpAddressAllocation(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testAllocation[0].id);
    expect(result!.ip_address).toEqual('172.16.0.25');
    expect(result!.purpose).toEqual('Application Instance');
    expect(result!.assigned_hardware_id).toBeNull();
    expect(result!.assigned_software_id).toEqual(456);
    expect(result!.status).toEqual('reserved');
  });

  it('should retrieve IP address allocation with null purpose', async () => {
    // Create test IP address allocation with null purpose
    const testAllocation = await db.insert(ipAddressAllocationsTable)
      .values({
        ip_address: '192.168.0.1',
        purpose: null,
        assigned_hardware_id: null,
        assigned_software_id: null,
        status: 'available'
      })
      .returning()
      .execute();

    const input: DeleteInput = { id: testAllocation[0].id };
    const result = await getIpAddressAllocation(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testAllocation[0].id);
    expect(result!.ip_address).toEqual('192.168.0.1');
    expect(result!.purpose).toBeNull();
    expect(result!.assigned_hardware_id).toBeNull();
    expect(result!.assigned_software_id).toBeNull();
    expect(result!.status).toEqual('available');
  });

  it('should handle multiple IP address allocations and return only the requested one', async () => {
    // Create multiple test IP address allocations
    const allocations = await db.insert(ipAddressAllocationsTable)
      .values([
        {
          ip_address: '192.168.1.10',
          purpose: 'Router',
          assigned_hardware_id: null,
          assigned_software_id: null,
          status: 'allocated'
        },
        {
          ip_address: '192.168.1.11',
          purpose: 'Switch',
          assigned_hardware_id: null,
          assigned_software_id: null,
          status: 'allocated'
        }
      ])
      .returning()
      .execute();

    const input: DeleteInput = { id: allocations[1].id };
    const result = await getIpAddressAllocation(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(allocations[1].id);
    expect(result!.ip_address).toEqual('192.168.1.11');
    expect(result!.purpose).toEqual('Switch');
  });
});
