import { z } from 'zod';

// Hardware asset schema
export const hardwareAssetSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.enum(['server', 'switch']),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
});

export type HardwareAsset = z.infer<typeof hardwareAssetSchema>;

// Input schema for creating hardware assets
export const createHardwareAssetInputSchema = z.object({
  name: z.string(),
  type: z.enum(['server', 'switch']),
  description: z.string().nullable(),
});

export type CreateHardwareAssetInput = z.infer<typeof createHardwareAssetInputSchema>;

// Input schema for updating hardware assets
export const updateHardwareAssetInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  type: z.enum(['server', 'switch']).optional(),
  description: z.string().nullable().optional(),
});

export type UpdateHardwareAssetInput = z.infer<typeof updateHardwareAssetInputSchema>;

// Software asset schema
export const softwareAssetSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.enum(['VM', 'container']),
  description: z.string().nullable(),
  host_id: z.number(),
  created_at: z.coerce.date(),
});

export type SoftwareAsset = z.infer<typeof softwareAssetSchema>;

// Input schema for creating software assets
export const createSoftwareAssetInputSchema = z.object({
  name: z.string(),
  type: z.enum(['VM', 'container']),
  description: z.string().nullable(),
  host_id: z.number(),
});

export type CreateSoftwareAssetInput = z.infer<typeof createSoftwareAssetInputSchema>;

// Input schema for updating software assets
export const updateSoftwareAssetInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  type: z.enum(['VM', 'container']).optional(),
  description: z.string().nullable().optional(),
  host_id: z.number().optional(),
});

export type UpdateSoftwareAssetInput = z.infer<typeof updateSoftwareAssetInputSchema>;

// IP address schema
export const ipAddressSchema = z.object({
  id: z.number(),
  ip_address: z.string(),
  status: z.enum(['allocated', 'free']),
  hardware_asset_id: z.number().nullable(),
  software_asset_id: z.number().nullable(),
  created_at: z.coerce.date(),
});

export type IpAddress = z.infer<typeof ipAddressSchema>;

// Input schema for creating IP addresses
export const createIpAddressInputSchema = z.object({
  ip_address: z.string(),
  status: z.enum(['allocated', 'free']),
  hardware_asset_id: z.number().nullable(),
  software_asset_id: z.number().nullable(),
});

export type CreateIpAddressInput = z.infer<typeof createIpAddressInputSchema>;

// Input schema for updating IP addresses
export const updateIpAddressInputSchema = z.object({
  id: z.number(),
  ip_address: z.string().optional(),
  status: z.enum(['allocated', 'free']).optional(),
  hardware_asset_id: z.number().nullable().optional(),
  software_asset_id: z.number().nullable().optional(),
});

export type UpdateIpAddressInput = z.infer<typeof updateIpAddressInputSchema>;
