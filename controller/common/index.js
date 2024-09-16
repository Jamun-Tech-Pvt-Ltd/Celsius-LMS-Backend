import {
  ApolloError,
  AuthenticationError,
  ForbiddenError,
} from 'apollo-server-express'
import prisma from '../../database.js'
import { ROLES } from '../../utils/helper.js'
import { uploadImgToAWS } from '../../utils/imageHandler.js'

const commonQueryTypesAndInputs = `
  type Token {
    token: String!
  }

  input createAndUpdateCourseInput {
    crs_id: Int
    crs_category_id: Int!
    crs_name: String!
    crs_desc: String!
    crs_duration: Int!
    crs_rate: Int!
    crs_rate_us: Int!
    crs_ins: String!
    crs_start_date: Date
    crs_image: Upload
    time: String
    lavel: String
    meetLink: String
    isDeleted: Boolean
  }


  input deleteCourseInput {
    crs_id: Int!
  }

  type Course {
    crs_id: Int!
    crs_category_id: Int!
    crs_name: String!
    crs_desc: String!
    crs_duration: Int!
    crs_rate: Int!
    crs_rate_us: Int!
    crs_ins: String!
    crs_start_date: Date
    crs_image: String
    time: String
    lavel: String
    meetLink: String
    isDeleted: Boolean!
    company: Company!
    category: CourseCategory!
  }

  type ContactInfoType {
    phone: String!
    phone1: String!
    email: String!
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

  type JmkALlBlog {
    blog_type: String
    blog_slug: String
    blog_heading: String
    blog_logo: String
    blog_image: String
    author: String
    blog_id: Int
    created_at: Date
    updated_at: Date
    created_by: String
    blog_short_description: String
    blog_meta_title: String
    blog_meta_description: String
    blog_meta_keyword: String
  }

  type JmkBlog {
    blog_type: String
    blog_heading: String
    blog_logo: String
    author: String
    blog_id: Int
    blog_short_description: String
    blog_description: String
    blog_image: String
    blog_meta_title: String
    blog_meta_description: String
    blog_meta_keyword: String
    created_at: Date
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
    
     type Testimonial {
      serial:Int!
      usr_name:String!
      usr_label:String!
      usr_star:Int!
      testimonial:String!
      usr_img:String!
      created_at:Date!
     }    

  type Notification {
    serial: Int!
    user_type: String!
    user_id: Int!
    category: String!
    link: String
    label1: String
    label2: String
    message: String!
    is_read: Boolean!
    created_at: Date!
  }

  
`


const commonQuery = `
    getAllCourseList:[Course!]!
    getCourseById(crs_id:Int!):Course!
    getContactInfo:ContactInfoType!
    getPopupModal: webModal
    getAllActiveBlogs:[JmkALlBlog]
    getBlogBySlug(blog_slug:String!):JmkBlog!
    getFaqByType(type:String):[Faq!]!
    getFaqById(faq_id:Int!):Faq!
    getMyNotifications:[Notification]

    getTestimonials: [Testimonial]
    getTestimonial(serial:Int!): Testimonial
`

const commonMutation = `
    createCourse(data:createAndUpdateCourseInput!):String!
    updateCourse(data:createAndUpdateCourseInput!):String!
    deleteCourse(data:deleteCourseInput):String

    deleteNotification(serial:Int!):String!
    deleteAllNotification:String!

    updateNotification(serial:Int!):String!
`


const commonResolvers = {
  createCourse: async (_, { data }, { userId, role, platform }) => {
    if (!userId) throw new ForbiddenError('invalid token');
    if (role === 'admin' && platform === 'external') {
      const admin = await prisma.jmkuserinfo.findFirst({
        where: { usr_id: userId },
      });
      if (!admin) throw new AuthenticationError('invalid admin');
      data.crs_company_id = admin.company_id;
      const oldCourseCheck = await prisma.jmkcrsinfo.findFirst({ where: { crs_name: data.crs_name, time: data.time, crs_company_id: admin.company_id } });
      if (oldCourseCheck) throw new ApolloError('this course already exist');

      const image = await uploadImgToAWS(data.crs_image, 'course/');
      if (!image.data) throw new ApolloError('Someting went wrong !');
      data.crs_image = image.data.Location;
      data.crs_image_key = image.data.key;

      const newCourse = await prisma.jmkcrsinfo.create({ data });
      if (!newCourse) throw new ApolloError('something went wrong !')
      return 'Success'
    }
    throw new AuthenticationError('invalid access')
  },

  updateCourse: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (role === 'admin') {
      const admin = await prisma.jmkuserinfo.findFirst({
        where: { usr_id: userId },
      })
      if (!admin) throw new AuthenticationError('invalid admin')
      const crs = await prisma.jmkcrsinfo.findFirst({
        where: { crs_id: data.crs_id },
      })
      if (!crs) throw new ApolloError('invalid course');
      if (data.crs_image) {
        const image = await uploadImgToAWS(data.crs_image, 'course/');
        if (!image.data) throw new ApolloError('Someting went wrong !');
        data.crs_image = image.data.Location;
        data.crs_image_key = image.data.key;
      } else {
        delete data.crs_image
      }
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

  deleteCourse: async (_, { data }, { userId, role, platform }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (role === 'admin') {
      if (platform === 'external') {
        const admin = await prisma.jmkuserinfo.findFirst({
          where: { usr_id: userId },
          include: { company: true }
        })
        if (!admin) throw new AuthenticationError('invalid admin')
        const course = await prisma.jmkcrsinfo.update({
          where: { crs_id: data.crs_id, crs_company_id: admin.company_id },
          data: { isDeleted: true }
        })
        if (!course) throw new ApolloError('something went wrong !')
        return 'success'
      }
      const admin = await prisma.jmkuserinfo.findFirst({
        where: { usr_id: userId },
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

  deleteNotification: async (_, { serial }, { userId, role }) => {
    if (role) {
      if (!userId) throw new ForbiddenError('invalid token');
      await prisma.jmk_notifications.delete({ where: { serial } });
      return 'success'
    }
  },

  deleteAllNotification: async (_, { data }, { userId, role }) => {
    if (role === ROLES[0]) {
      if (!userId) throw new ForbiddenError('invalid token');
      const student = await prisma.jmkstdinfo.findFirst({
        where: { std_id: userId },
      });
      if (!student) throw new AuthenticationError('invalid student');
      await prisma.jmk_notifications.deleteMany({ where: { user_id: student.std_id, user_type: 'Student' } });
      return 'success'
    }

    if (role === ROLES[1]) {
      if (!userId) throw new ForbiddenError('invalid token');
      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      });
      if (!trainer) throw new AuthenticationError('invalid trainer');
      await prisma.jmk_notifications.deleteMany({ where: { user_id: trainer.tr_id, user_type: 'Trainer' } });
      return 'success'
    }

    if (role === 'admin') {
      if (!userId) throw new ForbiddenError('invalid token');
      const admin = await prisma.jmkuserinfo.findFirst({
        where: { usr_id: userId },
      });
      if (!admin) throw new AuthenticationError('invalid admin');
      await prisma.jmk_notifications.deleteMany({ where: { user_id: admin.usr_id, user_type: 'Admin' } });
      return 'success'
    }

    throw new AuthenticationError('invalid access');
  },

  updateNotification: async (_, { serial }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token');
    if (!serial) throw new ForbiddenError('invalid serial');
    await prisma.jmk_notifications.update({ where: { serial }, data: { is_read: true } });
    return 'success'
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
  getAllCourseList: async (_, args, { userId, role, platform }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (role === 'admin') {
      const admin = await prisma.jmkuserinfo.findFirst({
        where: { usr_id: userId },
        include: { company: true }
      });
      if (!admin) throw new AuthenticationError('invalid admin credentials');
      if (platform === 'internal') {
        const courses = await prisma.jmkcrsinfo.findMany({ include: { company: true, category: true } });
        if (!courses) throw new ApolloError('Courses not found !!')
        return courses
      } else {
        const courses = await prisma.jmkcrsinfo.findMany({ where: { crs_company_id: admin.company_id }, include: { company: true, category: true } });
        if (!courses) throw new ApolloError('Courses not found !!')
        return courses
      }

    }
    throw new AuthenticationError('invalid access !!')
  },
  getCourseById: async (_, args, { userId, role, platform }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    })
    if (!admin) throw new AuthenticationError('invalid admin credentials')
    if (role === 'admin') {
      if (platform === 'external') {
        const course = await prisma.jmkcrsinfo.findFirst({
          where: { crs_id: args.crs_id, crs_company_id: admin.company_id },
        })
        if (!course) throw new ApolloError('No data found')
        return course
      }
      const course = await prisma.jmkcrsinfo.findFirst({
        where: { crs_id: args.crs_id },
      })
      if (!course) throw new ApolloError('No data found')
      return course
    }
    throw new AuthenticationError('invalid access')
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
  getMyNotifications: async (_, { }, { userId, role }) => {
    if (role === ROLES[0]) {
      if (!userId) throw new ForbiddenError('invalid token');
      const student = await prisma.jmkstdinfo.findFirst({
        where: { std_id: userId },
      });
      if (!student) throw new AuthenticationError('invalid student');
      const notifications = await prisma.jmk_notifications.findMany({ where: { user_id: student.std_id, user_type: 'Student' }, orderBy: { created_at: 'desc' } });
      if (notifications) {
        return notifications
      } else {
        return []
      }
    }

    if (role === ROLES[1]) {
      if (!userId) throw new ForbiddenError('invalid token');
      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      });
      if (!trainer) throw new AuthenticationError('invalid trainer');
      const notifications = await prisma.jmk_notifications.findMany({ where: { user_id: trainer.tr_id, user_type: 'Trainer' }, orderBy: { created_at: 'desc' } });
      if (notifications) {
        return notifications
      } else {
        return []
      }
    }

    if (role === 'admin') {
      if (!userId) throw new ForbiddenError('invalid token');
      const admin = await prisma.jmkuserinfo.findFirst({
        where: { usr_id: userId },
      });
      if (!admin) throw new AuthenticationError('invalid admin');
      const notifications = await prisma.jmk_notifications.findMany({ where: { user_id: admin.usr_id, user_type: 'Admin' }, orderBy: { created_at: 'desc' } });
      if (notifications) {
        return notifications
      } else {
        return []
      }
    }

    throw new AuthenticationError('invalid access');
  },


  getTestimonials: async (_, { args }, { userId, role }) => {
    const testimonials = await prisma.jmk_testimonial.findMany({ orderBy: { created_at: 'desc' } });
    if (!testimonials) throw new ApolloError('Data Not Found');
    return testimonials
  },

  getTestimonial: async (_, { serial }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token');
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    });
    if (!admin) throw new AuthenticationError('invalid admin credentials');
    const testimonial = await prisma.jmk_testimonial.findFirst({ where: { serial } });
    if (!testimonial) throw new ApolloError('Data Not Found')
    return testimonial
  },
}

export {
  commonQueryTypesAndInputs,
  commonQuery,
  commonMutation,
  commonResolvers,
  commonResolversQuery,
}
