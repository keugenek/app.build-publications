import { z } from 'zod';

// Hardware Asset schema
export const hardwareAssetSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.enum(['Server', 'Switch', 'Router', 'Storage']),
  make: z.string(),
  model: z.string(),
  serial_number: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type HardwareAsset = z.infer<typeof hardwareAssetSchema>;

// Input schema for creating hardware assets
export const createHardwareAssetInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(['Server', 'Switch', 'Router', 'Storage']),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  serial_number: z.string().min(1, "Serial number is required"),
  description: z.string().nullable()
});

export type CreateHardwareAssetInput = z.infer<typeof createHardwareAssetInputSchema>;

// Input schema for updating hardware assets
export const updateHardwareAssetInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Name is required").optional(),
  type: z.enum(['Server', 'Switch', 'Router', 'Storage']).optional(),
  make: z.string().min(1, "Make is required").optional(),
  model: z.string().min(1, "Model is required").optional(),
  serial_number: z.string().min(1, "Serial number is required").optional(),
  description: z.string().nullable().optional()
});

export type UpdateHardwareAssetInput = z.infer<typeof updateHardwareAssetInputSchema>;

// Software Asset schema
export const softwareAssetSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.enum(['VM', 'Container']),
  host_id: z.number(),
  operating_system: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type SoftwareAsset = z.infer<typeof softwareAssetSchema>;

// Input schema for creating software assets
export const createSoftwareAssetInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(['VM', 'Container']),
  host_id: z.number(),
  operating_system: z.string().min(1, "Operating system is required"),
  description: z.string().nullable()
});

export type CreateSoftwareAssetInput = z.infer<typeof createSoftwareAssetInputSchema>;

// Input schema for updating software assets
export const updateSoftwareAssetInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Name is required").optional(),
  type: z.enum(['VM', 'Container']).optional(),
  host_id: z.number().optional(),
  operating_system: z.string().min(1, "Operating system is required").optional(),
  description: z.string().nullable().optional()
});

export type UpdateSoftwareAssetInput = z.infer<typeof updateSoftwareAssetInputSchema>;

// IP Address schema
export const ipAddressSchema = z.object({
  id: z.number(),
  ip_address: z.string().regex(/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)+([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/, "Invalid IP address format"),
  device_type: z.enum(['hardware', 'software']),
  device_id: z.number(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type IPAddress = z.infer<typeof ipAddressSchema>;

// Input schema for creating IP addresses
export const createIPAddressInputSchema = z.object({
  ip_address: z.string().regex(/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)+([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/, "Invalid IP address format"),
  device_type: z.enum(['hardware', 'software']),
  device_id: z.number(),
  description: z.string().nullable()
});

export type CreateIPAddressInput = z.infer<typeof createIPAddressInputSchema>;

// Input schema for updating IP addresses
export const updateIPAddressInputSchema = z.object({
  id: z.number(),
  ip_address: z.string().regex(/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)+([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/, "Invalid IP address format").optional(),
  device_type: z.enum(['hardware', 'software']).optional(),
  device_id: z.number().optional(),
  description: z.string().nullable().optional()
});

export type UpdateIPAddressInput = z.infer<typeof updateIPAddressInputSchema>;
