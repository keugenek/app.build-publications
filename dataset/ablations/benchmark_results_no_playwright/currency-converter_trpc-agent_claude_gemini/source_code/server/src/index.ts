import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  currencyConversionInputSchema,
  getConversionHistoryInputSchema,
  currencyCodeSchema
} from './schema';

// Import handlers
import { convertCurrency } from './handlers/convert_currency';
import { getConversionHistory } from './handlers/get_conversion_history';
import { getSupportedCurrencies } from './handlers/get_supported_currencies';
import { getExchangeRate } from './handlers/get_exchange_rate';

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
  
  // Convert currency amount from one currency to another
  convertCurrency: publicProcedure
    .input(currencyConversionInputSchema)
    .mutation(({ input }) => convertCurrency(input)),
  
  // Get conversion history with pagination
  getConversionHistory: publicProcedure
    .input(getConversionHistoryInputSchema)
    .query(({ input }) => getConversionHistory(input)),
  
  // Get list of supported currencies
  getSupportedCurrencies: publicProcedure
    .query(() => getSupportedCurrencies()),
  
  // Get current exchange rates for a base currency
  getExchangeRate: publicProcedure
    .input(z.object({
      baseCurrency: currencyCodeSchema,
      targetCurrency: currencyCodeSchema.optional()
    }))
    .query(({ input }) => getExchangeRate(input.baseCurrency, input.targetCurrency))
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
  console.log(`TRPC Currency Conversion server listening at port: ${port}`);
}

start();
