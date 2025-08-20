import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createBarangInputSchema,
  updateBarangInputSchema,
  deleteBarangInputSchema,
  getBarangBySkuInputSchema,
  createTransaksiMasukInputSchema,
  createTransaksiKeluarInputSchema,
  getTransaksiBySkuInputSchema
} from './schema';

// Import handlers
import { createBarang } from './handlers/create_barang';
import { getAllBarang } from './handlers/get_all_barang';
import { getBarangBySku } from './handlers/get_barang_by_sku';
import { updateBarang } from './handlers/update_barang';
import { deleteBarang } from './handlers/delete_barang';
import { createTransaksiMasuk } from './handlers/create_transaksi_masuk';
import { createTransaksiKeluar } from './handlers/create_transaksi_keluar';
import { getAllTransaksi } from './handlers/get_all_transaksi';
import { getTransaksiBySku } from './handlers/get_transaksi_by_sku';

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

  // Barang (Item) management routes
  createBarang: publicProcedure
    .input(createBarangInputSchema)
    .mutation(({ input }) => createBarang(input)),

  getAllBarang: publicProcedure
    .query(() => getAllBarang()),

  getBarangBySku: publicProcedure
    .input(getBarangBySkuInputSchema)
    .query(({ input }) => getBarangBySku(input)),

  updateBarang: publicProcedure
    .input(updateBarangInputSchema)
    .mutation(({ input }) => updateBarang(input)),

  deleteBarang: publicProcedure
    .input(deleteBarangInputSchema)
    .mutation(({ input }) => deleteBarang(input)),

  // Transaction routes
  createTransaksiMasuk: publicProcedure
    .input(createTransaksiMasukInputSchema)
    .mutation(({ input }) => createTransaksiMasuk(input)),

  createTransaksiKeluar: publicProcedure
    .input(createTransaksiKeluarInputSchema)
    .mutation(({ input }) => createTransaksiKeluar(input)),

  getAllTransaksi: publicProcedure
    .query(() => getAllTransaksi()),

  getTransaksiBySku: publicProcedure
    .input(getTransaksiBySkuInputSchema)
    .query(({ input }) => getTransaksiBySku(input)),
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
