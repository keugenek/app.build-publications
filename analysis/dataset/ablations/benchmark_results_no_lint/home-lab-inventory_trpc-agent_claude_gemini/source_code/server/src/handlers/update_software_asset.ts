import { db } from '../db';
import { softwareAssetsTable, hardwareAssetsTable, ipAddressAllocationsTable } from '../db/schema';
import { type UpdateSoftwareAssetInput, type SoftwareAsset } from '../schema';
import { eq } from 'drizzle-orm';

export const updateSoftwareAsset = async (input: UpdateSoftwareAssetInput): Promise<SoftwareAsset> => {
  try {
    // First, verify the software asset exists
    const existingSoftwareAsset = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, input.id))
      .execute();

    if (existingSoftwareAsset.length === 0) {
      throw new Error(`Software asset with id ${input.id} not found`);
    }

    // Validate foreign key references if they are being updated
    if (input.hardware_asset_id !== undefined && input.hardware_asset_id !== null) {
      const hardwareAsset = await db.select()
        .from(hardwareAssetsTable)
        .where(eq(hardwareAssetsTable.id, input.hardware_asset_id))
        .execute();

      if (hardwareAsset.length === 0) {
        throw new Error(`Hardware asset with id ${input.hardware_asset_id} not found`);
      }
    }

    if (input.ip_address_id !== undefined && input.ip_address_id !== null) {
      const ipAddress = await db.select()
        .from(ipAddressAllocationsTable)
        .where(eq(ipAddressAllocationsTable.id, input.ip_address_id))
        .execute();

      if (ipAddress.length === 0) {
        throw new Error(`IP address allocation with id ${input.ip_address_id} not found`);
      }
    }

    // Build update object only with provided fields
    const updateFields: Partial<typeof softwareAssetsTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.name !== undefined) updateFields.name = input.name;
    if (input.type !== undefined) updateFields.type = input.type;
    if (input.hardware_asset_id !== undefined) updateFields.hardware_asset_id = input.hardware_asset_id;
    if (input.operating_system !== undefined) updateFields.operating_system = input.operating_system;
    if (input.purpose !== undefined) updateFields.purpose = input.purpose;
    if (input.resource_allocation !== undefined) updateFields.resource_allocation = input.resource_allocation;
    if (input.ip_address_id !== undefined) updateFields.ip_address_id = input.ip_address_id;

    // Update the software asset
    const result = await db.update(softwareAssetsTable)
      .set(updateFields)
      .where(eq(softwareAssetsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Software asset update failed:', error);
    throw error;
  }
};
