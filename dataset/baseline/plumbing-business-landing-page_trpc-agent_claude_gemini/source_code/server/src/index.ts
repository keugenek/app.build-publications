import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createServiceInputSchema, 
  updateServiceInputSchema,
  createTestimonialInputSchema,
  createContactInquiryInputSchema,
  updateContactInquiryStatusInputSchema
} from './schema';

// Import handlers
import { getServices, getFeaturedServices } from './handlers/get_services';
import { createService } from './handlers/create_service';
import { updateService } from './handlers/update_service';
import { getTestimonials, getFeaturedTestimonials } from './handlers/get_testimonials';
import { createTestimonial } from './handlers/create_testimonial';
import { createContactInquiry } from './handlers/create_contact_inquiry';
import { getContactInquiries, getNewContactInquiries } from './handlers/get_contact_inquiries';
import { updateContactInquiryStatus } from './handlers/update_contact_inquiry_status';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Service management endpoints
  getServices: publicProcedure
    .query(() => getServices()),
  
  getFeaturedServices: publicProcedure
    .query(() => getFeaturedServices()),
  
  createService: publicProcedure
    .input(createServiceInputSchema)
    .mutation(({ input }) => createService(input)),
  
  updateService: publicProcedure
    .input(updateServiceInputSchema)
    .mutation(({ input }) => updateService(input)),

  // Testimonial management endpoints
  getTestimonials: publicProcedure
    .query(() => getTestimonials()),
  
  getFeaturedTestimonials: publicProcedure
    .query(() => getFeaturedTestimonials()),
  
  createTestimonial: publicProcedure
    .input(createTestimonialInputSchema)
    .mutation(({ input }) => createTestimonial(input)),

  // Contact inquiry endpoints (main lead generation)
  createContactInquiry: publicProcedure
    .input(createContactInquiryInputSchema)
    .mutation(({ input }) => createContactInquiry(input)),
  
  getContactInquiries: publicProcedure
    .query(() => getContactInquiries()),
  
  getNewContactInquiries: publicProcedure
    .query(() => getNewContactInquiries()),
  
  updateContactInquiryStatus: publicProcedure
    .input(updateContactInquiryStatusInputSchema)
    .mutation(({ input }) => updateContactInquiryStatus(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`🔧 Plumbing Business API Server listening at port: ${port}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   • Services: getServices, getFeaturedServices, createService, updateService`);
  console.log(`   • Testimonials: getTestimonials, getFeaturedTestimonials, createTestimonial`);
  console.log(`   • Lead Generation: createContactInquiry, getContactInquiries, getNewContactInquiries`);
  console.log(`   • Lead Management: updateContactInquiryStatus`);
}

start();
