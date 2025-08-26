import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createJobListingInputSchema,
  updateJobListingInputSchema,
  getJobListingsInputSchema
} from './schema';

// Import handlers
import { createJobListing } from './handlers/create_job_listing';
import { getJobListings } from './handlers/get_job_listings';
import { getJobListingById } from './handlers/get_job_listing_by_id';
import { updateJobListing } from './handlers/update_job_listing';
import { deleteJobListing } from './handlers/delete_job_listing';
import { getEngineeringDisciplines } from './handlers/get_engineering_disciplines';

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

  // Job listing management endpoints
  createJobListing: publicProcedure
    .input(createJobListingInputSchema)
    .mutation(({ input }) => createJobListing(input)),

  getJobListings: publicProcedure
    .input(getJobListingsInputSchema)
    .query(({ input }) => getJobListings(input)),

  getJobListingById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getJobListingById(input.id)),

  updateJobListing: publicProcedure
    .input(updateJobListingInputSchema)
    .mutation(({ input }) => updateJobListing(input)),

  deleteJobListing: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteJobListing(input.id)),

  // Utility endpoints
  getEngineeringDisciplines: publicProcedure
    .query(() => getEngineeringDisciplines()),
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
  console.log(`Engineering Job Board TRPC server listening at port: ${port}`);
}

start();
