import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createBarangInputSchema, 
  updateBarangInputSchema,
  getBarangByIdInputSchema,
  deleteBarangInputSchema,
  createTransaksiInputSchema,
  getTransaksiByBarangIdInputSchema
} from './schema';

// Import handlers
import { createBarang } from './handlers/create_barang';
import { getAllBarang } from './handlers/get_all_barang';
import { getBarangById } from './handlers/get_barang_by_id';
import { updateBarang } from './handlers/update_barang';
import { deleteBarang } from './handlers/delete_barang';
import { createTransaksi } from './handlers/create_transaksi';
import { getAllTransaksi } from './handlers/get_all_transaksi';
import { getTransaksiByBarangId } from './handlers/get_transaksi_by_barang_id';

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

  // Barang (Inventory Items) endpoints
  createBarang: publicProcedure
    .input(createBarangInputSchema)
    .mutation(({ input }) => createBarang(input)),

  getAllBarang: publicProcedure
    .query(() => getAllBarang()),

  getBarangById: publicProcedure
    .input(getBarangByIdInputSchema)
    .query(({ input }) => getBarangById(input)),

  updateBarang: publicProcedure
    .input(updateBarangInputSchema)
    .mutation(({ input }) => updateBarang(input)),

  deleteBarang: publicProcedure
    .input(deleteBarangInputSchema)
    .mutation(({ input }) => deleteBarang(input)),

  // Transaksi (Transactions) endpoints
  createTransaksi: publicProcedure
    .input(createTransaksiInputSchema)
    .mutation(({ input }) => createTransaksi(input)),

  getAllTransaksi: publicProcedure
    .query(() => getAllTransaksi()),

  getTransaksiByBarangId: publicProcedure
    .input(getTransaksiByBarangIdInputSchema)
    .query(({ input }) => getTransaksiByBarangId(input)),
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
