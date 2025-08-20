import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas for input validation
import {
  createJobListingInputSchema,
  updateJobListingInputSchema,
  jobListingFiltersSchema,
  getJobListingInputSchema,
  deleteJobListingInputSchema
} from './schema';

// Import handlers
import { createJobListing } from './handlers/create_job_listing';
import { getJobListings } from './handlers/get_job_listings';
import { getJobListing } from './handlers/get_job_listing';
import { updateJobListing } from './handlers/update_job_listing';
import { deleteJobListing } from './handlers/delete_job_listing';

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

  // Create a new job listing
  createJobListing: publicProcedure
    .input(createJobListingInputSchema)
    .mutation(({ input }) => createJobListing(input)),

  // Get all job listings with optional filtering
  getJobListings: publicProcedure
    .input(jobListingFiltersSchema.optional())
    .query(({ input }) => getJobListings(input)),

  // Get a single job listing by ID
  getJobListing: publicProcedure
    .input(getJobListingInputSchema)
    .query(({ input }) => getJobListing(input)),

  // Update an existing job listing
  updateJobListing: publicProcedure
    .input(updateJobListingInputSchema)
    .mutation(({ input }) => updateJobListing(input)),

  // Delete a job listing
  deleteJobListing: publicProcedure
    .input(deleteJobListingInputSchema)
    .mutation(({ input }) => deleteJobListing(input)),
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
  console.log(`Job Board TRPC server listening at port: ${port}`);
}

start();
