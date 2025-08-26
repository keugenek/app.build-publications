import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable } from '../db/schema';
import { getHardwareAssets } from '../handlers/get_hardware_assets';

describe('getHardwareAssets', () => {
  beforeEach(async () => {
    await createDB();
  });

  afterEach(async () => {
    await resetDB();
  });

  it('should return an empty array when no hardware assets exist', async () => {
    const result = await getHardwareAssets();
    expect(result).toEqual([]);
  });

  it('should return all hardware assets when they exist', async () => {
    // Insert test data
    const testAssets = [
      {
        name: 'Server 1',
        type: 'Server' as const,
        make: 'Dell',
        model: 'PowerEdge R740',
        serial_number: 'SN123456',
        description: 'Production server'
      },
      {
        name: 'Switch 1',
        type: 'Switch' as const,
        make: 'Cisco',
        model: 'Catalyst 9300',
        serial_number: 'SN789012',
        description: 'Core switch'
      }
    ];

    for (const asset of testAssets) {
      await db.insert(hardwareAssetsTable).values(asset).execute();
    }

    const result = await getHardwareAssets();

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      name: 'Server 1',
      type: 'Server',
      make: 'Dell',
      model: 'PowerEdge R740',
      serial_number: 'SN123456',
      description: 'Production server'
    });
    
    expect(result[1]).toMatchObject({
      name: 'Switch 1',
      type: 'Switch',
      make: 'Cisco',
      model: 'Catalyst 9300',
      serial_number: 'SN789012',
      description: 'Core switch'
    });

    // Check that created_at is a Date object
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should return hardware assets with null description when description is null', async () => {
    // Insert test data with null description
    await db.insert(hardwareAssetsTable).values({
      name: 'Router 1',
      type: 'Router',
      make: 'Cisco',
      model: 'ISR 4331',
      serial_number: 'SN456789',
      description: null
    }).execute();

    const result = await getHardwareAssets();

    expect(result).toHaveLength(1);
    expect(result[0].description).toBeNull();
    expect(result[0].name).toBe('Router 1');
  });
});
