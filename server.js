import dotenv from 'dotenv';
dotenv.config();
import { ApolloServerPluginLandingPageLocalDefault } from 'apollo-server-core';
import { AuthenticationError } from 'apollo-server-express';
import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import { createServer } from 'http';
import { execute, subscribe } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import logger from './utils/logger.js';
import { SubscriptionServer } from 'subscriptions-transport-ws'; // Import the SubscriptionServer class
import typeDefs from './typeDefs.js'
import resolvers from './resolvers.js'
import { ROLES } from './utils/helper.js';
import { updateStdActiveDate } from './controller/student/index.js';
import { updateTrainerActiveDate } from './controller/trainer/index.js';

new PrismaClient();

const port = process.env.PORT || 8080;

const cors = {
  origin: '*',
  credentials: true,
};

const context = ({ req }) => {
  const { authorization } = req.headers;
  if (authorization) {
    try {
      const { userId, role, platform, c_username, c_package_type } = jwt.verify(
        authorization,
        process.env.JWT_SECRET_KEY
      );
      if (role === ROLES[0]) {
        updateStdActiveDate(userId)
      }
      if (role === ROLES[1]) {
        updateTrainerActiveDate(userId)
      }
      if (userId && role && platform) return { userId, role, platform, c_username, c_package_type };
    } catch (error) {
      throw new AuthenticationError('Token Expired !');
    }
    return null;
  } else {
    return null;
  }
};

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(graphqlUploadExpress());

  app.use(logger);

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  const httpServer = createServer(app);

  const server = new ApolloServer({
    schema,
    context,
    cors,
    csrfPrevention: false,
    cache: 'bounded',
    plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
  });

  await server.start();

  server.applyMiddleware({ app });

  // Create a SubscriptionServer for WebSocket support
  SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe,
    },
    {
      server: httpServer,
      path: '/graphql',
    }
  );

  httpServer.listen(port, () => {
    console.log(`🚀 Server ready at http://localhost:${port}${server.graphqlPath}`);
    console.log(`🚀 Subscriptions ready at ws://localhost:${port}${server.graphqlPath}`);
  });
}

startServer();

