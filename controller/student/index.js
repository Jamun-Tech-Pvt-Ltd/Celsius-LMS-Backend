import {
  ApolloError,
  AuthenticationError,
  ForbiddenError,
} from 'apollo-server-express'
import prisma from '../../database.js'
import jwt from 'jsonwebtoken'
import { ROLES } from '../../utils/helper.js'
import { deleteImgToAWS, uploadImgToAWS } from '../../utils/imageHandler.js'
import { sendMail } from '../../utils/mailHandler.js'
import registerrHTML from '../../utils/signup.js'
import newUserSignupNotification from '../../utils/newUsersignup.js'
import forgotPasswordHTML from '../../utils/forgotPassword.js'

const studentQueryTypesAndInputs = `
    input SigninInput{
      cid:Int!
        email: String!
        password: String!
    }

    input SignupInput{
        std_fname: String!
        std_mname: String
        std_lname: String!
        std_mobile: String!
        std_email: String!
        std_password: String!
        std_birth_dt: Date
        std_remark:String
        crsmain_id:Int
        crs_ecp_st_d:Date!
        cid:Int
    }

    input UpdateUserInput {
        std_fname: String!
        std_mname: String
        std_lname: String!
        std_email: String!
        std_mobile: String!
        std_birth_dt: String
        std_password: String
    }

    input GrievancesInput {
        grv_type: String!
        grv_desc: String!
        grv_rate: String!
     }

     input studentProjectInput{
      proj_id:Int!
      proj_git_link:String!
     }

    input forgotPPEmailCheckInput {
        std_email: String!
    }
  
    input forgotPasswordInput {
        token: String!
        new_password: String!
    }

    input studentReviewInput {
        rate: String!
     }
  
     input addNewCourseInput {
        crs_id: ID!
        crs_start_dt: Date!
     }
  
     input removeCourseFromUserInput   {
        crs_id: ID!
     }
  
     input changeActiveCourseInput {
        crs_id: ID!
     }
  
     input studentVideoNoteUpdateInput {
        serial: Int
        vid_id: Int!
        vid_note: String!
     }
  
     input updateStudentAnsInput {
        qserial: Int!
        std_ans: String!
        std_test_set_id: Int!
     }

     input addStudentPaymentInput{
        payment_date: Date!
        pay_amount: Int!
        transaction_id: String!
     }


     type Feedback {
        grv_id : ID!
        std_id: String!
        grv_date: Date!   
        grv_type: String!
        grv_rate: String!     
        grv_desc: String!   
     }

     type StudentTestSet {
        serial: Int!
        std_lname: String!
        std_fname: String!
        std_mname: String
        std_email: String!
        crs_name: String!
        crs_type: String!
        isComplete: Boolean!
        timer: Int!
     }
  
     
     type studentQA {
        question: String!
        rtans: String!
        std_ans: String
     }

     type studentCourseProject{
      proj_id: Int!
      crs_id: Int!
      proj_title:String!
      proj_desc: String!
      proj_git_link:String!
      submited:Boolean
     }
     

     type UserCourse {
        serial : ID!
        crs_id: ID!
        crs_start_dt: Date
        std_id: ID!
        crs_name: String!
        discount: Int
        amt_paid: Int
        amt_due: Int
        crs_rate: Int
        std_crs_verirfy: Boolean
        crs_complete: Boolean
        crs_complete_date: Date
     }
  
     type ActiveUserCourse {
        serial : ID
        crs_id: ID
        crs_start_dt: Date
        std_id: ID
        crs_name: String
        discount: Int
        amt_paid: Int
        amt_due: Int
        crs_rate: Int
     }
     
     type User {
        std_id: ID!
        std_fname: String!
        std_mname: String
        std_lname: String!
        std_email: String!
        std_pic: String
        crs_complete: Boolean
        crs_complete_date: Date
        std_password: String!
        std_mobile: String!
        std_join_dt: Date
        std_birth_dt: Date
        std_high_ql: String
        crs_id: ID!
        std_status: Int
        std_paidup: Int
        std_due: Int
        feedback: [Feedback]
     }

     type StudentQuestionSet {
        serial: Int!
        std_id: Int!
        crs_id: Int!
        timer: Int!
        test_category: String!
        totalrt: Int!
        testlbl: Int!
        isComplete: Boolean!
     }

     type StdQuestion {
        qserial: Int!
        ques_id: Int!
        std_ans: String
        std_test_set_id: Int!
     }

     type StdQuestionType {
        questionsSet: StudentQuestionSet!
        questions: [StdQuestion]
     }

     type Score{
      totalrt: Int!
      testlbl: Int!
     }
  
     type CourseContents {
        serial: Int!
        content: String!
        content_date: Date!
     }

     type Video {
        vid_id: String!
        vid_name: String!
        vid_loc: String
        crs_id: String!
        vid_date: Date!
        vid_summary: String!
     }
  
     type VideoNote {
        serial: ID!
        vid_id: ID!
        std_id: ID!
        vid_note: String!
     }
  

`

const studentQuery = `
    me:User!
    myDailyVideo:[Video]
    myDailyVideoByid(vid_id:Int!):Video!
    myCourse:Course,
    myCourseContents:[CourseContents],
    myCourseContent(id:Int!):CourseContents,
    getCourseContentsByCrsId(crs_id:Int!):[CourseContents]
    courseList:[PublicCourseType]
    userCourseList:[UserCourse]
    studentVideoNote(vid_id:Int!): VideoNote!
    getActiveUserCourse: ActiveUserCourse

    questionSetList:[StudentQuestionSet]
    getTestQuestion(set_id:Int!):StdQuestionType!
    getQuestionByid(ques_id:Int!):Question!
    getQuestionVidew(set_id:Int!):String!
    getTotalGrade:Score!
    loadQuestion: String!
    loadTest: String!

    
    getProjectByStudentSelectedCourse:[studentCourseProject]
    getProjectByStudentSelectedCourseById(proj_id:Int!):studentCourseProject


`

const studentMutation = `

    signinUser(userSignIn:SigninInput!):Token
    signupUser(userNew:SignupInput!):Token
    updateUser(data:UpdateUserInput):User

    feedback(data:GrievancesInput!):[Feedback]
    studentVideoNoteUpdate(data:studentVideoNoteUpdateInput):VideoNote!

    updateStudentAns(data:[updateStudentAnsInput]):String!

    addNewCourse(data:addNewCourseInput):String!
    changeActiveCourse(data:changeActiveCourseInput):User!
    removeCourseFromUser(data:removeCourseFromUserInput):String!

    forgotPPEmailCheck(data:forgotPPEmailCheckInput): String!
    forgotPassword(data:forgotPasswordInput):String!
    uploadFile(file: Upload!): User
    studentReview(data:studentReviewInput):String

    addStudentPayInfo(data:addStudentPaymentInput): String!
    submitProject(data:studentProjectInput):String!
    

`

const studentResolvers = {
  signinUser: async (_, { userSignIn }) => {
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_email: userSignIn.email },
    })
    if (!user) throw new AuthenticationError('invalid user credentials')
    const isMatch = userSignIn.password == user.std_password
    if (!isMatch) throw new AuthenticationError('invalid user credentials')
    if (user.cid !== userSignIn.cid)
      throw new AuthenticationError('invalid organization selected')

    const token = jwt.sign(
      { userId: user.std_id, role: ROLES[0] },
      process.env.JWT_SECRET_KEY
    )
    return { token }
  },

  signupUser: async (_, { userNew }, { userId, role }) => {
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_email: userNew.std_email },
    })
    if (user)
      throw new AuthenticationError('user already exist with that email')
    const course = await prisma.jmkcrsmain.findFirst({
      where: {
        crsmain_id: userNew.crsmain_id,
      },
    })
    if (!course) throw new AuthenticationError('invalid course')
    if (role === ROLES[2]) {
      const newUser = await prisma.jmkstdinfo.create({
        data: {
          ...userNew, cid: userId
        },
      })
      await prisma.jmkstdcrsinfo.create({
        data: {
          crsmain_id: userNew.crsmain_id,
          crs_start_dt: userNew.crs_ecp_st_d,
          std_id: newUser.std_id,
        },
      })
      const token = jwt.sign(
        { userId: newUser.std_id, role: ROLES[0] },
        process.env.JWT_SECRET_KEY
      )
      return { token }
    }

    const newUser = await prisma.jmkstdinfo.create({
      data: { ...userNew },
    })
    await prisma.jmkstdcrsinfo.create({
      data: {
        crs_id: userNew.crs_id,
        crs_start_dt: userNew.crs_ecp_st_d,
        std_id: newUser.std_id,
      },
    })
    const token = jwt.sign(
      { userId: newUser.std_id, role: ROLES[0] },
      process.env.JWT_SECRET_KEY
    )
    // await sendMail(newUser.std_email, 'Successfully Register ', registerrHTML)
    // await sendMail('riwaz@jamuntek.com', 'New User Singup Notification', newUserSignupNotification(newUser, course.crs_name))
    // await sendMail('jenish@jamuntek.com', 'New User Singup Notification', newUserSignupNotification(newUser, course.crs_name))
    return { token }
  },

  updateUser: async (_, { data }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user')
    const newUser = await prisma.jmkstdinfo.update({
      data: {
        std_fname: data.std_fname,
        std_mname: data.std_mname,
        std_lname: data.std_lname,
        std_email: data.std_email,
        std_mobile: data.std_mobile,
        std_birth_dt: data.std_birth_dt,
        std_password: data.std_password,
      },
      where: { std_id: userId },
    })
    if (!newUser) throw new Error('something went wrong!!')
    return newUser
  },

  forgotPPEmailCheck: async (_, { data }) => {
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_email: data.std_email },
    })
    if (!user) throw new AuthenticationError("user doesn't exist !!")
    const token = jwt.sign(
      { userId: user.std_id },
      process.env.JWT_SECRET_KEY_FORGOT_PP,
      {
        expiresIn: '1d',
      }
    )
    const url = `${process.env.CLIENT_URL}forgotpassword/verification?token=${token}`
    await sendMail(
      user.std_email,
      'Reset your password !',
      forgotPasswordHTML(url)
    )
    return 'Email send !!'
  },

  forgotPassword: async (_, { data }) => {
    if (!data.token) throw new AuthenticationError('Bad request !')
    const { userId } = jwt.verify(
      data.token,
      process.env.JWT_SECRET_KEY_FORGOT_PP
    )
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    if (!user) throw new AuthenticationError("user doesn't exist !!")
    const reg = await prisma.jmkstdinfo.update({
      data: {
        std_password: data.new_password,
      },
      where: {
        std_id: userId,
      },
    })
    if (!reg) throw new AuthenticationError('someting went wrong !!')
    return 'success'
  },

  uploadFile: async (_, { file }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    if (!user) throw new ForbiddenError('Someting went wrong !')
    await deleteImgToAWS(user.std_pic_key)
    const data = await uploadImgToAWS(file, 'user_profiles_pic/')
    if (!data.data) throw new ApolloError('Someting went wrong !')
    const newUser = await prisma.jmkstdinfo.update({
      data: {
        std_pic: data.data.Location,
        std_pic_key: data.data.key,
      },
      where: { std_id: userId },
    })
    if (!newUser) throw new Error('something went wrong!!')
    return newUser
  },

  studentReview: async (_, { data }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user')
    const student_review = await prisma.jmkstdreview.create({
      data: {
        std_id: userId,
        std_rate: data.rate,
        std_rate_date: new Date(),
      },
    })
    if (!student_review) throw new Error('something went wrong!!')
    return 'success'
  },

  feedback: async (_, { data }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user')
    const grv = await prisma.jmkgrvinfo.findMany({
      where: { std_id: userId },
    })
    const oldgrv = grv.find((item) => item.grv_type === data.grv_type)
    if (oldgrv) {
      const updateFeedback = await prisma.jmkgrvinfo.update({
        data: {
          grv_type: data.grv_type,
          grv_desc: data.grv_desc,
          grv_rate: data.grv_rate,
        },
        where: { grv_id: oldgrv.grv_id },
      })
      if (!updateFeedback) throw new Error('something went wrong!!')
      const newFeedback = await prisma.jmkgrvinfo.findMany({
        where: { std_id: userId },
      })
      return newFeedback
    }
    const createFeedback = await prisma.jmkgrvinfo.create({
      data: {
        std_id: userId,
        grv_date: new Date(),
        grv_type: data.grv_type,
        grv_desc: data.grv_desc,
        grv_rate: data.grv_rate,
      },
    })
    if (!createFeedback) throw new Error('something went wrong!!')
    const newFeedback = await prisma.jmkgrvinfo.findMany({
      where: { std_id: userId },
    })
    return newFeedback
  },

  addNewCourse: async (_, { data }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    const course = await prisma.jmkcrsinfo.findFirst({
      where: { crs_id: parseInt(data.crs_id) },
    })
    const userCourse = await prisma.jmkstdcrsinfo.findFirst({
      where: { std_id: userId, crs_id: parseInt(data.crs_id) },
    })
    if (!user) throw new AuthenticationError('invalid user')
    if (!course) throw new ApolloError('Bad Request')
    if (userCourse) throw new ApolloError('you already have this course')
    await prisma.jmkstdcrsinfo.create({
      data: {
        crs_id: parseInt(data.crs_id),
        crs_start_dt: data.crs_start_dt,
        std_id: userId,
      },
    })
    return 'success'
  },

  addStudentPayInfo: async (_, { data }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user')
    await prisma.jmktstdpayinfo.create({
      data: {
        std_id: user.std_id,
        payment_date: new Date(data.payment_date),
        pay_amount: parseInt(data.pay_amount),
        transaction_id: data.transaction_id,
        crs_id: user.crs_id,
      },
    })
    return 'success'
  },

  changeActiveCourse: async (_, { data }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    const course = await prisma.jmkcrsinfo.findFirst({
      where: { crs_id: parseInt(data.crs_id) },
    })
    if (!user) throw new AuthenticationError('invalid user')
    if (!course) throw new ApolloError('Bad Request')
    const userCourse = await prisma.jmkstdcrsinfo.findFirst({
      where: {
        std_id: userId,
        crs_id: parseInt(data.crs_id),
      },
    })
    if (parseInt(data.crs_id) === user.crs_id)
      throw new ApolloError('Already selected')
    if (!userCourse.std_crs_verirfy)
      throw new ApolloError(
        'your are not permited to use this course, wait for admin to approve or cantact our support !'
      )
    const updateUser = await prisma.jmkstdinfo.update({
      data: {
        crs_id: parseInt(data.crs_id),
      },
      where: { std_id: userId },
    })
    return updateUser
  },

  removeCourseFromUser: async (_, { data }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user')
    if (!data.crs_id) throw new AuthenticationError('course id required')
    if (user.crs_id === parseInt(data.crs_id))
      throw new AuthenticationError("Can't delete active course")
    const checkCourse = await prisma.jmkstdcrsinfo.findFirst({
      where: {
        crs_id: parseInt(data.crs_id),
        std_id: userId,
      },
    })
    if (!checkCourse) throw new AuthenticationError('invalid')
    const deleteUserCourse = await prisma.jmkstdcrsinfo.delete({
      where: {
        serial: checkCourse.serial,
      },
    })
    if (!deleteUserCourse) throw new AuthenticationError('invalid !!')
    return 'success'
  },

  studentVideoNoteUpdate: async (_, { data }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user')
    const vid = await prisma.jmkvidinfo.findFirst({
      where: {
        vid_id: data.vid_id,
      },
    })
    if (user.crs_id !== vid.crs_id) throw new AuthenticationError('invalid')
    const getStdNote = await prisma.jmkstdvidnote.findFirst({
      where: {
        std_id: userId,
        vid_id: data.vid_id,
      },
    })
    if (!getStdNote) {
      const note = await prisma.jmkstdvidnote.create({
        data: {
          std_id: userId,
          vid_id: data.vid_id,
          vid_note: data.vid_note,
        },
      })

      return note
    }
    const note = await prisma.jmkstdvidnote.update({
      data: {
        vid_note: data.vid_note,
      },
      where: {
        serial: data.serial,
      },
    })
    return note
  },

  updateStudentAns: async (_, { data }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user')

    const questionsSet = await prisma.jmkstdtestset.findFirst({
      where: {
        std_id: userId,
        isComplete: false,
        crs_id: user.crs_id,
        serial: parseInt(data[0].std_test_set_id),
      },
    })
    if (!questionsSet) throw new ApolloError('Invalid !')
    for (let index = 0; index < data.length; index++) {
      if (!data[index].std_ans)
        throw new AuthenticationError('std_ans id required')
      if (!data[index].std_test_set_id)
        throw new AuthenticationError('std_test_set_id id required')
      await prisma.jmkstdtestqa.update({
        data: {
          std_ans: data[index].std_ans,
        },
        where: {
          qserial: data[index].qserial,
        },
      })
    }

    //updating the score
    const studentAnswers = await prisma.jmkstdtestqa.findMany({
      select: { ques_id: true, std_ans: true, std_test_set_id: true },
      where: {
        std_test_set_id: parseInt(data[0].std_test_set_id),
      },
    })

    const allRightAnswer = await prisma.jmkquesans.findMany({
      select: { rtans: true, ques_id: true },
    })

    const result = allRightAnswer.filter((rans) => {
      return studentAnswers.some((ans) => {
        return rans.ques_id === ans.ques_id
      })
    })

    for (let stdAns of studentAnswers) {
      for (let rightAns of result) {
        if (
          stdAns.ques_id === rightAns.ques_id &&
          stdAns.std_ans === rightAns.rtans
        ) {
          await prisma.jmkstdtestset.update({
            data: {
              totalrt: {
                increment: 1,
              },
            },
            where: { serial: stdAns.std_test_set_id },
          })
        }
      }
    }

    const questionsSetUpdate = await prisma.jmkstdtestset.update({
      data: {
        isComplete: true,
      },
      where: {
        serial: parseInt(data[0].std_test_set_id),
      },
    })

    if (!questionsSetUpdate) throw new ApolloError('Somethig went wrong !')

    //creating new testlbl if isComplete = true for previous
    const testLevel = await prisma.jmkstdtestset.findFirst({
      where: {
        std_id: userId,
        crs_id: user.crs_id,
      },
      orderBy: {
        testlbl: 'desc',
      },
    })

    if (testLevel.isComplete === true) {
      if (testLevel.testlbl < 4) {
        await prisma.jmkstdtestset.create({
          data: {
            std_id: user.std_id,
            crs_id: user.crs_id,
            test_category: testLevel.testlbl >= 2 ? 'Advance' : 'Fundamental',
            isComplete: false,
            timer: testLevel.testlbl >= 2 ? 30 : 20,
            testlbl: testLevel.testlbl + 1,
          },
        })
      }
    }

    //
    return 'success'
  },
  submitProject: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user')
    const project = await prisma.jmkcrsproject.findFirst({
      where: { proj_id: data.proj_id },
    })
    if (project) {
      await prisma.jmkstdproj.create({
        data: { ...data, std_id: user.std_id, proj_sub_date: new Date() },
      })
      await prisma.jmkcrsproject.update({
        data: {
          submited: true,
        },
        where: {
          proj_id: data.proj_id,
        },
      })
      return 'success'
    }
    return 'No such project found '
  },
}

const studentResolversQuery = {
  me: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    if (role === ROLES[0]) {
      const user = await prisma.jmkstdinfo.findFirst({
        where: { std_id: userId },
      })
      if (!user) throw new AuthenticationError('invalid user credentials')
      const feedback = await prisma.jmkgrvinfo.findMany({
        where: { std_id: userId },
      })
      if (!feedback[0]) return user
      return { ...user, feedback }
    }
    throw new ForbiddenError('Bad request !!')
  },

  myDailyVideo: async (_, args, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    const videos = await prisma.jmkvidinfo.findMany({
      where: { crs_id: user.crs_id },
    })
    return videos
  },

  myDailyVideoByid: async (_, args, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user')
    const video = await prisma.jmkvidinfo.findFirst({
      where: { vid_id: args.vid_id },
    })
    if (!video) throw new ForbiddenError('invalid !')
    if (user.crs_id !== video.crs_id) throw new ForbiddenError('invalid !')
    return video
  },

  myCourse: async (_, args, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    const course = await prisma.jmkcrsinfo.findFirst({
      where: { crs_id: user.crs_id },
    })
    return course
  },

  courseList: async () => {
    const course = await prisma.jmkcrsinfo.findMany()
    const filter = course.reduce((all, course) => {
      all[course.crs_type] = [...(all[course.crs_type] || []), { ...course }]
      return all
    }, {})
    const newObj = Object.entries(filter).map((item) => ({
      crs_type: item[0],
      courses: [...item[1]],
    }))
    return newObj
  },

  userCourseList: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    if (role === ROLES[0]) {
      const user = await prisma.jmkstdinfo.findFirst({
        where: { std_id: userId },
      })
      if (!user) throw new AuthenticationError('invalid user credentials')
      const stdcourse = await prisma.jmkstdcrsinfo.findMany({
        where: { std_id: userId },
      })
      const userCourse = []
      for (let index = 0; index < stdcourse.length; index++) {
        const course = await prisma.jmkcrsinfo.findFirst({
          where: { crs_id: stdcourse[index].crs_id },
        })
        userCourse.push({ ...stdcourse[index], crs_name: course.crs_name })
      }
      return userCourse
    }
    throw new ForbiddenError('Bad request !!')
  },

  myCourseContents: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    if (role === ROLES[0]) {
      const user = await prisma.jmkstdinfo.findFirst({
        where: { std_id: userId },
      })
      if (!user) throw new AuthenticationError('invalid user credentials')
      const courseContents = await prisma.jmkcrscontents.findMany({
        where: { crs_id: user.crs_id },
        orderBy: {
          content_date: 'desc',
        },
      })
      if (!courseContents) throw new ApolloError('empty courseContents')
      return courseContents
    }
    throw new ForbiddenError('Bad request !!')
  },

  myCourseContent: async (_, args, { userId, role }) => {
    if (role === ROLES[0]) {
      if (!userId) throw new ForbiddenError('user need to login')
      const user = await prisma.jmkstdinfo.findFirst({
        where: { std_id: userId },
      })
      if (!user) throw new AuthenticationError('invalid user credentials')
      const courseContent = await prisma.jmkcrscontents.findFirst({
        where: { serial: args.id, crs_id: user.crs_id },
      })
      if (!courseContent) throw new ApolloError('empty courseContents')
      return courseContent
    }
    if (role === ROLES[1]) {
      if (!userId) throw new ForbiddenError('trainer need to login')
      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      })
      if (!trainer) throw new AuthenticationError('invalid trainer credentials')
      const courseContent = await prisma.jmkcrscontents.findFirst({
        where: { serial: args.id },
      })
      if (!courseContent) throw new ApolloError('empty courseContents')
      return courseContent
    }
    throw new ForbiddenError('Bad request !!')
  },

  getCourseContentsByCrsId: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('trainer need to login')
    if (role === ROLES[1]) {
      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      })
      if (!trainer) throw new AuthenticationError('invalid trainer credentials')
      const courseContent = await prisma.jmkcrscontents.findMany({
        where: { crs_id: args.crs_id },
      })
      if (!courseContent) throw new ApolloError('empty courseContents')
      return courseContent
    }
    throw new ForbiddenError('Bad request !!')
  },

  getActiveUserCourse: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    if (role === ROLES[0]) {
      const user = await prisma.jmkstdinfo.findFirst({
        where: { std_id: userId },
      })
      if (!user) throw new AuthenticationError('invalid user credentials')
      const stdcourse = await prisma.jmkstdcrsinfo.findFirst({
        where: { std_id: userId, crs_id: user.crs_id },
      })
      if (!stdcourse) throw new ForbiddenError('invalid')

      const crs = await prisma.jmkcrsinfo.findFirst({
        where: { crs_id: user.crs_id },
      })
      return { ...stdcourse, crs_rate: crs.crs_rate, crs_name: crs.crs_name }
    }
    throw new ForbiddenError('Bad request !!')
  },

  studentVideoNote: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    if (role === ROLES[0]) {
      const user = await prisma.jmkstdinfo.findFirst({
        where: { std_id: userId },
      })
      if (!user) throw new AuthenticationError('invalid user credentials')
      const note = await prisma.jmkstdvidnote.findFirst({
        where: { std_id: userId, vid_id: args.vid_id },
      })
      if (!note) throw new ApolloError('Empty Note !')
      return note
    }
    throw new ForbiddenError('Bad request !!')
  },

  questionSetList: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    if (role === ROLES[0]) {
      const user = await prisma.jmkstdinfo.findFirst({
        where: { std_id: userId },
      })
      if (!user) throw new AuthenticationError('invalid user credentials')
      const questionsSet = await prisma.jmkstdtestset.findMany({
        where: { std_id: userId, crs_id: user.crs_id },
      })
      if (!questionsSet) throw new ApolloError('Empty questions !')
      return questionsSet
    }
    throw new ForbiddenError('Bad request !!')
  },
  loadQuestion: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    if (role === ROLES[0]) {
      const user = await prisma.jmkstdinfo.findFirst({
        where: { std_id: userId },
      })
      if (!user) throw new AuthenticationError('invalid user credentials')
      const questionsSet = await prisma.jmkstdtestset.findMany({
        where: {
          std_id: userId,
        },
      })
      questionsSet.map(async (set) => {
        const selectedQuestions = await prisma.jmkquesans.findMany({
          where: {
            crsmain_id: user.crs_id,
            testlbl: set.testlbl,
          },
        })

        selectedQuestions.slice(0, 5).forEach(async (question) => {
          const existedQuestion = await prisma.jmkstdtestqa.findFirst({
            where: { ques_id: question.ques_id },
          })

          if (!existedQuestion) {
            await prisma.jmkstdtestqa.create({
              data: {
                ques_id: question.ques_id,
                std_test_set_id: set.serial,
              },
            })
          }
        })
      })
      return 'Loaded successfully'
    }
    throw new ForbiddenError('Bad request !!')
  },
  loadTest: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    if (role === ROLES[0]) {
      const user = await prisma.jmkstdinfo.findFirst({
        where: { std_id: userId },
      })
      if (!user) throw new AuthenticationError('invalid user credentials')
      const testlevel = await prisma.jmkstdtestset.findFirst({
        where: {
          std_id: user.std_id,
          crs_id: user.crs_id,
        },
      })
      if (!testlevel) {
        await prisma.jmkstdtestset.create({
          data: {
            std_id: user.std_id,
            crs_id: user.crs_id,
            test_category: 'Fundamental',
            isComplete: false,
            timer: 20,
            testlbl: 1,
          },
        })
      }

      return 'Test Loaded'
    }
    throw new ForbiddenError('Bad request !!')
  },

  getTestQuestion: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    if (role === ROLES[0]) {
      const user = await prisma.jmkstdinfo.findFirst({
        where: { std_id: userId },
      })
      if (!user) throw new AuthenticationError('invalid user credentials')
      const questionsSet = await prisma.jmkstdtestset.findFirst({
        where: {
          std_id: userId,
          isComplete: false,
          crs_id: user.crs_id,
          serial: parseInt(args.set_id),
        },
      })
      if (!questionsSet) throw new ApolloError('Empty questions !')
      const questions = await prisma.jmkstdtestqa.findMany({
        where: { std_test_set_id: parseInt(args.set_id) },
      })
      if (!questions) throw new ApolloError('Empty question !')
      return { questionsSet, questions }
    }
    throw new ForbiddenError('Bad request !!')
  },

  getQuestionByid: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    if (role === ROLES[0]) {
      const user = await prisma.jmkstdinfo.findFirst({
        where: { std_id: userId },
      })
      if (!user) throw new AuthenticationError('invalid user credentials')
      const question = await prisma.jmkquesans.findFirst({
        where: { ques_id: parseInt(args.ques_id) },
      })
      if (!question) throw new ApolloError('Empty question !')
      return question
    }
    throw new ForbiddenError('Bad request !!')
  },

  getQuestionVidew: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    if (role === ROLES[0]) {
      const user = await prisma.jmkstdinfo.findFirst({
        where: { std_id: userId },
      })
      if (!user) throw new AuthenticationError('invalid user credentials')
      const questionsSet = await prisma.jmkstdtestset.findFirst({
        where: {
          std_id: userId,
          isComplete: false,
          crs_id: user.crs_id,
          serial: parseInt(args.set_id),
        },
      })
      if (!questionsSet) throw new ApolloError('Empty questions !')
      // const questionsSetUpdate = await prisma.jmkstdtestset.update({
      //   data: {
      //     isComplete: true,
      //   },
      //   where: {
      //     serial: parseInt(args.set_id),
      //   },
      // })
      // if (!questionsSetUpdate) throw new ApolloError('Somethig went wrong !')
      return 'success'
    }
    throw new ForbiddenError('Bad request !!')
  },

  getProjectByStudentSelectedCourse: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user')
    const projects = await prisma.jmkcrsproject.findMany({
      where: {
        crs_id: user.crs_id,
      },
    })
    if (projects) {
      return projects
    }
    return ApolloError('No Data Found')
  },
  getProjectByStudentSelectedCourseById: async (
    _,
    { proj_id },
    { userId, role }
  ) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user')
    const project = await prisma.jmkcrsproject.findUnique({
      where: {
        proj_id: proj_id,
      },
    })
    if (project) {
      return project
    }
    return ApolloError('No Data Found')
  },
}

export {
  studentQueryTypesAndInputs,
  studentQuery,
  studentMutation,
  studentResolvers,
  studentResolversQuery,
}
