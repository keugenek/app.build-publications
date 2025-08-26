import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { createJobInputSchema, jobFilterSchema, updateJobInputSchema } from './schema';
import { createJob } from './handlers/create_job';
import { getJobs } from './handlers/get_jobs';
import { getJobById } from './handlers/get_job_by_id';
import { updateJob } from './handlers/update_job';
import { deleteJob } from './handlers/delete_job';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  createJob: publicProcedure
    .input(createJobInputSchema)
    .mutation(({ input }) => createJob(input)),
  getJobs: publicProcedure
    .input(jobFilterSchema)
    .query(({ input }) => getJobs(input)),
  getJobById: publicProcedure
    .input((val) => {
      if (typeof val === 'number') return { id: val };
      throw new Error('ID must be a number');
    })
    .query(({ input }) => getJobById(input.id)),
  updateJob: publicProcedure
    .input(updateJobInputSchema)
    .mutation(({ input }) => updateJob(input)),
  deleteJob: publicProcedure
    .input((val) => {
      if (typeof val === 'number') return val;
      throw new Error('ID must be a number');
    })
    .mutation(({ input }) => deleteJob(input)),
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