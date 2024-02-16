import {
  ApolloError,
  AuthenticationError,
  ForbiddenError,
} from 'apollo-server-express'
import prisma from '../../database.js'
import { ROLES } from '../../utils/helper.js'

const commonQueryTypesAndInputs = `

input createUpdateCourseVideoInput {
    vid_id: Int
    vid_name: String!
    vid_loc: Upload
    crs_id: Int!
    vid_date: String!
    vid_summary:String!
    vid_link:String
    content:String
}

input createCourseInput {
    crs_name: String!
    crs_desc: String!
    crs_duration: Float!
    crs_rate: Int!
    crs_ins: String!
    crs_type: String!
    crs_nxt_st_date: Date!
    crs_image: String!
    lavel: String!
    time: String!
 }

 input updateCourseInput {
  crs_id: Int!
  crs_name: String!
  crs_desc: String!
  crs_duration: Float!
  crs_rate: Int!
  crs_ins: String!
  crs_type: String!
  crs_nxt_st_date: Date!
  crs_image: String!
  lavel: String!
  time: String!
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
        crs_desc: String!
        crs_duration: String!
        crs_rate: String!
        crs_ins: String!
        crs_type: String!
        crs_nxt_st_date:Date!
        crs_image:String
        time:String
        lavel:String
        isDeleted:Boolean!
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
      phone:String!
      phone1:String!
      email:String!
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
     type JmkALlBlog{
      blog_type:String
      blog_slug:String
      blog_heading:String
      blog_image_key:String
      author:String
      blog_id:Int
      blog_short_description:String
  }

  type JmkBlog{
      blog_type:String
      blog_heading:String
      blog_image_key:String
      author:String
      blog_id:Int
      blog_short_description:String
      blog_description:String
      blog_image:String
      blog_meta_description:String
      blog_meta_keyword:String
      created_at:Date
  }

  type Faq {
    faq_id: Int!
    question: String!
    answer: String!
    type: String!
    created_at: Date!
  }

  type webModal {
    status: Boolean!
    img: String!
  }

`

const commonQuery = `
    getAllCourseList:[Course!]!
    getCourseById(crs_id:Int!):Course!
    getAllConsultancyInfo:[ConsultancyInfo]
    getContactInfo:ContactInfoType!
    getPopupModal: webModal
    getAllActiveBlogs:[JmkALlBlog]
    getBlogBySlug(blog_slug:String!):JmkBlog!
    getFaqByType(type:String):[Faq!]!
    getFaqById(faq_id:Int!):Faq!
`

const commonMutation = `
    createCourse(data:createCourseInput!):String!
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
      const newCourse = await prisma.jmkcrsinfo.create({ data })
      if (!newCourse) throw new ApolloError('something went wrong !')
      return 'Success'
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
      const course = await prisma.jmkcrsinfo.update({
        data: { ...data },
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
      const course = await prisma.jmkcrsinfo.update({
        where: { crs_id: data.crs_id },
        data: { isDeleted: true }
      })
      if (!course) throw new ApolloError('something went wrong !')
      return 'success'
    }
    throw new AuthenticationError('invalid access')
  },
}

const commonResolversQuery = {
  getContactInfo: async () => {
    const info = await prisma.jmk_web_details.findMany({});
    if (info?.[0]) {
      return info[0]
    } else {
      throw new ApolloError('Info not found !!')
    }
  },
  getPopupModal: async (_, { args }) => {
    const modal = await prisma.jmk_web_modal.findFirst({ where: { status: true } });
    if (!modal) throw new ApolloError('Data Not Found')
    return modal
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
  getAllActiveBlogs: async () => {
    const blogs = await prisma.jmkblog.findMany({
      where: { status: true },
    })
    if (!blogs) throw new ApolloError('No data Found')
    return blogs
  },
  getBlogBySlug: async (_, args) => {
    if (!args.blog_slug) throw new ForbiddenError('blog_slug is required !')
    const blog = await prisma.jmkblog.findFirst({
      where: { blog_slug: args.blog_slug },
    })
    if (!blog) throw new ApolloError('Data Not Found')
    return blog
  },
  getFaqByType: async (_, { type }) => {
    if (!type) throw new ForbiddenError('faq type is required !')
    const faq = await prisma.jmkfaq.findMany({
      where: { type },
    })
    if (!faq) throw new ApolloError('Data Not Found')
    return faq
  },
  getFaqById: async (_, { faq_id }) => {
    if (!faq_id) throw new ForbiddenError('faq id is required !')
    const faq = await prisma.jmkfaq.findFirst({
      where: { faq_id },
    })
    if (!faq) throw new ApolloError('Data Not Found')
    return faq
  },
}

export {
  commonQueryTypesAndInputs,
  commonQuery,
  commonMutation,
  commonResolvers,
  commonResolversQuery,
}
