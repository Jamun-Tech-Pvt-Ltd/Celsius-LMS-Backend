import {
  ApolloError,
  AuthenticationError,
  ForbiddenError,
} from 'apollo-server-express'
import prisma from '../../database.js'
import jwt from 'jsonwebtoken'
import { uploadImgToAWS, deleteImgToAWS } from '../../utils/imageHandler.js'
import { ROLES } from '../../utils/helper.js'
import { sendMail } from '../../utils/mailHandler.js'
import newUserSignupNotification from '../../utils/newUsersignup.js'

const adminQueryTypesAndInputs = `

    input signinAdminInput {
        username: String
        usr_email: String!
        usr_password: String!
    }

    input updateAdminInput {
        usr_email: String
        usr_password: String
        usr_role: String
        usr_code:String
    }

    input faqInput {
      faq_id:Int
      question: String!
      answer: String!
      type: String!
    }

    input updateStudentFromAdminInput {
        std_id: Int!
        std_fname: String!
        std_mname: String
        std_lname: String!
        std_email: String!
        std_mobile: String!
        std_password: String!
        std_join_dt: Date!
        std_birth_dt: Date!
        std_verifyed: Boolean!
        crs_id:Int
        std_add_house_no:String
        std_add_street:String
        std_add_city:String
        std_add_ward_no:Int
        std_add_distrcit:String
        std_add_province:String
        std_add_zone:String
     }

     input updateStudentCourseFromAdminInput {
      crs_id:Int!
        serial : Int!
        discount: Int
        amt_paid: Int
        amt_due: Int
        std_crs_verirfy: Boolean
        crs_complete: Boolean
        crs_complete_date: Date
     }
   
     type Admin {
        usr_id: Int!
        usr_code: String
        usr_email: String!
        usr_role: String!
     }

     type logInfo{
      log_id:Int
      ip:String
      user_id:String
      role:String
      method:String
      time:Date
     }

     type studentreceipt{
      receipt_no:Int!
      receipt_date: Date
      std_id:Int
      receipt_amount:Int
      receipt_desc:String
    }

     type AdminStudent {
        std_id: ID!
        std_fname: String!
        std_mname: String
        std_lname: String!
        std_email: String!
        std_pic: String
        crs_complete: Boolean
        crs_complete_date: Date
        std_mobile: String!
        std_join_dt: Date
        std_birth_dt: Date
        crs_type: String
        crs_name: String
        oname:String
        std_password: String!
        std_high_ql: String
        crsmain_id:Int
        crsmain_title:String
        std_status: String
        std_paidup: String
        std_company: String
        std_institute: String
        std_remark: String
        std_due: String
        std_verifyed: Boolean!
        join_courses: [UserCourseAdmin]
     }

     type trainer_join_courses {
      serial: Int!
      tr_id: Int!
      crs_id: Int!
      crs_name: String!
    }
  
     type AdminTrainer {
        tr_id: ID!
        tr_fname: String!
        tr_mname: String
        tr_lname: String!
        tr_mobile:String
        tr_email: String
        tr_city:String
        tr_country: String
        tr_main_tech1:String
        tr_main_tech2: String
        tr_main_tech3:String
        tr_dob: String
        tr_verifyed:Boolean
        tr_password:String
        tr_resume:String
        tr_github:String
        tr_linkedin:String
        tr_role:String
        tr_label:String
        tr_remark:String
        join_courses: [trainer_join_courses]
     }


     type devTechDet{
      tech_stack:String
      tech_stack_exp:String
      tech_last_used:String
      tech_stack_summary:String
      
     }

     type devProjDet{
         proj_title:String
         proj_desc:String
         proj_tech_used:String
     }

     type devExpDet{
        company_name:String
        exp_desc:String
        exp_role_pos:String
        exp_start_date:Date
        exp_end_date:Date
     }

      type courseCurriculum {
        topic: String!
        description: String!
      }
        
      type staticCourse{
        crsmain_id:Int!
        category: String!
        title: String!
        description: String!
        requirements: String!
        cramain_seo_desc: String!
        cramain_seo_title: String!
        crsmain_img_url: String!
        duration: Float!
        label: String!
        language: String!
        lavel: String!
        rate: Int!
        rateUs: Float
        start_date: String!
        short_description: String!
        learning: [String!]!
        timing: [String!]!
        curriculum: [courseCurriculum!]!
        isDeleted:Boolean
      }
     
     type totalCount{
       name:String
       count:Int
       link:String
     }

     type userInfo{
      usr_id:Int!
      usr_code:String
      usr_email:String
      usr_password:String
      usr_role:String
      usr_fname:String
      usr_mname:String
      usr_lname:String
      usr_img_url:String
      usr_img_key:String
      usr_access:String
      company:Company
     }


     type AdminType{
      usr_id:Int!
      usr_email:String
      usr_role: String
      usr_fname:String
      usr_mname:String
      usr_lname:String
      usr_img_url:String
      usr_password:String
      usr_access:String
      company_id:Int
      company:Company
     }
     type PaymentInfo{
      pay_id: Int!
      payment_date: Date!
      pay_amount: Int!
      std_email: String!
      transaction_id: String!
      crs_name:String!
      pay_verified: Boolean!
     }

     type JmkBlog {
      blog_id: Int!
      blog_type: String
      blog_heading: String
      blog_short_description: String
      blog_description: String
      blog_image: String
      blog_image_key: String
      author: String
      created_by: Int
      blog_meta_title: String
      blog_meta_description: String
      blog_meta_keyword: String
      created_at: Date!
      updated_at: Date
      status: Boolean
    }

      input UpdateJmkBlogInput {
        blog_id: Int!
        blog_type: String
        blog_heading: String
        blog_short_description: String
        blog_description: String
        blog_image: Upload
        blog_logo: Upload
        author: String
        blog_meta_title: String
        blog_meta_description: String
        blog_meta_keyword: String
        updated_at: Date
        status: Boolean
      }

      input updateJmkBlogStatus{
        blog_id: Int!
        status: Boolean
      }

      input AddJmkBlogInput {
        blog_type: String
        blog_heading: String
        blog_short_description: String
        blog_description: String
        blog_image: Upload
        blog_logo: Upload
        author: String
        blog_meta_title: String
        blog_meta_description: String
        blog_meta_keyword: String
        status: Boolean
      }

     input updateTrainerFromDashboard {
        tr_id: Int
        tr_fname: String
        tr_mname: String
        tr_lname: String
        tr_mobile: String
        tr_email: String
        tr_dob:Date
        tr_password: String
        tr_github: String
        tr_linkedin: String
        tr_role: String
        tr_remark: String
        tr_verifyed:Boolean!
     }

     input assignTrainerCourseFromDashboard {
        tr_id:Int!
        crs_id:Int!
     }

     input createNewUserInput {
      usr_fname:String
      usr_mname:String
      usr_lname:String
      usr_email:String
      usr_password:String
      usr_role:String
      usr_img_url:Upload
     }

     input updateUserInput {
      usr_id:Int!
      usr_email:String
      usr_password:String
      usr_role:String
      usr_fname:String
      usr_mname:String
      usr_lname:String
      usr_access:String
      usr_img_url:Upload
     }

     input contactInfoUpdate {
      serial:Int!
      email_address:String!
      contact_number:String!
     }

     input web_details {
      phone: String
      phone1: String
      email: String
    }

    input web_modal {
      status: Boolean
      img: Upload
    }

    input career_input {
      serial:Int
      title:String!
      description:String!
      seo_title:String
      seo_description:String
      department:String!
      employment_type:String!
      employment_structure:String!
      location:String!
      status:Boolean!
    }

    input CourseCategoryInput {
      serial:Int
      title: String!
      description: String!
      icon: Upload
     }

     input testimonialInput{
      serial:Int
      std_name:String!
      crs_name:String!
      testimonial:String!
      std_img:Upload
     }

     input serviceInput {
      serial:Int
      title: String!
      description: String!
      seo_title: String!
      seo_description: String!
      long_description: String!
      short_description: String!
      icon: Upload
     }

     input policyInput {
      shot_description: String!
      description: String!
     }

     input PartnerInput {
      serial:Int
      title:String!
      icon:Upload
     }

     input PromoInput {
      serial:Int
      name:String!
      crs_id:Int!
      code:String!
      discount:Int!
      upto:Int!
      expiry_date:Date!
     }

     input MailSendInput {
      content:String!
      users:String!
      subject:String!
     }

     input updateAttendanceByIdDateInput {
      crs_id:Int!
      std_id:Int!
      date:String!
     }

     type UserCourseAdmin {
      std_id:Int!
      serial:Int!
      crsmain_id:Int
      crs_id:Int
      crs_start_dt:Date
      rate:String
      title:String
      discount: String
      amt_paid:String
      amt_due:String
      crs_complete:String
      crs_complete_date:Date
      std_crs_verirfy:Boolean
      payment_option:String
      payment_type:String
      promo_discount: Int
      promo_code: String
      time:String
      ref_id:String
     }

     type Career {
      serial:Int!
      title:String!
      description:String!
      department:String!
      employment_type:String!
      employment_structure:String!
      seo_title:String
      seo_description:String
      location:String!
      created_at:Date!
      status:Boolean!
     }

     type StudentCourseRequest {
      id:Int!
      std_id: Int!
      crsmain_id: Int!
      crsmain_title: String!
      crsmain_type: String!
      crsmain_duration: Float!
      createdAt: Date!
      std_fname: String!
      std_lname: String!
      std_mname: String
      std_email: String!
      std_verifyed:Boolean!
     }

     type CourseCategory {
      serial:Int!
      title: String!
      description: String!
      icon: String!
      created_at: Date!
     }

     type Testimonial {
      serial:Int!
      std_name:String!
      crs_name:String!
      testimonial:String!
      std_img:String!
      created_at:Date!
     }

     type Service {
      serial:Int!
      title:String!
      description:String!
      seo_title:String
      seo_description:String
      long_description:String!
      short_description:String!
      icon:String!
      created_at:Date!
     }

     type Policy {
      serial:Int!
      shot_description:String!
      description:String!
     }

     type Partner {
      serial:Int!
      title:String!
      icon:String!
      created_at:Date!
     }

     type PartnerReq {
        pr_id:Int!
        pr_fname: String!
        pr_lname: String!
        pr_mobile: String!
        pr_email: String!
        pr_company: String!
        pr_company_site: String
        pr_role: String!
        pr_remark: String
     }

     type jobReq {
      serial:Int!
      fname: String!
      lname: String!
      mobile: String!
      email: String!
      linkedin: String!
      career_id: Int!
      role: String!
      resume: String!
      remark: String
      career: Career
    }

    type contactReq {
      serial:Int!
      cfname: String!
      clname: String!
      cmobile: String!
      cemail: String!
      cmessage: String
      cdate: Date
    }

    type PromoStudents {
      serial:Int!
      std_id:Int!
      name:String!
      course: String!
      discount:Int!
      created_at:Date!
    }

    type Promo {
      serial:Int!
      name:String!
      crs_id:Int!
      crs_name: String
      code:String!
      discount:Int!
      upto:Int!
      expiry_date:Date!
      created_at:Date!
      promoStudents: [PromoStudents]
     }

     type StudentAttendanceAdmin {
      std_id: Int!
      std_fname: String!
      std_mname: String
      std_lname: String!
      std_email: String!
      total_atendance: Int!
      today_atendance: Boolean!
      crs_id: Int!
      crs_name: String!
      time: String!
     }

`

const adminQuery = `
    admin:Admin!

    getAdminById: AdminType
    getstudentForAdmin:[AdminStudent]
    getstudentByIdForAdmin(std_id:Int!):AdminStudent
    getstudentCourseByIdForAdmin(serial:Int!):UserCourseAdmin

    getTrainerDataForAdmin:[AdminTrainer]
    getTrainerByIdForAdmin(tr_id:Int!):AdminTrainer

    getCoursesForAdmin:[Course]

    getDataCountForAllTableInAdmin:[totalCount]

    getAllUserInfo:[userInfo]
    getUserInfoById(usr_id:Int!):userInfo

    getUserLog:[logInfo]
    getPaymentInfo:[PaymentInfo]

    getBlogs:[JmkBlog ]
    getBlog(blog_id: Int!): JmkBlog

    getPayments:[studentreceipt]

    getFaqs:[Faq!]!

    getWebModal:webModal!

    getAllCareer: [Career!]!

    getCareer(serial:Int!): Career!

    getStudentCourseRequest: [StudentCourseRequest]

    getCourseCategories: [CourseCategory]
    getCourseCategory(serial:Int!): CourseCategory

    getTestimonials: [Testimonial]
    getTestimonial(serial:Int!): Testimonial

    getServices:[Service]
    getService(serial:Int!): Service

    getPartners:[Partner]
    getPartner(serial:Int!): Partner

    getPartnerShipReq:[PartnerReq]
    getPartnerShipReqById(serial:Int!): PartnerReq

    getJobReqs:[jobReq]
    getJobReqById(serial:Int!): jobReq

    getPolicy: Policy

    getContactReqs:[contactReq]
    getContactReqById(serial:Int!): contactReq

    getPropmo:[Promo]
    getPropmoById(serial:Int!): Promo

    getAttendanceAdmin:[StudentAttendanceAdmin]
    getAttendanceByIdAdmin(std_id:Int!,crs_id:Int!):StudentAttendanceRecod
`

const adminMutation = `

    signinAdmin(data:signinAdminInput!):Token
    updateAdmin(data:updateAdminInput):Admin!

    updateStudentFromAdmin(data:updateStudentFromAdminInput):String!
    updateStudentCourseFromAdmin(data:updateStudentCourseFromAdminInput):String!

    updateTrainerFromDashboard(data:updateTrainerFromDashboard):String!
    createTrainerFromDashboard(data:updateTrainerFromDashboard):String!
    assignTrainerCourseFromDashboard(data:assignTrainerCourseFromDashboard):String!
    removeTrainerCourseFromDashboard(data:assignTrainerCourseFromDashboard):String!

    createNewUser(data:createNewUserInput):String!
    updateSelectedUser(data:updateUserInput):String!
    deleteUserById(usrId:Int!):String!

    
    updatePaymentStatus(pay_id:Int!): String

    updateContactInfo(data:contactInfoUpdate):String


    updateBlog(data:UpdateJmkBlogInput): String
    deleteBlog(blog_id: Int!): String
    addBlog(data:AddJmkBlogInput):  String
    updateStatus(data: updateJmkBlogStatus!): String

    createAndUpdateFaq(data:faqInput):String!
    deleteFaqById(faq_id:Int!):String!

    createAndUpdateWebDetails(data:web_details!):String!

    createAndUpdateModal(data:web_modal!):String!

    createAndUpdateCareer(data:career_input!):String!

    deleteCareer(serial:Int!):String!

    createAndUpdateCourseCategory(data:CourseCategoryInput!):String!

    createAndUpdateTestimonial(data:testimonialInput):String!
    deleteTestimonialById(serial:Int!):String!

    createAndUpdateService(data:serviceInput):String!
    deleteServiceById(serial:Int!):String!

    createAndUpdatePolicy(data:policyInput):String!

    createAndUpdatePartner(data:PartnerInput):String!
    deletePartnerById(serial:Int!):String!

    createAndUpdatePromo(data:PromoInput):String!
    deletePromoById(serial:Int!):String!

    sendEmailByUser(data:MailSendInput!):String!


    updateAttendanceByIdDate(data:updateAttendanceByIdDateInput!):String!
`

const adminResolvers = {

  updateStatus: async (_, { data }, { userId, role }) => {
    if (!userId) return new AuthenticationError("Invalid Token");
    if (role == "admin") {
      const updateBlog = await prisma.jmkblog.update({
        where: {
          blog_id: data.blog_id
        },
        data: {
          status: data.status
        }
      });

      if (!updateBlog) return new ApolloError("Something went wrong");

      return "success";
    }

  },

  deleteBlog: async (_, data, { userId, role }) => {
    if (!userId) return new AuthenticationError("Invalid Token");
    const toDelete = await prisma.jmkblog.findFirst({
      where: {
        blog_id: data.blog_id
      }
    });


    if (role == "admin") {
      await deleteImgToAWS(toDelete.blog_image_key);
      const deletedBlog = await prisma.jmkblog.delete({
        where: {
          blog_id: data.blog_id
        }
      })

      if (!deletedBlog) return new ApolloError("Something went wrong");

      return "success";
    }
  },

  updateBlog: async (_, { data }, { userId, role }) => {

    const { blog_id, ...updatedData } = data;
    if (!userId) return new AuthenticationError("Invalid Token");
    if (role == "admin") {

      const prevBlog = await prisma.jmkblog.findFirst({
        where: { blog_id: blog_id }
      });

      let file;
      if (data.blog_image !== null) {
        await deleteImgToAWS(prevBlog?.blog_image_key);
        file = await uploadImgToAWS(data.blog_image, 'blog');
        if (!file.data) throw new ApolloError("Something went wrong!");
      }

      let logo;
      if (data?.blog_logo !== null) {
        await deleteImgToAWS(prevBlog?.blog_logo_key);
        logo = await uploadImgToAWS(data.blog_logo, 'blog');
        if (!logo.data) throw new ApolloError("Something went wrong!");
      }

      const blog = await prisma.jmkblog.update({
        where: {
          blog_id: blog_id,
        },
        data: {
          ...updatedData,
          updated_at: new Date(),
          blog_image: data?.blog_image != null ? file?.data?.Location : prevBlog.blog_image,
          blog_image_key: data?.blog_image != null ? file?.data?.key : prevBlog.blog_image_key,
          blog_logo: data?.blog_logo != null ? logo?.data?.Location : prevBlog.blog_logo,
          blog_logo_key: data?.blog_logo != null ? logo?.data?.key : prevBlog.blog_logo_key,
        }
      });


      if (!blog) return new ApolloError("Something went wrong");

      return "success";
    }

  },

  addBlog: async (_, { data }, { userId, role }) => {
    if (!userId) return new AuthenticationError("Invalid Token");
    if (role == "admin") {

      let file;
      if (data.blog_image !== null) {
        file = await uploadImgToAWS(data.blog_image, 'blog');
        if (!file.data) throw new ApolloError("Something went wrong!");
      }

      let logo;
      if (data.blog_logo !== null) {
        logo = await uploadImgToAWS(data.blog_logo, 'blog');
        if (!file.data) throw new ApolloError("Something went wrong!");
      }

      const name = data.blog_heading;
      const formattedName = name.toLowerCase().replace(/ /g, '-');
      const blog = await prisma.jmkblog.create({
        data: {
          ...data,
          updated_at: new Date(),
          created_by: userId,
          blog_image: data.blog_image != null ? file?.data?.Location : null,
          blog_image_key: data.blog_image != null ? file?.data?.key : null,
          blog_logo: data.blog_image != null ? logo?.data?.Location : null,
          blog_logo_key: data.blog_image != null ? logo?.data?.key : null,
          blog_slug: formattedName
        }
      });


      if (!blog) return new ApolloError("Something went wrong");

      return "success";
    }
  },

  signinAdmin: async (_, { data }) => {
    if (data?.username) {
      const company = await prisma.jmkcompany.findFirst({ where: { c_username: data?.username } });
      if (!company) throw new AuthenticationError('invalid user credentials');
      const admin = await prisma.jmkuserinfo.findFirst({
        where: { usr_email: data.usr_email, company_id: company.serial },
        include: {
          company: true,
        },
      })
      if (!admin) throw new AuthenticationError('invalid admin credentials')
      const isMatch = data.usr_password == admin.usr_password
      if (!isMatch) throw new AuthenticationError('invalid user credentials')
      const token = jwt.sign({ userId: admin.usr_id, role: 'admin', platform: 'external', c_username: admin?.company?.c_username, c_package_type: admin?.company?.c_username }, process.env.JWT_SECRET_KEY)
      return { token }
    }
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_email: data.usr_email },
      include: {
        company: true,
      },
    })
    if (!admin) throw new AuthenticationError('invalid admin credentials')
    const isMatch = data.usr_password == admin.usr_password
    if (!isMatch) throw new AuthenticationError('invalid user credentials')
    const token = jwt.sign({ userId: admin.usr_id, role: 'admin', platform: 'internal' }, process.env.JWT_SECRET_KEY)
    return { token }
  },

  updateAdmin: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    })
    if (!admin) throw new AuthenticationError('invalid admin')
    const newAdmin = await prisma.jmkuserinfo.update({
      data: { ...data },
      where: { usr_id: userId },
    })
    if (!newAdmin) throw new Error('something went wrong!!')
    return newAdmin
  },

  updateStudentFromAdmin: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (role === 'admin') {
      const admin = await prisma.jmkuserinfo.findFirst({
        where: { usr_id: userId },
      })
      if (!admin) throw new AuthenticationError('invalid admin')

      const student = await prisma.jmkstdinfo.update({
        data: {
          ...data,
        },
        where: { std_id: data.std_id },
      })
      await prisma.jmkstdcrsinfo.create({
        data: {
          crs_id: data.crs_id,
          std_id: data.std_id,
        },
      })
      if (!student) throw new AuthenticationError('Error')
      return 'success'
    }

    if (role === ROLES[2]) {
      const consultancy = await prisma.jmkcompany.findFirst({
        where: { serial: userId },
      })
      if (!consultancy) throw new AuthenticationError('invalid consultancy')
      const student = await prisma.jmkstdinfo.update({
        data: { ...data, cid: userId },
        where: { std_id: data.std_id },
      })
      if (!student) throw new AuthenticationError('Error')
      return 'success'
    }
    throw new AuthenticationError('invalid Access')
  },

  updateStudentCourseFromAdmin: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')

    if (role == 'admin') {
      const admin = await prisma.jmkuserinfo.findFirst({
        where: { usr_id: userId },
      })
      if (!admin) {
        throw new AuthenticationError('invalid admin')
      }
      if (!role) {
        throw new ForbiddenError('You dont have access to create course')
      }
      const student = await prisma.jmkstdcrsinfo.update({
        data: { ...data },
        where: { serial: data.serial },
      })
      if (!student) {
        throw new AuthenticationError('Error')
      }
      return 'success'
    }
    if (role === ROLES[2]) {
      const company = await prisma.jmkcompany.findFirst({
        where: { serial: userId },
      })
      if (!company) throw new AuthenticationError('invalid admin')
      const student = await prisma.jmkstdcrsinfo.update({
        data: { ...data },
        where: { serial: data.serial },
      })
      if (!student) throw new AuthenticationError('Error')
      return 'success'
    }

    throw new AuthenticationError('Invalid access')
  },

  updateTrainerFromDashboard: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')

    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    })

    if (!admin) throw new AuthenticationError('invalid admin')

    const trainer = await prisma.jmktrinfo.update({
      data: { ...data },
      where: { tr_id: parseInt(data.tr_id) },
    })

    if (!trainer) throw new AuthenticationError('Something went wrong')

    return 'success'
  },

  createTrainerFromDashboard: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token');

    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    })

    if (!admin) throw new AuthenticationError('invalid admin')

    const checkEmail = await prisma.jmktrinfo.findFirst({
      where: { tr_email: data.tr_email },
    });

    if (checkEmail) throw new AuthenticationError('trainer already exist with that email');
    data['tr_label'] = 'internal';
    const trainer = await prisma.jmktrinfo.create({ data: { ...data }, })
    if (!trainer) throw new AuthenticationError('Something went wrong')
    return 'success'
  },

  assignTrainerCourseFromDashboard: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token');

    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    })

    if (!admin) throw new AuthenticationError('invalid admin')


    const checkCourse = await prisma.jmktrcrsinfo.findFirst({
      where: { crs_id: data.crs_id, tr_id: data.tr_id },
    });
    if (checkCourse) throw new AuthenticationError('already assign');

    const course = await prisma.jmkcrsinfo.findFirst({ where: { crs_id: data.crs_id } });
    if (!course) throw new AuthenticationError('invalid');

    const trainerCourse = await prisma.jmktrcrsinfo.create({ data: { ...data }, })
    if (!trainerCourse) throw new AuthenticationError('Something went wrong')

    await prisma.jmk_notifications.create({
      data: {
        user_id: trainerCourse.tr_id,
        label1: `Admin`,
        label2: course.crs_name,
        user_type: "Trainer",
        category: 'new_course',
        message: `just assign a new course `,
        link: `/courses`,
        is_read: false,
      }
    });

    return 'success'
  },

  removeTrainerCourseFromDashboard: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token');

    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    })

    if (!admin) throw new AuthenticationError('invalid admin')

    const checkCourse = await prisma.jmktrcrsinfo.findFirst({
      where: { crs_id: data.crs_id, tr_id: data.tr_id },
    });

    if (!checkCourse) throw new AuthenticationError('invalid course');

    const trainerCourse = await prisma.jmktrcrsinfo.delete({ where: { serial: checkCourse.serial } })

    if (!trainerCourse) throw new AuthenticationError('Something went wrong')

    return 'success'
  },

  updateContactInfo: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    })
    if (!admin) throw new AuthenticationError('invalid admin')
    if (role === 'admin') {
      if (data) {
        const contactinfo = await prisma.contactinfo.findFirst({
          where: {
            serial: data.serial,
          },
        })
        if (!contactinfo) throw ApolloError('No such contact Info')
        await prisma.contactinfo.update({
          data: {
            email_address: data.email_address,
            contact_number: data.contact_number,
          },
          where: {
            serial: data.serial,
          },
        })

        return 'success'
      }
    }

    throw new AuthenticationError('invalid access !!')
  },

  createNewUser: async (_, { data }, { userId, role, platform }) => {
    if (!userId) throw new ForbiddenError('invalid token');
    if (!role === 'admin') throw new ForbiddenError('only admin have access  to create');
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
      include: { company: true }
    });
    if (!admin) throw new AuthenticationError('invalid admin');

    let file
    if (data.usr_img_url) {
      file = await uploadImgToAWS(data.usr_img_url, 'admin_users_profilePic/')
      if (!file.data) throw new ApolloError('Something went wrong !')
    }

    if (platform === 'external') {
      const newUser = await prisma.jmkuserinfo.create({
        data: {
          ...data,
          company_id: admin.company.serial,
          usr_img_url: file?.data?.Location ?? null,
          usr_img_key: file?.data?.key ?? '',
        },
      })

      if (!newUser) throw new ApolloError('something went wrong !')

      return 'success'
    }

    const newUser = await prisma.jmkuserinfo.create({
      data: {
        ...data,
        usr_img_url: file?.data?.Location ?? null,
        usr_img_key: file?.data?.key ?? '',
      },
    })

    if (!newUser) throw new ApolloError('something went wrong !')

    return 'success'
  },

  updateSelectedUser: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    })
    if (!admin) throw new AuthenticationError('invalid admin')

    const selectedUser = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: parseInt(data.usr_id) },
    })

    if (!selectedUser) throw new ApolloError('invalid user')

    let file
    if (data.usr_img_url !== null && data.usr_img_url) {
      await deleteImgToAWS(selectedUser?.usr_img_key)

      file = await uploadImgToAWS(data.usr_img_url, 'admin_users_profilePic/')
      if (!file.data) throw new ApolloError('Something went wrong !')
    }
    const user = await prisma.jmkuserinfo.update({
      data: {
        ...data,
        usr_img_url:
          data.usr_img_url !== null
            ? file?.data?.Location
            : selectedUser.usr_img_url,
        usr_img_key:
          data.usr_img_url !== null
            ? file?.data?.key
            : selectedUser.usr_img_key,
      },
      where: {
        usr_id: parseInt(data.usr_id),
      },
    })
    if (!user) throw new ApolloError('something went wrong !')
    return 'success'
  },

  deleteUserById: async (_, { usrId }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')

    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    })
    if (!admin) throw new AuthenticationError('invalid admin')

    const user = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: usrId },
    })

    if (user.usr_role === 'admin') throw new Error('Cannot delete admin')

    await deleteImgToAWS(user?.usr_img_key)
    const selectedUser = await prisma.jmkuserinfo.delete({
      where: { usr_id: usrId },
    })

    if (!selectedUser) throw new ApolloError('something went wrong !')
    return 'success'
  },


  updatePaymentStatus: async (_, { pay_id }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')

    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    })
    if (!admin) throw new AuthenticationError('invalid admin')

    const paymentdet = await prisma.jmktstdpayinfo.findFirst({
      where: {
        pay_id,
      },
    })

    if (!paymentdet) throw new ApolloError('No such payement info exist')
    await prisma.jmktstdpayinfo.update({
      data: {
        pay_verified: !paymentdet.pay_verified,
      },
      where: {
        pay_id,
      },
    })

    return 'success'
  },


  createAndUpdateFaq: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    })
    if (!admin) throw new AuthenticationError('invalid admin');

    if (data.faq_id) {
      const faq = await prisma.jmkfaq.update({ data, where: { faq_id: data.faq_id } });
      if (!faq) throw new ApolloError('someting went wrong');
      return 'updated'
    } else {
      const faq = await prisma.jmkfaq.findFirst({ where: { question: data.question, type: data.type } });
      if (faq) throw new ApolloError('Already exist');
      const newFaq = await prisma.jmkfaq.create({ data });
      if (!newFaq) throw new ApolloError('someting went wrong');
      return 'created'
    }
  },

  deleteFaqById: async (_, { faq_id }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    })
    if (!admin) throw new AuthenticationError('invalid admin');

    const faq = await prisma.jmkfaq.delete({ where: { faq_id } });
    if (!faq) throw new ApolloError('someting went wrong');
    return 'deleted'

  },

  createAndUpdateWebDetails: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    })
    if (!admin) throw new AuthenticationError('invalid admin');

    const webDetails = await prisma.jmk_web_details.findFirst();

    if (!webDetails) {
      const webDetailsCreate = await prisma.jmk_web_details.create({ data });
      if (!webDetailsCreate) throw new ApolloError('someting went wrong');
      return 'create'
    } else {
      const webDetailsUpdate = await prisma.jmk_web_details.update({ data, where: { serial: webDetails.serial } });
      if (!webDetailsUpdate) throw new ApolloError('someting went wrong');
      return 'updated'
    }

  },

  createAndUpdateModal: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token');

    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    });

    if (!admin) throw new AuthenticationError('invalid admin');

    const webModal = await prisma.jmk_web_modal.findFirst();

    let file
    if (data.img) {
      if (webModal?.img_key) {
        await deleteImgToAWS(webModal?.img_key)
      }
      file = await uploadImgToAWS(data.img, 'web_modal/');
      data['img'] = file?.data?.Location ?? null;
      data['img_key'] = file?.data?.key ?? '';
      if (!file.data) throw new ApolloError('Something went wrong !');
    } else {
      data['img'] = webModal.img;
      data['img_key'] = webModal.img_key;
    }

    if (!webModal) {
      const webModalCreate = await prisma.jmk_web_modal.create({ data });
      if (!webModalCreate) throw new ApolloError('someting went wrong');
      return 'create'
    } else {
      const webModalUpdate = await prisma.jmk_web_modal.update({ data, where: { serial: webModal.serial } });
      if (!webModalUpdate) throw new ApolloError('someting went wrong');
      return 'updated'
    }

  },

  createAndUpdateCareer: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token');

    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    });

    if (!admin) throw new AuthenticationError('invalid admin');

    if (data.serial) {
      const oldCareer = await prisma.jmk_web_career.findFirst({ where: { serial: data.serial } });
      if (!oldCareer) throw new ForbiddenError('invalid career id');
      const updateCareer = await prisma.jmk_web_career.update({ data, where: { serial: oldCareer.serial } });
      if (!updateCareer) throw new ApolloError('someting went wrong');
      return 'updated'
    } else {
      const career = await prisma.jmk_web_career.create({ data });
      if (!career) throw new ApolloError('someting went wrong');
      return 'create'
    }
  },

  deleteCareer: async (_, { serial }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    })
    if (!admin) throw new AuthenticationError('invalid admin');

    const career = await prisma.jmk_web_career.delete({ where: { serial } });
    if (!career) throw new ApolloError('someting went wrong');
    return 'deleted'

  },

  createAndUpdateCourseCategory: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token');
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    });
    if (!admin) throw new AuthenticationError('invalid admin credentials');
    if (!data.serial) {
      if (!data.icon) throw new ApolloError('icon is required');
      let file = await uploadImgToAWS(data.icon, 'category_icon/');
      if (!file.data) throw new ApolloError('Something went wrong !');
      data.icon = file?.data?.Location;
      data.icon_key = file?.data?.key;
      const newCategory = await prisma.jmk_crs_categories.create({ data });
      if (!newCategory) throw new ApolloError('Someting went wrong')
    } else {
      const category = await prisma.jmk_crs_categories.findFirst({ where: { serial: data.serial } });
      if (!category) throw new ApolloError('invalid id');
      if (data.icon) {
        await deleteImgToAWS(category.icon_key)
        let file = await uploadImgToAWS(data.icon, 'category_icon/')
        if (!file.data) throw new ApolloError('Something went wrong !')
        data.icon = file?.data?.Location;
        data.icon_key = file?.data?.key;
      } else {
        data.icon = category.icon;
        data.icon_key = category.icon_key;
      }
      const updateCategory = await prisma.jmk_crs_categories.update({ where: { serial: data.serial }, data });
      if (!updateCategory) throw new ApolloError('invalid id')
    }
    return "success"
  },

  createAndUpdateTestimonial: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    })
    if (!admin) throw new AuthenticationError('invalid admin');
    if (data.serial) {
      const oldTestimonial = await prisma.jmk_testimonial.findFirst({ where: { serial: data.serial } });
      if (!oldTestimonial) throw new ApolloError('invalid id');
      if (data.std_img) {
        await deleteImgToAWS(oldTestimonial.std_img_key);
        let file = await uploadImgToAWS(data.std_img, 'testimonial_images/');
        if (!file.data) throw new ApolloError('Something went wrong !');
        data.std_img = file?.data?.Location;
        data.std_img_key = file?.data?.key;
      } else {
        data.std_img = oldTestimonial.std_img;
        data.std_img_key = oldTestimonial.std_img_key;
      }
      const testimonial = await prisma.jmk_testimonial.update({ data, where: { serial: data.serial } });
      if (!testimonial) throw new ApolloError('someting went wrong');
      return 'updated'
    } else {
      if (!data.std_img) throw new ApolloError('image is required');
      let file = await uploadImgToAWS(data.std_img, 'testimonial_images/');
      if (!file.data) throw new ApolloError('Something went wrong !');
      data.std_img = file?.data?.Location;
      data.std_img_key = file?.data?.key;
      const newTestimonial = await prisma.jmk_testimonial.create({ data });
      if (!newTestimonial) throw new ApolloError('someting went wrong');
      return 'created'
    }
  },

  deleteTestimonialById: async (_, { serial }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    })
    if (!admin) throw new AuthenticationError('invalid admin');
    const testimonial = await prisma.jmk_testimonial.delete({ where: { serial } });
    await deleteImgToAWS(testimonial.std_img_key);
    if (!testimonial) throw new ApolloError('someting went wrong');
    return 'deleted'
  },

  createAndUpdateService: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token');
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    });
    if (!admin) throw new AuthenticationError('invalid admin credentials');
    if (!data.serial) {
      if (!data.icon) throw new ApolloError('icon is required');
      let file = await uploadImgToAWS(data.icon, 'service_icon/');
      if (!file.data) throw new ApolloError('Something went wrong !');
      data.icon = file?.data?.Location;
      data.icon_key = file?.data?.key;
      const newService = await prisma.jmk_services.create({ data });
      if (!newService) throw new ApolloError('Someting went wrong')
    } else {
      const service = await prisma.jmk_services.findFirst({ where: { serial: data.serial } });
      if (!service) throw new ApolloError('invalid id');
      if (data.icon) {
        await deleteImgToAWS(service.icon_key)
        let file = await uploadImgToAWS(data.icon, 'service_icon/')
        if (!file.data) throw new ApolloError('Something went wrong !')
        data.icon = file?.data?.Location;
        data.icon_key = file?.data?.key;
      } else {
        data.icon = service.icon;
        data.icon_key = service.icon_key;
      }
      const updateService = await prisma.jmk_services.update({ where: { serial: data.serial }, data });
      if (!updateService) throw new ApolloError('invalid id')
    }
    return "success"
  },

  deleteServiceById: async (_, { serial }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    })
    if (!admin) throw new AuthenticationError('invalid admin');
    const service = await prisma.jmk_services.delete({ where: { serial } });
    await deleteImgToAWS(service.std_img_key);
    if (!service) throw new ApolloError('someting went wrong');
    return 'deleted'
  },

  createAndUpdatePolicy: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token');
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    });
    if (!admin) throw new AuthenticationError('invalid admin credentials');
    const policy = await prisma.jmk_policy.findFirst();
    if (!policy) {
      const newPolicy = await prisma.jmk_policy.create({ data });
      if (!newPolicy) throw new ApolloError('Someting went wrong')
    } else {
      const updatePolicy = await prisma.jmk_policy.update({ where: { serial: policy.serial }, data });
      if (!updatePolicy) throw new ApolloError('invalid id')
    }
    return "success"
  },

  createAndUpdatePartner: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token');
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    });
    if (!admin) throw new AuthenticationError('invalid admin credentials');
    if (!data.serial) {
      if (!data.icon) throw new ApolloError('icon is required');
      let file = await uploadImgToAWS(data.icon, 'partner_icon/');
      if (!file.data) throw new ApolloError('Something went wrong !');
      data.icon = file?.data?.Location;
      data.icon_key = file?.data?.key;
      const newPartner = await prisma.jmk_partner_ui.create({ data });
      if (!newPartner) throw new ApolloError('Someting went wrong')
    } else {
      const partner = await prisma.jmk_partner_ui.findFirst({ where: { serial: data.serial } });
      if (!partner) throw new ApolloError('invalid id');
      if (data.icon) {
        await deleteImgToAWS(partner.icon_key)
        let file = await uploadImgToAWS(data.icon, 'partner_icon/')
        if (!file.data) throw new ApolloError('Something went wrong !')
        data.icon = file?.data?.Location;
        data.icon_key = file?.data?.key;
      } else {
        data.icon = partner.icon;
        data.icon_key = partner.icon_key;
      }
      const updatePartner = await prisma.jmk_partner_ui.update({ where: { serial: data.serial }, data });
      if (!updatePartner) throw new ApolloError('invalid id')
    }
    return "success"
  },

  deletePartnerById: async (_, { serial }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    })
    if (!admin) throw new AuthenticationError('invalid admin');
    const partner = await prisma.jmk_partner_ui.delete({ where: { serial } });
    await deleteImgToAWS(partner.icon_key);
    if (!partner) throw new ApolloError('someting went wrong');
    return 'deleted'
  },

  createAndUpdatePromo: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token');
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    });
    if (!admin) throw new AuthenticationError('invalid admin credentials');
    const promo = await prisma.jmk_promo_code.findFirst({ where: { serial: data.serial } });
    if (!data.serial) {
      const newPromo = await prisma.jmk_promo_code.create({ data });
      if (!newPromo) throw new ApolloError('Someting went wrong')
    } else {
      const updatePomo = await prisma.jmk_promo_code.update({ where: { serial: promo.serial }, data });
      if (!updatePomo) throw new ApolloError('invalid id')
    }
    return "success"
  },

  deletePartnerById: async (_, { serial }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    })
    if (!admin) throw new AuthenticationError('invalid admin');
    const promo = await prisma.jmk_promo_code.delete({ where: { serial } });
    if (!promo) throw new ApolloError('someting went wrong');
    return 'deleted'
  },

  sendEmailByUser: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token');

    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    });

    if (!admin) throw new AuthenticationError('invalid admin');

    if (data.users === 'Students') {
      const students = await prisma.jmkstdinfo.findMany();
      for (let index = 0; index < students.length; index++) {
        const student = students[index];
        await sendMail(student.std_email, data.subject, data.content)
      }
    }

    if (data.users === 'Trainers') {
      const trainers = await prisma.jmktrinfo.findMany();
      for (let index = 0; index < trainers.length; index++) {
        const trainer = trainers[index];
        await sendMail(trainer.tr_email, data.subject, data.content)
      }
    }

    if (data.users === 'Admins') {
      const admins = await prisma.jmkuserinfo.findMany();
      for (let index = 0; index < students.length; index++) {
        const admin = admins[index];
        await sendMail(admin.usr_email, data.subject, data.content)
      }
    }

    return 'send'
  },

  updateAttendanceByIdDate: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    })
    if (!admin) throw new AuthenticationError('invalid admin');

    const crs = await prisma.jmkcrsinfo.findFirst({ where: { crs_id: data.crs_id } });
    if (!crs) throw new Error('Course not found');

    const std = await prisma.jmkstdinfo.findFirst({ where: { std_id: data.std_id } });
    if (!std) throw new Error('Student not found');

    const today = new Date(data.date);
    console.log(today);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const attendance = await prisma.jmk_std_attendance.findFirst({
      where: {
        crs_id: data.crs_id,
        std_id: data.std_id,
        attendance: true,
        created_at: {
          gte: today,
          lt: tomorrow,
        }
      }
    });
    if (!attendance) {
      await prisma.jmk_std_attendance.create({
        data: {
          std_id: data.std_id,
          crs_id: data.crs_id,
          attendance: true,
          created_at: new Date(data.date)
        }
      })
    } else {
      await prisma.jmk_std_attendance.update({
        where: {
          serial: attendance.serial,
        },
        data: {
          attendance: attendance.attendance ? false : true,
        }
      })
    }
    return 'Updated'
  },

}

const adminResolversQuery = {
  admin: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    })
    if (!admin) throw new AuthenticationError('invalid admin credentials')
    return admin
  },

  getBlogs: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (role === 'admin') {
      const blogs = await prisma.jmkblog.findMany({ orderBy: { created_at: 'desc' } });
      return blogs;
    }
  },

  getBlog: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (role === 'admin') {
      const blog = await prisma.jmkblog.findFirst({
        where: {
          blog_id: args.blog_id
        }
      });
      return blog;
    }
  },

  getPayments: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const paymentDet = await prisma.jmkstdreceipt.findMany();
    return paymentDet;
  },

  getstudentForAdmin: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    })
    if (!admin) throw new AuthenticationError('invalid admin credentials')
    if (role === 'admin') {
      let students = []
      const student = await prisma.jmkstdinfo.findMany({ orderBy: { std_join_dt: 'desc' } })
      for (let index = 0; index < student.length; index++) {
        if (student[index].crs_id) {
          const course = await prisma.jmkcrsinfo.findFirst({
            where: { crs_id: student[index].crs_id },
          })
          if (course) {
            students.push({
              ...student[index],
              crs_type: course.crs_type,
              crs_name: course.crs_name,
            })
          } else {
            students.push({
              ...student[index],
            })
          }
        } else {
          students.push({
            ...student[index],
          })
        }
      }
      return students
    }
  },

  getstudentByIdForAdmin: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    })
    if (!admin) throw new AuthenticationError('invalid admin credentials')
    if (role === 'admin') {
      const student = await prisma.jmkstdinfo.findFirst({
        where: { std_id: args.std_id },
      })
      return student
    }
    throw new AuthenticationError('invalid access')
  },

  getTrainerDataForAdmin: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    })
    if (!admin) throw new AuthenticationError('invalid admin credentials')
    if (role === 'admin') {
      const trainers = await prisma.jmktrinfo.findMany({ orderBy: { createdAt: 'desc' } })
      return trainers
    }
  },

  getTrainerByIdForAdmin: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    })
    if (!admin) throw new AuthenticationError('invalid admin credentials')
    if (role === 'admin') {
      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: args.tr_id },
      });

      let join_courses = []
      const join_courses_data = await prisma.jmktrcrsinfo.findMany({
        where: { tr_id: trainer.tr_id },
        include: { 'jmkcrsinfo': 'crs_name' }
      });

      for (let index = 0; index < join_courses_data.length; index++) {
        join_courses.push({
          serial: join_courses_data[index].serial,
          tr_id: join_courses_data[index].tr_id,
          crs_id: join_courses_data[index].jmkcrsinfo.crs_id,
          crs_name: join_courses_data[index].jmkcrsinfo.crs_name
        })
      }

      return { ...trainer, join_courses }
    }
    throw new AuthenticationError('invalid access')
  },

  getstudentCourseByIdForAdmin: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (role === 'admin') {
      const admin = await prisma.jmkuserinfo.findFirst({
        where: { usr_id: userId },
      })
      if (!admin) throw new AuthenticationError('invalid admin credentials')
      const course = await prisma.jmkstdcrsinfo.findFirst({
        where: { serial: args.serial },
        include: { promo: true }
      })
      if (!course) throw new ApolloError('crs not fund !!')
      const selectedCourse = await prisma.jmkcrsmain.findFirst({
        where: {
          crsmain_id: course.crsmain_id,
        },
        select: {
          title: true,
          rate: true
        },
      })
      return { ...course, ...selectedCourse, promo_discount: course.promo?.discount ?? null, promo_code: course.promo?.code ?? null }
    }
    throw new AuthenticationError('invalid access')
  },

  getAdminById: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (role === 'admin') {
      const admin = await prisma.jmkuserinfo.findFirst({
        where: { usr_id: userId },
        include: {
          company: true
        }
      })
      if (!admin) throw new AuthenticationError('invalid admin credentials')
      return admin
    }
  },

  getCoursesForAdmin: async (_, args, { userId, role, platform }) => {
    if (!userId) throw new ForbiddenError('invalid token');
    if (role === 'admin') {
      if (platform === 'external') {
        const admin = await prisma.jmkuserinfo.findFirst({
          where: { usr_id: userId },
        });
        if (!admin?.company_id) throw new AuthenticationError('invalid admin credentials');
        const courses = await prisma.jmkcrsinfo.findMany({ where: { company_id: admin.company_id }, orderBy: { created_at: 'desc' } });
        if (!courses[0]) throw new ApolloError('No data found');
        return courses;
      }
      const admin = await prisma.jmkuserinfo.findFirst({
        where: { usr_id: userId },
      });
      if (!admin) throw new AuthenticationError('invalid admin credentials');
      const courses = await prisma.jmkcrsinfo.findMany({ orderBy: { created_at: 'desc' } });
      if (!courses[0]) throw new ApolloError('No data found');
      return courses;
    }
    throw new AuthenticationError('invalid access')
  },


  getDataCountForAllTableInAdmin: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    });

    if (!admin) throw new AuthenticationError('invalid admin credentials');

    const categories = await prisma.jmk_crs_categories.count();
    const courses = await prisma.jmkcrsinfo.count({ where: { isDeleted: false } });
    const students = await prisma.jmkstdinfo.count({ where: { std_verifyed: true } });
    const trainers = await prisma.jmktrinfo.count({ where: { tr_verifyed: true } });
    const users = await prisma.jmkuserinfo.count();
    const partners = await prisma.jmk_partner_ui.count();
    const services = await prisma.jmk_services.count();
    const blogs = await prisma.jmkblog.count({ where: { status: true } });

    let tableCount = [];

    const access = JSON.parse(admin.usr_access ?? '[]');

    if (access) {
      const findDashboardAccess = access.find((item) => item.name === 'Dashboard');
      if (findDashboardAccess.access?.[0].read) {

        const findCoursesAccess = access.find((item) => item.name === 'Courses');
        if (findCoursesAccess) {
          const findCategoryAccess = findCoursesAccess.option.find((item) => item.name === 'Categories');
          if (findCategoryAccess.access?.[0].read) {
            tableCount.push({
              name: 'Categories',
              count: categories ?? 0,
              link: '/categories',
            })
          }
          const findRunningCourseAccess = findCoursesAccess.option.find((item) => item.name === 'Running Courses');
          if (findRunningCourseAccess.access?.[0].read) {
            tableCount.push({
              name: 'Courses',
              count: courses ?? 0,
              link: '/courses',
            })
          }
        }

        const findStakeHoldersAccess = access.find((item) => item.name === 'StakeHolders');
        if (findStakeHoldersAccess) {
          const findAdminsAccess = findStakeHoldersAccess.option.find((item) => item.name === 'Admins');
          if (findAdminsAccess.access?.[0].read) {
            tableCount.push({
              name: 'Admins',
              count: users ?? 0,
              link: '/users',
            })
          }
          const findPartnersAccess = findStakeHoldersAccess.option.find((item) => item.name === 'Partners');
          if (findPartnersAccess.access?.[0].read) {
            tableCount.push({
              name: 'Partners (UI)',
              count: partners ?? 0,
              link: '/partners',
            })
          }
        }

        const findRegistrationInfoAccess = access.find((item) => item.name === 'RegistrationInfo');
        if (findRegistrationInfoAccess) {
          const findStudentsAccess = findRegistrationInfoAccess.option.find((item) => item.name === 'Course Registration');
          if (findStudentsAccess.access?.[0].read) {
            tableCount.push({
              name: 'Students',
              count: students ?? 0,
              link: '/students',
            })
          }
          const findTrainerAccess = findRegistrationInfoAccess.option.find((item) => item.name === 'Trainer Request');
          if (findTrainerAccess.access?.[0].read) {
            tableCount.push({
              name: 'Trainers',
              count: trainers ?? 0,
              link: '/trainer',
            })
          }
        }

        const findServicesAccess = access.find((item) => item.name === 'Services');
        if (findServicesAccess.access?.[0].read) {
          tableCount.push({
            name: 'Services',
            count: services ?? 0,
            link: '/services',
          })
        }

        const findBlogAccess = access.find((item) => item.name === 'Blog');
        if (findBlogAccess.access?.[0].read) {
          tableCount.push({
            name: 'Blogs',
            count: blogs ?? 0,
            link: '/blogs',
          })
        }
      }
    }
    return tableCount
  },

  getAllUserInfo: async (_, args, { userId, role, platform }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
      include: { company: true }
    })
    if (!admin) throw new AuthenticationError('invalid admin credentials')
    if (platform === 'external') {
      const allUser = await prisma.jmkuserinfo.findMany({ where: { company_id: admin.company.serial }, orderBy: { created_at: 'desc' }, include: { company: true } })
      return allUser
    }
    const allUser = await prisma.jmkuserinfo.findMany({ orderBy: { created_at: 'desc' }, include: { company: true } })
    return allUser
  },

  getUserInfoById: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
      include: { company: true }
    })
    if (!admin) throw new AuthenticationError('invalid admin credentials')
    const user = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: args.usr_id },
      include: { company: true }
    })
    return user
  },

  getUserLog: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    })
    if (!admin) throw new AuthenticationError('invalid admin credentials')
    const logs = await prisma.jmkloginfo.findMany({})
    const logging = []
    logs.map((log) => {
      let monitor = log.log_desc.split(' ')
      logging.push({
        log_id: log.log_id,
        ip: monitor[0],
        user_id: monitor[1],
        role: monitor[2],
        method: monitor[3],
        time: `${monitor[4]} ${monitor[5]} ${monitor[6]} ${monitor[7]} ${monitor[8]} ${monitor[9]} ${monitor[10]} ${monitor[11]}`,
      })
    })
    return logging
  },

  getPaymentInfo: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    })
    if (!admin) throw new AuthenticationError('invalid admin credentials')
    const paymentInfos = []
    const paymentsInfo = await prisma.jmkstdcrsinfo.findMany({})

    for (let i = 0; i < paymentsInfo.length; i++) {
      if (paymentsInfo[i]?.crsmain_id && paymentsInfo[i].amt_paid) {
        const course = await prisma.jmkcrsmain.findUnique({
          where: {
            crsmain_id: paymentsInfo[i]?.crsmain_id,
          },
        })
        const student = await prisma.jmkstdinfo.findFirst({
          where: {
            std_id: paymentsInfo[i]?.std_id,
          },
        })
        paymentInfos.push({
          pay_id: paymentsInfo[i].serial,
          payment_date: paymentsInfo[i].createdAt,
          pay_amount: paymentsInfo[i].amt_paid ?? 0,
          std_email: student?.std_email,
          transaction_id: paymentsInfo[i].ref_id ?? 'empty',
          crs_name: course?.title,
          pay_verified: paymentsInfo[i].std_crs_verirfy,
        })
      }
    }
    return paymentInfos
  },

  getFaqs: async (_, { args }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    })
    if (!admin) throw new AuthenticationError('invalid admin credentials')
    const faq = await prisma.jmkfaq.findMany();
    if (!faq) throw new ApolloError('Data Not Found')
    return faq
  },

  getWebModal: async (_, { args }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    })
    if (!admin) throw new AuthenticationError('invalid admin credentials')
    const modal = await prisma.jmk_web_modal.findFirst();
    if (!modal) throw new ApolloError('Data Not Found')
    return modal
  },

  getAllCareer: async (_, { args }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token');
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    });
    if (!admin) throw new AuthenticationError('invalid admin credentials');
    const careers = await prisma.jmk_web_career.findMany({ orderBy: { created_at: 'desc' } });
    if (!careers) throw new ApolloError('Data Not Found')
    return careers
  },

  getCareer: async (_, { serial }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token');
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    });
    if (!admin) throw new AuthenticationError('invalid admin credentials');
    const career = await prisma.jmk_web_career.findFirst({ where: { serial } });
    if (!career) throw new ApolloError('Data Not Found')
    return career
  },

  getStudentCourseRequest: async (_, { serial }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token');
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    });
    if (!admin) throw new AuthenticationError('invalid admin credentials');
    const data = [];
    const requestCourse = await prisma.jmkstdcrsinfo.findMany({ where: { crs_id: null }, take: 200, orderBy: { createdAt: 'desc' } });
    for (let index = 0; index < requestCourse.length; index++) {
      if (requestCourse[index].std_id && requestCourse[index].crsmain_id) {
        const std = await prisma.jmkstdinfo.findFirst({ where: { std_id: requestCourse[index].std_id } });
        const crs = await prisma.jmkcrsmain.findFirst({ where: { crsmain_id: requestCourse[index].crsmain_id } });
        if (std && crs) {
          data.push({
            id: requestCourse[index].serial,
            std_id: std.std_id,
            crsmain_id: crs.crsmain_id,
            crs_name: std.crs_name,
            std_fname: std.std_fname,
            std_lname: std.std_lname,
            std_mname: std.std_mname,
            std_email: std.std_email,
            std_verifyed: std.std_verifyed,
            crsmain_title: crs.title,
            crsmain_type: crs.label,
            crsmain_duration: crs.duration,
            createdAt: requestCourse[index].createdAt
          })
        }
      }
    }
    if (!data) throw new ApolloError('Data Not Found')
    return data
  },

  getCourseCategories: async (_, { args }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token');
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    });
    if (!admin) throw new AuthenticationError('invalid admin credentials');
    const categories = await prisma.jmk_crs_categories.findMany({ orderBy: { created_at: 'desc' } });
    if (!categories) throw new ApolloError('Data Not Found')
    return categories
  },

  getCourseCategory: async (_, { serial }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token');
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    });
    if (!admin) throw new AuthenticationError('invalid admin credentials');
    const category = await prisma.jmk_crs_categories.findFirst({ where: { serial } });
    if (!category) throw new ApolloError('Data Not Found')
    return category
  },


  getTestimonials: async (_, { args }, { userId, role }) => {
    // if (!userId) throw new ForbiddenError('invalid token');
    // const admin = await prisma.jmkuserinfo.findFirst({
    //   where: { usr_id: userId},
    // });
    // if (!admin) throw new AuthenticationError('invalid admin credentials');
    const testimonials = await prisma.jmk_testimonial.findMany({ orderBy: { created_at: 'desc' } });
    if (!testimonials) throw new ApolloError('Data Not Found')
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

  getServices: async (_, { args }, { userId, role }) => {
    // if (!userId) throw new ForbiddenError('invalid token');
    // const admin = await prisma.jmkuserinfo.findFirst({
    //   where: { usr_id: userId},
    // });
    // if (!admin) throw new AuthenticationError('invalid admin credentials');
    const services = await prisma.jmk_services.findMany({ orderBy: { created_at: 'desc' } });
    if (!services) throw new ApolloError('Data Not Found')
    return services
  },

  getService: async (_, { serial }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token');
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    });
    if (!admin) throw new AuthenticationError('invalid admin credentials');
    const service = await prisma.jmk_services.findFirst({ where: { serial } });
    if (!service) throw new ApolloError('Data Not Found')
    return service
  },

  getPolicy: async (_, { serial }, { userId, role }) => {
    // if (!userId) throw new ForbiddenError('invalid token');
    // const admin = await prisma.jmkuserinfo.findFirst({
    //   where: { usr_id: userId},
    // });
    // if (!admin) throw new AuthenticationError('invalid admin credentials');
    const policy = await prisma.jmk_policy.findFirst();
    if (!policy) throw new ApolloError('Data Not Found')
    return policy
  },

  getPartners: async (_, { args }, { userId, role }) => {
    // if (!userId) throw new ForbiddenError('invalid token');
    // const admin = await prisma.jmkuserinfo.findFirst({
    //   where: { usr_id: userId},
    // });
    // if (!admin) throw new AuthenticationError('invalid admin credentials');
    const partners = await prisma.jmk_partner_ui.findMany({ orderBy: { created_at: 'desc' } });
    if (!partners) throw new ApolloError('Data Not Found')
    return partners
  },

  getPartner: async (_, { serial }, { userId, role }) => {
    // if (!userId) throw new ForbiddenError('invalid token');
    // const admin = await prisma.jmkuserinfo.findFirst({
    //   where: { usr_id: userId},
    // });
    // if (!admin) throw new AuthenticationError('invalid admin credentials');
    const partner = await prisma.jmk_partner_ui.findFirst({ where: { serial } });
    if (!partner) throw new ApolloError('Data Not Found')
    return partner
  },

  getPartnerShipReq: async (_, { args }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token');
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    });
    if (!admin) throw new AuthenticationError('invalid admin credentials');
    const partners = await prisma.jmkpartnerReq.findMany({ orderBy: { createdAt: 'desc' } });
    if (!partners) throw new ApolloError('Data Not Found')
    return partners
  },

  getPartnerShipReqById: async (_, { serial }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token');
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    });
    if (!admin) throw new AuthenticationError('invalid admin credentials');
    const partner = await prisma.jmkpartnerReq.findFirst({ where: { pr_id: serial } });
    if (!partner) throw new ApolloError('Data Not Found')
    return partner
  },

  getJobReqs: async (_, { args }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token');
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    });
    if (!admin) throw new AuthenticationError('invalid admin credentials');
    const jonReq = await prisma.jmkjobReq.findMany({ orderBy: { createdAt: 'desc' }, include: { career: true } });
    if (!jonReq) throw new ApolloError('Data Not Found')
    return jonReq
  },

  getJobReqById: async (_, { serial }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token');
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    });
    if (!admin) throw new AuthenticationError('invalid admin credentials');
    const jonReq = await prisma.jmkjobReq.findFirst({ where: { serial }, orderBy: { createdAt: 'desc' }, include: { career: true } });
    if (!jonReq) throw new ApolloError('Data Not Found')
    return jonReq
  },

  getContactReqs: async (_, { args }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token');
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    });
    if (!admin) throw new AuthenticationError('invalid admin credentials');
    const contactReq = await prisma.jmkcontact.findMany({ orderBy: { cdate: 'desc' } });
    if (!contactReq) throw new ApolloError('Data Not Found')
    return contactReq
  },

  getContactReqById: async (_, { serial }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token');
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    });
    if (!admin) throw new AuthenticationError('invalid admin credentials');
    const contactReq = await prisma.jmkcontact.findFirst({ where: { serial }, orderBy: { cdate: 'desc' } });
    if (!contactReq) throw new ApolloError('Data Not Found')
    return contactReq
  },

  getPropmo: async (_, { args }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token');
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    });
    if (!admin) throw new AuthenticationError('invalid admin credentials');
    let data = [];
    const promo = await prisma.jmk_promo_code.findMany({ orderBy: { created_at: 'desc' } });
    for (let index = 0; index < promo.length; index++) {
      const item = promo[index];
      const course = await prisma.jmkcrsinfo.findFirst({ where: { crs_id: item.crs_id } });
      data.push({ ...item, crs_name: course.crs_name })
    }
    if (!data?.[0]) throw new ApolloError('Data Not Found')
    return data
  },

  getPropmoById: async (_, { serial }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token');
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    });
    if (!admin) throw new AuthenticationError('invalid admin credentials');
    let students = [];
    const promo = await prisma.jmk_promo_code.findFirst({ where: { serial }, include: { jmkstdcrsinfo: true } });
    for (let index = 0; index < promo.jmkstdcrsinfo.length; index++) {
      const element = promo.jmkstdcrsinfo[index];
      const std = await prisma.jmkstdinfo.findFirst({ where: { std_id: element.std_id } });
      if (element.crs_id) {
        const crs = await prisma.jmkcrsinfo.findFirst({ where: { crs_id: element.crs_id } });
        students.push({
          serial: element.serial,
          name: std.std_fname + ' ' + std.std_mname + ' ' + std.std_lname,
          course: crs.crs_name,
          discount: promo.discount,
          created_at: element.createdAt,
          std_id: element.std_id,
        })
      }
    }
    if (!promo) throw new ApolloError('Data Not Found')
    return { ...promo, promoStudents: students }
  },

  getAttendanceAdmin: async (_, { serial }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token');
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    });
    if (!admin) throw new AuthenticationError('invalid admin credentials');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    let attendanceData = [];
    const students = await prisma.jmkstdcrsinfo.findMany({ where: { std_crs_verirfy: true } });
    if (students?.[0]) {
      for (let index = 0; index < students.length; index++) {
        const element = students[index];
        if (element && element.crs_id !== 59 && element.crs_id) {
          const std = await prisma.jmkstdinfo.findFirst({ where: { std_id: element.std_id } });
          if (std?.crs_id) {
            const crs = await prisma.jmkcrsinfo.findFirst({ where: { crs_id: std.crs_id } });
            if (std) {
              const attendance = await prisma.jmk_std_attendance.findFirst({
                where: {
                  crs_id: std.crs_id, std_id: element.std_id, created_at: {
                    gte: today,
                    lt: tomorrow,
                  }
                }
              });
              const attendanceCount = await prisma.jmk_std_attendance.count({ where: { crs_id: std.crs_id, std_id: element.std_id } });
              attendanceData.push({
                std_id: std.std_id,
                std_fname: std.std_fname,
                std_mname: std.std_mname,
                std_lname: std.std_lname,
                std_email: std.std_email,
                total_atendance: attendanceCount,
                today_atendance: attendance ? true : false,
                crs_id: crs.crs_id,
                crs_name: crs.crs_name,
                time: crs.time
              })
            }
          }
        }
      }
    }
    return attendanceData
  },

  getAttendanceByIdAdmin: async (_, { std_id, crs_id }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token');
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    });
    if (!admin) throw new AuthenticationError('invalid admin credentials');

    const allAttendance = []

    const crs = await prisma.jmkcrsinfo.findFirst({ where: { crs_id } });
    if (!crs) throw new Error('Course not found');

    const std = await prisma.jmkstdinfo.findFirst({ where: { std_id } });
    if (!std) throw new Error('Student not found');

    let totalClasses = Math.ceil((new Date() - new Date(crs.crs_nxt_st_date)) / (1000 * 60 * 60 * 24)) ?? 0;

    if (new Date(crs.crs_nxt_st_date).getTime() > Date.now()) {
      return []
    }

    totalClasses = (crs.crs_duration * 30) < totalClasses ? (crs.crs_duration * 30) : totalClasses;

    const total_attendance = await prisma.jmk_std_attendance.count({ where: { crs_id: std.crs_id, std_id } }) ?? 0;

    const startDate = new Date(crs.crs_nxt_st_date);
    for (let index = 0; index < totalClasses; index++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + index);

      const tomorrow = new Date(currentDate);
      tomorrow.setDate(currentDate.getDate() + 1);
      const attendance = await prisma.jmk_std_attendance.findFirst({
        where: {
          attendance: true,
          crs_id: std.crs_id, std_id, created_at: {
            gte: currentDate,
            lt: tomorrow,
          }
        }
      });

      allAttendance.push({
        serial: index,
        attendance: attendance ? true : false,
        created_at: currentDate,
        std_id,
      })
    }

    const total_duration = crs.crs_duration * 30 ?? 0;
    const total_absent = totalClasses - total_attendance ?? 0;
    return {
      attendance: allAttendance,
      total_duration,
      total_absent,
      total_attendance,
      crs_id: crs.crs_id,
      std_fname: std.std_fname,
      std_lname: std.std_lname,
      std_email: std.std_email,
    }
  },
}

export {
  adminQueryTypesAndInputs,
  adminQuery,
  adminMutation,
  adminResolvers,
  adminResolversQuery,
}
