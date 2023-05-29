import { ApolloError, AuthenticationError, ForbiddenError } from 'apollo-server-express'
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
     }
  
     input updateStudentCourseFromAdminInput {
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
        crs_type: String!
        crs_name: String!
        std_password: String!
        std_high_ql: String
        crs_id: String!
        std_status: String
        std_paidup: String
        std_due: String
        std_verifyed: Boolean!
        join_courses: [UserCourse]
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
     type adminDeveloper {
        developer_id:ID!
        developer_fname: String!
        developer_mname: String
        developer_lname: String!
        developer_high_qualification: String
        developer_phone: String!
        developer_email: String!
        developer_password: String!
        developer_country: String!
        developer_tech1: String!
        developer_tech2: String
        developer_tech3: String
        developer_tech1_exp: String!
        developer_tech2_exp: String
        developer_tech3_exp: String
        developer_resume: String
        developer_company1: String!
        developer_company1_project: String!
        developer_company1_start: Date!
        developer_company2: String
        developer_company2_start: Date
        developer_company2_end: Date
        developer_company2_project: String
        developer_type: String!
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
     }

     type staticCourseDetails{
      crsdet_id:Int!
      crsdet_title:String
      crsmain_id:Int!
     }
     
     input createStaticCourseInput{
      crsmain_overview:String
      crsmain_duration:Int
      crsmain_img_url:Upload
      crsmain_rate:Int
      crsmain_desc:String
      crsmain_title:String
      crsmain_type:String
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
     }

      input deleteStaticCourseInput {
       crsmain_id: Int!
      }

      input addStaticCourseDetailsInput{
         crsdet_title:String!
         crsmain_id:Int!
      }
      input updateStaticCourseDetailsInput{
         crsdet_id:Int
         crsdet_title:String
         crsmain_id:Int!
      }

     input updateDeveloperFromDashboard {
        developer_id: Int!
        developer_fname: String
        developer_mname: String
        developer_lname: String
        developer_high_qualification: String
        developer_phone: String
        developer_email: String
        developer_password: String
        developer_country: String
        developer_tech1: String
        developer_tech2: String
        developer_tech3: String
        developer_tech1_exp: String
        developer_tech2_exp: String
        developer_tech3_exp: String
        developer_resume: Upload
        developer_company1: String
        developer_company1_project: String
        developer_company1_start: Date
        developer_company2: String
        developer_company2_start: Date
        developer_company2_end: Date
        developer_company2_project: String
        developer_type: String
     }
  
     input updateTrainerFromDashboard {
        tr_id: Int!
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
        tr_verifyed:Boolean!
        tr_password:String!
        tr_resume:String
        tr_github:String
        tr_linkedin:String
     }

`

const adminQuery = `
    admin:Admin!

    getstudentForAdmin:[AdminStudent]
    getstudentByIdForAdmin(std_id:Int!):AdminStudent
    getstudentCourseByIdForAdmin(serial:Int!):UserCourse

    getTrainerDataForAdmin:[AdminTrainer]
    getTrainerByIdForAdmin(tr_id:Int!):AdminTrainer

    getDeveloperDataForAdmin:[adminDeveloper]
    getDeveloperByIdForAdmin(developer_id:Int!):adminDeveloper

    getStaticCoursesDataForAdmin:[staticCourse]
    getStaticCourseByIdForAdmin(crsmain_id:Int!):staticCourse
    getStaticCourseDetailsByIdForAdmin(crsmain_id:Int!):[staticCourseDetails]

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

`

const adminResolvers = {

   signinAdmin: async (_, { data }) => {
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
         process.env.JWT_SECRET_KEY
      )
      // await sendMail(newAdmin.usr_email, 'Successfully Register ', registerrHTML)
      // await sendMail('riwaz@jamuntek.com', 'New Admin Created !', newUserSignupNotification(newUser, course.crs_name))
      // await sendMail('jenish@jamuntek.com', 'New Admin Created !', newUserSignupNotification(newUser, course.crs_name))
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
      const access = ['admin']
      if (!userId) throw new ForbiddenError('invalid token')
      const admin = await prisma.jmkuserinfo.findFirst({
         where: { usr_id: userId, usr_role: role },
      })
      if (!admin) throw new AuthenticationError('invalid admin')
      if (!access.includes(admin.usr_role))
         throw new ForbiddenError('You dont have access to create course')
      const student = await prisma.jmkstdinfo.update({
         data: { ...data },
         where: { std_id: data.std_id },
      })
      if (!student) throw new AuthenticationError('Error')
      return 'success'
   },

   updateStudentCourseFromAdmin: async (_, { data }, { userId, role }) => {
      const access = ['admin']
      if (!userId) throw new ForbiddenError('invalid token')
      const admin = await prisma.jmkuserinfo.findFirst({
         where: { usr_id: userId, usr_role: role },
      })
      if (!admin) throw new AuthenticationError('invalid admin')
      if (!access.includes(admin.usr_role))
         throw new ForbiddenError('You dont have access to create course')
      const student = await prisma.jmkstdcrsinfo.update({
         data: { ...data },
         where: { serial: data.serial },
      })
      if (!student) throw new AuthenticationError('Error')
      return 'success'
   },

   updateTrainerFromDashboard: async (_, { data }, { userId, role }) => {
      const access = ['admin']
      if (!userId) throw new ForbiddenError('invalid token')
      const admin = await prisma.jmkuserinfo.findFirst({
         where: { usr_id: userId, usr_role: role },
      })
      if (!admin) throw new AuthenticationError('invalid admin')
      if (!access.includes(admin.usr_role))
         throw new ForbiddenError('You dont have access to update')
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

      await deleteImgToAWS(selectedStaticCourse?.crsmain_img_key)

      let file
      if (data.crsmain_img_url) {
         file = await uploadImgToAWS(data.crsmain_img_url, 'webimages/')
         if (!file.data) throw new ApolloError('Something went wrong !')
      }
      const course = await prisma.jmkcrsmain.update({
         data: {
            ...data,
            crsmain_img_url: file?.data?.Location ?? null,
            crsmain_img_key: file?.data?.key ?? '',
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
         if (!deleteStaticCourseDetails) throw new ApolloError('something went wrong !')
      });
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
            data: { ...element }
         })
         if (!newStaticCourseDetails) throw new ApolloError('something went wrong !')
      });

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
         }
         else{
         
            const createStaticCourseDetails = await prisma.jmkcrsdet.create({
               data: {  
                  crsdet_title: element.crsdet_title,
                 crsmain_id: element.crsmain_id
             }
             
            })
         }

      });

      return 'success'

   },

   updateDeveloperFromDashboard: async (_, { data }, { userId, role }) => {
      if (!userId) throw new ForbiddenError('invalid token')
      if (role === 'admin') {
         const admin = await prisma.jmkuserinfo.findFirst({
            where: { usr_id: userId, usr_role: role },
         })
         if (!admin) throw new AuthenticationError('invalid admin')

         const uppdateDev = await prisma.jmkdevinfo.update({ data: { ...data }, where: { developer_id: data.developer_id } })
         if (!uppdateDev) throw new AuthenticationError('invalid update !')

         return 'success'
      }
      if (role === ROLES[2]) {
         const consultancy = await prisma.jmkconsulinfo.findFirst({
            where: { serial: userId },
         })
         if (!consultancy) throw new AuthenticationError('invalid consultancy !')

         const uppdateDev = await prisma.jmkdevinfo.update({ data: { ...data, cid: userId }, where: { developer_id: data.developer_id } })
         if (!uppdateDev) throw new AuthenticationError('invalid update !')

         return 'success'
      }
      throw new AuthenticationError('invalid aceess !')

   },
}

const adminResolversQuery = {
   admin: async (_, args, { userId, role }) => {
      if (!userId) throw new ForbiddenError('invalid token');
      const admin = await prisma.jmkuserinfo.findFirst({ where: { usr_id: userId, usr_role: role } })
      if (!admin) throw new AuthenticationError("invalid admin credentials")
      return admin;
   },

   getstudentForAdmin: async (_, args, { userId, role }) => {
      if (!userId) throw new ForbiddenError('invalid token');
      const admin = await prisma.jmkuserinfo.findFirst({ where: { usr_role: userId, usr_role: role } })
      if (!admin) throw new AuthenticationError("invalid admin credentials")
      if (admin.usr_role === 'admin') {
         let students = [];
         const student = await prisma.jmkstdinfo.findMany()
         for (let index = 0; index < student.length; index++) {
            const course = await prisma.jmkcrsinfo.findFirst({ where: { crs_id: student[index].crs_id } })
            if (course) {
               students.push({ ...student[index], crs_type: course.crs_type, crs_name: course.crs_name })
            }
         }
         return students;
      }
   },

   getstudentByIdForAdmin: async (_, args, { userId, role }) => {
      if (!userId) throw new ForbiddenError('invalid token');
      const admin = await prisma.jmkuserinfo.findFirst({ where: { usr_role: userId, usr_role: role } })
      if (!admin) throw new AuthenticationError("invalid admin credentials")
      if (admin.usr_role === 'admin') {
         const student = await prisma.jmkstdinfo.findFirst({ where: { std_id: args.std_id } })
         const course = await prisma.jmkcrsinfo.findFirst({ where: { crs_id: student.crs_id } })
         const join_courses = []
         const joinCourses = await prisma.jmkstdcrsinfo.findMany({ where: { std_id: student.std_id } })
         for (let index = 0; index < joinCourses.length; index++) {
            const course = await prisma.jmkcrsinfo.findFirst({ where: { crs_id: joinCourses[index].crs_id } })
            join_courses.push({ ...joinCourses[index], crs_name: course.crs_name, crs_rate: course.crs_rate })
         }
         if (course) {
            const mergestudent = { ...student, crs_type: course.crs_type, crs_name: course.crs_name, join_courses }
            return mergestudent;
         }
      }
      throw new AuthenticationError("invalid access")

   },

   getTrainerDataForAdmin: async (_, args, { userId, role }) => {
      if (!userId) throw new ForbiddenError('invalid token');
      const admin = await prisma.jmkuserinfo.findFirst({ where: { usr_role: userId, usr_role: role } })
      if (!admin) throw new AuthenticationError("invalid admin credentials")
      if (admin.usr_role === 'admin') {
         //let trainers = [];
         const trainers = await prisma.jmktrinfo.findMany()

         return trainers;
      }
   },

   getTrainerByIdForAdmin: async (_, args, { userId, role }) => {
      if (!userId) throw new ForbiddenError('invalid token');
      const admin = await prisma.jmkuserinfo.findFirst({ where: { usr_role: userId, usr_role: role } })
      if (!admin) throw new AuthenticationError("invalid admin credentials")
      if (admin.usr_role === 'admin') {
         const trainer = await prisma.jmktrinfo.findFirst({ where: { tr_id: args.tr_id } })

         return trainer
      }
      throw new AuthenticationError("invalid access")

   },

   getDeveloperDataForAdmin: async (_, args, { userId, role }) => {
      if (!userId) throw new ForbiddenError('invalid token');
      const admin = await prisma.jmkuserinfo.findFirst({ where: { usr_role: userId, usr_role: role } })
      if (!admin) throw new AuthenticationError("invalid admin credentials")
      if (admin.usr_role === 'admin') {
         //let trainers = [];
         const developers = await prisma.jmkdevinfo.findMany()

         return developers;
      }
   },

   getDeveloperByIdForAdmin: async (_, args, { userId, role }) => {
      if (!userId) throw new ForbiddenError('invalid token');
      if (role === 'admin') {
         const admin = await prisma.jmkuserinfo.findFirst({ where: { usr_role: userId, usr_role: role } })
         if (!admin) throw new AuthenticationError("invalid admin credentials")
         const developer = await prisma.jmkdevinfo.findFirst({ where: { developer_id: args.developer_id } })
         return developer
      }

      if (role === ROLES[2]) {
         if (!userId) throw new ForbiddenError('invalid token');
         const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
         if (!consultancy) throw new AuthenticationError("invalid consultancy credentials")
         const developer = await prisma.jmkdevinfo.findFirst({ where: { developer_id: args.developer_id, cid: consultancy.serial } })
         return developer
      }
      throw new AuthenticationError("invalid access")

   },

   getstudentCourseByIdForAdmin: async (_, args, { userId, role }) => {
      if (!userId) throw new ForbiddenError('invalid token');
      if (role === 'admin') {
         const admin = await prisma.jmkuserinfo.findFirst({ where: { usr_role: userId, usr_role: role } })
         if (!admin) throw new AuthenticationError("invalid admin credentials")
         const course = await prisma.jmkstdcrsinfo.findFirst({ where: { serial: args.serial } })
         if (!course) throw new ApolloError("crs not fund !!")
         return course;
      }
      if (role === ROLES[2]) {
         const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
         if (!consultancy) throw new AuthenticationError("invalid consultancy credentials")
         const course = await prisma.jmkstdcrsinfo.findFirst({ where: { serial: args.serial } })
         if (!course) throw new ApolloError("crs not fund !!")
         return course;
      }
      throw new AuthenticationError("invalid access")

   },

   getStaticCoursesDataForAdmin: async (_, args, { userId, role }) => {
      if (!userId) throw new ForbiddenError('invalid token');
      const admin = await prisma.jmkuserinfo.findFirst({ where: { usr_role: userId, usr_role: role } })
      if (!admin) throw new AuthenticationError("invalid admin credentials")
      if (admin.usr_role === 'admin') {
         //let trainers = [];
         const staticCourses = await prisma.jmkcrsmain.findMany()

         return staticCourses;
      }
   },
   getStaticCourseByIdForAdmin: async (_, args, { userId, role }) => {
      if (!userId) throw new ForbiddenError('invalid token');
      const admin = await prisma.jmkuserinfo.findFirst({ where: { usr_role: userId, usr_role: role } })
      if (!admin) throw new AuthenticationError("invalid admin credentials")
      if (admin.usr_role === 'admin') {
         const staticCourse = await prisma.jmkcrsmain.findFirst({ where: { crsmain_id: args.crsmain_id } })

         return staticCourse
      }
      throw new AuthenticationError("invalid access")

   },
   getStaticCourseDetailsByIdForAdmin: async (_, args, { userId, role }) => {
      if (!userId) throw new ForbiddenError('invalid token');
      const admin = await prisma.jmkuserinfo.findFirst({ where: { usr_role: userId, usr_role: role } })
      if (!admin) throw new AuthenticationError("invalid admin credentials")
      if (admin.usr_role === 'admin') {
         const staticCourse = await prisma.jmkcrsmain.findFirst({ where: { crsmain_id: args.crsmain_id } })

         const staticCourseDetails = await prisma.jmkcrsdet.findMany({ where: { crsmain_id: staticCourse.crsmain_id } })
         return staticCourseDetails
      }
      throw new AuthenticationError("invalid access")

   },


}

export { adminQueryTypesAndInputs, adminQuery, adminMutation, adminResolvers, adminResolversQuery }
