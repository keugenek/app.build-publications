import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ipAddressesTable, hardwareAssetsTable, softwareAssetsTable } from '../db/schema';
import { type IdInput } from '../schema';
import { getIpAddress } from '../handlers/get_ip_address';
import { eq } from 'drizzle-orm';

describe('getIpAddress', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return IP address when found', async () => {
    // Create test IP address
    const ipResult = await db.insert(ipAddressesTable)
      .values({
        ip_address: '192.168.1.100',
        subnet: '192.168.1.0/24',
        assignment_type: 'hardware',
        hardware_asset_id: null,
        software_asset_id: null,
        description: 'Test IP address',
        is_reserved: false
      })
      .returning()
      .execute();

    const testInput: IdInput = {
      id: ipResult[0].id
    };

    const result = await getIpAddress(testInput);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(ipResult[0].id);
    expect(result!.ip_address).toBe('192.168.1.100');
    expect(result!.subnet).toBe('192.168.1.0/24');
    expect(result!.assignment_type).toBe('hardware');
    expect(result!.hardware_asset_id).toBeNull();
    expect(result!.software_asset_id).toBeNull();
    expect(result!.description).toBe('Test IP address');
    expect(result!.is_reserved).toBe(false);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when IP address not found', async () => {
    const testInput: IdInput = {
      id: 999 // Non-existent ID
    };

    const result = await getIpAddress(testInput);

    expect(result).toBeNull();
  });

  it('should return IP address with hardware assignment', async () => {
    // Create test hardware asset
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'server',
        status: 'active'
      })
      .returning()
      .execute();

    // Create test IP address assigned to hardware
    const ipResult = await db.insert(ipAddressesTable)
      .values({
        ip_address: '10.0.0.50',
        subnet: '10.0.0.0/16',
        assignment_type: 'hardware',
        hardware_asset_id: hardwareResult[0].id,
        software_asset_id: null,
        description: 'Server management IP',
        is_reserved: true
      })
      .returning()
      .execute();

    const testInput: IdInput = {
      id: ipResult[0].id
    };

    const result = await getIpAddress(testInput);

    expect(result).not.toBeNull();
    expect(result!.ip_address).toBe('10.0.0.50');
    expect(result!.assignment_type).toBe('hardware');
    expect(result!.hardware_asset_id).toBe(hardwareResult[0].id);
    expect(result!.software_asset_id).toBeNull();
    expect(result!.is_reserved).toBe(true);
  });

  it('should return IP address with software assignment', async () => {
    // Create test software asset
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: 'Test VM',
        type: 'virtual_machine',
        status: 'running'
      })
      .returning()
      .execute();

    // Create test IP address assigned to software
    const ipResult = await db.insert(ipAddressesTable)
      .values({
        ip_address: '172.16.0.10',
        subnet: '172.16.0.0/24',
        assignment_type: 'software',
        hardware_asset_id: null,
        software_asset_id: softwareResult[0].id,
        description: 'VM IP address',
        is_reserved: false
      })
      .returning()
      .execute();

    const testInput: IdInput = {
      id: ipResult[0].id
    };

    const result = await getIpAddress(testInput);

    expect(result).not.toBeNull();
    expect(result!.ip_address).toBe('172.16.0.10');
    expect(result!.assignment_type).toBe('software');
    expect(result!.hardware_asset_id).toBeNull();
    expect(result!.software_asset_id).toBe(softwareResult[0].id);
    expect(result!.is_reserved).toBe(false);
  });

  it('should verify IP address exists in database after retrieval', async () => {
    // Create test IP address
    const ipResult = await db.insert(ipAddressesTable)
      .values({
        ip_address: '203.0.113.42',
        subnet: '203.0.113.0/24',
        assignment_type: 'hardware',
        description: 'Public IP for testing',
        is_reserved: true
      })
      .returning()
      .execute();

    const testInput: IdInput = {
      id: ipResult[0].id
    };

    const result = await getIpAddress(testInput);

    // Verify the IP address exists in database
    const dbRecord = await db.select()
      .from(ipAddressesTable)
      .where(eq(ipAddressesTable.id, result!.id))
      .execute();

    expect(dbRecord).toHaveLength(1);
    expect(dbRecord[0].ip_address).toBe(result!.ip_address);
    expect(dbRecord[0].subnet).toBe(result!.subnet);
    expect(dbRecord[0].assignment_type).toBe(result!.assignment_type);
    expect(dbRecord[0].description).toBe(result!.description);
    expect(dbRecord[0].is_reserved).toBe(result!.is_reserved);
  });
});
