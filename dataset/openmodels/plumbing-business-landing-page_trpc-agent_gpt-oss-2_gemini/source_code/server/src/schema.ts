import { z } from 'zod';

// Lead (contact form submission) schema
export const leadSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(), // simple string, validation can be enhanced
  message: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Lead = z.infer<typeof leadSchema>;

// Input schema for creating a lead (contact form)
export const createLeadInputSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  phone: z.string().min(1, { message: 'Phone number is required' }),
  message: z.string().nullable().optional() // optional field, can be omitted or null
});

export type CreateLeadInput = z.infer<typeof createLeadInputSchema>;
