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

import { PubSub } from 'graphql-subscriptions'

const pubsub = new PubSub()

const studentQueryTypesAndInputs = `
    input SigninInput{
        email: String!
        password: String!
    }

    input addStudentPaymentInput{
      payment_date: Date!
      pay_amount: Int!
      transaction_id: String!
   }

    input SignupInput{
        std_fname: String!
        std_mname: String
        std_lname: String!
        std_mobile: String!
        std_email: String!
        std_password: String!
        std_birth_dt: Date
        std_institute: String
        std_company: String
        std_payment_type: String
        std_payment_option: String
        std_payment_amount: Int
        std_remark:String
        crsmain_id:Int
        std_add_house_no:String
        std_add_street:String
        std_add_city:String
        std_add_ward_no:Int
        std_add_district:String
        std_add_province:String
        time:String
        ref_id:String
        std_add_zone:String
        std_country:String
        crs_id:Int
        crs_ecp_st_d:Date
        cid:Int
    }

    input UpdateUserInput {
        std_fname: String!
        std_mname: String
        std_lname: String!
        std_email: String!
        std_mobile: String!
        std_birth_dt: String
        std_add_house_no:String
        std_add_street:String
        std_add_city:String
        std_add_ward_no:Int
        std_add_district:String
        std_add_province:String
        std_add_zone:String
        std_country:String
    }

    input UpdateUserPasswordInput{
      old_std_password:String!
      std_password:String!
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
        crsmain_id: Int!
     }
  
     input removeCourseFromUserInput   {
        crsmain_id: ID!
     }
  
     input changeActiveCourseInput {
      crsmain_id: Int!
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

     input submitStdTestAnsInput {
      test_set_id:Int!
      std_ans:String!
     }

     input createMessageInput{
      receiver_id:Int!
      user_type:String!
      chat_profile_type: String!
      message:String!
      chat_type:String!
      image:Upload
   }

    input createStdWeeklyNoteInput {
      week_id: Int!
      std_note:String!
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
     
     type UserCourse {
        serial : Int!
        crs_id: Int!
        crsmain_id:Int!
        crs_start_dt: Date
        crs_name: String!
        crs_rate: Int
        crs_image:String!
        crs_desc:String!
     }
  
     type ActiveUserCourse {
        serial : Int!
        crs_id: Int!
        crs_start_dt: Date
        crs_name: String!
        crs_image:String!
        crs_desc:String!
        crs_ins:String!
        crs_complete: Boolean!
        crs_complete_date:Date
        crs_duration:Int!
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
        c_id:ID
        acc_type:String
        std_mobile: String!
        std_birth_dt: Date
        crs_id: ID!
        std_status: Int
        std_paidup: Int
        std_due: Int
        lastSeen:Date
        std_add_house_no:String
        std_add_street:String
        std_add_city:String
        std_add_district:String
        std_add_ward_no:String
        std_add_province:String
        std_add_zone:String
        std_country:String
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
      teacher_id:Int
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

     type courseWeek {
      week_id:Int!
      title:String!
      description:String!
      created_at:Date!
     }

     type courseWeekContent {
       content_id:Int!
       week_id:Int!
       title:String!
       description:String
       type:String!
       date:Date!
       video_url:String
       project_url: String
       test_set_id: Int
       test_complete:Boolean
       score:String
      }

      type weeklyTest {
        test_set_id: Int!
        content_id: Int!
        question: String!
        ans1:String!
        ans2:String!
        ans3:String!
        ans4:String!
     }

     type weeklyTestSet {
      courseWeekContent:courseWeekContent
      questions:[weeklyTest]
     }

     type weeklyNote {
      serial: Int!
      week_id: Int!
      std_note:String!
      week_title:String
      created_at: Date!
      updated_at: Date!
   }

   type Chat {
    chat_id:Int!
    receiver_id:Int! 
    sender_id:Int! 
    created_at:Date! 
    message:String!
    isSeen: Boolean!
    user_type:String!
    chat_type:String!
    student: Student
    trainer: TrainerData
   }

   type StudentChatHistory {
    user:Student!
    student:Student
    teacher:TrainerData
    group: groupData
    chat_history:[Chat]
   }

   type studentChatList {
    trainer: TrainerDetails
    students: [studentDetails]
    groups: [groupDetails]
   }
    
   type TrainerDetails {
    trainer:TrainerData
    message: Chat
   }

   type TrainerData{
    tr_id:Int!
    tr_fname:String! 
    tr_mname:String 
    tr_lname:String! 
    tr_pic:String
    lastSeen:Date!
   }

   type studentDetails {
    student:Student
    message: Chat
   }

   type Student {
    std_id:Int!
    std_fname:String! 
    std_mname:String 
    std_lname:String! 
    std_pic:String
    lastSeen:Date!
   }

   type groupDetails {
    group:groupData
    message: Chat
   }

   type groupData {
    group_id:Int!
    group_name:String! 
    teacher_id:String!
    lastSeen:Date!
   }

   type typing {
    student_id:Int!
    isTyping:Boolean!
   }

  type Subscription{
    newMessage(receiver_id: Int!, user_id:Int!, subsType: String!):Chat
  }

  type Subscription{
    messageSeen(receiver_id: Int!, user_id:Int!):String!
  }

  type Subscription{
    messageTyping(receiver_id: Int!, user_id:Int!):typing!
  }

`

const studentQuery = `
    me:User!

    myCourse:Course,

    courseList:[PublicCourseType]
    userCourseList:[UserCourse]
    getActiveUserCourse: ActiveUserCourse

    getWeeklyTest(content_id:Int!):weeklyTestSet

    getWeeklyNote(week_id:Int!):weeklyNote
    getAllWeeklyNote:[weeklyNote]

    getStudentCourseWeek:[courseWeek]
    getStudentCourseWeekContent(week_id:Int!):[courseWeekContent]

    getStdQuestions:[stdQuestion]
    getStdQuestionById(question_id:Int!):stdQuestion
    getStdRandomQuestions:[stdQuestion]

    getStdQuesAns(question_id:Int!):[stdQuesAns]

    getQuestionAnsVote(question_id:Int,answer_id:Int):[quesAndAnsVote]

    getStdQuesSub(question_id:Int):String!

    getStdCrsRelatedQuesInfo:[stdCrsRelatedQuesInfo]!

    getStuentChatList:studentChatList

    getStudentChats(chatId:Int!,chatType:String!):StudentChatHistory!
`

const studentMutation = `

    signinUser(userSignIn:SigninInput!):Token
    signupUser(userNew:SignupInput!):Token
    updateUser(data:UpdateUserInput):User
    updateUserPassword(data:UpdateUserPasswordInput):String!


    addNewCourse(data:addNewCourseInput):String!
    changeActiveCourse(data:changeActiveCourseInput):User!
    removeCourseFromUser(data:removeCourseFromUserInput):String!

    forgotPPEmailCheck(data:forgotPPEmailCheckInput): String!
    forgotPassword(data:forgotPasswordInput):String!
    studentEmailVerify(data:studentEmailVerify!):String!
    uploadFile(file: Upload!): User
    studentReview(data:studentReviewInput):String

    submitProject(data:studentProjectInput):String!


    createStdQuestion(data:stdQuestionInput!):String!
    updateStdQuestion(data:stdQuestionInput!):String!
    deleteStdQuestion(question_id:Int!):String!


    createQuesAns(data:stdQuesAnsInput!):String!
    updateQuesAns(data:stdQuesAnsInput!):String!

    createAndUpdateQuestionVote(data:quesAndAnsVoteInput!):String!
    createAndUpdateStdQuesSub(data:stdQuesSubInput!):String!


    submitStdTestAns(data:[submitStdTestAnsInput]!):String!

    createStdWeeklyNote(data:createStdWeeklyNoteInput):String!

    isTypingMessage(isTyping:Boolean!, receiver_id:Int!):String!

    createMessage(data:createMessageInput!):Chat
 
    updateMessageSeen(id:Int!, type:String!):String!

    addStudentPayInfo(data:addStudentPaymentInput): String!
    
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
    if (!user.std_verifyed) throw new AuthenticationError('Email not verified. Please check the mail')

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
    });

    if (user) throw new AuthenticationError('user already exist with that email')

    const course = await prisma.jmkcrsmain.findFirst({
      where: {
        crsmain_id: userNew.crsmain_id,
        isDeleted: false
      },
    })

    if (!course) throw new AuthenticationError('invalid course')

    const { std_payment_type, std_payment_option, std_payment_amount, time, ref_id, ...rest } = userNew;

    const newUser = await prisma.jmkstdinfo.create({
      data: { ...rest, crs_id: 59, std_join_dt: new Date() },
    })

    if (userNew.crsmain_id) {
      if (std_payment_type) {
        await prisma.jmkstdcrsinfo.create({
          data: {
            crsmain_id: userNew.crsmain_id,
            crs_start_dt: course.start_date,
            std_id: newUser.std_id,
            payment_type: std_payment_type,
            payment_option: std_payment_option,
            amt_paid: std_payment_amount ?? 0,
            amt_due: course.rate - std_payment_amount ?? 0,
            time,
            ref_id
          },
        })
      } else {
        await prisma.jmkstdcrsinfo.create({
          data: {
            crsmain_id: userNew.crsmain_id,
            crs_start_dt: course.start_date,
            std_id: newUser.std_id,
          },
        })
      }
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
      'riwaz@jaamun.com',
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
      data: { ...data },
      where: { std_id: userId },
    })
    if (!newUser) throw new Error('something went wrong!!')
    return newUser
  },

  updateUserPassword: async (_, { data }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user');
    if (user.std_password !== data.old_std_password) throw new AuthenticationError('old password didnt match !');
    if (user.std_password === data.std_password) throw new AuthenticationError('old password new password cant be same !');
    if (data.std_password.length < 6) throw new AuthenticationError('password must be 6 char long !');
    const update = await prisma.jmkstdinfo.update({
      data: { std_password: data.std_password },
      where: { std_id: userId },
    })
    if (!update) throw new Error('something went wrong!!')
    return 'successfully changed'
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

  //  not sure
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

  // used
  addNewCourse: async (_, { data }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    const course = await prisma.jmkcrsmain.findFirst({
      where: { crsmain_id: parseInt(data.crsmain_id), isDeleted: false },
    })
    const userCourse = await prisma.jmkstdcrsinfo.findFirst({
      where: { std_id: userId, crsmain_id: parseInt(data.crsmain_id) },
    })
    if (!user) throw new AuthenticationError('invalid user')
    if (!course) throw new ApolloError('Bad Request')
    if (userCourse?.crs_id) throw new ApolloError("Great news! The course you requested has been approved and is now available on our platform. If you have any further questions or if there's anything else you'd like to learn, please don't hesitate to ask. We're here to support your learning journey!");
    if (userCourse && !userCourse?.crs_id) throw new ApolloError("Thank you for your interest, but it looks like you've already requested this course. If you have any other course suggestions or questions, feel free to reach out. We're here to assist you!")
    await prisma.jmkstdcrsinfo.create({
      data: {
        crsmain_id: parseInt(data.crsmain_id),
        crs_start_dt: new Date(),
        std_id: userId,
      },
    })
    return 'success'
  },

  //  used
  changeActiveCourse: async (_, { data }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })

    if (!user) throw new AuthenticationError('invalid user');

    const userCourse = await prisma.jmkstdcrsinfo.findFirst({
      where: {
        std_id: userId,
        crsmain_id: data.crsmain_id,
      },
    })

    const crs = await prisma.jmkcrsinfo.findFirst({
      where: {
        crs_id: userCourse.crs_id,
      },
    })

    if (!crs === user.crs_id) throw new ApolloError('Invalid opration : contact our support');

    if (userCourse.crs_id === user.crs_id) throw new ApolloError('Already selected');

    if (!userCourse.std_crs_verirfy) throw new ApolloError('your are not permited to use this course, wait for admin to approve or contact our support !');

    const updateUser = await prisma.jmkstdinfo.update({
      data: {
        crs_id: userCourse.crs_id,
      },
      where: { std_id: userId },
    })

    if (!updateUser) throw new AuthenticationError('invalid user');
    return updateUser
  },

  // not sure
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

  // not sure
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

  submitStdTestAns: async (_, { data }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user');
    if (!data[0].test_set_id) throw new AuthenticationError('invalid submit');

    const question = await prisma.jmk_test_set.findFirst({ where: { test_set_id: data[0].test_set_id } })
    if (!question) throw new ApolloError('Invalid !')

    let score = 0;

    for (let index = 0; index < data.length; index++) {
      const questionCheck = await prisma.jmk_test_set.findFirst({ where: { test_set_id: data[index].test_set_id } })
      if (questionCheck.rtans.toLowerCase() == data[index].std_ans.toLowerCase()) {
        score += 1
      }

      await prisma.jmk_std_test_ans.create({
        data: {
          std_id: userId,
          content_id: question.content_id,
          test_set_id: data[index].test_set_id,
          std_ans: data[index].std_ans
        }
      })
    }

    const updateJmkWeekTest = await prisma.jmk_std_test_result.create({
      data: {
        std_id: userId,
        content_id: question.content_id,
        test_complete: true,
        score: `${score}/${data.length}`
      }
    })

    if (!updateJmkWeekTest) throw new ApolloError('Someting went wrong !')

    return 'Submited'
  },

  createStdWeeklyNote: async (_, { data }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user')

    const oldWeeklyNote = await prisma.jmk_std_week_note.findFirst({ where: { week_id: data.week_id, std_id: userId } })

    if (oldWeeklyNote) {
      const updateWeeklyNote = await prisma.jmk_std_week_note.update({
        data: {
          std_note: data.std_note,
          updated_at: new Date()
        },
        where: {
          serial: oldWeeklyNote.serial
        }
      })

      if (!updateWeeklyNote) throw new ApolloError('Someting went wrong !')
      return 'Updated !'

    } else {
      const createWeeklyNote = await prisma.jmk_std_week_note.create({
        data: {
          week_id: data.week_id,
          std_id: userId,
          std_note: data.std_note,
        }
      })

      if (!createWeeklyNote) throw new ApolloError('Someting went wrong !')
      return 'Created !'
    }
  },

  createMessage: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token');
    if (!data.receiver_id) throw new ForbiddenError('receiver cant be null');
    if (!data.message) throw new ForbiddenError('message cant be empty');
    if (!data.chat_profile_type) throw new ForbiddenError('chat_profile_type cant be empty');

    if (role === ROLES[0]) {
      const user = await prisma.jmkstdinfo.findFirst({
        where: { std_id: userId },
      })
      if (!user) throw new ForbiddenError('invalid user');
    }

    if (role === ROLES[1]) {
      const user = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      })
      if (!user) throw new ForbiddenError('invalid user');
    }

    if (data.chat_type === 'Image') {
      const imgData = await uploadImgToAWS(data.image, 'user_chat_files/')
      if (!imgData?.data?.Location) throw new ApolloError('Image is too large');
      data.message = imgData.data.Location;
      delete data.image
    }

    if (data.chat_profile_type !== 'group') {
      const message = await prisma.jmk_chats.create({
        data: {
          receiver_id: data.receiver_id,
          sender_id: userId,
          user_type: data.user_type,
          chat_type: data.chat_type,
          message: data.message
        }
      });

      if (!message) throw new ApolloError('Something went wrong, try again!');

      const receiverChannel = `channel_${userId}_${data.receiver_id}`;

      if (receiverChannel) {
        pubsub.publish(receiverChannel, { newMessage: message });
      }
      return message;
    } else {
      if (role === ROLES[0]) {
        const myGroup = await prisma.jmk_chat_group_student.findFirst({ where: { std_id: userId, group_id: data.receiver_id } });
        if (!myGroup) throw new ApolloError('invalid access !');
      }

      if (role === ROLES[1]) {
        const myGroup = await prisma.jmk_chat_group.findFirst({ where: { teacher_id: userId, group_id: data.receiver_id } });
        if (!myGroup) throw new ApolloError('invalid access !');
      }

      const message = await prisma.jmk_group_chats.create({
        data: {
          receiver_id: data.receiver_id,
          sender_id: userId,
          user_type: data.user_type,
          chat_type: data.chat_type,
          message: data.message
        }
      });

      if (message.user_type === 'Student') {
        const getStdDetails = await prisma.jmkstdinfo.findFirst({ where: { std_id: message.sender_id } })
        message['student'] = getStdDetails;
      } else {
        const getTrDetails = await prisma.jmktrinfo.findFirst({ where: { tr_id: message.sender_id } })
        message['trainer'] = getTrDetails;
      }

      if (!message) throw new ApolloError('Something went wrong, try again!');

      const receiverChannel = `channel_group_${data.receiver_id}`;

      if (receiverChannel) {
        pubsub.publish(receiverChannel, { newMessage: message });
      }
      return message;
    }
  },

  isTypingMessage: async (_, { isTyping, receiver_id }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token');
    if (!receiver_id) throw new ForbiddenError('receiver cant be null');

    if (role === ROLES[0]) {
      const user = await prisma.jmkstdinfo.findFirst({
        where: { std_id: userId },
      })
      if (!user) throw new ForbiddenError('invalid user');
    }

    if (role === ROLES[1]) {
      const user = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      })
      if (!user) throw new ForbiddenError('invalid user');
    }

    const receiverChannel = `channel_${userId}_${receiver_id}`;

    if (receiverChannel) {
      pubsub.publish(receiverChannel, {
        messageTyping: {
          student_id: userId,
          isTyping
        }
      });
    }

    return 'Status changed';
  },

  updateMessageSeen: async (_, { id, type }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token');
    if (!id) throw new ForbiddenError('id cant be null');
    if (!type) throw new ForbiddenError('type cant be null');

    if (role === ROLES[0]) {
      const user = await prisma.jmkstdinfo.findFirst({
        where: { std_id: userId },
      })
      if (!user) throw new ForbiddenError('invalid user');
    }

    if (role === ROLES[1]) {
      const user = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      })
      if (!user) throw new ForbiddenError('invalid user');
    }

    if (type === 'student') {
      const student = await prisma.jmkstdinfo.findFirst({
        where: { std_id: id },
      })
      if (!student) throw new ForbiddenError('invalid');
    } else if (type === 'trainer') {
      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: id },
      })
      if (!trainer) throw new ForbiddenError('invalid');
    } else {
      if (role === ROLES[0]) {
        const mygroup = await prisma.jmk_chat_group_student.findFirst({ where: { std_id: userId, group_id: id } });
        if (!mygroup) throw new ForbiddenError('invalid');
      } else if (role === ROLES[1]) {
        const mygroup = await prisma.jmk_chat_group.findFirst({ where: { teacher_id: userId, group_id: id } });
        if (!mygroup) throw new ForbiddenError('invalid');
      } else {
        throw new ForbiddenError('No aceess');
      }
      const group = await prisma.jmk_chat_group.findFirst({
        where: { group_id: id },
      })
      if (!group) throw new ForbiddenError('invalid');
    }

    if (type !== "group") {
      const oldChats = await prisma.jmk_chats.findMany({
        where: {
          receiver_id: userId,
          sender_id: id,
          isSeen: false
        }
      })

      if (!oldChats[0]) return 'Nothing to update !'

      for (let index = 0; index < oldChats.length; index++) {
        await prisma.jmk_chats.update({
          data: {
            isSeen: true
          }, where: {
            chat_id: oldChats[index].chat_id
          }
        });
      }

      const receiverChannel = `message_seen_${userId}_${id}`;

      if (receiverChannel) {
        pubsub.publish(receiverChannel, { messageSeen: "allMessage" });
      }

    } else {
      const oldChats = await prisma.jmk_group_chats.findMany({
        where: {
          receiver_id: id,
          isSeen: false
        }
      })

      if (!oldChats[0]) return 'Nothing to update !'

      for (let index = 0; index < oldChats.length; index++) {
        await prisma.jmk_group_chats.update({
          data: {
            isSeen: true
          }, where: {
            chat_id: oldChats[index].chat_id
          }
        });
      }

      const receiverChannel = `message_seen_${userId}_${id}`;

      if (receiverChannel) {
        pubsub.publish(receiverChannel, { messageSeen: "allMessage" });
      }
    }

    return "success";
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
      if (user.cid) {
        const organization = await prisma.jmkconsulinfo.findFirst({
          where: {
            serial: user.cid,
          },
        })
        if (!organization) throw new AuthenticationError('invalid user')
        if (organization) {
          if (!feedback[0]) return { ...user, acc_type: organization.acc_type }
          return { ...user, feedback, acc_type: organization.acc_type }
        }
      }
      if (!feedback[0]) return user
      return { ...user, feedback }
    }
    throw new ForbiddenError('Bad request !!')
  },

  // need to chnage 
  courseList: async () => {
    const course = await prisma.jmkcrsmain.findMany({ where: { isDeleted: false } })
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

  //  used
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
        if (stdcourse[index].crs_id) {
          const course = await prisma.jmkcrsinfo.findFirst({
            where: { crs_id: stdcourse[index].crs_id },
          })
          userCourse.push({ ...course, crsmain_id: stdcourse[index].crsmain_id })
        }
      }
      return userCourse
    }
    throw new ForbiddenError('Bad request !!')
  },

  // used
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
      return { ...stdcourse, ...crs }
    }
    throw new ForbiddenError('Bad request !!')
  },

  // ! new api

  getWeeklyTest: async (_, { content_id }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    if (role === ROLES[0]) {
      const user = await prisma.jmkstdinfo.findFirst({
        where: { std_id: userId },
      })
      if (!user) throw new AuthenticationError('invalid user credentials')
      const weekContents = await prisma.jmk_week_content.findFirst({ where: { content_id: content_id } })
      if (!weekContents) throw new ForbiddenError('Wrong content_id !')

      const questions = await prisma.jmk_test_set.findMany({
        where: { content_id: content_id },
      })
      if (!questions) throw new ApolloError('Empty questions !')
      return { courseWeekContent: weekContents, questions: questions }
    }
    throw new ForbiddenError('Bad request !!')
  },

  getWeeklyNote: async (_, { week_id }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    if (role === ROLES[0]) {
      const user = await prisma.jmkstdinfo.findFirst({
        where: { std_id: userId },
      })
      if (!user) throw new AuthenticationError('invalid user credentials')

      const weekNote = await prisma.jmk_std_week_note.findFirst({ where: { week_id: week_id, std_id: userId } })
      if (!weekNote) throw new ForbiddenError('Empty Note !')

      return weekNote
    }
    throw new ForbiddenError('Bad request !!')
  },

  getStuentChatList: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    if (role === ROLES[0]) {
      const user = await prisma.jmkstdinfo.findFirst({
        where: { std_id: userId },
      })
      if (!user) throw new AuthenticationError('invalid user credentials')
      let students = []
      let studentsData = await prisma.jmkstdinfo.findMany({ where: { crs_id: user.crs_id } });

      if (!studentsData) throw new ForbiddenError('Empty !');
      for (let index = 0; index < studentsData.length; index++) {
        if (studentsData[index].std_id != userId) {
          const message = await prisma.jmk_chats.findFirst({
            where: {
              OR: [
                {
                  sender_id: studentsData[index].std_id,
                  receiver_id: userId
                },
                {
                  sender_id: userId,
                  receiver_id: studentsData[index].std_id
                }
              ]
            },
            orderBy: {
              created_at: 'desc'
            }
          });
          students.push({ student: { ...studentsData[index] }, message })
        }
      };

      const stdCrsTrainer = await prisma.jmktrcrsinfo.findFirst({ where: { crs_id: user.crs_id } });
      const trainer = await prisma.jmktrinfo.findFirst({ where: { tr_id: stdCrsTrainer.tr_id } });

      if (!trainer) throw new ForbiddenError('invalid course !');

      const trainerDetails = {
        tr_id: trainer.tr_id,
        tr_fname: trainer.tr_fname,
        tr_mname: trainer.tr_mname,
        tr_lname: trainer.tr_lname,
        tr_pic: trainer.tr_pic,
        lastSeen: new Date(),
      }

      const trainerMessage = await prisma.jmk_chats.findFirst({
        where: {
          OR: [
            {
              sender_id: trainer.tr_id,
              receiver_id: userId
            },
            {
              sender_id: userId,
              receiver_id: trainer.tr_id,
            }
          ]
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      const groups = [];
      const myGroups = await prisma.jmk_chat_group_student.findMany({ where: { std_id: userId } });
      if (myGroups?.[0]) {
        for (let index = 0; index < myGroups.length; index++) {
          const group = await prisma.jmk_chat_group.findFirst({ where: { group_id: myGroups[index].group_id, crs_id: user.crs_id } });
          if (group) {
            const message = await prisma.jmk_group_chats.findFirst({
              where: { receiver_id: group?.group_id },
              orderBy: {
                created_at: 'desc'
              }
            });
            if (message) {
              groups.push({ group, message })
            } else {
              groups.push({ group })
            }
          }
        };
      }

      return { students, trainer: { trainer: trainerDetails, message: trainerMessage }, groups }
    }
    throw new ForbiddenError('Bad request !!')
  },

  getAllWeeklyNote: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    if (role === ROLES[0]) {
      const user = await prisma.jmkstdinfo.findFirst({
        where: { std_id: userId },
      })
      if (!user) throw new AuthenticationError('invalid user credentials')
      const stdNotes = []

      const weekNotes = await prisma.jmk_std_week_note.findMany({ where: { std_id: userId } })

      for (let index = 0; index < weekNotes.length; index++) {
        const week = await prisma.jmk_tr_week.findFirst({ where: { week_id: weekNotes[index].week_id } });
        if (week?.crs_id === user?.crs_id) {
          stdNotes.push({ ...weekNotes[index], week_title: week.title })
        }
      }

      if (!stdNotes[0]) throw new ForbiddenError('Empty Note !')

      return stdNotes
    }
    throw new ForbiddenError('Bad request !!')
  },

  getStudentCourseWeek: async (_, args, { userId, role }) => {

    if (!userId) throw new ForbiddenError('user need to login')

    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })

    if (!user) throw new AuthenticationError('invalid user')
    const week = await prisma.jmk_tr_week.findMany({ where: { crs_id: user.crs_id } })

    if (!week[0]) throw new ForbiddenError('Course not started yet .')
    return week
  },

  getStudentCourseWeekContent: async (_, { week_id }, { userId, role }) => {

    if (!userId) throw new ForbiddenError('user need to login')

    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })

    if (!user) throw new AuthenticationError('invalid user')
    const weekContents = []
    const weekContentsData = await prisma.jmk_week_content.findMany({ where: { week_id: week_id } })

    for (let index = 0; index < weekContentsData.length; index++) {
      if (weekContentsData[index].type === 'Test') {
        const checkTestResult = await prisma.jmk_std_test_result.findFirst({ where: { content_id: weekContentsData[index].content_id, std_id: userId } });
        if (checkTestResult?.test_complete) {
          weekContents.push({ ...weekContentsData[index], score: checkTestResult.score, test_complete: checkTestResult.test_complete })
        } else {
          weekContents.push({ ...weekContentsData[index] })
        }
      } else {
        weekContents.push({ ...weekContentsData[index] })
      }
    }

    if (!weekContents[0]) throw new ForbiddenError('No data in this week .')
    return weekContents
  },

  getStudentChats: async (_, { chatId, chatType }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')

    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })

    if (!user) throw new AuthenticationError('invalid user')

    if (chatType === 'student') {
      const student = await prisma.jmkstdinfo.findFirst({
        where: { std_id: chatId },
      });
      if (!student) throw new AuthenticationError('invalid student')

      const chats = await prisma.jmk_chats.findMany({ where: { receiver_id: userId, sender_id: chatId } })
      const myChats = await prisma.jmk_chats.findMany({ where: { receiver_id: chatId, sender_id: userId, user_type: 'Student' } })

      let filterchat = [...chats, ...myChats]

      const sortedMessages = filterchat.sort((a, b) => {
        return new Date(a.created_at) - new Date(b.created_at);
      });

      return {
        user: user,
        student: student,
        teacher: null,
        group: null,
        chat_history: sortedMessages
      }
    }

    if (chatType === 'trainer') {
      const teacher = await prisma.jmktrinfo.findFirst({
        where: { tr_id: chatId },
      });
      if (!teacher) throw new AuthenticationError('invalid trainer')

      const chats = await prisma.jmk_chats.findMany({ where: { receiver_id: userId, sender_id: chatId, user_type: 'Teacher' } })
      const myChats = await prisma.jmk_chats.findMany({ where: { receiver_id: chatId, sender_id: userId, user_type: 'Student' } })

      let filterchat = [...chats, ...myChats]

      const sortedMessages = filterchat.sort((a, b) => {
        return new Date(a.created_at) - new Date(b.created_at);
      });

      return {
        user: user,
        teacher: teacher,
        student: null,
        group: null,
        chat_history: sortedMessages
      }
    }

    if (chatType === 'group') {

      const mygroup = await prisma.jmk_chat_group_student.findFirst({
        where: { std_id: userId, group_id: chatId },
      });

      if (!mygroup) throw new AuthenticationError('Not have access');

      const group = await prisma.jmk_chat_group.findFirst({
        where: { group_id: chatId },
      });

      if (!group) throw new AuthenticationError('invalid group');

      const chats = await prisma.jmk_group_chats.findMany({ where: { receiver_id: chatId } });

      let filterchat = [];

      for (let index = 0; index < chats.length; index++) {
        if (chats[index].user_type === 'Student') {
          const student = await prisma.jmkstdinfo.findFirst({ where: { std_id: chats[index].sender_id } });
          filterchat.push({ ...chats[index], student })
        } else {
          const trainer = await prisma.jmktrinfo.findFirst({ where: { tr_id: chats[index].sender_id } });
          filterchat.push({ ...chats[index], trainer })
        }
      }

      const sortedMessages = filterchat.sort((a, b) => {
        return new Date(a.created_at) - new Date(b.created_at);
      });

      return {
        user: user,
        teacher: null,
        student: null,
        group: group,
        chat_history: sortedMessages
      }
    };
    throw new AuthenticationError('invalid request');
  },

  // diss panel

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
        const user = await prisma.jmktrinfo.findFirst({ where: { tr_id: answersData[index].teacher_id } })
        answers.push({ ...answersData[index], user_fname: user.tr_fname, user_mname: user.tr_mname, user_lname: user.tr_lname, user_pic: user.tr_pic, user_role: "Teacher", totalUpvote })
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

const subscription = {
  Subscription: {
    newMessage: {
      subscribe: (_, { receiver_id, user_id, subsType }) => {
        let receiverChannel;
        if (subsType === 'group') {
          receiverChannel = `channel_${subsType}_${receiver_id}`
        } else {
          receiverChannel = `channel_${receiver_id}_${user_id}`
        }
        return pubsub.asyncIterator(receiverChannel);
      }
    },
    messageSeen: {
      subscribe: (_, { receiver_id, user_id }) => {
        const receiverChannel = `message_seen_${receiver_id}_${user_id}`
        return pubsub.asyncIterator(receiverChannel);
      }
    },
    messageTyping: {
      subscribe: (_, { receiver_id, user_id }) => {
        const receiverChannel = `channel_${receiver_id}_${user_id}`
        return pubsub.asyncIterator(receiverChannel);
      }
    },
  }
}

const updateStdActiveDate = async (userId) => {
  await prisma.jmkstdinfo.update({
    data: {
      lastSeen: new Date()
    }, where: {
      std_id: userId
    }
  })
}

export {
  studentQueryTypesAndInputs,
  studentQuery,
  studentMutation,
  studentResolvers,
  studentResolversQuery,
  updateStdActiveDate,
  subscription
}
