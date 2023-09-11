import {
  ApolloError,
  AuthenticationError,
  ForbiddenError,
} from 'apollo-server-express'
import prisma from '../../database.js'
import jwt from 'jsonwebtoken'
import { ROLES, getRandomItemsFromArray } from '../../utils/helper.js'
import { deleteImgToAWS, uploadImgToAWS } from '../../utils/imageHandler.js'
import { sendMail } from '../../utils/mailHandler.js'
import registerrHTML from '../../utils/signup.js'
import newUserSignupNotification from '../../utils/newUsersignup.js'
import QuestionCreateTemplate from '../../utils/QuestionCreateEmail.js'
import forgotPasswordHTML from '../../utils/forgotPassword.js'
import QuestionInformTemplate from '../../utils/QuestionInformEmail.js'
import SubscriptionEmailTemplate from '../../utils/SubscriptionEmail.js'

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
        std_add_house_no:String
        std_add_street:String
        std_add_city:String
        std_add_ward_no:Int
        std_add_distrcit:String
        std_add_province:String
        std_add_zone:String
        crs_id:Int
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
        crsmain_id: ID!
        crs_start_dt: Date!
     }
  
     input removeCourseFromUserInput   {
        crsmain_id: ID!
     }
  
     input changeActiveCourseInput {
        crsmain_id: ID!
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
     input studentEmailVerify{
      token: String!
     }

     input stdQuestionInput {
      ques_id:Int
      instance_id:String
      ques_title:String! 
      ques_description:String! 
      severity_level:String 
      ques_image: Upload
      status:Boolean!
     }

     input stdQuesAnsInput {
      ans_id:Int
      question_id:Int! 
      answer:String! 
     }

     input quesAndAnsVoteInput {
      imp_type:String! 
      question_id:Int
      ans_id:Int 
      upvote:Int
      downvote:Int
     }

     input stdQuesSubInput{
       question_id:Int
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
        serial : ID
        crs_id: ID
        crsmain_title:String
        crs_start_dt: Date
        crsmain_id:ID
        std_id: ID
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
        c_id:ID
        acc_type:String
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
        content_title:String!
     }
  
     type VideoNote {
        serial: ID!
        vid_id: ID!
        std_id: ID!
        vid_note: String!
     }

     type stdQuestion {
      ques_id:Int!
      instance_id:String
      ques_title:String! 
      ques_description:String! 
      student_id:Int!
      severity_level:String 
      status:Boolean!
      created_at:Date! 
      updated_at:Date
      std_fname:String! 
      std_mname:String 
      std_lname:String! 
      std_pic:String
      user_role:String! 
      totalUpvote:Int
      ques_image:String
     }

     type stdQuesAns {
      ans_id:Int!
      user_type:String!  
      question_id:Int! 
      student_id:Int
      teacher_id:Int 
      answer:String!
      user_fname:String!
      user_mname:String
      user_lname:String!
      user_pic:String
      user_role:String! 
      created_at:Date! 
      updated_at:Date
      totalUpvote:Int 
     }

     type quesAndAnsVote {
      imp_id:Int!
      user_type:String!
      imp_type:String! 
      question_id:Int
      ans_id:Int 
      student_id:Int
      upvote:Int!
      downvote:Int!
      created_at:Date
      updated_at:Date 
     }


     type stdCrsRelatedQuesInfo {
      crsmain_id:Int!
      crs_id:Int!
      name:String!
      totalDiscussions:Int! 
      new:Int! 
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

    getStdQuestions:[stdQuestion]
    getStdQuestionById(question_id:Int!):stdQuestion
    getStdRandomQuestions:[stdQuestion]

    getStdQuesAns(question_id:Int!):[stdQuesAns]

    getQuestionAnsVote(question_id:Int,answer_id:Int):[quesAndAnsVote]

    getStdQuesSub(question_id:Int):String!

    getStdCrsRelatedQuesInfo:[stdCrsRelatedQuesInfo]!
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

    studentEmailVerify(data:studentEmailVerify!):String!


    createStdQuestion(data:stdQuestionInput!):String!
    updateStdQuestion(data:stdQuestionInput!):String!
    deleteStdQuestion(question_id:Int!):String!


    createQuesAns(data:stdQuesAnsInput!):String!
    updateQuesAns(data:stdQuesAnsInput!):String!


    createAndUpdateQuestionVote(data:quesAndAnsVoteInput!):String!

    createAndUpdateStdQuesSub(data:stdQuesSubInput!):String!

`

const studentResolvers = {
  studentEmailVerify: async (_, { data }) => {
    const decodedToken = jwt.decode(data.token, process.env.JWT_SECRET_KEY)

    if (!decodedToken) throw new AuthenticationError('The token is not valid')
    const student = await prisma.jmkstdinfo.findFirst({
      where: {
        std_id: decodedToken.userId,
      },
    })
    if (!student) throw new AuthenticationError('Invalid Token')

    const updateStatus = await prisma.jmkstdinfo.update({
      where: {
        std_id: student.std_id,
      },
      data: {
        std_verifyed: true,
      },
    })

    if (!updateStatus)
      throw new AuthenticationError('Could not verify your email')
    return 'Email Verification Completed'
  },
  signinUser: async (_, { userSignIn }) => {
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_email: userSignIn.email },
    })
    if (!user) throw new AuthenticationError('invalid user credentials')
    const isMatch = userSignIn.password == user.std_password
    if (!isMatch) throw new AuthenticationError('invalid user credentials')
    if (!user.std_verifyed)
      throw new AuthenticationError('Email not verified. Please check the mail')
    if (user.cid !== userSignIn.cid)
      throw new AuthenticationError('invalid organization selected')

    const token = jwt.sign(
      { userId: user.std_id, role: ROLES[0] },
      process.env.JWT_SECRET_KEY
    )
    return { token }
  },

  signupUser: async (_, { userNew }, { userId, role }) => {
    // this logic use on multiple pannels
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_email: userNew.std_email },
    })
    if (user)
      throw new AuthenticationError('user already exist with that email')

    if (role === ROLES[2]) {
      const course = await prisma.jmkcrsinfo.findFirst({
        where: {
          crs_id: userNew.crs_id,
          cid: userId,
        },
      })
      if (!course) throw new AuthenticationError('invalid course')

      const newUser = await prisma.jmkstdinfo.create({
        data: {
          ...userNew,
          cid: userId,
        },
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
      // await sendMail(
      //   newUser.std_email,
      //   'Registration Completed',
      //   studentMailVerificationHTML(token)
      // )
      return { token }
    }

    const course = await prisma.jmkcrsmain.findFirst({
      where: {
        crsmain_id: userNew.crsmain_id,
      },
    })
    if (!course) throw new AuthenticationError('invalid course')

    const newUser = await prisma.jmkstdinfo.create({
      data: { ...userNew, std_join_dt: new Date() },
    })

    if (userNew.crsmain_id) {
      await prisma.jmkstdcrsinfo.create({
        data: {
          crsmain_id: userNew.crsmain_id,
          crs_start_dt: userNew.crs_ecp_st_d,
          std_id: newUser.std_id,
        },
      })
    }
    const token = jwt.sign(
      { userId: newUser.std_id, role: ROLES[0] },
      process.env.JWT_SECRET_KEY
    )
    await sendMail(
      newUser.std_email,
      'Successfully Register ',
      registerrHTML(token, userNew.std_fname)
    )
    await sendMail(
      'riwaz@jamuntek.com',
      'New User Singup Notification',
      newUserSignupNotification(newUser, course.crs_name)
    )
    await sendMail(
      'jenish@jamuntek.com',
      'New User Singup Notification',
      newUserSignupNotification(newUser, course.crs_name)
    )
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
    const course = await prisma.jmkcrsmain.findFirst({
      where: { crsmain_id: parseInt(data.crsmain_id) },
    })
    const userCourse = await prisma.jmkstdcrsinfo.findFirst({
      where: { std_id: userId, crsmain_id: parseInt(data.crsmain_id) },
    })
    if (!user) throw new AuthenticationError('invalid user')
    if (!course) throw new ApolloError('Bad Request')
    if (userCourse) throw new ApolloError('you already have this course')
    await prisma.jmkstdcrsinfo.create({
      data: {
        crsmain_id: parseInt(data.crsmain_id),
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

    if (!user) throw new AuthenticationError('invalid user')
    const userCourse = await prisma.jmkstdcrsinfo.findFirst({
      where: {
        std_id: userId,
        crsmain_id: parseInt(data.crsmain_id),
      },
    })
    if (parseInt(userCourse.crs_id) === user.crs_id)
      throw new ApolloError('Already selected')
    if (!userCourse.std_crs_verirfy)
      throw new ApolloError(
        'your are not permited to use this course, wait for admin to approve or contact our support !'
      )
    const updateUser = await prisma.jmkstdinfo.update({
      data: {
        crs_id: parseInt(userCourse.crs_id),
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
    if (!data.crsmain_id) throw new AuthenticationError('course id required')
    if (user.crs_id === parseInt(data.crs_id))
      throw new AuthenticationError("Can't delete active course")
    const checkCourse = await prisma.jmkstdcrsinfo.findFirst({
      where: {
        crsmain_id: parseInt(data.crsmain_id),
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

  createStdQuestion: async (_, { data }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user')

    const oldQuestion = await prisma.jmk_std_ques.findFirst({
      where: {
        ques_title: data.ques_title,
      },
    })
    if (oldQuestion) throw new ApolloError('Already Exist Question')

    let file
    if (data.ques_image) {
      file = await uploadImgToAWS(data.ques_image, 'questions_images/')
      if (!file.data) throw new ApolloError('Someting went wrong !')
    }

    const question = await prisma.jmk_std_ques.create({
      data: {
        ...data, student_id: userId, instance_id: user.crs_id,
        ques_image: file?.data?.Location ?? null,
        ques_image_key: file?.data?.key ?? '',
      }
    });

    //This one sends the mail to the current user informing his post has been sucessfully posted
    await sendMail(user.std_email, `Question Sucessfully Posted`, QuestionCreateTemplate(`${user.std_fname} ${user.std_lname}`, `${user.std_pic}`, question.ques_id));

    //This one is for all the other users having common CRSID informing that the user has posted a question
    const studentList = await prisma.jmkstdinfo.findMany({
      where: {
        crs_id: user.crs_id,
        std_verifyed: true
      }
    });
    studentList.forEach(async (stud) => {
      if (stud.std_id != user.std_id) {
        console.log(`${stud.std_fname} ${stud.std_lname}`);
        await sendMail(user.std_email, `Question was posted`, QuestionInformTemplate(`${user.std_fname} ${user.std_lname}`, `${user.std_fname} ${user.std_lname}`, `${user.std_pic}`, question.ques_id));
      }
    })

    //TODO: Teacher one up for discussion

    if (!question) throw new ApolloError('Someting went wrong !')

    return 'Successfully created'
  },

  updateStdQuestion: async (_, { data }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user')
    const oldQuestion = await prisma.jmk_std_ques.findFirst({
      where: {
        student_id: userId,
        ques_id: data.ques_id
      },
    })
    if (!oldQuestion) throw new ApolloError('Invalid !')

    if (data.ques_image && oldQuestion.ques_image_key) {
      await deleteImgToAWS(oldQuestion.ques_image_key)
    }

    let file
    if (data.ques_image) {
      file = await uploadImgToAWS(data.ques_image, 'questions_images/')
      if (!file.data) throw new ApolloError('Someting went wrong !')
    }

    const question = await prisma.jmk_std_ques.update({
      data: {
        ...data,
        ques_image: file?.data?.Location ?? oldQuestion.ques_image ?? '',
        ques_image_key: file?.data?.key ?? oldQuestion.ques_image_key ?? '',
      },
      where: { ques_id: data.ques_id }
    })

    if (!question) throw new ApolloError('Someting went wrong !')

    return 'Successfully updated !'
  },

  deleteStdQuestion: async (_, { question_id }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user')
    const oldQuestion = await prisma.jmk_std_ques.findFirst({
      where: {
        student_id: userId,
        ques_id: question_id
      },
    })
    if (!oldQuestion) throw new ApolloError('Invalid !')

    // delete aws image
    if (oldQuestion.ques_image_key) {
      await deleteImgToAWS(oldQuestion.ques_image_key)
    }

    const allAnswers = await prisma.jmk_ques_ans.findMany({ where: { question_id: question_id } })
    // delete all answers and answers votes
    for (let index = 0; index < allAnswers.length; index++) {
      const allAnsVotes = await prisma.jmk_ques_ans_imp.findMany({ where: { ans_id: allAnswers[index].ans_id } })
      for (let index2 = 0; index2 < allAnsVotes.length; index2++) {
        await prisma.jmk_ques_ans_imp.delete({ where: { imp_id: allAnsVotes[index2].imp_id } })
      }
      await prisma.jmk_ques_ans.delete({ where: { ans_id: allAnswers[index].ans_id } })
    }

    const allSubsStudents = await prisma.jmk_ques_sub.findMany({ where: { question_id: question_id } })
    // delete all student subs data
    for (let index = 0; index < allSubsStudents.length; index++) {
      await prisma.jmk_ques_sub.delete({ where: { sub_id: allSubsStudents[index].sub_id } })
    }

    // delete all Question Vote
    const allQuesVotes = await prisma.jmk_ques_ans_imp.findMany({ where: { question_id: oldQuestion.ques_id } })
    for (let index = 0; index < allQuesVotes.length; index++) {
      await prisma.jmk_ques_ans_imp.delete({ where: { imp_id: allQuesVotes[index].imp_id } })
    }

    // delete question
    const question = await prisma.jmk_std_ques.delete({ where: { ques_id: question_id } })

    if (!question) throw new ApolloError('Someting went wrong !')

    return 'Successfully deleted !'
  },

  createQuesAns: async (_, { data }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user')
    const question = await prisma.jmk_std_ques.findFirst({
      where: {
        ques_id: data.question_id,
      },
    })
    if (!question) throw new ApolloError('invalid question_id')

    const answer = await prisma.jmk_ques_ans.create({
      data: { ...data, student_id: userId, user_type: 'Student' }
    })


    const subsList = await prisma.jmk_ques_sub.findMany({
      where: {
        question_id: data.question_id
      }
    });

    subsList.forEach(async (student) => {
      let studentDB = await prisma.jmkstdinfo.findFirst({
        where: {
          std_id: student.student_id
        }
      });
      console.log(studentDB.std_fname)
      await sendMail(studentDB.std_email, `Question Subscription Update`, SubscriptionEmailTemplate(`${studentDB.std_fname} ${studentDB.std_lname}`, `${studentDB.std_pic}`, data.question_id));

    });

    if (!answer) throw new ApolloError('Someting went wrong !')

    return 'Successfully created'
  },

  updateQuesAns: async (_, { data }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user')
    const oldAns = await prisma.jmk_ques_ans.findFirst({
      where: {
        ans_id: data.ans_id,
        student_id: userId
      },
    })
    if (!oldAns) throw new ApolloError('invalid !')

    const answer = await prisma.jmk_ques_ans.update({
      data: { ...data },
      where: { ans_id: data.ans_id }
    })

    if (!answer) throw new ApolloError('Someting went wrong !')

    return 'Successfully updated !'
  },

  createAndUpdateQuestionVote: async (_, { data }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })

    if (!user) throw new AuthenticationError('invalid user')

    if (data.imp_type === "Question") {

      const oldVote = await prisma.jmk_ques_ans_imp.findFirst({
        where: {
          student_id: userId,
          question_id: data.question_id
        },
      })

      if (oldVote) {
        const vote = await prisma.jmk_ques_ans_imp.update({
          data: { ...data },
          where: { imp_id: oldVote.imp_id }
        })

        if (!vote) throw new ApolloError('Someting went wrong !')
        return 'Successfully updated !'
      }

      const vote = await prisma.jmk_ques_ans_imp.create({
        data: { ...data, user_type: "Student", student_id: userId }
      })

      if (!vote) throw new ApolloError('Someting went wrong !')

      return 'Successfully Created !'
    }
    if (data.imp_type === "Answer") {

      const oldVote = await prisma.jmk_ques_ans_imp.findFirst({
        where: {
          student_id: userId,
          ans_id: data.ans_id
        },
      })

      if (oldVote) {
        const vote = await prisma.jmk_ques_ans_imp.update({
          data: { ...data },
          where: { imp_id: oldVote.imp_id }
        })

        if (!vote) throw new ApolloError('Someting went wrong !')
        return 'Successfully updated !'
      }

      const vote = await prisma.jmk_ques_ans_imp.create({
        data: { ...data, user_type: "Student", student_id: userId }
      })

      if (!vote) throw new ApolloError('Someting went wrong !')

      return 'Successfully Created !'
    }
    throw new AuthenticationError('invalid !')
  },

  createAndUpdateStdQuesSub: async (_, { data }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user')
    const subscribe = await prisma.jmk_ques_sub.findFirst({
      where: {
        question_id: data.question_id,
        student_id: userId
      },
    })
    if (subscribe) {
      const stdSubscribe = await prisma.jmk_ques_sub.delete({ where: { sub_id: subscribe.sub_id } })

      if (!stdSubscribe) throw new ApolloError('Someting went wrong !')

      return 'unsubscribed'
    }

    const stdSubscribe = await prisma.jmk_ques_sub.create({
      data: { ...data, student_id: userId },
    })

    if (!stdSubscribe) throw new ApolloError('Someting went wrong !')

    return 'subscribed'
  },
}

const studentResolversQuery = {
  me: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    if (role === ROLES[0]) {
      const user = await prisma.jmkstdinfo.findFirst({
        where: { std_id: userId },
      })
      const organization = await prisma.jmkconsulinfo.findFirst({
        where: {
          serial: user.cid,
        },
      })
      if (!user) throw new AuthenticationError('invalid user credentials')
      const feedback = await prisma.jmkgrvinfo.findMany({
        where: { std_id: userId },
      })
      if (!feedback[0]) return user
      return { ...user, feedback, acc_type: organization.acc_type }
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
    const course = await prisma.jmkcrsmain.findMany()
    const filter = course.reduce((all, course) => {
      all[course.crsmain_type] = [
        ...(all[course.crsmain_type] || []),
        { ...course },
      ]
      return all
    }, {})
    const newObj = Object.entries(filter).map((item) => ({
      crsmain_type: item[0],
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
        const course = await prisma.jmkcrsmain.findFirst({
          where: { crsmain_id: stdcourse[index].crsmain_id },
        })
        userCourse.push({ ...stdcourse[index], crs_name: course.crsmain_title })
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

  getStdQuestions: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user')
    let questions = [];
    const questionsData = await prisma.jmk_std_ques.findMany({ where: { instance_id: user.crs_id } })
    for (let index = 0; index < questionsData.length; index++) {
      let totalUpvote = 0;
      const vote = await prisma.jmk_ques_ans_imp.findMany({ where: { question_id: questionsData[index].ques_id } })
      vote.forEach(item => {
        if (item.upvote === 1) {
          totalUpvote = +1
        }
      })
      const user = await prisma.jmkstdinfo.findFirst({ where: { std_id: questionsData[index].student_id } })
      questions.push({ ...questionsData[index], std_fname: user.std_fname, std_mname: user.std_mname, std_lname: user.std_lname, std_pic: user.std_pic, user_role: "Student", totalUpvote: totalUpvote })
    }
    if (!questions[0]) throw new ForbiddenError('No Questions Found !')
    return questions
  },

  getStdRandomQuestions: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user')
    let questions = [];
    const questionsData = await prisma.jmk_std_ques.findMany({ where: { instance_id: user.crs_id } })
    for (let index = 0; index < questionsData.length; index++) {
      let totalUpvote = 0;
      const vote = await prisma.jmk_ques_ans_imp.findMany({ where: { question_id: questionsData[index].ques_id } })
      vote.forEach(item => {
        if (item.upvote === 1) {
          totalUpvote = +1
        }
      })
      const user = await prisma.jmkstdinfo.findFirst({ where: { std_id: questionsData[index].student_id } })
      questions.push({ ...questionsData[index], std_fname: user.std_fname, std_mname: user.std_mname, std_lname: user.std_lname, std_pic: user.std_pic, user_role: "Student", totalUpvote: totalUpvote })
    }
    questions = getRandomItemsFromArray(questions, 3)
    if (!questions[0]) throw new ForbiddenError('No Questions Found !')
    return questions
  },

  getStdQuestionById: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user')
    const questionData = await prisma.jmk_std_ques.findFirst({ where: { ques_id: args.question_id } });
    if (!questionData) throw new ForbiddenError('No Questions Found !')
    const questionUser = await prisma.jmkstdinfo.findFirst({ where: { std_id: questionData.student_id } })
    if (!user) throw new ForbiddenError('No Questions Found !')
    return { ...questionData, ...questionUser, user_role: "Student" }
  },

  getStdQuesAns: async (_, { question_id }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user')
    let answers = [];
    const answersData = await prisma.jmk_ques_ans.findMany({ where: { question_id: question_id } })
    for (let index = 0; index < answersData.length; index++) {
      if (answersData?.[index].user_type === 'Student') {
        let totalUpvote = 0;
        const vote = await prisma.jmk_ques_ans_imp.findMany({ where: { ans_id: answersData[index].ans_id } })
        vote.forEach(item => {
          if (item.upvote === 1) {
            totalUpvote = +1
          }
        })
        const user = await prisma.jmkstdinfo.findFirst({ where: { std_id: answersData[index].student_id } })
        answers.push({ ...answersData[index], user_fname: user.std_fname, user_mname: user.std_mname, user_lname: user.std_lname, user_pic: user.std_pic, user_role: "Student", totalUpvote })
      } else {
        let totalUpvote = 0;
        const vote = await prisma.jmk_ques_ans_imp.findMany({ where: { ans_id: answersData[index].ans_id } })
        vote.forEach(item => {
          if (item.upvote === 1) {
            totalUpvote = +1
          }
        })
        const user = await prisma.jmkdevinfo.findFirst({ where: { developer_id: answersData[index].teacher_id } })
        answers.push({ ...answersData[index], user_fname: user.developer_fname, user_mname: user.developer_mname, user_lname: user.developer_lname, user_pic: '', user_role: "Teacher", totalUpvote })
      }
    }

    // Filter and sort teachers
    const teacherAnswers = answers.filter(item => item.user_role === "Teacher");
    teacherAnswers.sort((a, b) => (b.totalUpvote || 0) - (a.totalUpvote || 0));

    // Filter and sort non-teachers
    const nonTeacherAnswers = answers.filter(item => item.user_role !== "Teacher");
    nonTeacherAnswers.sort((a, b) => (b.totalUpvote || 0) - (a.totalUpvote || 0));

    // Concatenate the two sorted arrays
    answers = [...teacherAnswers, ...nonTeacherAnswers];

    if (!answers) throw new ForbiddenError('No Answer Found !')
    return answers
  },

  getQuestionAnsVote: async (_, { question_id, answer_id }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user')
    let vote;
    if (question_id) {
      vote = await prisma.jmk_ques_ans_imp.findMany({ where: { question_id: question_id } })
    }
    if (answer_id) {
      vote = await prisma.jmk_ques_ans_imp.findMany({ where: { ans_id: answer_id } })
    }
    if (!vote) throw new ApolloError('No Data !')
    return vote
  },

  getStdQuesSub: async (_, { question_id }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user')
    const stdSub = await prisma.jmk_ques_sub.findFirst({ where: { student_id: userId, question_id: question_id } })
    if (!stdSub) return "unsubscribed"
    return "subscribed"
  },

  getStdCrsRelatedQuesInfo: async (_, { data }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user')
    const channel = []
    const stdRlatedCrs = await prisma.jmkstdcrsinfo.findMany({ where: { std_id: userId } })

    for (let index = 0; index < stdRlatedCrs.length; index++) {
      const course = await prisma.jmkcrsinfo.findFirst({ where: { crs_id: stdRlatedCrs[index].crs_id } })
      const questionsCount = await prisma.jmk_std_ques.count({ where: { instance_id: stdRlatedCrs[index].crs_id } })
      channel.push({
        crsmain_id: stdRlatedCrs[index].crsmain_id,
        crs_id: course.crs_id,
        name: course.crs_name,
        totalDiscussions: questionsCount,
        new: 0
      })
    }
    if (!channel[0]) throw new ApolloError('user doesnt have course')
    return channel
  },
}

export {
  studentQueryTypesAndInputs,
  studentQuery,
  studentMutation,
  studentResolvers,
  studentResolversQuery,
}
