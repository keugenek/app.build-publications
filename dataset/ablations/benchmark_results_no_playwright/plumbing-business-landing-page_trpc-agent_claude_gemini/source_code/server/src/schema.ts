import { z } from 'zod';

// Contact form submission schema
export const contactFormSchema = z.object({
  id: z.number(),
  customer_name: z.string(),
  email: z.string().email(),
  phone_number: z.string(),
  message: z.string(),
  created_at: z.coerce.date()
});

export type ContactForm = z.infer<typeof contactFormSchema>;

// Input schema for creating contact form submissions
export const createContactFormInputSchema = z.object({
  customer_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone_number: z.string().min(10, "Phone number must be at least 10 digits"),
  message: z.string().min(10, "Message must be at least 10 characters")
});

export type CreateContactFormInput = z.infer<typeof createContactFormInputSchema>;

// Schema for plumbing services (static content)
export const plumbingServiceSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  icon: z.string().nullable(),
  display_order: z.number().int()
});

export type PlumbingService = z.infer<typeof plumbingServiceSchema>;

// Schema for customer testimonials (static content)
export const testimonialSchema = z.object({
  id: z.number(),
  customer_name: z.string(),
  rating: z.number().int().min(1).max(5),
  testimonial_text: z.string(),
  service_type: z.string().nullable(),
  created_at: z.coerce.date(),
  display_order: z.number().int()
});

export type Testimonial = z.infer<typeof testimonialSchema>;
