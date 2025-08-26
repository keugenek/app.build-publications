import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ipAddressAllocationsTable } from '../db/schema';
import { getIpAddressAllocations } from '../handlers/get_ip_address_allocations';

describe('getIpAddressAllocations', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no IP address allocations exist', async () => {
    const result = await getIpAddressAllocations();

    expect(result).toEqual([]);
  });

  it('should return all IP address allocations', async () => {
    // Create test IP address allocations
    const testAllocations = [
      {
        ip_address: '192.168.1.100',
        purpose: 'Web Server',
        assigned_hardware_id: null,
        assigned_software_id: null,
        status: 'allocated'
      },
      {
        ip_address: '192.168.1.101',
        purpose: 'Database Server',
        assigned_hardware_id: null,
        assigned_software_id: null,
        status: 'available'
      },
      {
        ip_address: '10.0.0.5',
        purpose: null,
        assigned_hardware_id: null,
        assigned_software_id: null,
        status: 'reserved'
      }
    ];

    // Insert test data
    await db.insert(ipAddressAllocationsTable)
      .values(testAllocations)
      .execute();

    const result = await getIpAddressAllocations();

    // Should return all allocations
    expect(result).toHaveLength(3);

    // Verify first allocation
    const allocation1 = result.find(a => a.ip_address === '192.168.1.100');
    expect(allocation1).toBeDefined();
    expect(allocation1?.purpose).toBe('Web Server');
    expect(allocation1?.status).toBe('allocated');
    expect(allocation1?.assigned_hardware_id).toBeNull();
    expect(allocation1?.assigned_software_id).toBeNull();
    expect(allocation1?.id).toBeDefined();
    expect(allocation1?.created_at).toBeInstanceOf(Date);
    expect(allocation1?.updated_at).toBeInstanceOf(Date);

    // Verify second allocation
    const allocation2 = result.find(a => a.ip_address === '192.168.1.101');
    expect(allocation2).toBeDefined();
    expect(allocation2?.purpose).toBe('Database Server');
    expect(allocation2?.status).toBe('available');

    // Verify third allocation with null purpose
    const allocation3 = result.find(a => a.ip_address === '10.0.0.5');
    expect(allocation3).toBeDefined();
    expect(allocation3?.purpose).toBeNull();
    expect(allocation3?.status).toBe('reserved');
  });

  it('should return IP address allocations with proper field types', async () => {
    // Create allocation with all fields populated
    await db.insert(ipAddressAllocationsTable)
      .values({
        ip_address: '172.16.0.50',
        purpose: 'Load Balancer',
        assigned_hardware_id: 123,
        assigned_software_id: 456,
        status: 'in_use'
      })
      .execute();

    const result = await getIpAddressAllocations();

    expect(result).toHaveLength(1);
    const allocation = result[0];

    // Verify all field types
    expect(typeof allocation.id).toBe('number');
    expect(typeof allocation.ip_address).toBe('string');
    expect(typeof allocation.purpose).toBe('string');
    expect(typeof allocation.assigned_hardware_id).toBe('number');
    expect(typeof allocation.assigned_software_id).toBe('number');
    expect(typeof allocation.status).toBe('string');
    expect(allocation.created_at).toBeInstanceOf(Date);
    expect(allocation.updated_at).toBeInstanceOf(Date);

    // Verify field values
    expect(allocation.ip_address).toBe('172.16.0.50');
    expect(allocation.purpose).toBe('Load Balancer');
    expect(allocation.assigned_hardware_id).toBe(123);
    expect(allocation.assigned_software_id).toBe(456);
    expect(allocation.status).toBe('in_use');
  });

  it('should handle mixed null and non-null values correctly', async () => {
    // Create allocations with different null combinations
    const allocations = [
      {
        ip_address: '192.168.1.200',
        purpose: 'Test Server',
        assigned_hardware_id: 100,
        assigned_software_id: null,
        status: 'allocated'
      },
      {
        ip_address: '192.168.1.201',
        purpose: null,
        assigned_hardware_id: null,
        assigned_software_id: 200,
        status: 'available'
      }
    ];

    await db.insert(ipAddressAllocationsTable)
      .values(allocations)
      .execute();

    const result = await getIpAddressAllocations();

    expect(result).toHaveLength(2);

    // First allocation: purpose and hardware_id set, software_id null
    const allocation1 = result.find(a => a.ip_address === '192.168.1.200');
    expect(allocation1?.purpose).toBe('Test Server');
    expect(allocation1?.assigned_hardware_id).toBe(100);
    expect(allocation1?.assigned_software_id).toBeNull();

    // Second allocation: purpose and hardware_id null, software_id set
    const allocation2 = result.find(a => a.ip_address === '192.168.1.201');
    expect(allocation2?.purpose).toBeNull();
    expect(allocation2?.assigned_hardware_id).toBeNull();
    expect(allocation2?.assigned_software_id).toBe(200);
  });
});
