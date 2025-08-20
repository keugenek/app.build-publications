import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createServiceInputSchema,
  createTestimonialInputSchema,
  createContactSubmissionInputSchema
} from './schema';

// Import handlers
import { createService } from './handlers/create_service';
import { getServices } from './handlers/get_services';
import { createTestimonial } from './handlers/create_testimonial';
import { getTestimonials } from './handlers/get_testimonials';
import { createContactSubmission } from './handlers/create_contact_submission';
import { getContactSubmissions } from './handlers/get_contact_submissions';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Service management routes
  createService: publicProcedure
    .input(createServiceInputSchema)
    .mutation(({ input }) => createService(input)),
  getServices: publicProcedure
    .query(() => getServices()),
    
  // Testimonial management routes
  createTestimonial: publicProcedure
    .input(createTestimonialInputSchema)
    .mutation(({ input }) => createTestimonial(input)),
  getTestimonials: publicProcedure
    .query(() => getTestimonials()),
    
  // Contact form routes
  createContactSubmission: publicProcedure
    .input(createContactSubmissionInputSchema)
    .mutation(({ input }) => createContactSubmission(input)),
  getContactSubmissions: publicProcedure
    .query(() => getContactSubmissions()),
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
  console.log(`TRPC server listening at port: ${port}`);
}

start();
