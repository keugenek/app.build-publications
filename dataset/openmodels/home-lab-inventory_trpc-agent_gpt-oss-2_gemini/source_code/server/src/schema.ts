import { z } from 'zod';

/**
 * Enum definitions matching PostgreSQL enums for strict type safety.
 */
export const hardwareTypeEnum = z.enum(['server', 'switch']);
export const softwareTypeEnum = z.enum(['vm', 'container']);
export const ipAllocationStatusEnum = z.enum(['allocated', 'available']);
export const allocationTargetTypeEnum = z.enum(['hardware', 'software']);

/**
 * Hardware Asset schemas
 */
export const hardwareAssetSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  type: hardwareTypeEnum,
  make: z.string(),
  model: z.string(),
  serial_number: z.string(),
  location: z.string(),
  created_at: z.coerce.date(),
});
export type HardwareAsset = z.infer<typeof hardwareAssetSchema>;

export const createHardwareAssetInputSchema = z.object({
  name: z.string(),
  type: hardwareTypeEnum,
  make: z.string(),
  model: z.string(),
  serial_number: z.string(),
  location: z.string(),
});
export type CreateHardwareAssetInput = z.infer<typeof createHardwareAssetInputSchema>;

export const updateHardwareAssetInputSchema = z.object({
  id: z.number().int(),
  name: z.string().optional(),
  type: hardwareTypeEnum.optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  serial_number: z.string().optional(),
  location: z.string().optional(),
});
export type UpdateHardwareAssetInput = z.infer<typeof updateHardwareAssetInputSchema>;

export const deleteHardwareAssetInputSchema = z.object({
  id: z.number().int(),
});
export type DeleteHardwareAssetInput = z.infer<typeof deleteHardwareAssetInputSchema>;

/**
 * Software Asset schemas
 */
export const softwareAssetSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  type: softwareTypeEnum,
  host_hardware_id: z.number().int(),
  operating_system: z.string(),
  purpose: z.string(),
  created_at: z.coerce.date(),
});
export type SoftwareAsset = z.infer<typeof softwareAssetSchema>;

export const createSoftwareAssetInputSchema = z.object({
  name: z.string(),
  type: softwareTypeEnum,
  host_hardware_id: z.number().int(),
  operating_system: z.string(),
  purpose: z.string(),
});
export type CreateSoftwareAssetInput = z.infer<typeof createSoftwareAssetInputSchema>;

export const updateSoftwareAssetInputSchema = z.object({
  id: z.number().int(),
  name: z.string().optional(),
  type: softwareTypeEnum.optional(),
  host_hardware_id: z.number().int().optional(),
  operating_system: z.string().optional(),
  purpose: z.string().optional(),
});
export type UpdateSoftwareAssetInput = z.infer<typeof updateSoftwareAssetInputSchema>;

export const deleteSoftwareAssetInputSchema = z.object({
  id: z.number().int(),
});
export type DeleteSoftwareAssetInput = z.infer<typeof deleteSoftwareAssetInputSchema>;

/**
 * IP Allocation schemas
 */
export const ipAllocationSchema = z.object({
  id: z.number().int(),
  ip_address: z.string(),
  allocation_target_type: allocationTargetTypeEnum,
  allocation_target_id: z.number().int(),
  subnet: z.string(),
  status: ipAllocationStatusEnum,
  created_at: z.coerce.date(),
});
export type IPAllocation = z.infer<typeof ipAllocationSchema>;

export const createIPAllocationInputSchema = z.object({
  ip_address: z.string(),
  allocation_target_type: allocationTargetTypeEnum,
  allocation_target_id: z.number().int(),
  subnet: z.string(),
  status: ipAllocationStatusEnum,
});
export type CreateIPAllocationInput = z.infer<typeof createIPAllocationInputSchema>;

export const updateIPAllocationInputSchema = z.object({
  id: z.number().int(),
  ip_address: z.string().optional(),
  allocation_target_type: allocationTargetTypeEnum.optional(),
  allocation_target_id: z.number().int().optional(),
  subnet: z.string().optional(),
  status: ipAllocationStatusEnum.optional(),
});
export type UpdateIPAllocationInput = z.infer<typeof updateIPAllocationInputSchema>;

export const deleteIPAllocationInputSchema = z.object({
  id: z.number().int(),
});
export type DeleteIPAllocationInput = z.infer<typeof deleteIPAllocationInputSchema>;
