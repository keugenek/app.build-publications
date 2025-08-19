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
  getBarangByIdInputSchema,
  createTransaksiMasukInputSchema,
  createTransaksiKeluarInputSchema,
  getTransaksiByBarangInputSchema
} from './schema';

// Import handlers
import { createBarang } from './handlers/create_barang';
import { getBarang } from './handlers/get_barang';
import { getBarangById } from './handlers/get_barang_by_id';
import { updateBarang } from './handlers/update_barang';
import { deleteBarang } from './handlers/delete_barang';
import { createTransaksiMasuk } from './handlers/create_transaksi_masuk';
import { createTransaksiKeluar } from './handlers/create_transaksi_keluar';
import { getTransaksi } from './handlers/get_transaksi';
import { getTransaksiByBarang } from './handlers/get_transaksi_by_barang';

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

  // Barang (Item) management routes
  createBarang: publicProcedure
    .input(createBarangInputSchema)
    .mutation(({ input }) => createBarang(input)),

  getBarang: publicProcedure
    .query(() => getBarang()),

  getBarangById: publicProcedure
    .input(getBarangByIdInputSchema)
    .query(({ input }) => getBarangById(input)),

  updateBarang: publicProcedure
    .input(updateBarangInputSchema)
    .mutation(({ input }) => updateBarang(input)),

  deleteBarang: publicProcedure
    .input(deleteBarangInputSchema)
    .mutation(({ input }) => deleteBarang(input)),

  // Transaksi (Transaction) management routes
  createTransaksiMasuk: publicProcedure
    .input(createTransaksiMasukInputSchema)
    .mutation(({ input }) => createTransaksiMasuk(input)),

  createTransaksiKeluar: publicProcedure
    .input(createTransaksiKeluarInputSchema)
    .mutation(({ input }) => createTransaksiKeluar(input)),

  getTransaksi: publicProcedure
    .query(() => getTransaksi()),

  getTransaksiByBarang: publicProcedure
    .input(getTransaksiByBarangInputSchema)
    .query(({ input }) => getTransaksiByBarang(input)),
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
  console.log('Available routes:');
  console.log('- healthcheck: GET /healthcheck');
  console.log('- createBarang: POST /createBarang');
  console.log('- getBarang: GET /getBarang');
  console.log('- getBarangById: GET /getBarangById');
  console.log('- updateBarang: POST /updateBarang');
  console.log('- deleteBarang: POST /deleteBarang');
  console.log('- createTransaksiMasuk: POST /createTransaksiMasuk');
  console.log('- createTransaksiKeluar: POST /createTransaksiKeluar');
  console.log('- getTransaksi: GET /getTransaksi');
  console.log('- getTransaksiByBarang: GET /getTransaksiByBarang');
}

start();
