import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createUserInputSchema, 
  updateUserInputSchema, 
  searchUsersInputSchema,
  sendMessageInputSchema,
  getConversationInputSchema,
  markMessageReadInputSchema,
  getUserConversationsInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { getUser } from './handlers/get_user';
import { updateUser } from './handlers/update_user';
import { searchUsers } from './handlers/search_users';
import { sendMessage } from './handlers/send_message';
import { getConversation } from './handlers/get_conversation';
import { markMessageRead } from './handlers/mark_message_read';
import { getUserConversations } from './handlers/get_user_conversations';

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

  // User management routes
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  getUser: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUser(input.userId)),

  updateUser: publicProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUser(input)),

  searchUsers: publicProcedure
    .input(searchUsersInputSchema)
    .query(({ input }) => searchUsers(input)),

  // Messaging routes
  sendMessage: publicProcedure
    .input(z.object({ 
      senderId: z.number(),
      messageData: sendMessageInputSchema 
    }))
    .mutation(({ input }) => sendMessage(input.senderId, input.messageData)),

  getConversation: publicProcedure
    .input(z.object({
      currentUserId: z.number(),
      conversationData: getConversationInputSchema
    }))
    .query(({ input }) => getConversation(input.currentUserId, input.conversationData)),

  markMessageRead: publicProcedure
    .input(z.object({
      userId: z.number(),
      messageData: markMessageReadInputSchema
    }))
    .mutation(({ input }) => markMessageRead(input.userId, input.messageData)),

  getUserConversations: publicProcedure
    .input(z.object({
      userId: z.number(),
      conversationData: getUserConversationsInputSchema.optional()
    }))
    .query(({ input }) => getUserConversations(input.userId, input.conversationData || { limit: 20 })),
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
  console.log(`Tennis Social Platform TRPC server listening at port: ${port}`);
}

start();
