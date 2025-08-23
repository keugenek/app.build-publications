import { db } from '../db';
import { ipAddressesTable, hardwareAssetsTable, softwareAssetsTable } from '../db/schema';
import { type UpdateIpAddressInput, type IpAddress } from '../schema';
import { eq } from 'drizzle-orm';

export const updateIpAddress = async (input: UpdateIpAddressInput): Promise<IpAddress | null> => {
  try {
    // Check if the IP address exists
    const existingIp = await db.select()
      .from(ipAddressesTable)
      .where(eq(ipAddressesTable.id, input.id))
      .execute();

    if (existingIp.length === 0) {
      return null;
    }

    // Validate foreign key references if they are being updated
    if (input.hardware_asset_id !== undefined) {
      if (input.hardware_asset_id !== null) {
        const hardwareAsset = await db.select()
          .from(hardwareAssetsTable)
          .where(eq(hardwareAssetsTable.id, input.hardware_asset_id))
          .execute();
        
        if (hardwareAsset.length === 0) {
          throw new Error(`Hardware asset with id ${input.hardware_asset_id} not found`);
        }
      }
    }

    if (input.software_asset_id !== undefined) {
      if (input.software_asset_id !== null) {
        const softwareAsset = await db.select()
          .from(softwareAssetsTable)
          .where(eq(softwareAssetsTable.id, input.software_asset_id))
          .execute();
        
        if (softwareAsset.length === 0) {
          throw new Error(`Software asset with id ${input.software_asset_id} not found`);
        }
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (input.ip_address !== undefined) updateData.ip_address = input.ip_address;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.hardware_asset_id !== undefined) updateData.hardware_asset_id = input.hardware_asset_id;
    if (input.software_asset_id !== undefined) updateData.software_asset_id = input.software_asset_id;

    // Update the IP address
    const result = await db.update(ipAddressesTable)
      .set(updateData)
      .where(eq(ipAddressesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      return null;
    }

    // Return the updated IP address
    return {
      ...result[0],
    };
  } catch (error) {
    console.error('IP address update failed:', error);
    throw error;
  }
};
