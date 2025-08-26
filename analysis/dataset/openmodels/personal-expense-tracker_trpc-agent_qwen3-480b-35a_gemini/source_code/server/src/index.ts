import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createTransactionInputSchema, 
  updateTransactionInputSchema,
  createBudgetInputSchema,
  updateBudgetInputSchema
} from './schema';

// Import transaction handlers
import { createTransaction } from './handlers/create_transaction';
import { getTransactions } from './handlers/get_transactions';
import { updateTransaction } from './handlers/update_transaction';
import { deleteTransaction } from './handlers/delete_transaction';

// Import budget handlers
import { createBudget } from './handlers/create_budget';
import { getBudgets } from './handlers/get_budgets';
import { updateBudget } from './handlers/update_budget';
import { deleteBudget } from './handlers/delete_budget';

// Import dashboard handler
import { getDashboardData } from './handlers/get_dashboard_data';

// Import summary handler
import { getSpendingSummary } from './handlers/get_spending_summary';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Transaction routes
  createTransaction: publicProcedure
    .input(createTransactionInputSchema)
    .mutation(({ input }) => createTransaction(input)),
  getTransactions: publicProcedure
    .query(() => getTransactions()),
  updateTransaction: publicProcedure
    .input(updateTransactionInputSchema)
    .mutation(({ input }) => updateTransaction(input)),
  deleteTransaction: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteTransaction(input)),
    
  // Budget routes
  createBudget: publicProcedure
    .input(createBudgetInputSchema)
    .mutation(({ input }) => createBudget(input)),
  getBudgets: publicProcedure
    .query(() => getBudgets()),
  updateBudget: publicProcedure
    .input(updateBudgetInputSchema)
    .mutation(({ input }) => updateBudget(input)),
  deleteBudget: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteBudget(input)),
  
  // Dashboard route
  getDashboardData: publicProcedure
    .query(() => getDashboardData()),
  
  // Spending summary route
  getSpendingSummary: publicProcedure
    .input(z.object({ 
      month: z.number().optional(), 
      year: z.number().optional() 
    }).optional())
    .query(({ input }) => getSpendingSummary(input?.month, input?.year)),
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
