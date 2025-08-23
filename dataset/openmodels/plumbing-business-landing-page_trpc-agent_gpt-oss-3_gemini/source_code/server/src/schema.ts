import { z } from 'zod';

// Service schema (output)
export const serviceSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  price: z.number(), // using number for numeric columns
  created_at: z.coerce.date(),
});
export type Service = z.infer<typeof serviceSchema>;

// Testimonial schema (output)
export const testimonialSchema = z.object({
  id: z.number(),
  name: z.string(),
  message: z.string(),
  rating: z.number().int().min(1).max(5),
  created_at: z.coerce.date(),
});
export type Testimonial = z.infer<typeof testimonialSchema>;

// Lead schema (output)
export const leadSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  message: z.string(),
  created_at: z.coerce.date(),
});
export type Lead = z.infer<typeof leadSchema>;

// Input schema for creating a lead (contact form submission)
export const createLeadInputSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  message: z.string(),
});
export type CreateLeadInput = z.infer<typeof createLeadInputSchema>;
