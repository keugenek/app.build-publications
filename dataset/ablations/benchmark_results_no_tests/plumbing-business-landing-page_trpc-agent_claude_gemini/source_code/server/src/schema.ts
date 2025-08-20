import { z } from 'zod';

// Contact form lead schema
export const contactLeadSchema = z.object({
  id: z.number(),
  customer_name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  message: z.string(),
  created_at: z.coerce.date()
});

export type ContactLead = z.infer<typeof contactLeadSchema>;

// Input schema for creating contact leads
export const createContactLeadInputSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  email: z.string().email('Valid email address is required'),
  phone: z.string().min(1, 'Phone number is required'),
  message: z.string().min(1, 'Message is required')
});

export type CreateContactLeadInput = z.infer<typeof createContactLeadInputSchema>;

// Response schema for successful lead submission
export const contactLeadResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  leadId: z.number().optional()
});

export type ContactLeadResponse = z.infer<typeof contactLeadResponseSchema>;
