import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs'
import { consultancyResolvers, consultancyResolversQuery } from './controller/consultancy/index.js'
import { developerMutationResolver, developerQueryResolvers } from './controller/developer/index.js';
import { courseQueryResolver, courseMutationResolver } from './controller/course/index.js'
import { trainerResolvers, trainerResolversQuery } from './controller/trainer/index.js'
import { studentResolvers, studentResolversQuery } from './controller/student/index.js'
import { commonResolvers, commonResolversQuery } from './controller/common/index.js'
import { adminResolvers, adminResolversQuery } from './controller/admin/index.js'
import { jamuntekQuery, jamuntekResolvers } from './controller/jamuntek/index.js'
import { employerMutationResolver, employerQueryResolver } from './controller/employer/index.js';


const resolvers = {
  Upload: GraphQLUpload,

  Query: {
    ...commonResolversQuery,
    ...consultancyResolversQuery,
    ...developerQueryResolvers,
    ...courseQueryResolver,
    ...trainerResolversQuery,
    ...studentResolversQuery,
    ...adminResolversQuery,
    ...employerQueryResolver,
    // ...jamuntekQuery,
  },

  Mutation: {
    ...commonResolvers,
    ...consultancyResolvers,
    ...courseMutationResolver,
    ...developerMutationResolver,
    ...trainerResolvers,
    ...adminResolvers,
    ...studentResolvers,
    ...jamuntekResolvers,
    ...employerMutationResolver
  },
}


export default resolvers
