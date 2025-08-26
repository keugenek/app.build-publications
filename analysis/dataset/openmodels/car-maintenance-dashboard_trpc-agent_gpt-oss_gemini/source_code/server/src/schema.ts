import { z } from 'zod';

// Maintenance Record schema (output)
export const maintenanceRecordSchema = z.object({
  id: z.number(),
  service_date: z.coerce.date(),
  service_type: z.string(),
  mileage: z.number().int().nonnegative(),
  cost: z.number().nonnegative(),
  notes: z.string().nullable(), // nullable, not optional
  created_at: z.coerce.date(),
});

export type MaintenanceRecord = z.infer<typeof maintenanceRecordSchema>;

// Input schema for creating a maintenance record
export const createMaintenanceInputSchema = z.object({
  service_date: z.coerce.date(),
  service_type: z.string(),
  mileage: z.number().int().nonnegative(),
  cost: z.number().nonnegative(),
  notes: z.string().nullable().optional(), // can be null or omitted
});

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceInputSchema>;

// Reminder schema (output)
export const reminderSchema = z.object({
  id: z.number(),
  due_date: z.coerce.date(),
  service_type: z.string(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
});

export type Reminder = z.infer<typeof reminderSchema>;

// Input schema for creating a reminder
export const createReminderInputSchema = z.object({
  due_date: z.coerce.date(),
  service_type: z.string(),
  notes: z.string().nullable().optional(),
});

export type CreateReminderInput = z.infer<typeof createReminderInputSchema>;
