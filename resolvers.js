import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs'
import { companyResolvers, companyResolversQuery } from './controller/company/index.js'
import { trainerResolvers, trainerResolversQuery } from './controller/trainer/index.js'
import { studentResolvers, studentResolversQuery, subscription } from './controller/student/index.js'
import { commonResolvers, commonResolversQuery } from './controller/common/index.js'
import { adminResolvers, adminResolversQuery } from './controller/admin/index.js'
import { jamuntekResolvers, jamuntekResolversQuery } from './controller/jamuntek/index.js'

const resolvers = {
  Upload: GraphQLUpload,

  Query: {
    ...commonResolversQuery,
    ...companyResolversQuery,
    ...trainerResolversQuery,
    ...studentResolversQuery,
    ...adminResolversQuery,
    ...jamuntekResolversQuery
  },

  Mutation: {
    ...commonResolvers,
    ...companyResolvers,
    ...trainerResolvers,
    ...adminResolvers,
    ...studentResolvers,
    ...jamuntekResolvers,
  },
  ...subscription,
}


export default resolvers
