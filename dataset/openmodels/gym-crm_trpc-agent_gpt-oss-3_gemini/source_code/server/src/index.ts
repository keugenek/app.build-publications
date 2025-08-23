import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import {
  createClassInputSchema,
  updateClassInputSchema,
  createMemberInputSchema,
  updateMemberInputSchema,
  createReservationInputSchema,
  cancelReservationInputSchema,
} from './schema';
import {
  createClass,
  getClasses,
  updateClass,
  deleteClass,
  createMember,
  getMembers,
  updateMember,
  deleteMember,
  createReservation,
  getReservations,
  cancelReservation,
} from './handlers';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Healthcheck already exists
  // Class procedures
  createClass: publicProcedure
    .input(createClassInputSchema)
    .mutation(({ input }) => createClass(input)),
  getClasses: publicProcedure.query(() => getClasses()),
  updateClass: publicProcedure
    .input(updateClassInputSchema)
    .mutation(({ input }) => updateClass(input)),
  deleteClass: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteClass(input.id)),
  // Member procedures
  createMember: publicProcedure
    .input(createMemberInputSchema)
    .mutation(({ input }) => createMember(input)),
  getMembers: publicProcedure.query(() => getMembers()),
  updateMember: publicProcedure
    .input(updateMemberInputSchema)
    .mutation(({ input }) => updateMember(input)),
  deleteMember: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteMember(input.id)),
  // Reservation procedures
  createReservation: publicProcedure
    .input(createReservationInputSchema)
    .mutation(({ input }) => createReservation(input)),
  getReservations: publicProcedure.query(() => getReservations()),
  cancelReservation: publicProcedure
    .input(cancelReservationInputSchema)
    .mutation(({ input }) => cancelReservation(input)),

  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
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
