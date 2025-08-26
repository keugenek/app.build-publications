import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schema types and handlers
import { conversionRequestSchema } from './schema';
import { getCurrencies } from './handlers/get_currencies';
import { convertCurrency } from './handlers/convert_currency';
import { getConversionHistory } from './handlers/get_conversion_history';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Get list of available currencies from Frankfurter API
  getCurrencies: publicProcedure
    .query(() => getCurrencies()),
  
  // Convert currency amount from one currency to another
  convertCurrency: publicProcedure
    .input(conversionRequestSchema)
    .mutation(({ input }) => convertCurrency(input)),
  
  // Get conversion history for the user
  getConversionHistory: publicProcedure
    .query(() => getConversionHistory()),
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
