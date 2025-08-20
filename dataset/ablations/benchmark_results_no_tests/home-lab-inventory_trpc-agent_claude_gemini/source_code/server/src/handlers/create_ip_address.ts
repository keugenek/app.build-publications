import { db } from '../db';
import { ipAddressesTable, hardwareAssetsTable, softwareAssetsTable } from '../db/schema';
import { type CreateIpAddressInput, type IpAddress } from '../schema';
import { eq } from 'drizzle-orm';

export const createIpAddress = async (input: CreateIpAddressInput): Promise<IpAddress> => {
  try {
    // Validate foreign key constraints if provided
    if (input.hardware_asset_id) {
      const hardwareAsset = await db.select()
        .from(hardwareAssetsTable)
        .where(eq(hardwareAssetsTable.id, input.hardware_asset_id))
        .limit(1)
        .execute();
      
      if (hardwareAsset.length === 0) {
        throw new Error(`Hardware asset with id ${input.hardware_asset_id} not found`);
      }
    }

    if (input.software_asset_id) {
      const softwareAsset = await db.select()
        .from(softwareAssetsTable)
        .where(eq(softwareAssetsTable.id, input.software_asset_id))
        .limit(1)
        .execute();
      
      if (softwareAsset.length === 0) {
        throw new Error(`Software asset with id ${input.software_asset_id} not found`);
      }
    }

    // Insert IP address record
    const result = await db.insert(ipAddressesTable)
      .values({
        ip_address: input.ip_address,
        subnet: input.subnet,
        assignment_type: input.assignment_type,
        hardware_asset_id: input.hardware_asset_id || null,
        software_asset_id: input.software_asset_id || null,
        description: input.description || null,
        is_reserved: input.is_reserved || false
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('IP address creation failed:', error);
    throw error;
  }
};
