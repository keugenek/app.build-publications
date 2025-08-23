import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';
import { createJobListingInputSchema, filterJobListingsInputSchema, updateJobListingInputSchema } from './schema';
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
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  createJobListing: publicProcedure
    .input(createJobListingInputSchema)
    .mutation(({ input }) => createJobListing(input)),
  getJobListings: publicProcedure
    .input(filterJobListingsInputSchema)
    .query(({ input }) => getJobListings(input)),
  getJobListing: publicProcedure
    .input(z.number())
    .query(({ input }) => getJobListing(input)),
  updateJobListing: publicProcedure
    .input(updateJobListingInputSchema)
    .mutation(({ input }) => updateJobListing(input)),
  deleteJobListing: publicProcedure
    .input(z.number())
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
  console.log(`TRPC server listening at port: ${port}`);
}

start();
