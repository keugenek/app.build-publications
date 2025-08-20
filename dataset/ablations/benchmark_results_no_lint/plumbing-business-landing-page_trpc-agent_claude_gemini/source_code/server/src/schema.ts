import { z } from 'zod';

// Service schema for plumbing services
export const serviceSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  created_at: z.coerce.date()
});

export type Service = z.infer<typeof serviceSchema>;

// Input schema for creating services
export const createServiceInputSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  description: z.string().min(1, 'Service description is required')
});

export type CreateServiceInput = z.infer<typeof createServiceInputSchema>;

// Testimonial schema for customer testimonials
export const testimonialSchema = z.object({
  id: z.number(),
  customer_name: z.string(),
  review_text: z.string(),
  rating: z.number().int().min(1).max(5), // Rating from 1-5 stars
  created_at: z.coerce.date()
});

export type Testimonial = z.infer<typeof testimonialSchema>;

// Input schema for creating testimonials
export const createTestimonialInputSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  review_text: z.string().min(1, 'Review text is required'),
  rating: z.number().int().min(1).max(5)
});

export type CreateTestimonialInput = z.infer<typeof createTestimonialInputSchema>;

// Contact form submission schema
export const contactSubmissionSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  phone_number: z.string().nullable(),
  message: z.string(),
  created_at: z.coerce.date()
});

export type ContactSubmission = z.infer<typeof contactSubmissionSchema>;

// Input schema for contact form submission
export const createContactSubmissionInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone_number: z.string().nullable(), // Phone number is optional
  message: z.string().min(1, 'Message is required')
});

export type CreateContactSubmissionInput = z.infer<typeof createContactSubmissionInputSchema>;
