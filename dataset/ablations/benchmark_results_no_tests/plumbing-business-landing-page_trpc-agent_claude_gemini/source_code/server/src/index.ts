import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas and handlers
import { createContactLeadInputSchema } from './schema';
import { createContactLead } from './handlers/create_contact_lead';
import { getContactLeads } from './handlers/get_contact_leads';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Create contact lead from landing page form submission
  createContactLead: publicProcedure
    .input(createContactLeadInputSchema)
    .mutation(({ input }) => createContactLead(input)),
  
  // Get all contact leads (for future admin features)
  getContactLeads: publicProcedure
    .query(() => getContactLeads()),
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
