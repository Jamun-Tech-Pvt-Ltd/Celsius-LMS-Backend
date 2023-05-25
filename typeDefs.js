import { gql } from 'apollo-server-express'
import { consultancyMutation, consultancyQuery, consultancyQueryTypesAndInputs } from './controller/consultancy/index.js'
import { courseQuery, courseMutation, courseQueryTypesAndInputs } from './controller/course/index.js'
import { developerMutation, developerQuery, developerQueryTypesAndInputs } from "./controller/developer/index.js";
import { trainerMutation, trainerQuery, trainerQueryTypesAndInputs } from './controller/trainer/index.js';
import { adminMutation, adminQuery, adminQueryTypesAndInputs } from './controller/admin/index.js';
import { studentMutation, studentQuery, studentQueryTypesAndInputs } from './controller/student/index.js';
import { commonMutation, commonQuery, commonQueryTypesAndInputs } from './controller/common/index.js';
import { jamuntekMutation, jamuntekQuery, jamuntekQueryTypesAndInputs } from './controller/jamuntek/index.js';


const typeDefs = gql`
   scalar Date 
   scalar Upload 

   ${adminQueryTypesAndInputs}
   ${consultancyQueryTypesAndInputs}
   ${courseQueryTypesAndInputs}
   ${developerQueryTypesAndInputs}
   ${trainerQueryTypesAndInputs}
   ${studentQueryTypesAndInputs}
   ${commonQueryTypesAndInputs}
   ${jamuntekQueryTypesAndInputs}


   type Query {
      ${adminQuery}
      ${consultancyQuery}
      ${developerQuery}
      ${courseQuery}
      ${trainerQuery}
      ${studentQuery}
      ${commonQuery}
      ${jamuntekQuery}
   }

   type Mutation {
      ${adminMutation}
      ${consultancyMutation}
      ${developerMutation}
      ${courseMutation}
      ${trainerMutation}
      ${studentMutation}
      ${commonMutation}
      ${jamuntekMutation}
   }
`

export default typeDefs
