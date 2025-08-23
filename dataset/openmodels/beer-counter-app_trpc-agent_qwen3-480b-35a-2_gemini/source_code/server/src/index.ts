import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { updateCounterInputSchema } from './schema';
import { getCounter } from './handlers/get_counter';
import { updateCounter } from './handlers/update_counter';
import fs from 'fs';
import path from 'path';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  getCounter: publicProcedure.query(() => getCounter()),
  updateCounter: publicProcedure
    .input(updateCounterInputSchema)
    .mutation(({ input }) => updateCounter(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
      // Serve static files
      if (req.method === 'GET' && req.url === '/') {
        fs.readFile(path.join(__dirname, 'public', 'index.html'), (err, data) => {
          if (err) {
            res.writeHead(404);
            res.end('Not found');
            return;
          }
          res.setHeader('Content-Type', 'text/html');
          res.writeHead(200);
          res.end(data);
        });
        return;
      }
      next();
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
