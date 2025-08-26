import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  currencyConversionRequestSchema,
  createExchangeRateInputSchema 
} from './schema';

// Import handlers
import { convertCurrency } from './handlers/convert_currency';
import { getSupportedCurrencies } from './handlers/get_supported_currencies';
import { getExchangeRates } from './handlers/get_exchange_rates';
import { createExchangeRate } from './handlers/create_exchange_rate';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Convert currency using Frankfurter API
  convertCurrency: publicProcedure
    .input(currencyConversionRequestSchema)
    .mutation(({ input }) => convertCurrency(input)),
    
  // Get list of supported currencies
  getSupportedCurrencies: publicProcedure
    .query(() => getSupportedCurrencies()),
    
  // Get all cached exchange rates (for debugging/admin purposes)
  getExchangeRates: publicProcedure
    .query(() => getExchangeRates()),
    
  // Create exchange rate (internal use for caching)
  createExchangeRate: publicProcedure
    .input(createExchangeRateInputSchema)
    .mutation(({ input }) => createExchangeRate(input)),
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
  console.log(`Currency conversion TRPC server listening at port: ${port}`);
}

start();
