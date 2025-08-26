import { db } from '../db';
import { ipAddressesTable, hardwareAssetsTable, softwareAssetsTable } from '../db/schema';
import { type CreateIpAddressInput, type IpAddress } from '../schema';
import { eq } from 'drizzle-orm';

export const createIpAddress = async (input: CreateIpAddressInput): Promise<IpAddress> => {
  try {
    // Validate that at least one of hardware_asset_id or software_asset_id is provided
    if (!input.hardware_asset_id && !input.software_asset_id) {
      throw new Error('Either hardware_asset_id or software_asset_id must be provided');
    }

    // Validate hardware asset exists if provided
    if (input.hardware_asset_id) {
      const hardwareAssets = await db.select()
        .from(hardwareAssetsTable)
        .where(eq(hardwareAssetsTable.id, input.hardware_asset_id))
        .execute();

      if (hardwareAssets.length === 0) {
        throw new Error(`Hardware asset with id ${input.hardware_asset_id} not found`);
      }
    }

    // Validate software asset exists if provided
    if (input.software_asset_id) {
      const softwareAssets = await db.select()
        .from(softwareAssetsTable)
        .where(eq(softwareAssetsTable.id, input.software_asset_id))
        .execute();

      if (softwareAssets.length === 0) {
        throw new Error(`Software asset with id ${input.software_asset_id} not found`);
      }
    }

    // Insert IP address record
    const result = await db.insert(ipAddressesTable)
      .values({
        ip_address: input.ip_address,
        subnet_mask: input.subnet_mask,
        hardware_asset_id: input.hardware_asset_id,
        software_asset_id: input.software_asset_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('IP address creation failed:', error);
    throw error;
  }
};
