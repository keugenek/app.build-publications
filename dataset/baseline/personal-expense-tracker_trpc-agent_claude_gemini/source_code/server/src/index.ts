import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createCategoryInputSchema,
  createTransactionInputSchema,
  createBudgetInputSchema,
  transactionFilterSchema,
  dateRangeSchema
} from './schema';

// Import handlers
import { createCategory } from './handlers/create_category';
import { getCategories } from './handlers/get_categories';
import { createTransaction } from './handlers/create_transaction';
import { getTransactions } from './handlers/get_transactions';
import { createBudget } from './handlers/create_budget';
import { getBudgets } from './handlers/get_budgets';
import { getSpendingByCategory } from './handlers/get_spending_by_category';
import { getSpendingTrends } from './handlers/get_spending_trends';
import { getFinancialSummary } from './handlers/get_financial_summary';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Category management
  createCategory: publicProcedure
    .input(createCategoryInputSchema)
    .mutation(({ input }) => createCategory(input)),

  getCategories: publicProcedure
    .query(() => getCategories()),

  // Transaction management
  createTransaction: publicProcedure
    .input(createTransactionInputSchema)
    .mutation(({ input }) => createTransaction(input)),

  getTransactions: publicProcedure
    .input(transactionFilterSchema.optional())
    .query(({ input }) => getTransactions(input)),

  // Budget management
  createBudget: publicProcedure
    .input(createBudgetInputSchema)
    .mutation(({ input }) => createBudget(input)),

  getBudgets: publicProcedure
    .input(z.object({
      month: z.number().int().min(1).max(12).optional(),
      year: z.number().int().min(2000).optional()
    }).optional())
    .query(({ input }) => getBudgets(input?.month, input?.year)),

  // Dashboard and analytics
  getSpendingByCategory: publicProcedure
    .input(dateRangeSchema)
    .query(({ input }) => getSpendingByCategory(input)),

  getSpendingTrends: publicProcedure
    .input(dateRangeSchema)
    .query(({ input }) => getSpendingTrends(input)),

  getFinancialSummary: publicProcedure
    .input(dateRangeSchema)
    .query(({ input }) => getFinancialSummary(input)),
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
