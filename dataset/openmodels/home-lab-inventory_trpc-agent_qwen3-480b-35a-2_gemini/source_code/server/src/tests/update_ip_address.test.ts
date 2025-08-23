import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ipAddressesTable, hardwareAssetsTable, softwareAssetsTable } from '../db/schema';
import { type UpdateIpAddressInput } from '../schema';
import { updateIpAddress } from '../handlers/update_ip_address';
import { eq } from 'drizzle-orm';

describe('updateIpAddress', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a hardware asset for foreign key reference
    await db.insert(hardwareAssetsTable).values({
      name: 'Test Server',
      type: 'server',
      description: 'A test server'
    }).execute();
    
    // Create a software asset for foreign key reference
    await db.insert(softwareAssetsTable).values({
      name: 'Test VM',
      type: 'VM',
      description: 'A test VM',
      host_id: 1
    }).execute();
    
    // Create an IP address to update
    await db.insert(ipAddressesTable).values({
      ip_address: '192.168.1.1',
      status: 'free',
      hardware_asset_id: null,
      software_asset_id: null
    }).execute();
  });
  
  afterEach(resetDB);

  it('should update an IP address', async () => {
    const updateInput: UpdateIpAddressInput = {
      id: 1,
      ip_address: '192.168.1.100',
      status: 'allocated',
      hardware_asset_id: 1
    };

    const result = await updateIpAddress(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(1);
    expect(result!.ip_address).toBe('192.168.1.100');
    expect(result!.status).toBe('allocated');
    expect(result!.hardware_asset_id).toBe(1);
    expect(result!.software_asset_id).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should partially update an IP address', async () => {
    const updateInput: UpdateIpAddressInput = {
      id: 1,
      status: 'allocated'
    };

    const result = await updateIpAddress(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(1);
    expect(result!.ip_address).toBe('192.168.1.1'); // Should remain unchanged
    expect(result!.status).toBe('allocated'); // Should be updated
    expect(result!.hardware_asset_id).toBeNull(); // Should remain unchanged
    expect(result!.software_asset_id).toBeNull(); // Should remain unchanged
  });

  it('should return null when updating a non-existent IP address', async () => {
    const updateInput: UpdateIpAddressInput = {
      id: 999, // Non-existent ID
      status: 'allocated'
    };

    const result = await updateIpAddress(updateInput);
    
    expect(result).toBeNull();
  });

  it('should update IP address to link to a software asset', async () => {
    const updateInput: UpdateIpAddressInput = {
      id: 1,
      software_asset_id: 1
    };

    const result = await updateIpAddress(updateInput);

    expect(result).not.toBeNull();
    expect(result!.software_asset_id).toBe(1);
    expect(result!.hardware_asset_id).toBeNull();
  });

  it('should update IP address to unlink from assets', async () => {
    // First link to a hardware asset
    await db.update(ipAddressesTable)
      .set({ hardware_asset_id: 1 })
      .where(eq(ipAddressesTable.id, 1))
      .execute();

    const updateInput: UpdateIpAddressInput = {
      id: 1,
      hardware_asset_id: null,
      software_asset_id: null
    };

    const result = await updateIpAddress(updateInput);

    expect(result).not.toBeNull();
    expect(result!.hardware_asset_id).toBeNull();
    expect(result!.software_asset_id).toBeNull();
  });

  it('should throw an error when linking to a non-existent hardware asset', async () => {
    const updateInput: UpdateIpAddressInput = {
      id: 1,
      hardware_asset_id: 999 // Non-existent ID
    };

    await expect(updateIpAddress(updateInput)).rejects.toThrow(/Hardware asset with id 999 not found/);
  });

  it('should throw an error when linking to a non-existent software asset', async () => {
    const updateInput: UpdateIpAddressInput = {
      id: 1,
      software_asset_id: 999 // Non-existent ID
    };

    await expect(updateIpAddress(updateInput)).rejects.toThrow(/Software asset with id 999 not found/);
  });
});
