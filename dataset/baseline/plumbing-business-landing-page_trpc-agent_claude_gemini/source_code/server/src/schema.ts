import { z } from 'zod';

// Service schema
export const serviceSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  icon: z.string(),
  price_range: z.string().nullable(),
  is_featured: z.boolean(),
  display_order: z.number().int(),
  created_at: z.coerce.date()
});

export type Service = z.infer<typeof serviceSchema>;

// Testimonial schema
export const testimonialSchema = z.object({
  id: z.number(),
  customer_name: z.string(),
  customer_location: z.string().nullable(),
  rating: z.number().int().min(1).max(5),
  review_text: z.string(),
  service_type: z.string().nullable(),
  is_featured: z.boolean(),
  created_at: z.coerce.date()
});

export type Testimonial = z.infer<typeof testimonialSchema>;

// Contact inquiry schema
export const contactInquirySchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  service_needed: z.string().nullable(),
  message: z.string(),
  is_urgent: z.boolean(),
  status: z.enum(['new', 'contacted', 'scheduled', 'completed', 'cancelled']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type ContactInquiry = z.infer<typeof contactInquirySchema>;

// Input schemas for creating records
export const createServiceInputSchema = z.object({
  title: z.string().min(1, "Service title is required"),
  description: z.string().min(1, "Service description is required"),
  icon: z.string().min(1, "Service icon is required"),
  price_range: z.string().nullable(),
  is_featured: z.boolean().default(false),
  display_order: z.number().int().nonnegative()
});

export type CreateServiceInput = z.infer<typeof createServiceInputSchema>;

export const createTestimonialInputSchema = z.object({
  customer_name: z.string().min(1, "Customer name is required"),
  customer_location: z.string().nullable(),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
  review_text: z.string().min(10, "Review must be at least 10 characters long"),
  service_type: z.string().nullable(),
  is_featured: z.boolean().default(false)
});

export type CreateTestimonialInput = z.infer<typeof createTestimonialInputSchema>;

export const createContactInquiryInputSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Please provide a valid email address"),
  phone: z.string().nullable(),
  service_needed: z.string().nullable(),
  message: z.string().min(10, "Please provide a detailed message (minimum 10 characters)"),
  is_urgent: z.boolean().default(false)
});

export type CreateContactInquiryInput = z.infer<typeof createContactInquiryInputSchema>;

// Update schemas
export const updateContactInquiryStatusInputSchema = z.object({
  id: z.number(),
  status: z.enum(['new', 'contacted', 'scheduled', 'completed', 'cancelled'])
});

export type UpdateContactInquiryStatusInput = z.infer<typeof updateContactInquiryStatusInputSchema>;

export const updateServiceInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  icon: z.string().min(1).optional(),
  price_range: z.string().nullable().optional(),
  is_featured: z.boolean().optional(),
  display_order: z.number().int().nonnegative().optional()
});

export type UpdateServiceInput = z.infer<typeof updateServiceInputSchema>;
