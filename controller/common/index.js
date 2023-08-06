import {
  ApolloError,
  AuthenticationError,
  ForbiddenError,
} from 'apollo-server-express'
import prisma from '../../database.js'
import { ROLES } from '../../utils/helper.js'
import { deleteImgToAWS, uploadImgToAWS } from '../../utils/imageHandler.js'

const commonQueryTypesAndInputs = `

input createCourseInput {
    crs_name: String!
    crs_desc: String
    crs_duration: Int
    crs_rate: Int
    crs_cat: String
    crs_con: String
    crs_ins: String
    crs_code:String
    crs_type: String!
    crs_nxt_st_date: Date
    crs_image: Upload
 }

 input updateCourseInput {
    crs_id: Int!
    crs_name: String
    crs_desc: String
    crs_duration: Int
    crs_rate: Int
    crs_cat: String
    crs_con: String
    crs_ins: String
    crs_code:String
    crs_type: String
    crs_image: Upload
    crs_nxt_st_date: Date
 }

 input deleteCourseInput {
    crs_id: Int!
 }

    type Token {
        token : String!
    }

    type Course {
        crs_id: ID!
        crs_name: String!
        crs_desc: String
        crs_cat: String
        crs_con: String
        crs_cat_id: String
        crs_con_id: String
        crs_duration: String
        crs_rate: String
        crs_ins: String
        crs_code:String
        crs_type: String!
        crs_nxt_st_date:Date
        crs_image:String
        crs_code: String
    }

    type PublicCourse {
        crs_id: ID!
        crsmain_id:ID!
        crsmain_title: String!
        crsmain_type: String!
        crs_nxt_st_date : Date
     }

    type ConsultancyInfo {
      serial: Int!
      oname:String!
    } 
  
     type PublicCourseType {
        crsmain_type: String!
        courses:[PublicCourse]
     }

     type ContactInfoType{
      serial:Int!
      email_address:String!
      contact_number:String!
     }
  
     type Question {
        ques_id: ID!
        question: String!
        mod_id: Int!
        ans1: String!
        ans2: String!
        ans3: String!
        ans4: String!
     }

`

const commonQuery = `
    getAllCourseList:[Course!]!
    getCourseById(crs_id:Int!):Course!
    getAllConsultancyInfo:[ConsultancyInfo]
    getContactInfo:[ContactInfoType!]
`

const commonMutation = `
    createCourse(data:createCourseInput!):Course
    updateCourse(data:updateCourseInput!):String!
    deleteCourse(data:deleteCourseInput):String
    
`

const commonResolvers = {
  createCourse: async (_, { data }, { userId, role }) => {
    const access = ['admin', ROLES[2]]
    if (!userId) throw new ForbiddenError('invalid token')
    if (role === access[0]) {
      const admin = await prisma.jmkuserinfo.findFirst({
        where: { usr_id: userId, usr_role: role },
      })
      if (!admin) throw new AuthenticationError('invalid admin')
      let file
      if (data.crs_image) {
        file = await uploadImgToAWS(data.crs_image, 'courses/')
        if (!file.data) throw new ApolloError('Someting went wrong !')
      }
      const newCourse = await prisma.jmkcrsinfo.create({
        data: {
          ...data,
          crs_image: file?.data?.Location ?? null,
          crs_image_key: file?.data?.key ?? '',
        },
      })
      if (!newCourse) throw new ApolloError('something went wrong !')
      return newCourse
    }
    if (role === access[1]) {
      const consultancy = await prisma.jmkconsulinfo.findFirst({
        where: { serial: userId },
      })
      if (!consultancy) throw new AuthenticationError('invalid consultancy')
      let file
      if (data.crs_image) {
        file = await uploadImgToAWS(data.crs_image, 'courses/')
        if (!file.data) throw new ApolloError('Someting went wrong !')
      }
      const newCourse = await prisma.jmkcrsinfo.create({
        data: {
          ...data,
          crs_image: file?.data?.Location ?? null,
          crs_image_key: file?.data?.key ?? '',
          cid: userId,
        },
      })
      if (!newCourse) throw new ApolloError('something went wrong !')
      return newCourse
    }
    throw new AuthenticationError('invalid access')
  },

  updateCourse: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (role === 'admin') {
      const admin = await prisma.jmkuserinfo.findFirst({
        where: { usr_id: userId, usr_role: role },
      })
      if (!admin) throw new AuthenticationError('invalid admin')
      const crs = await prisma.jmkcrsinfo.findFirst({
        where: { crs_id: data.crs_id },
      })
      if (!crs) throw new ApolloError('invalid course')
      await deleteImgToAWS(crs.crs_image_key)
      let file
      if (data.crs_image) {
        file = await uploadImgToAWS(data.crs_image, 'courses/')
        if (!file.data) throw new ApolloError('Someting went wrong !')
      }
      const course = await prisma.jmkcrsinfo.update({
        data: {
          ...data,
          crs_image: file?.data?.Location ?? null,
          crs_image_key: file?.data?.key ?? '',
        },
        where: {
          crs_id: parseInt(data.crs_id),
        },
      })
      if (!course) throw new ApolloError('something went wrong !')
      return 'success'
    }
    if (role === ROLES[2]) {
      const consultancy = await prisma.jmkconsulinfo.findFirst({
        where: { serial: userId },
      })
      if (!consultancy) throw new AuthenticationError('invalid consultancy')
      const crs = await prisma.jmkcrsinfo.findFirst({
        where: { crs_id: data.crs_id, cid: userId },
      })
      if (!crs) throw new ApolloError('invalid course')
      await deleteImgToAWS(crs.crs_image_key)
      let file
      if (data.crs_image) {
        file = await uploadImgToAWS(data.crs_image, 'courses/')
        if (!file.data) throw new ApolloError('Someting went wrong !')
      }
      const course = await prisma.jmkcrsinfo.update({
        data: {
          ...data,
          crs_image: file?.data?.Location ?? null,
          crs_image_key: file?.data?.key ?? '',
          cid: userId,
        },
        where: {
          crs_id: parseInt(data.crs_id),
        },
      })
      if (!course) throw new ApolloError('something went wrong !')
      return 'success'
    }
    throw new AuthenticationError('invalid access')
  },

  deleteCourse: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (role === 'admin') {
      const admin = await prisma.jmkuserinfo.findFirst({
        where: { usr_id: userId, usr_role: role },
      })
      if (!admin) throw new AuthenticationError('invalid admin')
      const crs = await prisma.jmkcrsinfo.findFirst({
        where: { crs_id: data.crs_id },
      })
      await deleteImgToAWS(crs.crs_image_key)
      const course = await prisma.jmkcrsinfo.delete({
        where: { crs_id: data.crs_id },
      })
      if (!course) throw new ApolloError('something went wrong !')
      return 'success'
    }
    if (role === ROLES[2]) {
      const consultancy = await prisma.jmkconsulinfo.findFirst({
        where: { serial: userId },
      })
      if (!consultancy) throw new AuthenticationError('invalid consultancy')
      const crs = await prisma.jmkcrsinfo.findFirst({
        where: { crs_id: data.crs_id, cid: userId },
      })
      await deleteImgToAWS(crs.crs_image_key)
      const course = await prisma.jmkcrsinfo.delete({
        where: { crs_id: crs.crs_id },
      })
      if (!course) throw new ApolloError('something went wrong !')
      return 'success'
    }
    throw new AuthenticationError('invalid access')
  },
}

const commonResolversQuery = {
  getContactInfo: async () => {
    const info = await prisma.contactinfo.findMany({})
    return info
  },
  getAllCourseList: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (role === 'admin') {
      const admin = await prisma.jmkuserinfo.findFirst({
        where: { usr_id: userId, usr_role: role },
      })
      if (!admin) throw new AuthenticationError('invalid admin credentials')
      if (admin.usr_role === 'admin') {
        const courses = await prisma.jmkcrsinfo.findMany({
          where: {
            cid: null,
          },
        })
        if (!courses) throw new ApolloError('Courses not found !!')
        return courses
      }
    }
    if (role === ROLES[2]) {
      const consultancy = await prisma.jmkconsulinfo.findFirst({
        where: { serial: userId },
      })
      if (!consultancy)
        throw new AuthenticationError('invalid admin credentials')
      const courses = await prisma.jmkcrsinfo.findMany({
        where: { cid: userId },
      })
      if (!courses) throw new ApolloError('Courses not found !!')
      return courses
    }
    throw new AuthenticationError('invalid access !!')
  },

  getCourseById: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (!args.crs_id) throw new ForbiddenError('crs_id is required !')
    const course = await prisma.jmkcrsinfo.findFirst({
      where: { crs_id: args.crs_id },
    })
    if (!course) throw new ApolloError('Data Not Found')
    return course
  },
  getAllConsultancyInfo: async (_args, { userId, role }) => {
    const consultancyInfo = await prisma.jmkconsulinfo.findMany({
      select: {
        serial: true,
        oname: true,
      },
    })
    if (!consultancyInfo) throw new ApolloError('No data Found')
    return consultancyInfo
  },
}

export {
  commonQueryTypesAndInputs,
  commonQuery,
  commonMutation,
  commonResolvers,
  commonResolversQuery,
}
