import { z } from 'zod';

// Hardware Asset schema
export const hardwareAssetSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.string(),
  model: z.string(),
  serialNumber: z.string(),
  location: z.string(),
  created_at: z.coerce.date()
});

export type HardwareAsset = z.infer<typeof hardwareAssetSchema>;

// Input schema for creating hardware assets
export const createHardwareAssetInputSchema = z.object({
  name: z.string(),
  type: z.string(),
  model: z.string(),
  serialNumber: z.string(),
  location: z.string()
});

export type CreateHardwareAssetInput = z.infer<typeof createHardwareAssetInputSchema>;

// Input schema for updating hardware assets
export const updateHardwareAssetInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  type: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  location: z.string().optional()
});

export type UpdateHardwareAssetInput = z.infer<typeof updateHardwareAssetInputSchema>;

// Software Asset schema
export const softwareAssetSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.string(),
  operatingSystem: z.string(),
  host: z.string(),
  created_at: z.coerce.date()
});

export type SoftwareAsset = z.infer<typeof softwareAssetSchema>;

// Input schema for creating software assets
export const createSoftwareAssetInputSchema = z.object({
  name: z.string(),
  type: z.string(),
  operatingSystem: z.string(),
  host: z.string()
});

export type CreateSoftwareAssetInput = z.infer<typeof createSoftwareAssetInputSchema>;

// Input schema for updating software assets
export const updateSoftwareAssetInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  type: z.string().optional(),
  operatingSystem: z.string().optional(),
  host: z.string().optional()
});

export type UpdateSoftwareAssetInput = z.infer<typeof updateSoftwareAssetInputSchema>;

// IP Address schema
export const ipAddressSchema = z.object({
  id: z.number(),
  address: z.string(),
  assignedTo: z.string(),
  created_at: z.coerce.date()
});

export type IPAddress = z.infer<typeof ipAddressSchema>;

// Input schema for creating IP addresses
export const createIPAddressInputSchema = z.object({
  address: z.string(),
  assignedTo: z.string()
});

export type CreateIPAddressInput = z.infer<typeof createIPAddressInputSchema>;

// Input schema for updating IP addresses
export const updateIPAddressInputSchema = z.object({
  id: z.number(),
  address: z.string().optional(),
  assignedTo: z.string().optional()
});

export type UpdateIPAddressInput = z.infer<typeof updateIPAddressInputSchema>;
