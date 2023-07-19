import dotenv from 'dotenv'
dotenv.config()
import { ApolloServerPluginLandingPageLocalDefault } from 'apollo-server-core'
import { AuthenticationError } from 'apollo-server-express'
import { ApolloServer } from 'apollo-server-express'
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs'
import express from 'express'
import typeDefs from './typeDefs.js'
import resolvers from './resolvers.js'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import logger from './utils/logger.js'
new PrismaClient()

const port = process.env.PORT || 8080

const cors = {
  origin: '*',
  credentials: true,
}

const context = ({ req }) => {
  const { authorization } = req.headers
  if (authorization) {
    try {
      const { userId, role, exp } = jwt.verify(
        authorization,
        process.env.JWT_SECRET_KEY
      )
      if (userId && role) return { userId, role }
    } catch (error) {
      throw new AuthenticationError('Token Expired !')
    }
    return null
  } else {
    return null
  }
}

async function startServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    cors,
    context,
    csrfPrevention: false,
    cache: 'bounded',
    plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
  })

  await server.start()

  const app = express()
  app.use(express.json())
  app.use(graphqlUploadExpress())

  app.use(logger)

  server.applyMiddleware({ app })

  await new Promise((r) => app.listen({ port }, r))

  console.log(
    `🚀 Server ready at http://localhost:${port}${server.graphqlPath}`
  )
}

startServer()
