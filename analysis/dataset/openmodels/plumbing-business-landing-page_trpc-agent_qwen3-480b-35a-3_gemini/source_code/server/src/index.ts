import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { 
  serviceSchema, 
  testimonialSchema, 
  contactFormInputSchema,
  createServiceInputSchema,
  createTestimonialInputSchema
} from './schema';
import { getServices } from './handlers/get_services';
import { getTestimonials } from './handlers/get_testimonials';
import { submitContactForm } from './handlers/submit_contact_form';
import { createService } from './handlers/create_service';
import { createTestimonial } from './handlers/create_testimonial';
import { seedData } from './handlers/seed_data';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  getServices: publicProcedure
    .query(() => getServices()),
  getTestimonials: publicProcedure
    .query(() => getTestimonials()),
  submitContactForm: publicProcedure
    .input(contactFormInputSchema)
    .mutation(({ input }) => submitContactForm(input)),
  createService: publicProcedure
    .input(createServiceInputSchema)
    .mutation(({ input }) => createService(input)),
  createTestimonial: publicProcedure
    .input(createTestimonialInputSchema)
    .mutation(({ input }) => createTestimonial(input)),
  seedData: publicProcedure
    .mutation(() => seedData()),
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
  
  // Seed data on startup for development
  if (process.env.NODE_ENV !== 'production') {
    console.log('Seeding data for development...');
    // In a real implementation, you would call seedData() here
  }
}

start();
