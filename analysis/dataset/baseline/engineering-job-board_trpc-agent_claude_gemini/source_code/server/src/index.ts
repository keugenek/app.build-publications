import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { 
  createJobListingInputSchema, 
  updateJobListingInputSchema,
  searchJobsInputSchema,
  getJobByIdInputSchema,
  deleteJobInputSchema
} from './schema';
import { createJobListing } from './handlers/create_job_listing';
import { getAllJobs } from './handlers/get_all_jobs';
import { searchJobs } from './handlers/search_jobs';
import { getJobById } from './handlers/get_job_by_id';
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

  // Job listing management endpoints
  createJobListing: publicProcedure
    .input(createJobListingInputSchema)
    .mutation(({ input }) => createJobListing(input)),

  getAllJobs: publicProcedure
    .query(() => getAllJobs()),

  searchJobs: publicProcedure
    .input(searchJobsInputSchema)
    .query(({ input }) => searchJobs(input)),

  getJobById: publicProcedure
    .input(getJobByIdInputSchema)
    .query(({ input }) => getJobById(input)),

  updateJobListing: publicProcedure
    .input(updateJobListingInputSchema)
    .mutation(({ input }) => updateJobListing(input)),

  deleteJobListing: publicProcedure
    .input(deleteJobInputSchema)
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
