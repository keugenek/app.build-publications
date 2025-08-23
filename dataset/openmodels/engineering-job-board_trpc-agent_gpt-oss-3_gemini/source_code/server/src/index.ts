import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas and handlers
import { createJobInputSchema, getJobsInputSchema } from './schema';
import { createJob } from './handlers/create_job';
import { getJobs } from './handlers/get_jobs';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Create a new job posting
  createJob: publicProcedure
    .input(createJobInputSchema)
    .mutation(({ input }) => createJob(input)),
  // Get list of jobs with optional filters
  getJobs: publicProcedure
    .input(getJobsInputSchema.optional())
    .query(({ input }) => getJobs(input)),
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
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
