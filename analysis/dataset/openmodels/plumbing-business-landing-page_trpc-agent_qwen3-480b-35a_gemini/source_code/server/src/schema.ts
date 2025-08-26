import { z } from 'zod';

// Service schema
export const serviceSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  icon: z.string().nullable(), // For service icons
  created_at: z.coerce.date()
});

export type Service = z.infer<typeof serviceSchema>;

// Testimonial schema
export const testimonialSchema = z.object({
  id: z.number(),
  customer_name: z.string(),
  quote: z.string(),
  rating: z.number().min(1).max(5), // 1-5 star rating
  created_at: z.coerce.date()
});

export type Testimonial = z.infer<typeof testimonialSchema>;

// Contact form input schema
export const contactFormInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  message: z.string().min(1, "Message is required")
});

export type ContactFormInput = z.infer<typeof contactFormInputSchema>;

// Contact submission schema
export const contactSubmissionSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  message: z.string(),
  submitted_at: z.coerce.date()
});

export type ContactSubmission = z.infer<typeof contactSubmissionSchema>;
