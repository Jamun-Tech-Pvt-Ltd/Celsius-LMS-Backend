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
    logo: String
    primary_color: String
    secondary_color: String
    tertiary_color: String
    description: String
    location: String
    company_name: String
    company_phone: String
    company_account: String
    bank_name: String
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
      usr_star:Int
      type:String!
      usr_company:String
      testimonial:String!
      usr_img:String!
      usr_company_logo:String
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

  type attendanceData {
    total_attendance:Int!
    total_classes:Int!
    today_attendance:Boolean!,
    student:Student,
    course:Course
  }

  type AttendanceForAdmin {
   total_student:Int!
   total_classes:Int!
   total_course:Int!
   total_present:Int!
   attendance:[attendanceData!]
  }

  type Attendance {
    serial:Int!
    attendance:Boolean!
    created_at:Date!
  }

  type AttendanceRecod {
    total_present:Int!
    total_classes:Int!
    total_course:Int!
    student:Student!
    course:Course!
    attendance:[Attendance]
  }
`

const commonQuery = `
    getAllCourseList:[Course!]!
    getCourseById(crs_id:Int!):Course!
    getContactInfo(type:String!):ContactInfoType!
    getPopupModal: webModal
    getAllActiveBlogs:[JmkALlBlog]
    getBlogBySlug(blog_slug:String!):JmkBlog!
    getFaqByType(type:String):[Faq!]!
    getFaqById(faq_id:Int!):Faq!
    getMyNotifications:[Notification]

    getTestimonials: [Testimonial]
    getTestimonial(serial:Int!): Testimonial

    getAttendance:AttendanceForAdmin!
    getAttendanceByStudentId(std_id:Int,crs_id:Int):AttendanceRecod!
`

const commonMutation = `
    createCourse(data:createAndUpdateCourseInput!):String!
    updateCourse(data:createAndUpdateCourseInput!):String!
    deleteCourse(data:deleteCourseInput):String

    deleteNotification(serial:Int!):String!
    deleteAllNotification:String!

    updateNotification(serial:Int!):String!

    updateAttendance(date:Date!,std_id:Int!,crs_id:Int):String!
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

  updateAttendance: async (_, { date, std_id, crs_id }, { userId, role, platform }) => {
    if (!userId) throw new ForbiddenError('invalid token');
    if (role === 'admin' && platform === 'internal') {
      const admin = await prisma.jmkuserinfo.findFirst({
        where: { usr_id: userId },
      });
      if (!admin) throw new AuthenticationError('invalid admin credentials');
      throw new AuthenticationError('internal admin doesnt have access');
    };

    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    if (role === 'admin' && platform === 'external') {
      if (!crs_id) throw new ApolloError('admin need to provide crs_id');
      const admin = await prisma.jmkuserinfo.findFirst({
        where: { usr_id: userId },
      });
      if (!admin) throw new AuthenticationError('invalid admin credentials');

      const existingAttendance = await prisma.jmk_std_attendance.findFirst({
        where: {
          std_id,
          crs_id,
          created_at: {
            gte: attendanceDate,
            lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      });

      if (existingAttendance) {
        await prisma.jmk_std_attendance.delete({ where: { serial: existingAttendance.serial } });
        return 'attendance removed';
      } else {
        await prisma.jmk_std_attendance.create({
          data: {
            std_id,
            crs_id,
            attendance: true,
            created_at: date
          }
        });
        return 'attendance added';
      }
    }

    if (role === 'trainer' && platform === 'external') {
      if (crs_id) throw new ApolloError('trainer doesnt need to provide crs_id');
      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      });
      if (!trainer) throw new AuthenticationError('invalid trainer credentials');

      const existingAttendance = await prisma.jmk_std_attendance.findFirst({
        where: {
          std_id,
          crs_id: trainer.crs_id,
          created_at: {
            gte: attendanceDate,
            lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      });

      if (existingAttendance) {
        await prisma.jmk_std_attendance.delete({ where: { serial: existingAttendance.serial } });
        return 'attendance removed';
      } else {
        await prisma.jmk_std_attendance.create({
          data: {
            std_id,
            crs_id: trainer.crs_id,
            attendance: true,
            created_at: date
          }
        });
        return 'attendance added';
      }
    }
    throw new AuthenticationError('doesn’t have access');
  }
}

const commonResolversQuery = {
  getContactInfo: async (_, arg, { userId, role, platform }) => {
    if (userId && platform === 'external') {
      let user;
      if (role === 'adimin') {
        user = await prisma.jmkuserinfo.findFirst({ where: { usr_id: userId } });
      }

      if (role === 'student') {
        user = await prisma.jmkstdinfo.findFirst({ where: { std_id: userId } });
      }

      if (!user) {
        throw new ApolloError('User not found !!');
      }
      const info = await prisma.jmk_web_details.findFirst({ where: { type: 'Company', company_id: user.company_id } });

      if (!info) {
        throw new ApolloError('Info not found !!');
      }
      return info
    }
    const info = await prisma.jmk_web_details.findFirst({ where: { company_id: null, type: arg.type } });
    if (info) {
      return info
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

  getFaqByType: async (_, { type }, { userId, role, platform }) => {
    if (!type) throw new ForbiddenError('faq type is required !');
    if (type === 'Student' && role === 'student' && platform === 'external') {
      const student = await prisma.jmkstdinfo.findFirst({ where: { std_id: userId } });
      if (!student) throw new ForbiddenError('invalid credentials');
      const faq = await prisma.jmkfaq.findMany({
        where: { type: 'Student', company_id: student.company_id },
      });
      if (!faq) throw new ApolloError('Data Not Found');
      return faq;
    } else if (type === 'Trainer' && role === 'trainer' && platform === 'external') {
      const trainer = await prisma.jmktrinfo.findFirst({ where: { tr_id: userId } });
      if (!trainer) throw new ForbiddenError('invalid credentials');
      const faq = await prisma.jmkfaq.findMany({
        where: { type: 'Trainer', company_id: trainer.company_id },
      });
      if (!faq) throw new ApolloError('Data Not Found');
      return faq;
    } else {
      const faq = await prisma.jmkfaq.findMany({
        where: { type, company_id: null },
      });
      if (!faq) throw new ApolloError('Data Not Found');
      return faq;
    }
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

  getAttendance: async (_, { serial }, { userId, role, platform }) => {
    if (!userId) throw new ForbiddenError('invalid token');
    if (role === 'admin' && platform === 'internal') {
      const admin = await prisma.jmkuserinfo.findFirst({
        where: { usr_id: userId },
      });
      if (!admin) throw new AuthenticationError('invalid admin credentials');
      throw new AuthenticationError('internal admin doesnt have access');
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (role === 'admin' && platform === 'external') {
      const admin = await prisma.jmkuserinfo.findFirst({
        where: { usr_id: userId },
      });
      if (!admin) throw new AuthenticationError('invalid admin credentials');

      const total_student = await prisma.jmkstdinfo.count({ where: { company_id: admin.company_id } });
      const total_present = await prisma.jmk_std_attendance.count({ where: { attendance: true, student: { company_id: admin.company_id } } });

      let total_classes = 0;
      const total_course = await prisma.jmkcrsinfo.findMany({ where: { crs_company_id: admin.company_id } });
      for (let index = 0; index < total_course.length; index++) {
        const course = total_course[index];
        const startDate = new Date(course.crs_start_date);
        const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
        total_classes += daysSinceStart;
      }

      const attendance = [];
      const students = await prisma.jmkstdcrsinfo.findMany({ where: { student: { company_id: admin.company_id } }, include: { student: true, course: true } });
      for (let index = 0; index < students.length; index++) {
        const student = students[index];
        const getTotalAttendance = await prisma.jmk_std_attendance.count({ where: { std_id: student.std_id, crs_id: student.crs_id, attendance: true } });
        const getTodayAttendance = await prisma.jmk_std_attendance.findFirst({ where: { std_id: student.std_id, crs_id: student.crs_id, attendance: true, created_at: { gte: today, lt: tomorrow } } });
        const startDate = new Date(student.course.crs_start_date);
        const total_classes = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
        attendance.push({
          total_attendance: getTotalAttendance,
          total_classes,
          today_attendance: getTodayAttendance ? true : false,
          student: student.student,
          course: student.course
        });
      }

      return { total_student, total_classes, total_course: total_course.length, total_present, attendance };
    }

    if (role === 'trainer' && platform === 'external') {
      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      });
      if (!trainer) throw new AuthenticationError('invalid trainer credentials');
      const total_student = await prisma.jmkstdcrsinfo.count({ where: { student: { company_id: trainer.company_id }, crs_id: trainer.crs_id } });
      const total_present = await prisma.jmk_std_attendance.count({ where: { attendance: true, student: { company_id: trainer.company_id }, crs_id: trainer.crs_id } });
      const course = await prisma.jmkcrsinfo.findFirst({ where: { crs_company_id: trainer.company_id, crs_id: trainer.crs_id } });
      const startDate = new Date(course.crs_start_date);
      const total_classes = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

      const attendance = [];
      const students = await prisma.jmkstdcrsinfo.findMany({ where: { student: { company_id: trainer.company_id }, crs_id: trainer.crs_id }, include: { student: true, course: true } });
      for (let index = 0; index < students.length; index++) {
        const student = students[index];
        const getTotalAttendance = await prisma.jmk_std_attendance.count({ where: { std_id: student.std_id, crs_id: student.crs_id, attendance: true } });
        const getTodayAttendance = await prisma.jmk_std_attendance.findFirst({ where: { std_id: student.std_id, crs_id: student.crs_id, attendance: true, created_at: { gte: today, lt: tomorrow } } });
        attendance.push({
          total_attendance: getTotalAttendance,
          total_classes,
          today_attendance: getTodayAttendance ? true : false,
          student: student.student,
          course: student.course
        });
      }

      return { total_student, total_classes, total_course: 1, total_present, attendance };
    }

    throw new AuthenticationError('doesnt have access');
  },

  getAttendanceByStudentId: async (_, { std_id, crs_id }, { userId, role, platform }) => {
    if (!userId) throw new ForbiddenError('invalid token');
    if (role === 'admin' && platform === 'internal') {
      const admin = await prisma.jmkuserinfo.findFirst({
        where: { usr_id: userId },
      });
      if (!admin) throw new AuthenticationError('invalid admin credentials');
      throw new AuthenticationError('internal admin doesnt have access');
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (role === 'admin' && platform === 'external') {
      if (!std_id && !crs_id) throw new ApolloError('admin need to provide std_id and crs_id');
      const admin = await prisma.jmkuserinfo.findFirst({
        where: { usr_id: userId },
      });
      if (!admin) throw new AuthenticationError('invalid admin credentials');
      const course = await prisma.jmkcrsinfo.findFirst({ where: { crs_id, crs_company_id: admin.company_id } });
      const student = await prisma.jmkstdinfo.findFirst({ where: { std_id, company_id: admin.company_id } });
      const attendanceData = await prisma.jmk_std_attendance.findMany({ where: { std_id, crs_id, attendance: true } });
      const startDate = new Date(course.crs_start_date);
      const total_classes = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
      const total_course = course.crs_duration * 30;

      const attendance = Array.from({ length: total_classes }, (_, index) => {
        const date = new Date(startDate);
        date.setDate(date.getDate() + index);
        return {
          attendance: false,
          created_at: date,
        };
      });

      attendanceData.forEach(record => {
        const dayIndex = Math.floor((new Date(record.created_at) - startDate) / (1000 * 60 * 60 * 24));
        if (dayIndex >= 0 && dayIndex < total_classes) {
          attendance[dayIndex].attendance = true;
        }
      });

      return { total_present: attendanceData.length, total_classes, student, course, total_course, attendance: attendance.reverse() };
    }

    if (role === 'trainer' && platform === 'external') {
      if (!std_id) throw new ApolloError('trainer need to provide std_id');
      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
        include: { course: true }
      });
      if (!trainer) throw new AuthenticationError('invalid trainer credentials');
      const student = await prisma.jmkstdinfo.findFirst({ where: { std_id, company_id: trainer.company_id } });
      const attendanceData = await prisma.jmk_std_attendance.findMany({ where: { std_id, crs_id: trainer.crs_id, attendance: true } });
      const startDate = new Date(trainer.course.crs_start_date);
      const total_classes = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
      const total_course = trainer.course.crs_duration * 30;

      const attendance = Array.from({ length: total_classes }, (_, index) => {
        const date = new Date(startDate);
        date.setDate(date.getDate() + index);
        return {
          attendance: false,
          created_at: date,
        };
      });

      attendanceData.forEach(record => {
        const dayIndex = Math.floor((new Date(record.created_at) - startDate) / (1000 * 60 * 60 * 24));
        if (dayIndex >= 0 && dayIndex < total_classes) {
          attendance[dayIndex].attendance = true;
        }
      });

      return { total_present: attendanceData.length, total_classes, student, course: trainer.course, total_course, attendance: attendance.reverse() };
    }

    if (role === 'student' && platform === 'external') {
      if (crs_id || std_id) throw new ApolloError('student doesnt need to provide arg');
      const student = await prisma.jmkstdinfo.findFirst({
        where: { std_id: userId },
        include: { course: true }
      });
      if (!student) throw new AuthenticationError('invalid student credentials');
      const attendanceData = await prisma.jmk_std_attendance.findMany({ where: { std_id: student.std_id, crs_id: student.crs_id, attendance: true } });
      const startDate = new Date(student.course.crs_start_date);
      const total_classes = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
      const total_course = student.course.crs_duration * 30;

      const attendance = Array.from({ length: total_classes }, (_, index) => {
        const date = new Date(startDate);
        date.setDate(date.getDate() + index);
        return {
          attendance: false,
          created_at: date,
        };
      });

      attendanceData.forEach(record => {
        const dayIndex = Math.floor((new Date(record.created_at) - startDate) / (1000 * 60 * 60 * 24));
        if (dayIndex >= 0 && dayIndex < total_classes) {
          attendance[dayIndex].attendance = true;
        }
      });

      return { total_present: attendanceData.length, total_classes, student, course: student.course, total_course, attendance: attendance.reverse() };
    }

    throw new AuthenticationError('doesnt have access');
  },
}

export {
  commonQueryTypesAndInputs,
  commonQuery,
  commonMutation,
  commonResolvers,
  commonResolversQuery,
}
