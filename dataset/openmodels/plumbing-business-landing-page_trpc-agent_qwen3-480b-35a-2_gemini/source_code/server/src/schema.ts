import { z } from 'zod';

// Service schema
export const serviceSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  icon: z.string().nullable(), // Icon identifier for UI
  created_at: z.coerce.date()
});

export type Service = z.infer<typeof serviceSchema>;

// Testimonial schema
export const testimonialSchema = z.object({
  id: z.number(),
  customer_name: z.string(),
  customer_location: z.string(),
  quote: z.string(),
  rating: z.number().min(1).max(5), // 1-5 star rating
  created_at: z.coerce.date()
});

export type Testimonial = z.infer<typeof testimonialSchema>;

// Contact form submission schema
export const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is required"),
  message: z.string().min(1, "Message is required")
});

export type ContactForm = z.infer<typeof contactFormSchema>;

// Input schema for creating contact form submissions
export const createContactFormInputSchema = contactFormSchema;

export type CreateContactFormInput = z.infer<typeof createContactFormInputSchema>;