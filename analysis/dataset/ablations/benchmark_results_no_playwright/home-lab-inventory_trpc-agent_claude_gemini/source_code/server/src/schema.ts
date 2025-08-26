import { z } from 'zod';

// Hardware asset schema
export const hardwareAssetSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.string(), // e.g., "Server", "Switch", "Router", "Storage"
  manufacturer: z.string(),
  model: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type HardwareAsset = z.infer<typeof hardwareAssetSchema>;

// Input schema for creating hardware assets
export const createHardwareAssetInputSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  manufacturer: z.string().min(1),
  model: z.string().min(1),
  description: z.string().nullable()
});

export type CreateHardwareAssetInput = z.infer<typeof createHardwareAssetInputSchema>;

// Input schema for updating hardware assets
export const updateHardwareAssetInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  manufacturer: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  description: z.string().nullable().optional()
});

export type UpdateHardwareAssetInput = z.infer<typeof updateHardwareAssetInputSchema>;

// Software asset schema
export const softwareAssetSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.string(), // e.g., "VM", "Container", "Service"
  description: z.string().nullable(),
  hardware_asset_id: z.number().nullable(), // Link to host hardware
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type SoftwareAsset = z.infer<typeof softwareAssetSchema>;

// Input schema for creating software assets
export const createSoftwareAssetInputSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  description: z.string().nullable(),
  hardware_asset_id: z.number().nullable()
});

export type CreateSoftwareAssetInput = z.infer<typeof createSoftwareAssetInputSchema>;

// Input schema for updating software assets
export const updateSoftwareAssetInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  hardware_asset_id: z.number().nullable().optional()
});

export type UpdateSoftwareAssetInput = z.infer<typeof updateSoftwareAssetInputSchema>;

// IP address schema
export const ipAddressSchema = z.object({
  id: z.number(),
  ip_address: z.string(),
  subnet_mask: z.string(),
  hardware_asset_id: z.number().nullable(), // Can be linked to hardware
  software_asset_id: z.number().nullable(), // Can be linked to software
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type IpAddress = z.infer<typeof ipAddressSchema>;

// Input schema for creating IP addresses
export const createIpAddressInputSchema = z.object({
  ip_address: z.string().ip(),
  subnet_mask: z.string(),
  hardware_asset_id: z.number().nullable(),
  software_asset_id: z.number().nullable()
});

export type CreateIpAddressInput = z.infer<typeof createIpAddressInputSchema>;

// Input schema for updating IP addresses
export const updateIpAddressInputSchema = z.object({
  id: z.number(),
  ip_address: z.string().ip().optional(),
  subnet_mask: z.string().optional(),
  hardware_asset_id: z.number().nullable().optional(),
  software_asset_id: z.number().nullable().optional()
});

export type UpdateIpAddressInput = z.infer<typeof updateIpAddressInputSchema>;

// Delete input schemas for all entities
export const deleteInputSchema = z.object({
  id: z.number()
});

export type DeleteInput = z.infer<typeof deleteInputSchema>;

// Get by ID input schema
export const getByIdInputSchema = z.object({
  id: z.number()
});

export type GetByIdInput = z.infer<typeof getByIdInputSchema>;
