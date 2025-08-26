import { z } from 'zod';

// Hardware asset types enum
export const hardwareTypeSchema = z.enum(['server', 'switch', 'router', 'firewall', 'storage', 'other']);
export type HardwareType = z.infer<typeof hardwareTypeSchema>;

// Software asset types enum
export const softwareTypeSchema = z.enum(['vm', 'container', 'service', 'application', 'other']);
export type SoftwareType = z.infer<typeof softwareTypeSchema>;

// Hardware asset schema
export const hardwareAssetSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: hardwareTypeSchema,
  make: z.string().nullable(),
  model: z.string().nullable(),
  location: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type HardwareAsset = z.infer<typeof hardwareAssetSchema>;

// Software asset schema
export const softwareAssetSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: softwareTypeSchema,
  host_id: z.number().nullable(), // Links to hardware asset
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type SoftwareAsset = z.infer<typeof softwareAssetSchema>;

// IP allocation schema
export const ipAllocationSchema = z.object({
  id: z.number(),
  ip_address: z.string(),
  asset_name: z.string(),
  hardware_asset_id: z.number().nullable(), // Optional link to hardware asset
  software_asset_id: z.number().nullable(), // Optional link to software asset
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type IpAllocation = z.infer<typeof ipAllocationSchema>;

// Input schemas for creating hardware assets
export const createHardwareAssetInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: hardwareTypeSchema,
  make: z.string().nullable(),
  model: z.string().nullable(),
  location: z.string().nullable()
});

export type CreateHardwareAssetInput = z.infer<typeof createHardwareAssetInputSchema>;

// Input schemas for updating hardware assets
export const updateHardwareAssetInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Name is required").optional(),
  type: hardwareTypeSchema.optional(),
  make: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  location: z.string().nullable().optional()
});

export type UpdateHardwareAssetInput = z.infer<typeof updateHardwareAssetInputSchema>;

// Input schemas for creating software assets
export const createSoftwareAssetInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: softwareTypeSchema,
  host_id: z.number().nullable(),
  description: z.string().nullable()
});

export type CreateSoftwareAssetInput = z.infer<typeof createSoftwareAssetInputSchema>;

// Input schemas for updating software assets
export const updateSoftwareAssetInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Name is required").optional(),
  type: softwareTypeSchema.optional(),
  host_id: z.number().nullable().optional(),
  description: z.string().nullable().optional()
});

export type UpdateSoftwareAssetInput = z.infer<typeof updateSoftwareAssetInputSchema>;

// Input schemas for creating IP allocations
export const createIpAllocationInputSchema = z.object({
  ip_address: z.string().ip("Invalid IP address format"),
  asset_name: z.string().min(1, "Asset name is required"),
  hardware_asset_id: z.number().nullable(),
  software_asset_id: z.number().nullable(),
  description: z.string().nullable()
});

export type CreateIpAllocationInput = z.infer<typeof createIpAllocationInputSchema>;

// Input schemas for updating IP allocations
export const updateIpAllocationInputSchema = z.object({
  id: z.number(),
  ip_address: z.string().ip("Invalid IP address format").optional(),
  asset_name: z.string().min(1, "Asset name is required").optional(),
  hardware_asset_id: z.number().nullable().optional(),
  software_asset_id: z.number().nullable().optional(),
  description: z.string().nullable().optional()
});

export type UpdateIpAllocationInput = z.infer<typeof updateIpAllocationInputSchema>;

// ID parameter schema for operations that need an ID
export const idParamSchema = z.object({
  id: z.number()
});

export type IdParam = z.infer<typeof idParamSchema>;
