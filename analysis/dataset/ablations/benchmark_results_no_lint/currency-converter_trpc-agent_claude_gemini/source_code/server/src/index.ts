import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  currencyConversionRequestSchema, 
  currencyCodeSchema,
  createExchangeRateInputSchema
} from './schema';
import { z } from 'zod';

// Import handlers
import { convertCurrency } from './handlers/convert_currency';
import { getCurrencies } from './handlers/get_currencies';
import { getExchangeRates } from './handlers/get_exchange_rates';
import { storeExchangeRate } from './handlers/store_exchange_rate';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Convert currency using live exchange rates
  convertCurrency: publicProcedure
    .input(currencyConversionRequestSchema)
    .mutation(({ input }) => convertCurrency(input)),

  // Get list of supported currencies with their information
  getCurrencies: publicProcedure
    .query(() => getCurrencies()),

  // Get historical exchange rates (optionally filtered by currency)
  getExchangeRates: publicProcedure
    .input(
      z.object({
        fromCurrency: currencyCodeSchema.optional(),
        toCurrency: currencyCodeSchema.optional()
      }).optional()
    )
    .query(({ input }) => 
      getExchangeRates(input?.fromCurrency, input?.toCurrency)
    ),

  // Store exchange rate for historical tracking
  storeExchangeRate: publicProcedure
    .input(createExchangeRateInputSchema)
    .mutation(({ input }) => storeExchangeRate(input))
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
  console.log(`Currency Conversion TRPC server listening at port: ${port}`);
}

start();
