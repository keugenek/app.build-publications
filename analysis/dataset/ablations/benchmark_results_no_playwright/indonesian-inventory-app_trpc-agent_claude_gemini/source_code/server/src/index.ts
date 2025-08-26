import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createBarangInputSchema,
  updateBarangInputSchema,
  createTransaksiInputSchema
} from './schema';

// Import handlers
import { createBarang } from './handlers/create_barang';
import { getBarang, getBarangById } from './handlers/get_barang';
import { updateBarang } from './handlers/update_barang';
import { deleteBarang } from './handlers/delete_barang';
import { createTransaksi } from './handlers/create_transaksi';
import { getTransaksi, getTransaksiByBarangId } from './handlers/get_transaksi';

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

  // Barang (Items) management routes
  createBarang: publicProcedure
    .input(createBarangInputSchema)
    .mutation(({ input }) => createBarang(input)),

  getBarang: publicProcedure
    .query(() => getBarang()),

  getBarangById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getBarangById(input.id)),

  updateBarang: publicProcedure
    .input(updateBarangInputSchema)
    .mutation(({ input }) => updateBarang(input)),

  deleteBarang: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteBarang(input.id)),

  // Transaksi (Transactions) management routes
  createTransaksi: publicProcedure
    .input(createTransaksiInputSchema)
    .mutation(({ input }) => createTransaksi(input)),

  getTransaksi: publicProcedure
    .query(() => getTransaksi()),

  getTransaksiByBarangId: publicProcedure
    .input(z.object({ barangId: z.number() }))
    .query(({ input }) => getTransaksiByBarangId(input.barangId)),
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
