import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

import { convertInputSchema, convertOutputSchema, type ConvertInput, type ConvertOutput, type ConversionLog } from './schema';
import { convert } from './handlers/convert';
import { listConversionLogs } from './handlers/get_conversion_logs';

const appRouter = router({
  convert: publicProcedure
    .input(convertInputSchema)
    .output(convertOutputSchema)
    .mutation(({ input }) => convert(input)),
  getConversionLogs: publicProcedure.query(() => listConversionLogs()),
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
