import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createCategoryInputSchema, 
  updateCategoryInputSchema,
  createTransactionInputSchema,
  updateTransactionInputSchema,
  createBudgetInputSchema,
  updateBudgetInputSchema
} from './schema';

// Import handlers
import { 
  getCategories, 
  getCategoryById, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from './handlers/categories';
import { 
  getTransactions, 
  getTransactionById, 
  createTransaction, 
  updateTransaction, 
  deleteTransaction 
} from './handlers/transactions';
import { 
  getBudgets, 
  getBudgetById, 
  createBudget, 
  updateBudget, 
  deleteBudget 
} from './handlers/budgets';
import { getDashboardData } from './handlers/dashboard';

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
  getCategories: publicProcedure.query(() => getCategories()),
  getCategoryById: publicProcedure.input(z.number()).query(({ input }) => getCategoryById(input)),
  createCategory: publicProcedure.input(createCategoryInputSchema).mutation(({ input }) => createCategory(input)),
  updateCategory: publicProcedure.input(updateCategoryInputSchema).mutation(({ input }) => updateCategory(input)),
  deleteCategory: publicProcedure.input(z.number()).mutation(({ input }) => deleteCategory(input)),
  
  // Transaction routes
  getTransactions: publicProcedure.query(() => getTransactions()),
  getTransactionById: publicProcedure.input(z.number()).query(({ input }) => getTransactionById(input)),
  createTransaction: publicProcedure.input(createTransactionInputSchema).mutation(({ input }) => createTransaction(input)),
  updateTransaction: publicProcedure.input(updateTransactionInputSchema).mutation(({ input }) => updateTransaction(input)),
  deleteTransaction: publicProcedure.input(z.number()).mutation(({ input }) => deleteTransaction(input)),
  
  // Budget routes
  getBudgets: publicProcedure.query(() => getBudgets()),
  getBudgetById: publicProcedure.input(z.number()).query(({ input }) => getBudgetById(input)),
  createBudget: publicProcedure.input(createBudgetInputSchema).mutation(({ input }) => createBudget(input)),
  updateBudget: publicProcedure.input(updateBudgetInputSchema).mutation(({ input }) => updateBudget(input)),
  deleteBudget: publicProcedure.input(z.number()).mutation(({ input }) => deleteBudget(input)),
  
  // Dashboard route
  getDashboardData: publicProcedure.query(() => getDashboardData()),
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
