import { gql } from 'apollo-server-express'
import { companyMutation, companyQuery, companyQueryTypesAndInputs } from './controller/company/index.js'
import { trainerMutation, trainerQuery, trainerQueryTypesAndInputs } from './controller/trainer/index.js';
import { adminMutation, adminQuery, adminQueryTypesAndInputs } from './controller/admin/index.js';
import { studentMutation, studentQuery, studentQueryTypesAndInputs } from './controller/student/index.js';
import { commonMutation, commonQuery, commonQueryTypesAndInputs } from './controller/common/index.js';
import { jamuntekMutation, jamuntekQuery, jamuntekQueryTypesAndInputs } from './controller/jamuntek/index.js';


const typeDefs = gql`
   scalar Date 
   scalar Upload 

   ${adminQueryTypesAndInputs}
   ${companyQueryTypesAndInputs}
   ${trainerQueryTypesAndInputs}
   ${studentQueryTypesAndInputs}
   ${commonQueryTypesAndInputs}
   ${jamuntekQueryTypesAndInputs}


   type Query {
      ${adminQuery}
      ${companyQuery}
      ${trainerQuery}
      ${studentQuery}
      ${commonQuery}
      ${jamuntekQuery}
   }

   type Mutation {
      ${adminMutation}
      ${companyMutation}
      ${trainerMutation}
      ${studentMutation}
      ${commonMutation}
      ${jamuntekMutation}
   }
`

export default typeDefs
