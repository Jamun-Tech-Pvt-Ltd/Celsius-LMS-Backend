import dotenv from 'dotenv'
dotenv.config()
import { ApolloServerPluginLandingPageLocalDefault } from 'apollo-server-core'
import { ApolloServer } from 'apollo-server-express'
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs'
import express from 'express'
import typeDefs from './typeDefs.js'
import resolvers from './resolvers.js'
import jwt from 'jsonwebtoken'
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

  app.use(graphqlUploadExpress())

  server.applyMiddleware({ app })

  await new Promise((r) => app.listen({ port }, r))

  console.log(
    `🚀 Server ready at http://localhost:${port}${server.graphqlPath}`
  )
}

startServer()
