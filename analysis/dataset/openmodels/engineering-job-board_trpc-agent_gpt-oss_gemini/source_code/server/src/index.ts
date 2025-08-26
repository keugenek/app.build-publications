import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas for input validation
import { createJobInputSchema, updateJobInputSchema, searchJobsInputSchema } from './schema';

// Import handler implementations
import { createJob } from './handlers/create_job';
import { getJobs } from './handlers/get_jobs';
import { updateJob } from './handlers/update_job';
import { searchJobs } from './handlers/search_jobs';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

// Define the TRPC router with job related procedures
const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  createJob: publicProcedure
    .input(createJobInputSchema)
    .mutation(({ input }) => createJob(input)),
  getJobs: publicProcedure.query(() => getJobs()),
  updateJob: publicProcedure
    .input(updateJobInputSchema)
    .mutation(({ input }) => updateJob(input)),
  searchJobs: publicProcedure
    .input(searchJobsInputSchema)
    .query(({ input }) => searchJobs(input)),
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
