import {
  ApolloError,
  AuthenticationError,
  ForbiddenError,
} from 'apollo-server-express'
import prisma from '../../database.js'
import jwt from 'jsonwebtoken'
import { uploadImgToAWS, deleteImgToAWS } from '../../utils/imageHandler.js'
import { ROLES } from '../../utils/helper.js'

const adminQueryTypesAndInputs = `

    input signinAdminInput {
        usr_email: String!
        usr_password: String!
    }

    input signupAdminInput {
        usr_email: String!
        usr_password: String!
        usr_role: String!
        usr_code:String
    }

    input updateAdminInput {
        usr_email: String
        usr_password: String
        usr_role: String
        usr_code:String
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

     input projectInput{
      proj_id:Int
      crs_id:Int!
      proj_title:String!
      proj_desc:String!
      proj_git_link:String!
     }

     type projectInfo{
      proj_id:Int!
      crs_id:Int!
      proj_title:String!
      proj_desc:String!
      proj_git_link:String!
      project_course_title:String
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
        std_due: String
        std_verifyed: Boolean!
        join_courses: [UserCourseAdmin]
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
        tr_password:String!
        tr_resume:String
        tr_github:String
        tr_linkedin:String
        tr_resume_key:String
        
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

     type EventReg{
      reg_id:Int
      reg_name:String
      reg_date:Date
      event_name: String
      reg_email:String
      reg_phone:String
     }

     type devExpDet{
        company_name:String
        exp_desc:String
        exp_role_pos:String
        exp_start_date:Date
        exp_end_date:Date
     }

     type adminDeveloper {
        developer_id:ID!
        developer_type: String!
        developer_fname: String!
        developer_mname: String
        developer_lname: String!
        developer_phone: String!
        developer_tech1: String!
        developer_country: String!
        developer_email: String!
        developer_password: String!
        developer_add_house_no: String
        developer_add_street: String
        developer_add_city: String
        developer_add_ward_no: Int
        developer_add_district: String
        developer_add_province: String
        developer_add_zone: String
        dev_tech_det:[devTechDet]
        dev_proj_det:[devProjDet]
        dev_exp_det:[devExpDet]
       
     }

     type staticCourse{
      crsmain_id:ID!
      crsmain_overview:String
      crsmain_duration:Int
      crsmain_img_url:String
      crsmain_rate:Int
      crsmain_desc:String
      crsmain_title:String
      crsmain_type:String
      cramain_del_mod:String
      cramain_seo_title:String
      cramain_seo_desc:String
     }
     
     type staticCourseDetails{
      crsdet_id:Int!
      crsdet_title:String
      crsmain_id:Int!
      crsdet_sub_title:String
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
     }

     type eventsInfo{
        events_id:Int!
        event_date:Date
        event_desc:String
        event_organizer:String
        event_time:String
        event_loc:String
        event_title:String
        event_img_url:String
        event_img_key:String
        event_hour:Int
        event_type:String
     }

     type eventRegisteredInfo{
         reg_id:Int!
         reg_name:String
         reg_date:Date
         event_id:Int!
         reg_email:String
         reg_phone:String
     }

     type upComingCourse{
      start_date: Date!
      crsmain_id: Int!
      serial: Int!
      crsmain_title: String
      crsmain_duration: Int
      crsmain_type: String
     }


     type followUpStudent{
      std_name:String
      std_phone:String
      std_address:String
      stdfeedbk:String
      program:String
      schcol:String
      follow_up:Boolean
      srno:Int

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
      author: String
      blog_meta_title: String
      blog_meta_description: String
      blog_meta_keyword: String
      status: Boolean
    }
        

     input createStaticCourseInput{
      crsmain_overview:String
      crsmain_duration:Int
      crsmain_img_url:Upload
      crsmain_rate:Int
      crsmain_desc:String
      crsmain_title:String
      crsmain_type:String
      cramain_del_mod:String
      cramain_seo_title:String
      cramain_seo_desc:String
     }
     input updateStaticCourseInput{
      crsmain_id:Int!
      crsmain_overview:String
      crsmain_duration:Int
      crsmain_rate:Int
      crsmain_img_url:Upload
      crsmain_img_key:String
      crsmain_desc:String
      crsmain_title:String
      crsmain_type:String
      cramain_del_mod:String
      cramain_seo_title:String
      cramain_seo_desc:String
     }


      input deleteStaticCourseInput {
       crsmain_id: Int!
      }

      input addStaticCourseDetailsInput{
         crsdet_title:String!
         crsdet_sub_title:String
         crsmain_id:Int!
      }
      input updateStaticCourseDetailsInput{
         crsdet_id:Int
         crsdet_title:String
         crsdet_sub_title:String
         crsmain_id:Int!
      }

     input updateDeveloperFromDashboard {
        developer_id: Int!
        developer_fname: String
        developer_mname: String
        developer_lname: String
        developer_phone: String
        developer_email: String
        developer_password: String
        developer_type: String
        developer_country: String
        developer_add_house_no: String
        developer_add_street: String
        developer_add_city: String
        developer_add_ward_no: Int
        developer_add_district: String
        developer_add_province: String
        developer_add_zone: String

     }
  
     input updateTrainerFromDashboard {
        tr_id: Int!
        tr_verifyed:Boolean!
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
      usr_img_url:Upload
     }

     input createNewEventInput {
      event_title:String
      event_date:Date
      event_desc:String
      event_organizer:String
      event_loc:String
      event_hour:Int
      event_type:String
      event_time:String
      event_img_url:Upload
     }

     input updateEventInput {
  
      events_id:Int!
      event_date:Date
      event_desc:String
      event_organizer:String
      event_time:String
      event_loc:String
      event_title:String
      event_img_url:Upload
      event_hour:Int
      event_type:String


     }
     input upcomingCourseInput{
      crsmain_id: Int!
      start_date: Date!
     }
     input updateUpcomingCourseInput{
      crsmain_id: Int!
      start_date: Date!
      serial: Int!
     }

     input createNewEventUser{
      reg_name:String
      event_id:Int!
      reg_email:String
      reg_phone:String
     }

     input contactInfoUpdate{
      serial:Int!
      email_address:String!
      contact_number:String!
     }


     type UserCourseAdmin {
      std_id:Int!
      serial:Int!
      crsmain_id:Int
      crs_id:Int
      crs_start_dt:Date
      crs_rate:String
      crsmain_title:String
      discount: String
      amt_paid:String
      amt_due:String
      crs_complete:String
      crs_complete_date:Date
      std_crs_verirfy:Boolean
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

    getDeveloperDataForAdmin:[adminDeveloper]
    getDeveloperByIdForAdmin(developer_id:Int!):adminDeveloper

    getStaticCoursesDataForAdmin:[staticCourse]
    getStaticCourseByIdForAdmin(crsmain_id:Int!):staticCourse
    getStaticCourseDetailsByIdForAdmin(crsmain_id:Int!):[staticCourseDetails]
    getDataCountForAllTableInAdmin:[totalCount]

    getAllUserInfo:[userInfo]
    getUserInfoById(usr_id:Int!):userInfo

    getAllEvents:[eventsInfo]
    getEventsInfoById(events_id:Int!):eventsInfo

    getAllEventRegisteredUser:[eventRegisteredInfo]

    getUpcomingCourses:[upComingCourse]
    getUpcomingCourseById(serial:Int!):upComingCourse
    getUserLog:[logInfo]
    getPaymentInfo:[PaymentInfo]

    getProjectInfo:[projectInfo]
    getProjectInfoById(proj_id:Int!):projectInfo


    getFolloUpStudent:[followUpStudent]
    getAllEventRegister:[EventReg]


    getBlogs:[JmkBlog ]
    getBlog(blog_id: Int!): JmkBlog

    getPayments:[studentreceipt]


`

const adminMutation = `

    signinAdmin(data:signinAdminInput!):Token
    signupAdmin(data:signupAdminInput!):Token
    updateAdmin(data:updateAdminInput):Admin!

    updateStudentFromAdmin(data:updateStudentFromAdminInput):String!
    updateStudentCourseFromAdmin(data:updateStudentCourseFromAdminInput):String!

    updateTrainerFromDashboard(data:updateTrainerFromDashboard):String!
    updateDeveloperFromDashboard(data:updateDeveloperFromDashboard ):String!

    createStaticCourse(data:createStaticCourseInput):Int!
    updateStaticCourse(data:updateStaticCourseInput):String!
    deleteStaticCourse(data:deleteStaticCourseInput):String
    addStaticCourseDetails(data:[addStaticCourseDetailsInput]):String!
    updateStaticCourseDetails(data:[updateStaticCourseDetailsInput]):String!
    deleteStaticCourseDetailTitleById(crsDetId:Int!):String!

    createNewUser(data:createNewUserInput):String!
    updateSelectedUser(data:updateUserInput):String!
    deleteUserById(usrId:Int!):String!

    createNewEvent(data:createNewEventInput):String!
    updateSelectedEvent(data:updateEventInput):String!
    deleteEventById(eventId:Int!):String!

    createNewProject(data:projectInput):String!
    updateSelectedProject(data:projectInput):String!
    deleteProjectById(proj_id:Int!):String!
  

    addUpcomingCourse(data:upcomingCourseInput):String!
    updateSelectedUpcomingCourse(data:updateUpcomingCourseInput):String!
    deleteUpcomingCourseById(serial:Int!): String!

    registerNewEventUser(data:createNewEventUser!):String
    
    updatePaymentStatus(pay_id:Int!): String
    updateFollowUpStatus(srno:Int!):String

    updateContactInfo(data:contactInfoUpdate):String


    updateBlog(data:UpdateJmkBlogInput): String
    deleteBlog(blog_id: Int!): String
    addBlog(data:AddJmkBlogInput):  String
    updateStatus(data: updateJmkBlogStatus!): String

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
    console.log(data)
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

      const blog = await prisma.jmkblog.update({
        where: {
          blog_id: blog_id,
        },
        data: {
          ...updatedData,
          updated_at: new Date(),
          blog_image: data.blog_image != null ? file?.data?.Location : prevBlog.blog_image,
          blog_image_key: data.blog_image != null ? file?.data?.Location : prevBlog.blog_image_key,
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

      const name = data.blog_heading;
      const formattedName = name.toLowerCase().replace(/ /g, '-');
      console.log(formattedName);


      const blog = await prisma.jmkblog.create({
        data: {
          ...data,
          updated_at: new Date(),
          created_by: userId,
          blog_image: data.blog_image != null ? file?.data?.Location : null,
          blog_image_key: data.blog_image != null ? file?.data?.Location : null,
          blog_slug: formattedName
        }
      });


      if (!blog) return new ApolloError("Something went wrong");

      return "success";
    }
  },

  signinAdmin: async (_, { data }) => {
    console.log(data)

    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_email: data.usr_email },
    })
    if (!admin) throw new AuthenticationError('invalid admin credentials')
    const isMatch = data.usr_password == admin.usr_password
    if (!isMatch) throw new AuthenticationError('invalid user credentials')
    const token = jwt.sign(
      { userId: admin.usr_id, role: admin.usr_role },
      process.env.JWT_SECRET_KEY
    )
    return { token }
  },

  signupAdmin: async (_, { data }, { userId }) => {
    if (!userId) throw new AuthenticationError('invalid Token')
    const suAdmin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId },
    })
    if (!suAdmin) throw new AuthenticationError('invalid admin credentials')
    if (suAdmin.usr_role !== 'admin')
      throw new AuthenticationError("You don't have acess to create admin")
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_email: data.usr_email },
    })
    if (admin)
      throw new AuthenticationError('admin already exist with that email')
    const newAdmin = await prisma.jmkuserinfo.create({
      data: { ...data },
    })
    const token = jwt.sign(
      { userId: newAdmin.usr_id, role: data.usr_role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '1d' }
    )
    await sendMail(newAdmin.usr_email, 'Successfully Register ', registerrHTML)
    await sendMail(
      'riwaz@jamuntek.com',
      'New Admin Created !',
      newUserSignupNotification(newUser, course.crs_name)
    )
    await sendMail(
      'jenish@jamuntek.com',
      'New Admin Created !',
      newUserSignupNotification(newUser, course.crs_name)
    )
    return { token }
  },

  updateAdmin: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
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
        where: { usr_id: userId, usr_role: role },
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
      const consultancy = await prisma.jmkconsulinfo.findFirst({
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
        where: { usr_id: userId, usr_role: role },
      })
      if (!admin) {
        throw new AuthenticationError('invalid admin')
      }
      if (!admin.usr_role) {
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
      const consultancy = await prisma.jmkconsulinfo.findFirst({
        where: { serial: userId },
      })
      if (!consultancy) throw new AuthenticationError('invalid admin')
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
      where: { usr_id: userId, usr_role: role },
    })

    if (!admin) throw new AuthenticationError('invalid admin')

    const trainer = await prisma.jmktrinfo.update({
      data: { ...data },
      where: { tr_id: parseInt(data.tr_id) },
    })

    if (!trainer) throw new AuthenticationError('Something went wrong')

    return 'success'
  },

  createStaticCourse: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin')
    let file
    if (data.crsmain_img_url) {
      file = await uploadImgToAWS(data.crsmain_img_url, 'webimages/')
      if (!file.data) throw new ApolloError('Something went wrong !')
    }
    const newStaticCourse = await prisma.jmkcrsmain.create({
      data: {
        ...data,
        crsmain_img_url: file?.data?.Location ?? null,
        crsmain_img_key: file?.data?.key ?? '',
      },
    })

    if (!newStaticCourse) throw new ApolloError('something went wrong !')
    return newStaticCourse.crsmain_id
  },

  updateStaticCourse: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin')
    const selectedStaticCourse = await prisma.jmkcrsmain.findFirst({
      where: { crsmain_id: parseInt(data.crsmain_id) },
    })
    if (!selectedStaticCourse) throw new ApolloError('invalid course')

    let file
    if (data.crsmain_img_url !== null) {
      await deleteImgToAWS(selectedStaticCourse?.crsmain_img_key)

      file = await uploadImgToAWS(data.crsmain_img_url, 'webimages/')
      if (!file.data) throw new ApolloError('Something went wrong !')
    }
    const course = await prisma.jmkcrsmain.update({
      data: {
        ...data,
        crsmain_img_url:
          data.crsmain_img_url !== null
            ? file?.data?.Location
            : selectedStaticCourse.crsmain_img_url,
        crsmain_img_key:
          data.crsmain_img_url !== null
            ? file?.data?.key
            : selectedStaticCourse.crsmain_img_key,
      },
      where: {
        crsmain_id: parseInt(data.crsmain_id),
      },
    })
    if (!course) throw new ApolloError('something went wrong !')
    return 'success'
  },

  deleteStaticCourse: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')

    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin')
    const crs = await prisma.jmkcrsmain.findFirst({
      where: { crsmain_id: data.crsmain_id },
    })
    await deleteImgToAWS(crs?.crsmain_img_key)
    const deleteStaticCourse = await prisma.jmkcrsmain.delete({
      where: { crsmain_id: data.crsmain_id },
    })

    const staticCourseDetails = await prisma.jmkcrsdet.findMany({
      where: { crsmain_id: data.crsmain_id },
    })

    staticCourseDetails.forEach(async (element) => {
      const deleteStaticCourseDetails = await prisma.jmkcrsdet.delete({
        where: { crsmain_id: element.crsmain_id },
      })
      if (!deleteStaticCourseDetails)
        throw new ApolloError('something went wrong !')
    })
    if (!deleteStaticCourse) throw new ApolloError('something went wrong !')
    return 'success'
  },

  addStaticCourseDetails: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin')

    data.forEach(async (element) => {
      const newStaticCourseDetails = await prisma.jmkcrsdet.create({
        data: { ...element },
      })
      if (!newStaticCourseDetails)
        throw new ApolloError('something went wrong !')
    })

    return 'success'
  },

  updateStaticCourseDetails: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin')

    data.forEach(async (element) => {
      if (!element.crsdet_title) return
      if (element.crsdet_id) {
        const updateStaticCourseDetails = await prisma.jmkcrsdet.update({
          data: { ...element },
          where: {
            crsdet_id: parseInt(element.crsdet_id),
          },
        })
      } else {
        const createStaticCourseDetails = await prisma.jmkcrsdet.create({
          data: {
            crsdet_title: element.crsdet_title,
            crsdet_sub_title: element.crsdet_sub_title,
            crsmain_id: element.crsmain_id,
          },
        })
      }
    })

    return 'success'
  },

  deleteStaticCourseDetailTitleById: async (
    _,
    { crsDetId },
    { userId, role }
  ) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin')

    if (crsDetId) {
      const deleteDet = await prisma.jmkcrsdet.delete({
        where: { crsdet_id: crsDetId },
      })

      if (!deleteDet) throw new AuthenticationError('invalid !!')
    }

    return 'success'
  },

  updateContactInfo: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin')
    if (admin.usr_role === 'admin') {
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

  deleteUpcomingCourseById: async (_, { serial }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin')
    if (admin.usr_role === 'admin') {
      if (serial) {
        const deleteUpcoming = await prisma.jmkcrsupcom.findFirst({
          where: { serial: serial },
        })

        if (!deleteUpcoming) throw new AuthenticationError('invalid !!')
        await prisma.jmkcrsupcom.delete({
          where: { serial: serial },
        })

        return 'success'
      }
    }

    throw new AuthenticationError('invalid access !!')
  },

  addUpcomingCourse: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin')
    await prisma.jmkcrsupcom.create({
      data: {
        start_date: data.start_date,
        crsmain_id: data.crsmain_id,
      },
    })
    return 'success'
  },

  updateSelectedUpcomingCourse: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin')
    const selectedCourse = await prisma.jmkcrsupcom.findFirst({
      where: {
        serial: data.serial,
      },
    })
    if (!selectedCourse) throw new ApolloError('No such upcoming course')
    await prisma.jmkcrsupcom.update({
      data: {
        start_date: data.start_date,
        crsmain_id: data.crsmain_id,
        serial: data.serial,
      },
      where: {
        serial: data.serial,
      },
    })
    return 'success'
  },

  updateDeveloperFromDashboard: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (role === 'admin') {
      const admin = await prisma.jmkuserinfo.findFirst({
        where: { usr_id: userId, usr_role: role },
      })
      if (!admin) throw new AuthenticationError('invalid admin')

      const uppdateDev = await prisma.jmkdevinfo.update({
        data: { ...data },
        where: { developer_id: data.developer_id },
      })
      if (!uppdateDev) throw new AuthenticationError('invalid update !')

      return 'success'
    }

    if (role === ROLES[2]) {
      const consultancy = await prisma.jmkconsulinfo.findFirst({
        where: { serial: userId },
      })
      if (!consultancy) throw new AuthenticationError('invalid consultancy !')

      const uppdateDev = await prisma.jmkdevinfo.update({
        data: { ...data, cid: userId },
        where: { developer_id: data.developer_id },
      })
      if (!uppdateDev) throw new AuthenticationError('invalid update !')

      return 'success'
    }
    throw new AuthenticationError('invalid aceess !')
  },

  createNewUser: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin')

    let file
    if (data.usr_img_url) {
      file = await uploadImgToAWS(data.usr_img_url, 'admin_users_profilePic/')
      if (!file.data) throw new ApolloError('Something went wrong !')
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
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin')

    const selectedUser = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: parseInt(data.usr_id) },
    })

    if (!selectedUser) throw new ApolloError('invalid user')

    let file
    if (data.usr_img_url !== null) {
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
      where: { usr_id: userId, usr_role: role },
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

  createNewEvent: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin')

    let file
    if (data.event_img_url) {
      file = await uploadImgToAWS(data.event_img_url, 'upcomingEvents/')
      if (!file.data) throw new ApolloError('Something went wrong !')
    }

    const newEvent = await prisma.jmkevents.create({
      data: {
        ...data,
        event_img_url: file?.data?.Location ?? null,
        event_img_key: file?.data?.key ?? '',
      },
    })

    if (!newEvent) throw new ApolloError('something went wrong !')

    return 'success'
  },

  updateSelectedEvent: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin')

    const selectedEvent = await prisma.jmkevents.findFirst({
      where: { events_id: parseInt(data.events_id) },
    })

    if (!selectedEvent) throw new ApolloError('invalid event')

    let file
    if (data.event_img_url !== null) {
      await deleteImgToAWS(selectedEvent?.event_img_key)

      file = await uploadImgToAWS(data?.event_img_url, 'upcomingEvents/')
      if (!file.data) throw new ApolloError('Something went wrong !')
    }
    const event = await prisma.jmkevents.update({
      data: {
        ...data,
        event_img_url:
          data.event_img_url !== null
            ? file?.data?.Location
            : selectedEvent.event_img_url,
        event_img_key:
          data.event_img_url !== null
            ? file?.data?.key
            : selectedEvent.event_img_key,
      },
      where: {
        events_id: parseInt(data.events_id),
      },
    })
    if (!event) throw new ApolloError('something went wrong !')
    return 'success'
  },

  deleteEventById: async (_, { eventId }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')

    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin')

    const event = await prisma.jmkevents.findFirst({
      where: { events_id: eventId },
    })

    await deleteImgToAWS(event?.event_img_key)
    const selectedEvent = await prisma.jmkevents.delete({
      where: { events_id: eventId },
    })

    if (!selectedEvent) throw new ApolloError('something went wrong !')
    return 'success'
  },

  registerNewEventUser: async (_, { data }, { userId, role }) => {
    const newEventUser = await prisma.jmkeventreg.create({
      data: { ...data },
    })
    if (!newEventUser) throw new ApolloError('something went wrong !')

    return 'success'
  },

  updatePaymentStatus: async (_, { pay_id }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')

    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
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

  updateFollowUpStatus: async (_, { srno }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')

    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin')

    const followUpDetail = await prisma.jmkstdmktg.findFirst({
      where: {
        srno,
      },
    })

    if (!followUpDetail) throw new ApolloError('No such followup info exist')
    await prisma.jmkstdmktg.update({
      data: {
        follow_up: !followUpDetail.follow_up,
      },
      where: {
        srno,
      },
    })

    return 'success'
  },

  createNewProject: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin')
    const title = await prisma.jmkcrsproject.findFirst({
      where: {
        proj_title: data.proj_title,
        crs_id: data.crs_id,
      },
    })

    if (title) throw new ApolloError('Title Already Exists')
    try {
      await prisma.jmkcrsproject.create({
        data: {
          ...data,
        },
      })
      return 'success'
    } catch (error) {
      console.log(error)
    }
  },

  updateSelectedProject: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin')
    try {
      await prisma.jmkcrsproject.update({
        data: {
          ...data,
        },
        where: {
          proj_id: data.proj_id,
        },
      })
      return 'success'
    } catch (error) {
      throw new ApolloError('Something went Wrong')
    }
  },

  deleteProjectById: async (_, { proj_id }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin')
    const project = await prisma.jmkcrsproject.findFirst({
      where: {
        proj_id: proj_id,
      },
    })
    if (project) {
      await prisma.jmkcrsproject.delete({
        where: {
          proj_id: proj_id,
        },
      })
      return 'success'
    }

    throw new ApolloError('No such project exist')
  },
}

const adminResolversQuery = {
  admin: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin credentials')
    return admin
  },

  getBlogs: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (role === 'admin') {
      const blogs = await prisma.jmkblog.findMany();
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
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin credentials')
    if (admin.usr_role === 'admin') {
      let students = []
      const student = await prisma.jmkstdinfo.findMany()
      for (let index = 0; index < student.length; index++) {
        if (student[index].crsmain_id) {
          const course = await prisma.jmkcrsmain.findFirst({
            where: { crsmain_id: student[index].crsmain_id },
          })
          if (course) {
            students.push({
              ...student[index],
              crs_type: course.crsmain_type,
              crs_name: course.crsmain_title,
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
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin credentials')
    if (admin.usr_role === 'admin') {
      const student = await prisma.jmkstdinfo.findFirst({
        where: { std_id: args.std_id },
      })
      const join_courses = []
      const joinCourses = await prisma.jmkstdcrsinfo.findMany({
        where: { std_id: student.std_id },
      })
      for (let index = 0; index < joinCourses.length; index++) {
        if (joinCourses[index].crsmain_id) {
          const course = await prisma.jmkcrsmain.findFirst({
            where: { crsmain_id: joinCourses[index].crsmain_id },
          })
          join_courses.push({
            ...joinCourses[index],
            crsmain_title: course.crsmain_title,
            crs_rate: course.crsmain_rate,
            crs_type: course.crsmain_type,
          })
        }1
      }

      const mergestudent = {
        ...student,
        join_courses,
      }
      return mergestudent
    }
    throw new AuthenticationError('invalid access')
  },

  getTrainerDataForAdmin: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin credentials')
    if (admin.usr_role === 'admin') {
      const trainers = await prisma.jmktrinfo.findMany()
      return trainers
    }
  },

  getTrainerByIdForAdmin: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin credentials')
    if (admin.usr_role === 'admin') {
      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: args.tr_id },
      })

      return trainer
    }
    throw new AuthenticationError('invalid access')
  },

  getDeveloperDataForAdmin: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin credentials')
    if (admin.usr_role === 'admin') {
      //let trainers = [];

      const developers = await prisma.jmkdevinfo.findMany()

      const allDevelopersData = await Promise.all(
        developers.map(async (element) => {
          const {
            developer_id,
            developer_type,
            developer_fname,
            developer_mname,
            developer_lname,
            developer_phone,
            developer_country,
            developer_email,
            developer_tech1,
            developer_password,
          } = element

          const newDevData = {
            developer_id,
            developer_type,
            developer_fname,
            developer_mname,
            developer_lname,
            developer_phone,
            developer_tech1,
            developer_country,
            developer_email,
            developer_password,
          }

          // tech details
          const dev_tech_details = await prisma.jmkdevtechdet.findMany({
            where: { developer_id: developer_id },
          });
          const dev_tech_det = dev_tech_details.map((element) => {
            const {
              tech_stack,
              tech_stack_exp,
              tech_last_used,
              tech_stack_summary,
            } = element
            return {
              tech_stack,
              tech_stack_exp,
              tech_last_used,
              tech_stack_summary,
            }
          })

          // tech exp
          const dev_tech_experience = await prisma.jmkdevexp.findMany({
            where: { developer_id: developer_id },
          })
          const dev_tech_exp = dev_tech_experience.map((element) => {
            const {
              company_name,
              exp_desc,
              exp_role_pos,
              exp_start_date,
              exp_end_date,
            } = element
            return {
              company_name,
              exp_desc,
              exp_role_pos,
              exp_start_date,
              exp_end_date,
            }
          })

          // proj details
          const dev_proj_details = await prisma.jmkdevprojdet.findMany({
            where: { developer_id: developer_id },
          })
          const dev_proj_det = dev_proj_details.map((element) => {
            const { proj_title, proj_desc, proj_tech_used } = element
            return { proj_title, proj_desc, proj_tech_used }
          })

          const mergedData = {
            ...newDevData,
            dev_tech_det: dev_tech_det,
            dev_exp_det: dev_tech_exp,
            dev_proj_det: dev_proj_det,
          }

          return mergedData
        })
      )

      return allDevelopersData
    }
  },

  getDeveloperByIdForAdmin: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (role === 'admin') {
      const admin = await prisma.jmkuserinfo.findFirst({
        where: { usr_id: userId, usr_role: role },
      })
      if (!admin) throw new AuthenticationError('invalid admin credentials')

      const developer = await prisma.jmkdevinfo.findFirst({
        where: { developer_id: args.developer_id },
      })

      const {
        developer_id,
        developer_type,
        developer_fname,
        developer_mname,
        developer_lname,
        developer_phone,
        developer_country,
        developer_email,
        developer_password,
      } = developer

      const newDevData = {
        developer_id,
        developer_type,
        developer_fname,
        developer_mname,
        developer_lname,
        developer_phone,
        developer_country,
        developer_email,
        developer_password,
      }

      // tech details
      const dev_tech_details = await prisma.jmkdevtechdet.findMany({
        where: { developer_id: developer_id },
      })
      const dev_tech_det = dev_tech_details.map((element) => {
        const {
          tech_stack,
          tech_stack_exp,
          tech_last_used,
          tech_stack_summary,
        } = element
        return {
          tech_stack,
          tech_stack_exp,
          tech_last_used,
          tech_stack_summary,
        }
      })

      // tech exp
      const dev_tech_experience = await prisma.jmkdevexp.findMany({
        where: { developer_id: developer_id },
      })
      const dev_tech_exp = dev_tech_experience.map((element) => {
        const {
          company_name,
          exp_desc,
          exp_role_pos,
          exp_start_date,
          exp_end_date,
        } = element
        return {
          company_name,
          exp_desc,
          exp_role_pos,
          exp_start_date,
          exp_end_date,
        }
      })

      // proj details
      const dev_proj_details = await prisma.jmkdevprojdet.findMany({
        where: { developer_id: developer_id },
      })
      const dev_proj_det = dev_proj_details.map((element) => {
        const { proj_title, proj_desc, proj_tech_used } = element
        return { proj_title, proj_desc, proj_tech_used }
      })

      const developerWholeData = {
        ...newDevData,
        dev_tech_det: dev_tech_det,
        dev_exp_det: dev_tech_exp,
        dev_proj_det: dev_proj_det,
      }

      return developerWholeData
    }

    if (role === ROLES[2]) {
      if (!userId) throw new ForbiddenError('invalid token')
      const consultancy = await prisma.jmkconsulinfo.findFirst({
        where: { serial: userId },
      })
      if (!consultancy)
        throw new AuthenticationError('invalid consultancy credentials')
      const developer = await prisma.jmkdevinfo.findFirst({
        where: { developer_id: args.developer_id, cid: consultancy.serial },
      })
      return developer
    }
    throw new AuthenticationError('invalid access')
  },

  getstudentCourseByIdForAdmin: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (role === 'admin') {
      const admin = await prisma.jmkuserinfo.findFirst({
        where: { usr_id: userId, usr_role: role },
      })
      if (!admin) throw new AuthenticationError('invalid admin credentials')
      const course = await prisma.jmkstdcrsinfo.findFirst({
        where: { serial: args.serial },
      })
      if (!course) throw new ApolloError('crs not fund !!')
      const selectedCourse = await prisma.jmkcrsmain.findFirst({
        where: {
          crsmain_id: course.crsmain_id,
        },
        select: {
          crsmain_title: true,
        },
      })
      return { ...course, ...selectedCourse }
    }
    if (role === ROLES[2]) {
      const consultancy = await prisma.jmkconsulinfo.findFirst({
        where: { serial: userId },
      })
      if (!consultancy)
        throw new AuthenticationError('invalid consultancy credentials')
      const course = await prisma.jmkstdcrsinfo.findFirst({
        where: { serial: args.serial },
      })
      if (!course) throw new ApolloError('crs not fund !!')
      return course
    }
    throw new AuthenticationError('invalid access')
  },

  getAdminById: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (role === 'admin') {
      const admin = await prisma.jmkuserinfo.findFirst({
        where: { usr_id: userId, usr_role: role },
      })
      if (!admin) throw new AuthenticationError('invalid admin credentials')

      const user = await prisma.jmkuserinfo.findFirst({
        where: {
          usr_id: userId,
        },
      })
      return user
    }
  },

  getStaticCoursesDataForAdmin: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin credentials')
    if (admin.usr_role === 'admin') {
      //let trainers = [];
      const staticCourses = await prisma.jmkcrsmain.findMany()

      return staticCourses
    }
  },

  getStaticCourseByIdForAdmin: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin credentials')
    if (admin.usr_role === 'admin') {
      const staticCourse = await prisma.jmkcrsmain.findFirst({
        where: { crsmain_id: args.crsmain_id },
      })

      return staticCourse
    }
    throw new AuthenticationError('invalid access')
  },

  getStaticCourseDetailsByIdForAdmin: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin credentials')
    if (admin.usr_role === 'admin') {
      const staticCourse = await prisma.jmkcrsmain.findFirst({
        where: { crsmain_id: args.crsmain_id },
      })

      const staticCourseDetails = await prisma.jmkcrsdet.findMany({
        where: { crsmain_id: staticCourse.crsmain_id },
      })
      return staticCourseDetails
    }
    throw new AuthenticationError('invalid access')
  },

  getDataCountForAllTableInAdmin: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin credentials')

    const runningCourses = await prisma.jmkcrsinfo.count()
    const dynamicCourses = await prisma.jmkcrsmain.count()
    const students = await prisma.jmkstdinfo.count()
    const trainers = await prisma.jmktrinfo.count()
    const developers = await prisma.jmkdevinfo.count()
    const users = await prisma.jmkuserinfo.count()
    const upcomingEvents = await prisma.jmkevents.count()
    const upcomingCourses = await prisma.jmkcrsupcom.count()

    const tableCount = [
      {
        name: 'Running Courses',
        count: runningCourses ?? 0,
        link: '/courses',
      },
      {
        name: 'Dynamic Courses',
        count: dynamicCourses ?? 0,
        link: '/staticCourses',
      },
      {
        name: 'Students',
        count: students ?? 0,
        link: '/students',
      },
      {
        name: 'Trainers',
        count: trainers ?? 0,
        link: '/trainer',
      },
      {
        name: 'Developers',
        count: developers ?? 0,
        link: '/developer',
      },
      {
        name: 'Users',
        count: users ?? 0,
        link: '/users',
      },
      {
        name: 'Upcoming Events',
        count: upcomingEvents ?? 0,
        link: '/upcomingEvents',
      },
      {
        name: 'Upcoming Course',
        count: upcomingCourses ?? 0,
        link: '/upcomingCourses',
      },
    ]
    return tableCount
  },

  getAllUserInfo: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin credentials')
    const allUser = await prisma.jmkuserinfo.findMany()
    return allUser
  },

  getUserInfoById: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin credentials')
    const user = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: args.usr_id },
    })
    return user
  },

  getAllEvents: async (_, args, { userId, role }) => {
    const allEvents = await prisma.jmkevents.findMany()
    return allEvents
  },

  getEventsInfoById: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin credentials')

    const event = await prisma.jmkevents.findFirst({
      where: { events_id: parseInt(args.events_id) },
    })
    return event
  },

  getAllEventRegisteredUser: async (_, args, { userId, role }) => {
    // if (!userId) throw new ForbiddenError('invalid token');
    // const admin = await prisma.jmkuserinfo.findFirst({ where: { usr_id: userId, usr_role: role } })
    // if (!admin) throw new AuthenticationError("invalid admin credentials")
    const allRegisteredUsers = await prisma.jmkeventreg.findMany()
    return allRegisteredUsers
  },

  getUpcomingCourses: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin credentials')
    const upCourse = await prisma.jmkcrsupcom.findMany({})
    let upcoming = []
    for (let i = 0; i < upCourse.length; i++) {
      const mainCourse = await prisma.jmkcrsmain.findFirst({
        where: {
          crsmain_id: upCourse[i].crsmain_id,
        },
      })
      if (mainCourse) {
        upcoming.push({
          ...upCourse[i],
          crsmain_title: mainCourse.crsmain_title,
          crsmain_duration: mainCourse.crsmain_duration,
          crsmain_type: mainCourse.crsmain_type,
        })
      } else {
        upcoming.push({
          ...upCourse[i],
        })
      }
    }
    return upcoming
  },

  getUpcomingCourseById: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin credentials')
    const upCourse = await prisma.jmkcrsupcom.findUnique({
      where: {
        serial: parseInt(args.serial),
      },
    })

    if (!upCourse) throw new ApolloError('No such course')
    const mainCourse = await prisma.jmkcrsmain.findFirst({
      where: {
        crsmain_id: upCourse.crsmain_id,
      },
    })
    return {
      ...upCourse,
      crsmain_title: mainCourse.crsmain_title,
      crsmain_duration: mainCourse.crsmain_duration,
      crsmain_type: mainCourse.crsmain_type,
    }
  },

  getUserLog: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
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
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin credentials')
    const paymentInfos = []
    const paymentsInfo = await prisma.jmktstdpayinfo.findMany({})

    for (let i = 0; i < paymentsInfo.length; i++) {
      const course = await prisma.jmkcrsinfo.findUnique({
        where: {
          crs_id: paymentsInfo[i]?.crs_id,
        },
      })
      const student = await prisma.jmkstdinfo.findUnique({
        where: {
          std_id: paymentsInfo[i]?.std_id,
        },
      })
      paymentInfos.push({
        pay_id: paymentsInfo[i].pay_id,
        payment_date: paymentsInfo[i].payment_date,
        pay_amount: paymentsInfo[i].pay_amount,
        std_email: student?.std_email,
        transaction_id: paymentsInfo[i].transaction_id,
        crs_name: course?.crs_name,
        pay_verified: paymentsInfo[i].pay_verified,
      })
    }
    return paymentInfos
  },

  getFolloUpStudent: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin credentials')
    const folloUpStudent = await prisma.jmkstdmktg.findMany({})
    if (!folloUpStudent) {
      return 'No record Found'
    }
    return folloUpStudent
  },

  getProjectInfo: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin credentials')
    const courseProjects = await prisma.jmkcrsproject.findMany({})
    const projectDetail = []
    for (let i in courseProjects) {
      const title = await prisma.jmkcrsinfo.findFirst({
        where: {
          crs_id: courseProjects[i].crs_id,
        },
        select: {
          crs_name: true,
        },
      })
      projectDetail.push({
        ...courseProjects[i],
        project_course_title: title.crs_name,
      })
    }

    if (!courseProjects) {
      return 'No projects data found'
    }
    return projectDetail
  },

  getProjectInfoById: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin credentials')
    const project = await prisma.jmkcrsproject.findFirst({
      where: {
        proj_id: args.proj_id,
      },
    })
    if (project) {
      return project
    }
    throw new ApolloError('No such project')
  },

  getAllEventRegister: async (_, { args }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin credentials')
    const events = await prisma.jmkeventreg.findMany({})
    const registeredEvents = []
    if (events) {
      for (let event in events) {
        const name = await prisma.jmkevents.findFirst({
          where: {
            events_id: events[event].event_id,
          },
          select: {
            event_title: true,
          },
        })
        registeredEvents.push({
          ...events[event],
          event_name: name.event_title,
        })
      }
    }
    return registeredEvents
  },
}

export {
  adminQueryTypesAndInputs,
  adminQuery,
  adminMutation,
  adminResolvers,
  adminResolversQuery,
}
