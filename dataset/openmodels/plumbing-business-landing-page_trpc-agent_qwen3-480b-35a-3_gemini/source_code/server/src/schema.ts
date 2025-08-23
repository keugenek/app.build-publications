import { z } from 'zod';

// Service schema
export const serviceSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  icon: z.string().nullable(), // URL to icon image
  created_at: z.coerce.date()
});

export type Service = z.infer<typeof serviceSchema>;

// Testimonial schema
export const testimonialSchema = z.object({
  id: z.number(),
  customer_name: z.string(),
  customer_position: z.string().nullable(),
  company_name: z.string().nullable(),
  content: z.string(),
  rating: z.number().min(1).max(5),
  avatar: z.string().nullable(), // URL to customer avatar
  created_at: z.coerce.date()
});

export type Testimonial = z.infer<typeof testimonialSchema>;

// Contact form input schema
export const contactFormInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().nullable(),
  message: z.string().min(1, "Message is required"),
  service_id: z.number().optional(), // Service they're interested in
  preferred_contact: z.enum(['email', 'phone']).optional()
});

export type ContactFormInput = z.infer<typeof contactFormInputSchema>;

// Input schemas for creating records
export const createServiceInputSchema = z.object({
  title: z.string(),
  description: z.string(),
  icon: z.string().nullable()
});

export type CreateServiceInput = z.infer<typeof createServiceInputSchema>;

export const createTestimonialInputSchema = z.object({
  customer_name: z.string(),
  customer_position: z.string().nullable(),
  company_name: z.string().nullable(),
  content: z.string(),
  rating: z.number().min(1).max(5),
  avatar: z.string().nullable()
});

export type CreateTestimonialInput = z.infer<typeof createTestimonialInputSchema>;