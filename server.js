import dotenv from 'dotenv'
dotenv.config()
import { ApolloServerPluginLandingPageLocalDefault } from 'apollo-server-core'
import { ApolloServer } from 'apollo-server-express'
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs'
import express from 'express'
import typeDefs from './typeDefs.js'
import resolvers from './resolvers.js'
import bodyParser from 'body-parser'
import jwt from 'jsonwebtoken'
import morgan from 'morgan'
import IP from 'ip'
import { PrismaClient } from '@prisma/client'
import logger from './utils/logger.js'

const prisma = new PrismaClient()

const port = process.env.PORT || 8080

const cors = {
  origin: '*',
  credentials: true,
}

const context = ({ req }) => {
  const { authorization } = req.headers
  if (authorization) {
    const { userId, role } = jwt.verify(
      authorization,
      process.env.JWT_SECRET_KEY
    )
    if (userId && role) return { userId, role }
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

  // morgan.token('id-role', (req, res) => {
  //   const { authorization } = req.headers
  //   if (authorization) {
  //     const { userId, role } = jwt.verify(
  //       authorization,
  //       process.env.JWT_SECRET_KEY
  //     )
  //     if (userId && role) return `${userId} ${role}`
  //   } else {
  //     return 'Guest'
  //   }
  // })
  // morgan.token('ip-address', (req, res) => {
  //   const ip_address = IP.address()
  //   return ip_address
  // })
  // morgan.token('graphql-query', (req) => {
  //   const { query, variables, operationName } = req.body
  //   return ` ${operationName}`
  // })

  // app.use(morgan(':ip-address :id-role :graphql-query  :status [:date[web]]'))
  app.use(logger)

  server.applyMiddleware({ app })

  await new Promise((r) => app.listen({ port }, r))

  console.log(
    `🚀 Server ready at http://localhost:${port}${server.graphqlPath}`
  )
}

startServer()
