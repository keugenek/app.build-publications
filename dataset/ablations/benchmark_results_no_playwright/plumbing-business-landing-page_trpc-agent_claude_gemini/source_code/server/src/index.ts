import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schema types and handlers
import { createContactFormInputSchema } from './schema';
import { createContactForm } from './handlers/create_contact_form';
import { getPlumbingServices } from './handlers/get_plumbing_services';
import { getTestimonials } from './handlers/get_testimonials';
import { getContactForms } from './handlers/get_contact_forms';

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

  // Contact form submission for lead generation
  createContactForm: publicProcedure
    .input(createContactFormInputSchema)
    .mutation(({ input }) => createContactForm(input)),

  // Get plumbing services for the "Services Offered" section
  getPlumbingServices: publicProcedure
    .query(() => getPlumbingServices()),

  // Get customer testimonials for the "Customer Testimonials" section
  getTestimonials: publicProcedure
    .query(() => getTestimonials()),

  // Get contact form submissions for business owner (lead management)
  getContactForms: publicProcedure
    .query(() => getContactForms()),
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
