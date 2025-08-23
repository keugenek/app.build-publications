import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas and handlers
import { createLogInputSchema, updateLogInputSchema } from './schema';
import { createLog } from './handlers/create_log';
import { getLogs } from './handlers/get_logs';
import { updateLog } from './handlers/update_log';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  createLog: publicProcedure
    .input(createLogInputSchema)
    .mutation(({ input }) => createLog(input)),
  getLogs: publicProcedure.query(() => getLogs()),
  updateLog: publicProcedure
    .input(updateLogInputSchema)
    .mutation(({ input }) => updateLog(input)),
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
