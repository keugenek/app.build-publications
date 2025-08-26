import { z } from 'zod';

// Hardware Asset schemas
export const hardwareAssetSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.string(),
  make: z.string(),
  model: z.string(),
  serial_number: z.string().nullable(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type HardwareAsset = z.infer<typeof hardwareAssetSchema>;

export const createHardwareAssetInputSchema = z.object({
  name: z.string(),
  type: z.string(),
  make: z.string(),
  model: z.string(),
  serial_number: z.string().nullable(),
  description: z.string().nullable()
});

export type CreateHardwareAssetInput = z.infer<typeof createHardwareAssetInputSchema>;

export const updateHardwareAssetInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  type: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  serial_number: z.string().nullable().optional(),
  description: z.string().nullable().optional()
});

export type UpdateHardwareAssetInput = z.infer<typeof updateHardwareAssetInputSchema>;

// Software Asset schemas
export const softwareAssetSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.string(),
  hardware_asset_id: z.number().nullable(),
  operating_system: z.string().nullable(),
  purpose: z.string().nullable(),
  resource_allocation: z.string().nullable(),
  ip_address_id: z.number().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type SoftwareAsset = z.infer<typeof softwareAssetSchema>;

export const createSoftwareAssetInputSchema = z.object({
  name: z.string(),
  type: z.string(),
  hardware_asset_id: z.number().nullable(),
  operating_system: z.string().nullable(),
  purpose: z.string().nullable(),
  resource_allocation: z.string().nullable(),
  ip_address_id: z.number().nullable()
});

export type CreateSoftwareAssetInput = z.infer<typeof createSoftwareAssetInputSchema>;

export const updateSoftwareAssetInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  type: z.string().optional(),
  hardware_asset_id: z.number().nullable().optional(),
  operating_system: z.string().nullable().optional(),
  purpose: z.string().nullable().optional(),
  resource_allocation: z.string().nullable().optional(),
  ip_address_id: z.number().nullable().optional()
});

export type UpdateSoftwareAssetInput = z.infer<typeof updateSoftwareAssetInputSchema>;

// IP Address Allocation schemas
export const ipAddressAllocationSchema = z.object({
  id: z.number(),
  ip_address: z.string(),
  purpose: z.string().nullable(),
  assigned_hardware_id: z.number().nullable(),
  assigned_software_id: z.number().nullable(),
  status: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type IpAddressAllocation = z.infer<typeof ipAddressAllocationSchema>;

export const createIpAddressAllocationInputSchema = z.object({
  ip_address: z.string(),
  purpose: z.string().nullable(),
  assigned_hardware_id: z.number().nullable(),
  assigned_software_id: z.number().nullable(),
  status: z.string()
});

export type CreateIpAddressAllocationInput = z.infer<typeof createIpAddressAllocationInputSchema>;

export const updateIpAddressAllocationInputSchema = z.object({
  id: z.number(),
  ip_address: z.string().optional(),
  purpose: z.string().nullable().optional(),
  assigned_hardware_id: z.number().nullable().optional(),
  assigned_software_id: z.number().nullable().optional(),
  status: z.string().optional()
});

export type UpdateIpAddressAllocationInput = z.infer<typeof updateIpAddressAllocationInputSchema>;

// Common schemas for operations
export const deleteInputSchema = z.object({
  id: z.number()
});

export type DeleteInput = z.infer<typeof deleteInputSchema>;
