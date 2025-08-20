import { z } from 'zod';

// Service schema – represents a plumbing service offering
export const serviceSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  // Optional price field – can be omitted or null
  price: z.number().nonnegative().optional().nullable(),
});

export type Service = z.infer<typeof serviceSchema>;

// Testimonial schema – customer feedback
export const testimonialSchema = z.object({
  id: z.number(),
  customer_name: z.string(),
  content: z.string(),
  rating: z.number().int().min(1).max(5).optional(), // 1-5 stars
});

export type Testimonial = z.infer<typeof testimonialSchema>;

// Input schema for contact form submissions
export const contactFormInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().min(1),
});

export type ContactFormInput = z.infer<typeof contactFormInputSchema>;
