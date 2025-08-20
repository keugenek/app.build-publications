import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable, softwareAssetsTable, ipAddressesTable } from '../db/schema';
import { getIpAddresses } from '../handlers/get_ip_addresses';

describe('getIpAddresses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no IP addresses exist', async () => {
    const result = await getIpAddresses();

    expect(result).toEqual([]);
  });

  it('should fetch all IP addresses', async () => {
    // Create test hardware asset
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'server',
        status: 'active'
      })
      .returning()
      .execute();

    const hardwareId = hardwareResult[0].id;

    // Create test software asset
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: 'Test VM',
        type: 'virtual_machine',
        status: 'running',
        host_hardware_id: hardwareId
      })
      .returning()
      .execute();

    const softwareId = softwareResult[0].id;

    // Create test IP addresses
    const ipData = [
      {
        ip_address: '192.168.1.100',
        subnet: '192.168.1.0/24',
        assignment_type: 'hardware' as const,
        hardware_asset_id: hardwareId,
        software_asset_id: null,
        description: 'Server management IP',
        is_reserved: false
      },
      {
        ip_address: '192.168.1.101',
        subnet: '192.168.1.0/24',
        assignment_type: 'software' as const,
        hardware_asset_id: null,
        software_asset_id: softwareId,
        description: 'VM IP address',
        is_reserved: false
      },
      {
        ip_address: '192.168.1.1',
        subnet: '192.168.1.0/24',
        assignment_type: 'hardware' as const,
        hardware_asset_id: null,
        software_asset_id: null,
        description: 'Gateway IP',
        is_reserved: true
      }
    ];

    await db.insert(ipAddressesTable)
      .values(ipData)
      .execute();

    const result = await getIpAddresses();

    // Should return all 3 IP addresses
    expect(result).toHaveLength(3);

    // Verify first IP address (hardware assignment)
    const hardwareIP = result.find(ip => ip.ip_address === '192.168.1.100');
    expect(hardwareIP).toBeDefined();
    expect(hardwareIP!.assignment_type).toEqual('hardware');
    expect(hardwareIP!.hardware_asset_id).toEqual(hardwareId);
    expect(hardwareIP!.software_asset_id).toBeNull();
    expect(hardwareIP!.description).toEqual('Server management IP');
    expect(hardwareIP!.is_reserved).toBe(false);
    expect(hardwareIP!.created_at).toBeInstanceOf(Date);
    expect(hardwareIP!.updated_at).toBeInstanceOf(Date);

    // Verify second IP address (software assignment)
    const softwareIP = result.find(ip => ip.ip_address === '192.168.1.101');
    expect(softwareIP).toBeDefined();
    expect(softwareIP!.assignment_type).toEqual('software');
    expect(softwareIP!.hardware_asset_id).toBeNull();
    expect(softwareIP!.software_asset_id).toEqual(softwareId);
    expect(softwareIP!.description).toEqual('VM IP address');
    expect(softwareIP!.is_reserved).toBe(false);

    // Verify reserved IP address
    const reservedIP = result.find(ip => ip.ip_address === '192.168.1.1');
    expect(reservedIP).toBeDefined();
    expect(reservedIP!.assignment_type).toEqual('hardware');
    expect(reservedIP!.hardware_asset_id).toBeNull();
    expect(reservedIP!.software_asset_id).toBeNull();
    expect(reservedIP!.description).toEqual('Gateway IP');
    expect(reservedIP!.is_reserved).toBe(true);
  });

  it('should handle multiple IP addresses with various assignment types', async () => {
    // Create multiple test IP addresses without foreign key references
    const ipData = [
      {
        ip_address: '10.0.0.1',
        subnet: '10.0.0.0/24',
        assignment_type: 'hardware' as const,
        hardware_asset_id: null,
        software_asset_id: null,
        description: 'Network gateway',
        is_reserved: true
      },
      {
        ip_address: '10.0.0.2',
        subnet: '10.0.0.0/24',
        assignment_type: 'software' as const,
        hardware_asset_id: null,
        software_asset_id: null,
        description: 'Reserved for future use',
        is_reserved: true
      },
      {
        ip_address: '172.16.0.50',
        subnet: '172.16.0.0/16',
        assignment_type: 'hardware' as const,
        hardware_asset_id: null,
        software_asset_id: null,
        description: null,
        is_reserved: false
      }
    ];

    await db.insert(ipAddressesTable)
      .values(ipData)
      .execute();

    const result = await getIpAddresses();

    expect(result).toHaveLength(3);

    // Verify all IP addresses are returned
    const ipAddresses = result.map(ip => ip.ip_address).sort();
    expect(ipAddresses).toEqual(['10.0.0.1', '10.0.0.2', '172.16.0.50']);

    // Verify different subnets are handled
    const subnets = [...new Set(result.map(ip => ip.subnet))];
    expect(subnets).toContain('10.0.0.0/24');
    expect(subnets).toContain('172.16.0.0/16');

    // Verify reserved status
    const reservedCount = result.filter(ip => ip.is_reserved).length;
    expect(reservedCount).toBe(2);
  });

  it('should return IP addresses with proper field types', async () => {
    // Create test IP address
    await db.insert(ipAddressesTable)
      .values({
        ip_address: '192.168.100.50',
        subnet: '192.168.100.0/24',
        assignment_type: 'hardware',
        hardware_asset_id: null,
        software_asset_id: null,
        description: 'Type validation test',
        is_reserved: false
      })
      .execute();

    const result = await getIpAddresses();

    expect(result).toHaveLength(1);

    const ipAddress = result[0];
    
    // Verify all field types
    expect(typeof ipAddress.id).toBe('number');
    expect(typeof ipAddress.ip_address).toBe('string');
    expect(typeof ipAddress.subnet).toBe('string');
    expect(typeof ipAddress.assignment_type).toBe('string');
    expect(typeof ipAddress.is_reserved).toBe('boolean');
    expect(ipAddress.created_at).toBeInstanceOf(Date);
    expect(ipAddress.updated_at).toBeInstanceOf(Date);
    
    // Nullable fields can be null or string
    if (ipAddress.description !== null) {
      expect(typeof ipAddress.description).toBe('string');
    }
    if (ipAddress.hardware_asset_id !== null) {
      expect(typeof ipAddress.hardware_asset_id).toBe('number');
    }
    if (ipAddress.software_asset_id !== null) {
      expect(typeof ipAddress.software_asset_id).toBe('number');
    }
  });
});
