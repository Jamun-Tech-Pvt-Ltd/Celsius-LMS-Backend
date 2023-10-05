import {
  ApolloError,
  AuthenticationError,
  ForbiddenError,
} from 'apollo-server-express'
import prisma from '../../database.js'
import { ROLES } from '../../utils/helper.js'
import { deleteImgToAWS, uploadImgToAWS } from '../../utils/imageHandler.js'

import { PubSub } from 'graphql-subscriptions'

const pubsub = new PubSub()

const NEW_MESSAGE = "NEW_MESSAGE"

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

  type Video {
      vid_id: String!
      vid_name: String!
      vid_loc: String
      crs_id: String!
      vid_date: Date!
      vid_summary: String!
      content: String
  }

`

const commonQuery = `
    getAllCourseList:[Course!]!
    getCourseById(crs_id:Int!):Course!
    getAllConsultancyInfo:[ConsultancyInfo]
    getContactInfo:[ContactInfoType!]
    getAllActiveBlogs:[JmkALlBlog]
    getBlogBySlug(blog_slug:String!):JmkBlog!
    getAllVideosByCourseId(crs_id:Int!):[Video]
    getVideosByVideoId(vid_id:Int!):Video
`

const commonMutation = `
    createCourse(data:createCourseInput!):Course
    updateCourse(data:updateCourseInput!):String!
    deleteCourse(data:deleteCourseInput):String
    addCourseVideo(data:createUpdateCourseVideoInput!):String!
    updateCourseVideo(data:createUpdateCourseVideoInput!):String!
    deleteCourseVideo(vid_id:Int!):String!
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

  addCourseVideo: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (role === ROLES[2] || role === 'admin') {
      if (role === 'admin') {
        const admin = await prisma.jmkuserinfo.findFirst({
          where: { usr_id: userId, usr_role: role },
        })
        if (!admin) throw new AuthenticationError('invalid admin')
      }
      if (role === ROLES[2]) {
        const consultancy = await prisma.jmkconsulinfo.findFirst({
          where: { serial: userId },
        })
        if (!consultancy) throw new AuthenticationError('invalid consultancy')
      }
      if (!data.vid_loc && !data.vid_link) throw new AuthenticationError('video file or video link required !')
      let file
      if (data.vid_loc) {
        file = await uploadImgToAWS(data.vid_loc, 'videos/')
        if (!file.data) throw new ApolloError('Someting went wrong !')
      } else {
        file = { data: { Location: data.vid_link, key: '' } }
      }
      delete data.vid_link
      const newVideo = await prisma.jmkvidinfo.create({
        data: {
          ...data,
          vid_loc: file?.data?.Location ?? null,
          vid_loc_key: file?.data?.key ?? '',
        },
      })
      if (!newVideo) throw new ApolloError('something went wrong !')
      return "Success"
    }
    throw new AuthenticationError('invalid access')
  },

  updateCourseVideo: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (role === ROLES[2] || role === 'admin') {
      if (role === 'admin') {
        const admin = await prisma.jmkuserinfo.findFirst({
          where: { usr_id: userId, usr_role: role },
        })
        if (!admin) throw new AuthenticationError('invalid admin')
      }
      if (role === ROLES[2]) {
        const consultancy = await prisma.jmkconsulinfo.findFirst({
          where: { serial: userId },
        })
        if (!consultancy) throw new AuthenticationError('invalid consultancy')
      }

      const oldVideo = await prisma.jmkvidinfo.findFirst({ where: { vid_id: data.vid_id } })
      if (!oldVideo) throw new ForbiddenError('invalid Vdeo id !');
      const videoLink = data.vid_link;
      delete data.vid_link

      if (data.vid_loc) {
        if (videoLink) throw new AuthenticationError('invalid input data !')
        if (oldVideo.vid_loc_key) {
          await deleteImgToAWS(oldVideo.vid_loc_key);
        }
        let file
        file = await uploadImgToAWS(data.vid_loc, 'videos/')
        if (!file.data) throw new ApolloError('Someting went wrong !')
        const updateVideo = await prisma.jmkvidinfo.update({
          data: {
            ...data,
            vid_loc: file?.data?.Location ?? null,
            vid_loc_key: file?.data?.Key ?? '',
          },
          where: { vid_id: data.vid_id }
        })
        if (!updateVideo) throw new ApolloError('something went wrong !')
        return "Success"
      }
      const updateVideo = await prisma.jmkvidinfo.update({
        data: {
          ...data,
          vid_loc: videoLink ? videoLink : oldVideo.vid_loc,
          vid_loc_key: oldVideo.vid_loc_key,
        },
        where: { vid_id: data.vid_id }
      })
      if (!updateVideo) throw new ApolloError('something went wrong !')
      return "Success"
    }
    throw new AuthenticationError('invalid access')
  },

  deleteCourseVideo: async (_, { vid_id }, { userId, role }) => {
    throw new ForbiddenError('invalid opration !')
    // if (!userId) throw new ForbiddenError('invalid token')
    // if (role === ROLES[2] || role === 'admin') {
    //   if (role === 'admin') {
    //     const admin = await prisma.jmkuserinfo.findFirst({
    //       where: { usr_id: userId, usr_role: role },
    //     })
    //     if (!admin) throw new AuthenticationError('invalid admin')
    //   }
    //   if (role === ROLES[2]) {
    //     const consultancy = await prisma.jmkconsulinfo.findFirst({
    //       where: { serial: userId },
    //     })
    //     if (!consultancy) throw new AuthenticationError('invalid consultancy')
    //   }

    //   const oldVideo = await prisma.jmkvidinfo.findFirst({ where: { vid_id: vid_id } })
    //   if (!oldVideo) throw new ForbiddenError('invalid Vdeo id !');

    //   if (oldVideo.vid_loc_key) {
    //     await deleteImgToAWS(oldVideo.vid_loc_key);
    //   }

    //   const deleteVideo = await prisma.jmkvidinfo.delete({ where: { vid_id: vid_id } })
    //   if (!deleteVideo) throw new ApolloError('something went wrong !')

    //   return "Deleted !"
    // }
    // throw new AuthenticationError('invalid access')
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
  getAllVideosByCourseId: async (_, { crs_id }, { userId }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (!crs_id) throw new ForbiddenError('crs_id is required !')
    const videos = await prisma.jmkvidinfo.findMany({
      where: { crs_id: crs_id },
    })
    if (!videos[0]) throw new ApolloError('Data Not Found')
    return videos
  },
  getVideosByVideoId: async (_, { vid_id }, { userId }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (!vid_id) throw new ForbiddenError('vid_id is required !')
    const video = await prisma.jmkvidinfo.findFirst({
      where: { vid_id: vid_id },
    })
    if (!video) throw new ApolloError('Data Not Found')
    return video
  },
}

export {
  commonQueryTypesAndInputs,
  commonQuery,
  commonMutation,
  commonResolvers,
  commonResolversQuery,
}
