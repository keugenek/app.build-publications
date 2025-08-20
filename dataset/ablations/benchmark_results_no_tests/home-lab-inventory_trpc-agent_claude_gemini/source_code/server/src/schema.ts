import { z } from 'zod';

// Hardware Asset Schema
export const hardwareAssetSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.enum(['server', 'network_switch', 'router', 'firewall', 'storage', 'other']),
  status: z.enum(['active', 'inactive', 'maintenance', 'decommissioned']),
  model: z.string().nullable(),
  manufacturer: z.string().nullable(),
  serial_number: z.string().nullable(),
  location: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type HardwareAsset = z.infer<typeof hardwareAssetSchema>;

// Software Asset Schema
export const softwareAssetSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.enum(['virtual_machine', 'container', 'service', 'application', 'other']),
  status: z.enum(['running', 'stopped', 'paused', 'error']),
  host_hardware_id: z.number().nullable(), // Reference to hardware asset
  operating_system: z.string().nullable(),
  version: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type SoftwareAsset = z.infer<typeof softwareAssetSchema>;

// IP Address Allocation Schema
export const ipAddressSchema = z.object({
  id: z.number(),
  ip_address: z.string(),
  subnet: z.string(),
  assignment_type: z.enum(['hardware', 'software']),
  hardware_asset_id: z.number().nullable(), // Reference to hardware asset
  software_asset_id: z.number().nullable(), // Reference to software asset
  description: z.string().nullable(),
  is_reserved: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type IpAddress = z.infer<typeof ipAddressSchema>;

// Input schemas for creating hardware assets
export const createHardwareAssetInputSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['server', 'network_switch', 'router', 'firewall', 'storage', 'other']),
  status: z.enum(['active', 'inactive', 'maintenance', 'decommissioned']).default('active'),
  model: z.string().nullable().optional(),
  manufacturer: z.string().nullable().optional(),
  serial_number: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  notes: z.string().nullable().optional()
});

export type CreateHardwareAssetInput = z.infer<typeof createHardwareAssetInputSchema>;

// Input schemas for updating hardware assets
export const updateHardwareAssetInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  type: z.enum(['server', 'network_switch', 'router', 'firewall', 'storage', 'other']).optional(),
  status: z.enum(['active', 'inactive', 'maintenance', 'decommissioned']).optional(),
  model: z.string().nullable().optional(),
  manufacturer: z.string().nullable().optional(),
  serial_number: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  notes: z.string().nullable().optional()
});

export type UpdateHardwareAssetInput = z.infer<typeof updateHardwareAssetInputSchema>;

// Input schemas for creating software assets
export const createSoftwareAssetInputSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['virtual_machine', 'container', 'service', 'application', 'other']),
  status: z.enum(['running', 'stopped', 'paused', 'error']).default('stopped'),
  host_hardware_id: z.number().nullable().optional(),
  operating_system: z.string().nullable().optional(),
  version: z.string().nullable().optional(),
  notes: z.string().nullable().optional()
});

export type CreateSoftwareAssetInput = z.infer<typeof createSoftwareAssetInputSchema>;

// Input schemas for updating software assets
export const updateSoftwareAssetInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  type: z.enum(['virtual_machine', 'container', 'service', 'application', 'other']).optional(),
  status: z.enum(['running', 'stopped', 'paused', 'error']).optional(),
  host_hardware_id: z.number().nullable().optional(),
  operating_system: z.string().nullable().optional(),
  version: z.string().nullable().optional(),
  notes: z.string().nullable().optional()
});

export type UpdateSoftwareAssetInput = z.infer<typeof updateSoftwareAssetInputSchema>;

// Input schemas for creating IP addresses
export const createIpAddressInputSchema = z.object({
  ip_address: z.string().ip(),
  subnet: z.string(),
  assignment_type: z.enum(['hardware', 'software']),
  hardware_asset_id: z.number().nullable().optional(),
  software_asset_id: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
  is_reserved: z.boolean().default(false)
});

export type CreateIpAddressInput = z.infer<typeof createIpAddressInputSchema>;

// Input schemas for updating IP addresses
export const updateIpAddressInputSchema = z.object({
  id: z.number(),
  ip_address: z.string().ip().optional(),
  subnet: z.string().optional(),
  assignment_type: z.enum(['hardware', 'software']).optional(),
  hardware_asset_id: z.number().nullable().optional(),
  software_asset_id: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
  is_reserved: z.boolean().optional()
});

export type UpdateIpAddressInput = z.infer<typeof updateIpAddressInputSchema>;

// ID input schema for delete/get operations
export const idInputSchema = z.object({
  id: z.number()
});

export type IdInput = z.infer<typeof idInputSchema>;
