import { z } from 'zod';

// ---------- Hardware Asset Schemas ----------
export const hardwareAssetSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.enum(['server', 'switch']),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});
export type HardwareAsset = z.infer<typeof hardwareAssetSchema>;

export const createHardwareAssetInputSchema = z.object({
  name: z.string(),
  type: z.enum(['server', 'switch']),
  description: z.string().nullable()
});
export type CreateHardwareAssetInput = z.infer<typeof createHardwareAssetInputSchema>;

export const updateHardwareAssetInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  type: z.enum(['server', 'switch']).optional(),
  description: z.string().nullable().optional()
});
export type UpdateHardwareAssetInput = z.infer<typeof updateHardwareAssetInputSchema>;

// ---------- Software Asset Schemas ----------
export const softwareAssetSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.enum(['vm', 'container']),
  host_id: z.number(), // reference to hardware asset
  description: z.string().nullable(),
  created_at: z.coerce.date()
});
export type SoftwareAsset = z.infer<typeof softwareAssetSchema>;

export const createSoftwareAssetInputSchema = z.object({
  name: z.string(),
  type: z.enum(['vm', 'container']),
  host_id: z.number(),
  description: z.string().nullable()
});
export type CreateSoftwareAssetInput = z.infer<typeof createSoftwareAssetInputSchema>;

export const updateSoftwareAssetInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  type: z.enum(['vm', 'container']).optional(),
  host_id: z.number().optional(),
  description: z.string().nullable().optional()
});
export type UpdateSoftwareAssetInput = z.infer<typeof updateSoftwareAssetInputSchema>;

// ---------- IP Allocation Schemas ----------
export const ipAllocationSchema = z.object({
  id: z.number(),
  ip_address: z.string(),
  description: z.string().nullable(),
  hardware_asset_id: z.number().nullable(),
  software_asset_id: z.number().nullable(),
  created_at: z.coerce.date()
});
export type IPAllocation = z.infer<typeof ipAllocationSchema>;

export const createIPAllocationInputSchema = z.object({
  ip_address: z.string(),
  description: z.string().nullable(),
  hardware_asset_id: z.number().nullable(),
  software_asset_id: z.number().nullable()
});
export type CreateIPAllocationInput = z.infer<typeof createIPAllocationInputSchema>;

export const updateIPAllocationInputSchema = z.object({
  id: z.number(),
  ip_address: z.string().optional(),
  description: z.string().nullable().optional(),
  hardware_asset_id: z.number().nullable().optional(),
  software_asset_id: z.number().nullable().optional()
});
export type UpdateIPAllocationInput = z.infer<typeof updateIPAllocationInputSchema>;
