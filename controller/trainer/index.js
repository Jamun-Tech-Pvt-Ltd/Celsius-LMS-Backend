import {
  ApolloError,
  AuthenticationError,
  ForbiddenError,
} from 'apollo-server-express'
import prisma from '../../database.js'
import jwt from 'jsonwebtoken'
import { sendMail } from '../../utils/mailHandler.js'
import registerrHTML from '../../utils/signup.js'
import emailVerificationHTML from '../../utils/EmailVerification.js'
import { ROLES } from '../../utils/helper.js'
import { uploadImgToAWS } from '../../utils/imageHandler.js'

const trainerQueryTypesAndInputs = `

    enum ContentTypes{
      Test
      Project
      Video
      Notes
    }

    input signinTrainerInput{
        email: String!
        password: String!
    }

    input signupTrainerInput{
        tr_fname: String!
        tr_mname: String
        tr_lname: String!
        tr_mobile: String!
        tr_email: String!
        tr_password: String!
        tr_city: String
        tr_country: String
        tr_main_tech1: String
        tr_main_tech2: String
        tr_main_tech3: String
        tr_dob: Date
        tr_resume: Upload!
        tr_github: String
        tr_linkedin: String
     }

     input updateTrainerInput {
        tr_fname: String
        tr_mname: String
        tr_lname: String
        tr_email: String
        tr_mobile: String
        tr_dob: String
        tr_password: String
        tr_city: String
        tr_country: String
        tr_main_tech1: String
        tr_main_tech2: String
        tr_main_tech3: String
        tr_github: String
        tr_linkedin: String
        tr_resume: Upload
     }

     input addTrainerStudentFeedbackInput {
        std_id: Int!
        comment: String!
     }
  
     input updateTrainerStudentFeedbackInput {
        serial: Int!
        comment: String!
     }

     input updateActiveSession {
      crs_id:Int!
     }
  
     input deleteTrainerStudentFeedbackInput {
        serial: Int!
     }

     input emailVerifyTrainer{
      token: String!
     }

     input updateQuestionInput {
        ques_id: Int!
        question: String
        mod_id: Int
        ans1: String
        ans2: String
        ans3: String
        ans4: String
        rtans: String
     }

     input addQuestionInput {
        question: String!
        mod_id: Int!
        ans1: String!
        ans2: String!
        ans3: String!
        ans4: String!
        rtans: String!
     }

     input weekInput{
      title:String!
      description:String!
     }

     input updateWeekInput{
      title:String!
      description:String!
      week_id:Int!
     }
     input deleteWeekInput{
      week_id:Int!
     }

     input weekContentInput{
      title:String!
      description:String!
      video_url:String
      project_url:String
      type: ContentTypes
      
      content_id:Int
      test: TestInput
     }

     input TestInput{
      test_set_id:Int
      content_id:Int!
      question:String
      ans1: String
      ans2: String
      ans3: String
      ans4: String
      rtans: String
     }

     input addCourseContentInput {
        crs_id: Int!
        content: String!
        content_date: Date
        content_title:String
      }
      
      input updateCourseContentInput {
        serial: Int!
        content: String!
        content_date: Date
        content_title:String
     }
  
     input deleteCourseContentInput {
        serial: Int!
     }

     type Trainer {
        tr_id: ID!
        tr_fname: String!
        tr_mname: String
        tr_lname: String!
        tr_email: String!
        tr_mobile: String!
        tr_city: String
        tr_country: String
        tr_main_tech1: String
        tr_main_tech2: String
        tr_main_tech3: String
        tr_dob: Date
        tr_resume: String
        tr_github: String
        tr_linkedin: String
        crs_id: String!
     }

     type TrainerCourse {
        crs_id: ID!
        crs_name: String!
        crs_desc: String!
        crs_cat: String
        crs_con: String
        crs_cat_id: String
        crs_con_id: String
        crs_duration: String
        crs_rate: String
        crs_ins: String!
        crs_type: String!
        total_videos: Int!
        total_student: Int!
     }

     type TrainerStudent {
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
     }

     type TrainerStudentFeedback {
        serial: Int!
        std_id: Int!
        tr_id: Int!
        comment: String!
        content_date: Date!
     }
  
     type TrainerDashboard {
        students: Int
        courses: Int
        videos: Int
     }

     type StudentTestResult {
        std_lname: String!
        std_fname: String!
        std_mname: String
        std_email: String!
        crs_name: String!
        crs_type: String!
        isComplete: Boolean!
        timer: Int!
        score:Int!
        studentQA: [studentQA]
     }

     type QuestionModule {
        mod_id: Int!
        mod_code: String
        mod_name: String!
        total_question: Int!
     }

     type QuestionAdmin {
        ques_id: ID!
        question: String!
        mod_id: Int!
        ans1: String!
        ans2: String!
        ans3: String!
        ans4: String!
        rtans: String!
     }

     type sessionDetail{
      serial: Int
      tr_id:Int
      crs_id:Int
      jmkcrsinfo:JmkCrsInfo
    }

    type JmkCrsInfo {
      crs_id: Int!
      crs_name: String!
      crs_image: String
      crs_desc: String
    }

    type weekContentAndTest {
      week_id:Int
      title:String
      description:String
      created_at:Date
      
    }

    type jmkWeekContent{
      content_id:Int
      title:String
      description:String
      type:String
      video_url:String
      project_url:String
      date:Date
    }

`

const trainerQuery = `
    trainer:Trainer!

    getAssignedSessions:[sessionDetail]



    
    getTrainerDashboard:TrainerDashboard
    getstudentForTrainer:[TrainerStudent!]!
    getstudentTestSetForTrainer:[StudentTestSet!]!
    getstudentTestResultById(serial:Int!):StudentTestResult
    getTrainerStudentFeedback(std_id:Int!):[TrainerStudentFeedback]
    getTrainerCourses: [TrainerCourse]

    getQuestionModule:[QuestionModule]
    getQuestionByModuleId(mod_id:Int!):[Question!]!
    getQuestionByQuestionId(ques_id:Int!):QuestionAdmin!

    getWeekContentBasedonActiveSession:[weekContentAndTest] 
    getContentByWeekId(week_id:Int!):[jmkWeekContent]


`

const trainerMutation = `
    signupTrainer(data:signupTrainerInput!):Token
    signinTrainer(data:signinTrainerInput!):Token
    updateTrainer(data:updateTrainerInput):Trainer!

    activeSession(data:updateActiveSession!): Trainer!

    
    addTrainerStudentFeedback(data:addTrainerStudentFeedbackInput!):String!
    updateTrainerStudentFeedback(data:updateTrainerStudentFeedbackInput!):String!
    deleteTrainerStudentFeedback(data:deleteTrainerStudentFeedbackInput):String!

    addCourseContent(data:addCourseContentInput):String!
    updateCourseContent(data:updateCourseContentInput):String!
    deleteCourseContent(data:deleteCourseContentInput):String!

    addQuestion(data:addQuestionInput!):String!
    updateQuestion(data:updateQuestionInput!):String!

    trainerEmailVerify(data: emailVerifyTrainer!): String!


    addWeek(data:weekInput!):String!
    updateWeek(data:updateWeekInput!):String!
    deleteWeek(data:deleteWeekInput!):String!

    addTrainerWeekContentById(data:weekContentInput):String!
    updateTrainerWeekContentById(data:weekContentInput):String!
   
`

const trainerResolvers = {

  trainerEmailVerify: async (_, { data }) => {
    const decodedToken = jwt.decode(data.token, process.env.JWT_SECRET_KEY)
    if (!decodedToken) throw new AuthenticationError('The token is not valid')
    const trainer = await prisma.jmktrinfo.findFirst({
      where: { tr_id: decodedToken.userId },
    })
    if (!trainer) throw new AuthenticationError('Invalid Token')

    const updateStatus = await prisma.jmktrinfo.update({
      where: {
        tr_id: trainer.tr_id,
      },
      data: {
        tr_verifyed: true,
      },
    })
    if (!updateStatus)
      throw new AuthenticationError('Could not verify your email')
    return 'Email Verification Complete'

    // const generatedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIzLCJyb2xlIjoidHJhaW5lciIsImlhdCI6MTY5MDAwMTI3NX0.jnArqzd6dCS8vhIMKU8CEm4v-uGdkP1988Vlvq9Vxp8';
    // await sendMail("py.suhant@gmail.com", 'Successfully Register ', emailVerificationHTML(generatedToken))
    // return "mail sent";
  },

  activeSession: async (_, { data }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const trainer = await prisma.jmktrinfo.findFirst({
      where: { tr_id: userId },
    })
    if (!trainer) throw new AuthenticationError('invalid trainer')

    const checkCrsidAssign = await prisma.jmktrcrsinfo.findFirst({ where: { tr_id: trainer.tr_id, crs_id: data.crs_id } })

    if (!checkCrsidAssign) throw ApolloError('Invalid request')


    const updateSession = await prisma.jmktrinfo.update({
      data: {
        crs_id: data.crs_id,
      },
      where: { tr_id: trainer.tr_id },
    })
    if (!updateSession) throw ApolloError('Unsuccessful to update session')
    return updateSession
  },

  signinTrainer: async (_, { data }) => {
    const trainer = await prisma.jmktrinfo.findFirst({
      where: { tr_email: data.email },
    })
    if (!trainer) throw new AuthenticationError('invalid trainer credentials')
    const isMatch = data.password == trainer.tr_password
    if (!isMatch) throw new AuthenticationError('invalid trainer credentials')
    if (!trainer.tr_verifyed)
      throw new ApolloError('You are not permitted to log in')
    const token = jwt.sign(
      { userId: trainer.tr_id, role: ROLES[1] },
      process.env.JWT_SECRET_KEY
    )
    return { token }
  },

  signupTrainer: async (_, { data }) => {
    const trainer = await prisma.jmktrinfo.findFirst({
      where: { tr_email: data.tr_email },
    })

    if (trainer)
      throw new AuthenticationError('trainer already exist with that email')
    let file
    if (data.tr_resume) {
      file = await uploadImgToAWS(data.tr_resume, 'trainer_resume/')
      if (!file.data) throw new ApolloError('Someting went wrong !')
    }
    const newTrainer = await prisma.jmktrinfo.create({
      data: {
        ...data,
        tr_resume: file?.data?.Location ?? '',
        tr_resume_key: file?.data?.key ?? '',
      },
    })
    const token = jwt.sign(
      { userId: newTrainer.tr_id, purpose: 'Trainer Verification' },
      process.env.JWT_SECRET_KEY
    )
    // await sendMail(data.tr_email, 'Successfully Register ', registerrHTML)

    await sendMail(
      newTrainer.tr_email,
      'Successfully Register ',
      emailVerificationHTML(
        token,
        `${newTrainer.tr_fname} ${newTrainer.tr_lname}`,
        'TrainerVerification'
      )
    )
    return { token }
  },

  updateTrainer: async (_, { data }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const trainer = await prisma.jmktrinfo.findFirst({
      where: { tr_id: userId },
    })
    if (!trainer) throw new AuthenticationError('invalid trainer')
    const newTrainer = await prisma.jmktrinfo.update({
      data: {
        tr_fname: data.tr_fname,
        tr_mname: data.tr_mname,
        tr_lname: data.tr_lname,
        tr_email: data.tr_email,
        tr_mobile: data.tr_mobile,
        tr_city: data.tr_city,
        tr_country: data.tr_country,
        tr_main_tech1: data.tr_main_tech1,
        tr_main_tech2: data.tr_main_tech2,
        tr_main_tech3: data.tr_main_tech3,
        tr_github: data.tr_github,
        tr_linkedin: data.tr_linkedin,
        tr_resume: data.tr_resume,
        tr_dob: data.tr_dob,
        tr_password: data.tr_password,
      },
      where: { tr_id: userId },
    })
    if (!newTrainer) throw new Error('something went wrong!!')
    return newTrainer
  },

  addTrainerStudentFeedback: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid aceess')
    if (role === ROLES[1]) {
      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      })
      if (!trainer) throw new AuthenticationError('invalid Trainer credentials')
      const feedback = await prisma.jmkstdtrfeedback.create({
        data: {
          std_id: data.std_id,
          tr_id: userId,
          comment: data.comment,
          content_date: new Date(),
        },
      })
      if (!feedback) throw new ApolloError('something went wrong !')
      return 'success'
    }
    throw new ForbiddenError('Bad request !!')
  },

  updateTrainerStudentFeedback: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid aceess')
    if (role === ROLES[1]) {
      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      })
      if (!trainer) throw new AuthenticationError('invalid Trainer credentials')
      const feedback = await prisma.jmkstdtrfeedback.findFirst({
        where: {
          serial: data.serial,
        },
      })
      if (!feedback) throw new ApolloError('Invalid !')
      const updateFeedback = await prisma.jmkstdtrfeedback.update({
        data: {
          ...feedback,
          comment: data.comment,
        },
        where: {
          serial: data.serial,
        },
      })
      if (!updateFeedback) throw new ApolloError('something went wrong !')
      return 'success'
    }
    throw new ForbiddenError('Bad request !!')
  },

  deleteTrainerStudentFeedback: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid aceess')
    if (role === ROLES[1]) {
      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      })
      if (!trainer) throw new AuthenticationError('invalid Trainer credentials')
      const deleteFeedback = await prisma.jmkstdtrfeedback.delete({
        where: {
          serial: data.serial,
        },
      })
      if (!deleteFeedback) throw new ApolloError('something went wrong !')
      return 'success'
    }
    throw new ForbiddenError('Bad request !!')
  },

  addQuestion: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (role === ROLES[1]) {
      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      })
      if (!trainer) throw new AuthenticationError('invalid trainer credentials')
      const question = await prisma.jmkquesans.create({
        data: {
          ...data,
        },
      })
      if (!question) throw new ApolloError('No Questions Found !')
      return 'success'
    }
  },

  updateQuestion: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (role === ROLES[1]) {
      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      })
      if (!trainer) throw new AuthenticationError('invalid trainer credentials')
      const question = await prisma.jmkquesans.update({
        data: {
          ...data,
        },
        where: {
          ques_id: data.ques_id,
        },
      })
      if (!question) throw new ApolloError('No Questions Found !')
      return 'success'
    }
  },

  addCourseContent: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid aceess')
    if (role === ROLES[1]) {
      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      })
      if (!trainer) throw new AuthenticationError('invalid Trainer credentials')
      const course = await prisma.jmkcrsinfo.findFirst({
        where: { crs_id: parseInt(data.crs_id) },
      })
      if (!course) throw new ApolloError('Bad Request')
      const courseContent = await prisma.jmkcrscontents.create({
        data: {
          crs_id: data.crs_id,
          content: data.content,
          content_date: data.content_date,
        },
      })
      if (!courseContent) throw new ApolloError('something went wrong !')
      return 'success'
    }
    throw new ForbiddenError('Bad request !!')
  },

  updateCourseContent: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid aceess')
    if (role === ROLES[1]) {
      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      })
      if (!trainer) throw new AuthenticationError('invalid Trainer credentials')
      const courseContent = await prisma.jmkcrscontents.findFirst({
        where: {
          serial: data.serial,
        },
      })
      if (!courseContent) throw new ApolloError('Invalid !')
      const updateCourseContent = await prisma.jmkcrscontents.update({
        data: {
          content: data.content,
          content_title: data.content_title,
          content_date: data.content_date,
        },
        where: {
          serial: data.serial,
        },
      })
      if (!updateCourseContent) throw new ApolloError('something went wrong !')
      return 'success'
    }
    throw new ForbiddenError('Bad request !!')
  },

  deleteCourseContent: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid aceess')
    if (role === ROLES[1]) {
      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      })
      if (!trainer) throw new AuthenticationError('invalid Trainer credentials')
      const deleteCourseContent = await prisma.jmkcrscontents.delete({
        where: {
          serial: data.serial,
        },
      })
      if (!deleteCourseContent) throw new ApolloError('something went wrong !')
      return 'success'
    }
    throw new ForbiddenError('Bad request !!')
  },
  addWeek: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (role === ROLES[1]) {
      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      })
      if (!trainer) throw new AuthenticationError('invalid trainer credentials')
      const week = await prisma.jmk_tr_week.create({
        data: {
          ...data,
          crs_id: trainer.crs_id,
        },
      })
      if (!week) throw new ApolloError('Unable to create the week')
      return 'Week Successfully added'
    }
  },
  updateWeek: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (role === ROLES[1]) {
      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      })
      if (!trainer) throw new AuthenticationError('invalid trainer credentials')
      const week = await prisma.jmk_tr_week.update({
        data: {
          ...data,
        },
        where: {
          week_id: data.week_id,
        },
      })
      if (!week) throw new ApolloError('No week Found !')
      return 'Week Successfully updated'
    }
  },
  deleteWeek: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (role === ROLES[1]) {
      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      })
      if (!trainer) throw new AuthenticationError('invalid trainer credentials')
      const weekContents = await prisma.jmk_week_content.findMany({
        where: {
          week_id: data.week_id,
        },
      })
      if (weekContents.length <= 0) {
        await prisma.jmk_tr_week.delete({
          where: {
            week_id: data.week_id,
          },
        })
        return 'Week Successfully deleted'
      } else {
        return `Week is full of content. Can't delete`
      }
    }
  },
  addTrainerWeekContentById: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (role === ROLES[1]) {
      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      })
      if (!trainer) throw new AuthenticationError('invalid trainer credentials')
      if (data.type !== 'Test') {
        await prisma.jmk_week_content.create({
          data: {
            ...data,
          },
        })
      } else {
        const testcontent = await prisma.jmk_week_content.create({
          data: {
            title: data.title,
            description: data.description,
          },
        })

        const test = await prisma.jmk_test_set.create({
          data: {
            ...data,
          },
          where: {
            content_id: testcontent.content_id,
          },
        })
        return 'week test added successfully'
      }
      return 'Successfully added content'
    }
  },
  updateTrainerWeekContentById: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (role === ROLES[1]) {
      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      })
      if (!trainer) throw new AuthenticationError('invalid trainer credentials')
      if (data.type !== 'Test') {
        await prisma.jmk_week_content.update({
          data: {
            ...data,
          },
          where: {
            content_id: data.content_id,
          },
        })
      } else {
        const testcontent = await prisma.jmk_week_content.update({
          data: {
            ...data,
          },
          where: {
            content_id_id: data.content_id_id,
            test_set_id: data.test_set_id,
          },
        })

        const test = await prisma.jmk_test_set.create({
          data: {
            ...data,
          },
          where: {
            content_id: testcontent.content_id,
          },
        })
        return 'week test updated successfully'
      }
      return 'Successfully updated content'
    }
  },
}

const trainerResolversQuery = {
  getWeekContentBasedonActiveSession: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const trainer = await prisma.jmktrinfo.findFirst({
      where: { tr_id: userId },
    })
    if (!trainer) throw new AuthenticationError('invalid trainer')
    const weeks = await prisma.jmk_tr_week.findMany({
      where: {
        crs_id: trainer.crs_id,
      },
    })
    return weeks
  },
  getContentByWeekId: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const trainer = await prisma.jmktrinfo.findFirst({
      where: { tr_id: userId },
    })
    if (!trainer) throw new AuthenticationError('invalid trainer')
    const contents = await prisma.jmk_week_content.findMany({
      where: {
        week_id: args.week_id,
      },
    })
    return contents
  },

  getAssignedSessions: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const trainer = await prisma.jmktrinfo.findFirst({
      where: { tr_id: userId },
    })
    if (!trainer) throw new AuthenticationError('invalid trainer')
    const sessionDetails = await prisma.jmktrcrsinfo.findMany({
      where: {
        tr_id: trainer.tr_id,
      },
      include: {
        jmkcrsinfo: true,
      },
    })

    return sessionDetails
  },
  trainer: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    if (role === ROLES[1]) {
      const user = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      })
      if (!user) throw new AuthenticationError('invalid user credentials')
      return user
    }
    throw new ForbiddenError('Bad request !!')
  },

  getTrainerDashboard: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    if (role === ROLES[1]) {
      let students = 0
      let videos = 0
      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      })
      if (!trainer) throw new AuthenticationError('invalid trainer credentials')
      const trainerCourses = await prisma.jmktrcrsinfo.findMany({
        where: {
          tr_id: userId,
        },
      })
      for (let index = 0; index < trainerCourses.length; index++) {
        const total_videos = await prisma.jmkvidinfo.count({
          where: { crs_id: trainerCourses[index].crs_id },
        })
        const total_student = await prisma.jmkstdcrsinfo.count({
          where: { crs_id: trainerCourses[index].crs_id },
        })
        if (total_videos) {
          videos += total_videos
        }
        if (total_student) {
          students += total_student
        }
      }
      return { students, videos, courses: trainerCourses.length }
    }
  },

  getstudentForTrainer: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (role === ROLES[1]) {
      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      })
      if (!trainer) throw new AuthenticationError('invalid trainer credentials')
      const trainerCourses = await prisma.jmktrcrsinfo.findMany({
        where: {
          tr_id: userId,
        },
      })

      let students = []
      for (let index = 0; index < trainerCourses.length; index++) {
        const crs = await prisma.jmkstdcrsinfo.findMany({
          where: { crs_id: trainerCourses[index].crs_id },
        })
        for (let index = 0; index < crs.length; index++) {
          const course = await prisma.jmkcrsinfo.findFirst({
            where: { crs_id: crs[index].crs_id },
          })
          const student = await prisma.jmkstdinfo.findMany({
            where: { std_id: crs[index].std_id },
          })
          if (crs) {
            const mergestudent = student.map((i) => ({
              ...i,
              crs_type: course.crs_type,
              crs_name: course.crs_name,
            }))
            students.push(...mergestudent)
          }
        }
      }
      students = students.filter(
        (v, i, a) => a.findIndex((v2) => v2.std_id === v.std_id) === i
      )
      return students
    }
  },

  getTrainerCourses: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    if (role === ROLES[1]) {
      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      })
      if (!trainer) throw new AuthenticationError('invalid trainer credentials')
      const trainerCourses = await prisma.jmktrcrsinfo.findMany({
        where: {
          tr_id: userId,
        },
      })
      const trCourses = []
      for (let index = 0; index < trainerCourses.length; index++) {
        const course = await prisma.jmkcrsinfo.findFirst({
          where: { crs_id: trainerCourses[index].crs_id },
        })
        const total_videos = await prisma.jmkvidinfo.count({
          where: { crs_id: course.crs_id },
        })
        const total_student = await prisma.jmkstdcrsinfo.count({
          where: { crs_id: course.crs_id },
        })
        if (course) {
          trCourses.push({ ...course, total_videos, total_student })
        }
      }
      return trCourses
    }
  },

  getstudentTestSetForTrainer: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (role === ROLES[1]) {
      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      })
      if (!trainer) throw new AuthenticationError('invalid trainer credentials')
      const trainerCourses = await prisma.jmktrcrsinfo.findMany({
        where: {
          tr_id: userId,
        },
      })
      let testSet = []
      let testList = []

      for (let index = 0; index < trainerCourses.length; index++) {
        const test = await prisma.jmkstdtestset.findMany({
          where: { crs_id: trainerCourses[index].crs_id },
        })
        test?.forEach((item) => {
          testSet.push(item)
        })
      }

      for (let index = 0; index < testSet.length; index++) {
        const student = await prisma.jmkstdinfo.findFirst({
          where: { std_id: testSet[index].std_id },
        })
        const course = await prisma.jmkcrsinfo.findFirst({
          where: { crs_id: testSet[index].crs_id },
        })
        testList.push({
          ...testSet[index],
          std_fname: student.std_fname,
          std_mname: student.std_mname,
          std_lname: student.std_lname,
          std_email: student.std_email,
          crs_name: course.crs_name ?? 'wdwd',
          crs_type: course.crs_type ?? '',
        })
      }

      return testList
    }
  },

  getstudentTestResultById: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (role === ROLES[1]) {
      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      })
      if (!trainer) throw new AuthenticationError('invalid trainer credentials')
      const testSet = await prisma.jmkstdtestset.findFirst({
        where: { serial: args.serial },
      })
      const student = await prisma.jmkstdinfo.findFirst({
        where: { std_id: testSet.std_id },
      })
      const course = await prisma.jmkcrsinfo.findFirst({
        where: { crs_id: testSet.crs_id },
      })
      const studentAns = await prisma.jmkstdtestqa.findMany({
        where: { std_test_set_id: testSet.serial },
      })

      const studentQA = []
      let score = 0

      for (let index = 0; index < studentAns.length; index++) {
        const question = await prisma.jmkquesans.findFirst({
          where: { ques_id: studentAns[index].ques_id },
        })
        if (question.rtans === studentAns[index].std_ans) {
          score += 1
        }
        studentQA.push({
          question: question.question,
          rtans: question.rtans,
          std_ans: studentAns[index].std_ans,
        })
      }

      const result = {
        ...testSet,
        ...student,
        ...course,
        score,
        studentQA,
      }

      return result
    }
  },

  getTrainerStudentFeedback: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (role === ROLES[1]) {
      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      })
      if (!trainer) throw new AuthenticationError('invalid trainer credentials')
      const feenbacks = await prisma.jmkstdtrfeedback.findMany({
        where: { std_id: args.std_id, tr_id: userId },
      })
      if (!feenbacks) throw new ApolloError('No Feedback')
      return feenbacks
    }
  },

  getQuestionModule: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (role === ROLES[1]) {
      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      })
      if (!trainer) throw new AuthenticationError('invalid trainer credentials')
      const Qmodule = await prisma.jmkcrsmodule.findMany()
      const mergeModules = Qmodule?.map(async (item) => {
        const total_question = await prisma.jmkquesans.count({
          where: { mod_id: item.mod_id },
        })
        return { ...item, total_question }
      })
      if (!mergeModules) throw new ApolloError('No Module Found !')
      return mergeModules
    }
  },

  getQuestionByModuleId: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (role === ROLES[1]) {
      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      })
      if (!trainer) throw new AuthenticationError('invalid trainer credentials')
      const questions = await prisma.jmkquesans.findMany({
        where: { mod_id: args.mod_id },
      })
      if (!questions) throw new ApolloError('No Questions Found !')
      return questions
    }
  },

  getQuestionByQuestionId: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (role === ROLES[1]) {
      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      })
      if (!trainer) throw new AuthenticationError('invalid trainer credentials')
      const question = await prisma.jmkquesans.findFirst({
        where: { ques_id: args.ques_id },
      })
      if (!question) throw new ApolloError('No Questions Found !')
      return question
    }
  },
}

export {
  trainerQueryTypesAndInputs,
  trainerQuery,
  trainerMutation,
  trainerResolvers,
  trainerResolversQuery,
}
