import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createHardwareAssetInputSchema,
  createSoftwareAssetInputSchema,
  createIPAddressInputSchema,
  updateHardwareAssetInputSchema,
  updateSoftwareAssetInputSchema,
  updateIPAddressInputSchema
} from './schema';

// Import handlers
import { 
  createHardwareAsset,
  getHardwareAssets,
  getHardwareAssetById,
  updateHardwareAsset,
  deleteHardwareAsset
} from './handlers/hardware_assets';

import { 
  createSoftwareAsset,
  getSoftwareAssets,
  getSoftwareAssetById,
  updateSoftwareAsset,
  deleteSoftwareAsset
} from './handlers/software_assets';

import { 
  createIPAddress,
  getIPAddresses,
  getIPAddressById,
  updateIPAddress,
  deleteIPAddress
} from './handlers/ip_addresses';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Hardware Assets Routes
  createHardwareAsset: publicProcedure
    .input(createHardwareAssetInputSchema)
    .mutation(({ input }) => createHardwareAsset(input)),
    
  getHardwareAssets: publicProcedure
    .query(() => getHardwareAssets()),
    
  getHardwareAssetById: publicProcedure
    .input(z.number())
    .query(({ input }) => getHardwareAssetById(input)),
    
  updateHardwareAsset: publicProcedure
    .input(updateHardwareAssetInputSchema)
    .mutation(({ input }) => updateHardwareAsset(input)),
    
  deleteHardwareAsset: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteHardwareAsset(input)),
  
  // Software Assets Routes
  createSoftwareAsset: publicProcedure
    .input(createSoftwareAssetInputSchema)
    .mutation(({ input }) => createSoftwareAsset(input)),
    
  getSoftwareAssets: publicProcedure
    .query(() => getSoftwareAssets()),
    
  getSoftwareAssetById: publicProcedure
    .input(z.number())
    .query(({ input }) => getSoftwareAssetById(input)),
    
  updateSoftwareAsset: publicProcedure
    .input(updateSoftwareAssetInputSchema)
    .mutation(({ input }) => updateSoftwareAsset(input)),
    
  deleteSoftwareAsset: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteSoftwareAsset(input)),
  
  // IP Address Routes
  createIPAddress: publicProcedure
    .input(createIPAddressInputSchema)
    .mutation(({ input }) => createIPAddress(input)),
    
  getIPAddresses: publicProcedure
    .query(() => getIPAddresses()),
    
  getIPAddressById: publicProcedure
    .input(z.number())
    .query(({ input }) => getIPAddressById(input)),
    
  updateIPAddress: publicProcedure
    .input(updateIPAddressInputSchema)
    .mutation(({ input }) => updateIPAddress(input)),
    
  deleteIPAddress: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteIPAddress(input)),
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
