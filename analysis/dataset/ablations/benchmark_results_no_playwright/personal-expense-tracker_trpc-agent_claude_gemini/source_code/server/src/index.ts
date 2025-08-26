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
  updateTransactionInputSchema,
  createBudgetInputSchema,
  updateBudgetInputSchema,
  transactionFiltersSchema,
  dashboardFiltersSchema
} from './schema';

// Import handlers
import { createCategory } from './handlers/create_category';
import { getCategories } from './handlers/get_categories';
import { createTransaction } from './handlers/create_transaction';
import { getTransactions } from './handlers/get_transactions';
import { updateTransaction } from './handlers/update_transaction';
import { deleteTransaction } from './handlers/delete_transaction';
import { createBudget } from './handlers/create_budget';
import { getBudgets } from './handlers/get_budgets';
import { updateBudget } from './handlers/update_budget';
import { deleteBudget } from './handlers/delete_budget';
import { getDashboardData } from './handlers/get_dashboard_data';
import { seedPredefinedCategories } from './handlers/seed_predefined_categories';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Category routes
  createCategory: publicProcedure
    .input(createCategoryInputSchema)
    .mutation(({ input }) => createCategory(input)),

  getCategories: publicProcedure
    .query(() => getCategories()),

  seedPredefinedCategories: publicProcedure
    .mutation(() => seedPredefinedCategories()),

  // Transaction routes
  createTransaction: publicProcedure
    .input(createTransactionInputSchema)
    .mutation(({ input }) => createTransaction(input)),

  getTransactions: publicProcedure
    .input(transactionFiltersSchema.optional())
    .query(({ input }) => getTransactions(input)),

  updateTransaction: publicProcedure
    .input(updateTransactionInputSchema)
    .mutation(({ input }) => updateTransaction(input)),

  deleteTransaction: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteTransaction(input.id)),

  // Budget routes
  createBudget: publicProcedure
    .input(createBudgetInputSchema)
    .mutation(({ input }) => createBudget(input)),

  getBudgets: publicProcedure
    .input(z.object({
      month: z.number().int().min(1).max(12).optional(),
      year: z.number().int().min(2000).optional()
    }).optional())
    .query(({ input }) => getBudgets(input?.month, input?.year)),

  updateBudget: publicProcedure
    .input(updateBudgetInputSchema)
    .mutation(({ input }) => updateBudget(input)),

  deleteBudget: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteBudget(input.id)),

  // Dashboard routes
  getDashboardData: publicProcedure
    .input(dashboardFiltersSchema.optional())
    .query(({ input }) => getDashboardData(input)),
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
