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
import forgotPasswordHTML from '../../utils/forgotPassword.js'
import QuestionInformTemplate from '../../utils/QuestionInformEmail.js'

import { PubSub } from 'graphql-subscriptions'
import { differenceInDays } from 'date-fns'

const pubsub = new PubSub()

const studentQueryTypesAndInputs = `
    input SigninInput{
        username:String!
        email: String!
        password: String!
    }

    input StudentPaymentInput{
      date: Date!
      amount: Int!
      transaction: String!
   }

    input UpdateUserInput {
        std_fname: String!
        std_mname: String
        std_lname: String!
        std_email: String!
        std_mobile: String!
        std_birth_dt: String
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

  
     input addNewCourseInput {
        crs_id: Int!
     }
  
     input changeActiveCourseInput {
      crs_id: Int!
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
      time_taken: String!
      testAns: [testAnsInput]
     }

     input testAnsInput {
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

    input createStdNoteInput {
      title:String!
      note:String!
    }

    input pageCommentInput {
      blog_id:Int!
      comment:String!
    }

    input student_todo_input {
      serial: Int
      title:String!
      is_complete:Boolean
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
        std_crs_verirfy: Boolean!
        discount: Int
        amt_paid: Int
        amt_due:Int
        crs_complete: Boolean!
        course:Course!
     }
  
     type ActiveUserCourse {
        serial : Int!
        crs_id: Int!
        crs_complete: Boolean!
        crs_complete_date:Date
        discount: Int
        amt_paid: Int
        amt_due: Int
        course: Course
     }
     
     type User {
        std_id: Int!
        std_fname: String!
        std_mname: String
        std_lname: String!
        std_email: String!
        std_pic: String
        std_mobile: String!
        std_birth_dt: Date
        crs_id: Int!
        std_verifyed: Boolean!
        std_paidup: Int
        logo:String
        lastSeen:Date
        created_at:Date
        company:Company!
        course:Course!
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
       duration:String
       share_date:String
       level:String
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
        hint:String
     }

     type weeklyTestSet {
      courseWeekContent:courseWeekContent
      questions:[weeklyTest]
     }

     type testResults {
        content_id:Int!
        total_question:Int!
        question_attempted:Int!
        correct_answer:Int!
        time_taken: String!
     }

     type Note {
      serial: Int!
      title:String!
      note:String!
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
    std_email:String!
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

  type Subscription{
    askAttendance(receiver_id: Int!,crs_id:Int!,company_id:Int!):String!
  }

  type comment {
    serial: Int!
    comment: String! 
    created_at:Date!
    student: User
  }

  type pagesWithComments {
    page:page!
    comments:[comment]
  }

  type CourseAttendanceReport {
    totalClass:Int!
    totalPresent:Int!
    totalAbsent:Int!
    totalClassDays:Int!
    crs_name:String!
    is_current:Boolean
  }
  
  type AttendanceReport {
    totalClass:Int!
    totalPresent:Int!
    totalAbsent:Int!
    totalClassDays:Int!
    ovaral_attendance:Float
    courseAttendance:[CourseAttendanceReport!]
    ovaralAttendance:[Attendance]
  }

  type recent_class {
    serial:Int!
    course:course_with_week!
    crs_complete:Boolean!
  }

  type total_time_spend {
    date: Date!
    time:Int!
  }

  type quiz_report {
   total_questions:Int!
   total_correct_answers:Int!
   total_grade:Float!
   total_time_spend:[total_time_spend]
  }
    
  type StudentDashboardData {
    total_course:Int!
    total_class:Int!
    total_present:Int!
    course_completion:Float!
    class_attendance:Float!
    recent_class:[recent_class]
    resent_project:[courseWeekContent]
    resent_lessons:[courseWeekContent]
    quiz_report:quiz_report
    meetings:[Course]
    activity:[Activity]
    todos:[student_todo]
  }
  
  type student_todo {
    serial:Int!
    std_id:Int!
    crs_id:Int!
    title:String!
    is_complete:Boolean!
    created_at:Date!
    updated_at:Date!
  }

`

const studentQuery = `
    me:User!

    courseList:[Course]
    userCourseList:[UserCourse]
    getActiveUserCourse: ActiveUserCourse

    getWeeklyTest(content_id:Int!):weeklyTestSet

    getNote(serial:Int!):Note
    getAllNote:[Note]

    getStudentCourseWeek:[courseWeek]
    getStudentCourseWeekContent(week_id:Int!):[courseWeekContent]
    getStudentCourseResult(content_id:Int!):[testResults]

    getStdQuestions:[stdQuestion]
    getStdQuestionById(question_id:Int!):stdQuestion
    getStdRandomQuestions:[stdQuestion]

    getStdQuesAns(question_id:Int!):[stdQuesAns]

    getQuestionAnsVote(question_id:Int,answer_id:Int):[quesAndAnsVote]

    getStdQuesSub(question_id:Int):String!

    getStdCrsRelatedQuesInfo:[stdCrsRelatedQuesInfo]!

    getStuentChatList:studentChatList

    getStudentChats(chatId:Int!,chatType:String!):StudentChatHistory!

    getPagesStudent:[page]
    getPageStudent(serial:Int!):pagesWithComments

    getStudentAttendance:AttendanceReport!

    getStudentDashboardData:StudentDashboardData
`

const studentMutation = `

    signinUser(userSignIn:SigninInput!):Token
    updateUser(data:UpdateUserInput):User
    updateUserPassword(data:UpdateUserPasswordInput):String!
    uploadFile(file: Upload!): User

    addNewCourse(data:addNewCourseInput):String!
    changeActiveCourse(data:changeActiveCourseInput):User!

    forgotPPEmailCheck(data:forgotPPEmailCheckInput): String!
    forgotPassword(data:forgotPasswordInput):String!

    submitProject(data:studentProjectInput):String!

    createStdQuestion(data:stdQuestionInput!):String!
    updateStdQuestion(data:stdQuestionInput!):String!
    deleteStdQuestion(question_id:Int!):String!

    createQuesAns(data:stdQuesAnsInput!):String!
    updateQuesAns(data:stdQuesAnsInput!):String!

    createAndUpdateQuestionVote(data:quesAndAnsVoteInput!):String!
    createAndUpdateStdQuesSub(data:stdQuesSubInput!):String!

    submitStdTestAns(data:submitStdTestAnsInput!):String!

    createStdNote(data:createStdNoteInput):String!
    deleteStdNote(serial:Int!):String!

    createAndUpdateTodo(data:student_todo_input):String!
    deleteTodo(serial:Int!):String!

    isTypingMessage(isTyping:Boolean!, receiver_id:Int!):String!

    createMessage(data:createMessageInput!):Chat
 
    updateMessageSeen(id:Int!, type:String!):String!

    createStudentPayment(data:StudentPaymentInput): String!

    applyCourseCoupon(code:String!):String!

    addCommentOnPage(data:pageCommentInput):String!

    submitAttendance:String!
    takeAttendance:String!
    
`

const studentResolvers = {
  signinUser: async (_, { userSignIn }) => {
    const company = await prisma.jmkcompany.findFirst({ where: { c_username: userSignIn.username }, include: { payments: { where: { end_date: { gt: new Date() } } } } });
    if (!company) throw new AuthenticationError('invalid user credentials');
    if (!company.c_verified) throw new AuthenticationError('Your company is not verify yet , contact our support team for more info');
    if (company.payments.length === 0) throw new AuthenticationError('Your company package is expired, contact our support team for more info');
    const user = await prisma.jmkstdinfo.findFirst({ where: { std_email: userSignIn.email, company_id: company.serial } });
    if (!user) throw new AuthenticationError('invalid user credentials');
    const isMatch = userSignIn.password == user.std_password;
    if (!isMatch) throw new AuthenticationError('invalid user credentials');
    if (!user.std_verifyed) throw new AuthenticationError('Email not verified. Please check the mail');
    const token = jwt.sign(
      { userId: user.std_id, role: ROLES[0], platform: 'external', c_username: company?.c_username, c_package_type: company?.c_package_type, c_package: company?.c_package },
      process.env.JWT_SECRET_KEY
    );
    return { token };
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
    if (!userId) throw new ForbiddenError('user need to login');
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    });
    if (!user) throw new ForbiddenError('Someting went wrong !');
    if (user.std_pic_key) {
      await deleteImgToAWS(user.std_pic_key);
    };
    const data = await uploadImgToAWS(file, 'student_profile/');
    if (!data.data) throw new ApolloError('Someting went wrong !');
    const newUser = await prisma.jmkstdinfo.update({
      data: {
        std_pic: data.data.Location,
        std_pic_key: data.data.key,
      },
      where: { std_id: userId },
    })
    if (!newUser) throw new Error('something went wrong!!');
    return newUser;
  },

  // used
  addNewCourse: async (_, { data }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login');

    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
      include: { company: true }
    });
    if (!user) throw new AuthenticationError('invalid user');

    const course = await prisma.jmkcrsinfo.findFirst({
      where: { crs_id: data.crs_id, isDeleted: false, crs_company_id: user.company_id },
    });
    if (!course) throw new ApolloError('Invalid crs id');

    const userCourse = await prisma.jmkstdcrsinfo.findFirst({
      where: { std_id: userId, crs_id: data.crs_id },
    });
    if (userCourse?.std_crs_verirfy) throw new ApolloError("Great news! The course you requested has been approved and is now available on our platform. If you have any further questions or if there's anything else you'd like to learn, please don't hesitate to ask. We're here to support your learning journey!");
    if (userCourse && !userCourse?.std_crs_verirfy) throw new ApolloError("Thank you for your interest, but it looks like you've already requested this course. If you have any other course suggestions or questions, feel free to reach out. We're here to assist you!")

    await prisma.jmkstdcrsinfo.create({
      data: {
        crs_id: data.crs_id,
        std_id: userId,
      },
    });

    // notifiction to company admin

    const admins = await prisma.jmkuserinfo.findMany();
    for (let index = 0; index < admins.length; index++) {
      const admin = admins[index];
      const accessData = JSON.parse(admin.usr_access);
      if (admin?.usr_access?.[0]) {
        const findRegistrationAccess = accessData.find((item) => item.name === 'RegistrationInfo');
        if (findRegistrationAccess && findRegistrationAccess?.option) {
          const registration = findRegistrationAccess.option.find((item) => item.name === 'Students');
          if (registration?.access?.[0]?.read) {
            await prisma.jmk_notifications.create({
              data: {
                user_id: admin.usr_id,
                label1: `${user.std_fname}`,
                label2: course.title,
                user_type: "Admin",
                category: 'course_red',
                message: `has request new course `,
                link: `/students/${user.std_id}`,
                is_read: false,
              }
            });
          }
        }
      }
    }
    return 'success'
  },

  //  used
  changeActiveCourse: async (_, { data }, { userId, }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })

    if (!user) throw new AuthenticationError('invalid user');

    const userCourse = await prisma.jmkstdcrsinfo.findFirst({
      where: {
        std_id: userId,
        crs_id: data.crs_id,
      },
    })
    if (!userCourse) throw new AuthenticationError('invalid crs id');

    const crs = await prisma.jmkcrsinfo.findFirst({
      where: {
        crs_id: userCourse.crs_id,
        crs_company_id: user.company_id
      },
    });

    if (!crs) throw new AuthenticationError('invalid crs id');

    if (!userCourse.std_crs_verirfy) throw new ApolloError('your are not permited to use this course, wait for admin to approve or contact our support !');

    if (userCourse.crs_id === user.crs_id) throw new ApolloError('Already selected');

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

    //This one is for all the other users having common CRSID informing that the user has posted a question
    const studentList = await prisma.jmkstdinfo.findMany({
      where: {
        crs_id: user.crs_id,
        std_verifyed: true
      }
    });
    studentList.forEach(async (stud) => {
      if (stud.std_id != user.std_id) {
        await prisma.jmk_notifications.create({
          data: {
            user_id: stud.std_id,
            label1: `${user.std_fname}`,
            label2: question.ques_title,
            user_type: "Student",
            category: 'discussion_panel_new',
            message: `just posted a question `,
            link: `/discussion_panel/${question.ques_id}`,
            is_read: false,
          }
        });
        await sendMail(user.std_email, `Question was posted`, QuestionInformTemplate(`${user.std_fname} ${user.std_lname}`, `${user.std_fname} ${user.std_lname}`, `${user.std_pic}`, question.ques_id));
      }
    });

    const trainer = await prisma.jmktrcrsinfo.findFirst({ where: { crs_id: user.crs_id } });
    await prisma.jmk_notifications.create({
      data: {
        user_id: trainer.tr_id,
        label1: `${user.std_fname}`,
        label2: question.ques_title,
        user_type: "Trainer",
        category: 'discussion_panel_new',
        message: `just posted a question `,
        link: `/discussionPanel/${question.ques_id}`,
        is_read: false,
      }
    });

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
    });

    if (question?.student_id !== user.std_id) {
      await prisma.jmk_notifications.create({
        data: {
          user_id: question.student_id,
          label1: `${user.std_fname}`,
          label2: question.ques_title,
          user_type: "Student",
          category: 'discussion_panel_comment',
          message: `just commented in your question in discussion panel of`,
          link: `/discussion_panel/${question.ques_id}`,
          is_read: false,
        }
      });
    }

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

    const question = await prisma.jmk_std_ques.findFirst({ where: { ques_id: data.question_id } });
    if (!question) throw new AuthenticationError('invalid opration')

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

        if (!vote) throw new ApolloError('Someting went wrong !');
        if ((data.upvote === 1 || data.downvote === 1) && question.student_id !== userId) {
          await prisma.jmk_notifications.create({
            data: {
              user_id: question.student_id,
              label1: user.std_fname,
              label2: question.ques_title,
              user_type: "Student",
              category: data.upvote === 1 ? "discussion_panel_like" : "discussion_panel_dislike",
              message: `just ${data.upvote === 1 ? 'liked' : 'disliked'} liked your question in discussion panel of `,
              link: `/discussion_panel/${question.ques_id}`,
              is_read: false,
            }
          });
        }
        return 'Successfully updated !'
      }

      const vote = await prisma.jmk_ques_ans_imp.create({
        data: { ...data, user_type: "Student", student_id: userId }
      })

      if (!vote) throw new ApolloError('Someting went wrong !')
      if ((data.upvote === 1 || data.downvote === 1) && question.student_id !== userId) {
        await prisma.jmk_notifications.create({
          data: {
            user_id: question.student_id,
            label1: user.std_fname,
            label2: question.ques_title,
            user_type: "Student",
            category: data.upvote === 1 ? "discussion_panel_like" : "discussion_panel_dislike",
            message: `just ${data.upvote === 1 ? 'liked' : 'disliked'} liked your question in discussion panel of `,
            link: `/discussion_panel/${question.ques_id}`,
            is_read: false,
          }
        });
      }
      return 'Successfully Created !'
    }
    if (data.imp_type === "Answer") {

      const ans = await prisma.jmk_ques_ans.findFirst({ where: { ans_id: data.ans_id } });
      if (!ans) throw new AuthenticationError('invalid opration')

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

        if (!vote) throw new ApolloError('Someting went wrong !');
        if ((data.upvote === 1 || data.downvote === 1) && ans.student_id !== userId) {
          await prisma.jmk_notifications.create({
            data: {
              user_id: ans.user_type === 'Teacher' ? ans.teacher_id : ans.student_id,
              label1: user.std_fname,
              label2: question.ques_title,
              user_type: ans.user_type === 'Teacher' ? 'Trainer' : ans.user_type,
              category: data.upvote === 1 ? "discussion_panel_upvote" : "discussion_panel_downvote",
              message: `${data.upvote === 1 ? 'upvote' : 'downvote'} on your comments on your post in the discussion panel of`,
              link: ans.user_type === 'Teacher' ? `/discussionPanel/${question.ques_id}` : `/discussion_panel/${question.ques_id}`,
              is_read: false,
            }
          });
        }
        return 'Successfully updated !'
      }

      const vote = await prisma.jmk_ques_ans_imp.create({
        data: { ...data, user_type: "Student", student_id: userId }
      })

      if (!vote) throw new ApolloError('Someting went wrong !');

      if ((data.upvote === 1 || data.downvote === 1) && ans.student_id !== userId) {
        await prisma.jmk_notifications.create({
          data: {
            user_id: vote.student_id,
            label1: user.std_fname,
            label2: question.ques_title,
            user_type: "Student",
            category: data.upvote === 1 ? "discussion_panel_upvote" : "discussion_panel_downvote",
            message: `${data.upvote === 1 ? 'upvote' : 'downvote'} on your comments on your post in the discussion panel of`,
            link: `/discussion_panel/${question.ques_id}`,
            is_read: false,
          }
        });
      }
      return 'Successfully Created !'
    }
    throw new AuthenticationError('invalid !')
  },

  createAndUpdateStdQuesSub: async (_, { data }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    });
    if (!user) throw new AuthenticationError('invalid user');
    const question = await prisma.jmk_std_ques.findFirst({ where: { ques_id: data.question_id } });
    if (!question) throw new AuthenticationError('invalid opration');

    const subscribe = await prisma.jmk_ques_sub.findFirst({
      where: {
        question_id: data.question_id,
        student_id: userId
      },
    });
    if (subscribe) {
      const stdSubscribe = await prisma.jmk_ques_sub.delete({ where: { sub_id: subscribe.sub_id } });
      if (!stdSubscribe) throw new ApolloError('Someting went wrong !');
      const course = await prisma.jmkcrsinfo.findFirst({ where: { crs_id: user.crs_id } });
      // notification
      await prisma.jmk_notifications.create({
        data: {
          user_id: question.student_id,
          label1: user.std_fname,
          label2: course.crs_name,
          user_type: "Student",
          category: "discussion_panel",
          message: "just unsubscribed to your question in discussion panel of",
          link: `/discussion_panel/${data.question_id}`,
          is_read: false,
        }
      });

      return 'unsubscribed';
    }

    const stdSubscribe = await prisma.jmk_ques_sub.create({
      data: { ...data, student_id: userId },
    });
    if (!stdSubscribe) throw new ApolloError('Someting went wrong !');
    const course = await prisma.jmkcrsinfo.findFirst({ where: { crs_id: user.crs_id } });
    await prisma.jmk_notifications.create({
      data: {
        user_id: question.student_id,
        label1: user.std_fname,
        label2: course.crs_name,
        user_type: "Student",
        category: "discussion_panel",
        message: "just subscribed to your question in discussion panel of",
        link: `/discussion_panel/${data.question_id}`,
        is_read: false,
      }
    });
    return 'subscribed'
  },

  submitStdTestAns: async (_, { data }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user');
    if (!data.testAns?.[0]?.test_set_id) throw new AuthenticationError('invalid submit');

    const question = await prisma.jmk_test_set.findFirst({ where: { test_set_id: data.testAns[0].test_set_id } })
    if (!question) throw new ApolloError('Invalid !')

    let score = 0;
    let question_attempted = 0;

    for (let index = 0; index < data.testAns.length; index++) {
      const questionCheck = await prisma.jmk_test_set.findFirst({ where: { test_set_id: data.testAns[index].test_set_id } })
      if (questionCheck.rtans.toLowerCase() == data.testAns[index].std_ans.toLowerCase()) {
        score += 1
      }

      if (questionCheck.rtans.toLowerCase() !== "Not Answers") {
        question_attempted += 1
      }

      await prisma.jmk_std_test_ans.create({
        data: {
          std_id: userId,
          content_id: question.content_id,
          test_set_id: data?.testAns[index].test_set_id,
          std_ans: data.testAns[index].std_ans
        }
      })
    }

    const formatTimeTaken = (minutes) => {
      if (minutes < 60) {
        return minutes + " minutes";
      } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return hours + " hours " + remainingMinutes + " minutes";
      }
    }

    const updateJmkWeekTest = await prisma.jmk_std_test_result.create({
      data: {
        std_id: userId,
        content_id: question.content_id,
        test_complete: true,
        score: `${score}/${data.testAns.length}`,
        question_attempted,
        time_taken: formatTimeTaken(data.time_taken),
      }
    })

    if (!updateJmkWeekTest) throw new ApolloError('Someting went wrong !')

    return 'Submited'
  },

  createStdNote: async (_, { data }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login');
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    });
    if (!user) throw new AuthenticationError('invalid user');

    if (data.serial) {
      const updateNote = await prisma.jmk_std_note.update({
        data: {
          title: data.title,
          note: data.note,
          updated_at: new Date()
        },
        where: {
          serial: data.serial
        }
      });
      if (!updateNote) throw new ApolloError('Someting went wrong !');
      return 'Updated !';
    } else {
      const createNote = await prisma.jmk_std_note.create({
        data: {
          crs_id: user.crs_id,
          std_id: userId,
          note: data.note,
          title: data.title,
        }
      })

      if (!createNote) throw new ApolloError('Someting went wrong !');
      return 'Created !';
    }
  },

  deleteStdNote: async (_, { serial }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login');
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    });
    if (!user) throw new AuthenticationError('invalid user');
    const checkNote = await prisma.jmk_std_note.findFirst({ where: { serial, crs_id: user.crs_id, std_id: user.std_id } });
    if (!checkNote) throw new AuthenticationError('invalid access');
    const note = await prisma.jmk_std_note.delete({ where: { serial } });
    if (!note) throw new ApolloError('invalid note id');
    return 'deleted';
  },

  createAndUpdateTodo: async (_, { data }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login');
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    });
    if (!user) throw new AuthenticationError('invalid user');

    if (data.serial) {
      const updatetodo = await prisma.jmk_std_todos.update({
        data: {
          title: data.title,
          is_complete: data.is_complete,
          updated_at: new Date()
        },
        where: {
          serial: data.serial
        }
      });
      if (!updatetodo) throw new ApolloError('Someting went wrong !');
      return 'Updated !';
    } else {
      const createTodo = await prisma.jmk_std_todos.create({
        data: {
          crs_id: user.crs_id,
          std_id: userId,
          is_complete: data.is_complete ?? false,
          title: data.title,
        }
      })

      if (!createTodo) throw new ApolloError('Someting went wrong !');
      return 'Created !';
    }
  },

  deleteTodo: async (_, { serial }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login');
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    });
    if (!user) throw new AuthenticationError('invalid user');
    const checkTodo = await prisma.jmk_std_todos.findFirst({ where: { serial, crs_id: user.crs_id, std_id: user.std_id } });
    if (!checkTodo) throw new AuthenticationError('invalid access');
    const todo = await prisma.jmk_std_todos.delete({ where: { serial } });
    if (!todo) throw new ApolloError('invalid note id');
    return 'deleted';
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

  createStudentPayment: async (_, { data }, { userId, role, platform }) => {
    if (!userId) throw new ForbiddenError('invalid token');
    if (role !== ROLES[0]) throw new ForbiddenError('only student can create payment info');
    if (platform !== 'external') throw new ForbiddenError('invalid token');
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user');
    await prisma.jmktstdpayinfo.create({
      data: {
        payment_date: data.date,
        pay_amount: data.amount,
        transaction: data.transaction,
        crs_id: user.crs_id,
        std_id: user.std_id,
      },
    })
    return 'success'
  },

  applyCourseCoupon: async (_, { code }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('Invalid Token');
    if (role !== ROLES[0]) throw new AuthenticationError('invalid access');
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user');
    const stdcrs = await prisma.jmkstdcrsinfo.findFirst({ where: { crs_id: user.crs_id, std_id: user.std_id } });
    if (!stdcrs) throw new Error('invalid User Course');
    if (stdcrs.promo_code) throw new Error('Coupon already applyed on this course');
    const promo = await prisma.jmk_promo_code.findFirst({
      where: { code, crs_id: user.crs_id },
    });
    if (!promo) throw new Error('Invalid Promo Code');
    if (!code) throw new ApolloError('Invalid Promo Code');
    if (promo.upto < 1) throw new ApolloError('Promo Code Expire');
    if (new Date(promo.created_at).getTime() > Date.now()) throw new ApolloError('Promo Code Expire');
    await prisma.jmkstdcrsinfo.update({
      where: { serial: stdcrs.serial }, data: {
        promo_code: promo.code,
      }
    })
    return 'success'
  },

  addCommentOnPage: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('Invalid Token');
    if (role !== ROLES[0]) throw new AuthenticationError('invalid access');
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user');
    const blog = await prisma.jmk_crs_blog.findFirst({ where: { serial: data.blog_id } });
    if (!blog) throw new Error('invalid Blog Id');
    const comment = await prisma.jmk_crs_blog_comments.create({
      data: {
        comment: data.comment,
        blog_id: blog.serial,
        std_id: user.std_id
      }
    })
    if (!comment) throw new Error('Something Went Wrong !');

    return 'success'
  },

  submitAttendance: async (_, { }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('Invalid Token');
    if (role !== ROLES[0]) throw new AuthenticationError('invalid access');
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oldData = await prisma.jmk_std_attendance.findFirst({ where: { crs_id: user.crs_id, std_id: user.std_id, created_at: { gte: today } } });
    if (oldData) throw new ApolloError('Already attendance today');
    await prisma.jmk_std_attendance.create({
      data: {
        crs_id: user.crs_id,
        std_id: user.std_id,
        attendance: true
      }
    });
    return 'success'
  },

  takeAttendance: async (_, { }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('Invalid Token');
    if (role !== ROLES[1]) throw new AuthenticationError('invalid access');
    const trainer = await prisma.jmktrinfo.findFirst({
      where: { tr_id: userId },
    });

    const students = await prisma.jmkstdinfo.findMany({ where: { company_id: trainer.company_id, crs_id: trainer.crs_id } });
    if (!students.length) throw new Error('No students found');

    students.forEach(student => {
      const receiverChannel = `attendance_channel_${student.std_id}_${student.crs_id}_${student.company_id}`;
      pubsub.publish(receiverChannel, { askAttendance: `trainer is taking attendance` });
    });

    return 'success';
  },
}

const studentResolversQuery = {
  me: async (_, args, { userId, role, c_username }) => {
    if (!userId) throw new ForbiddenError('user need to login');
    if (role === ROLES[0]) {
      const user = await prisma.jmkstdinfo.findFirst({
        where: { std_id: userId },
        include: { company: true, course: true }
      });
      if (!user) throw new AuthenticationError('invalid user credentials');
      if (user.company.c_username !== c_username) throw new AuthenticationError('invalid user credentials');
      const logo = await prisma.jmk_web_details.findFirst({ where: { company_id: user.company_id } });
      return { ...user, logo: logo?.logo ?? null }
    }
    throw new ForbiddenError('Invalid user credentials !!');
  },

  courseList: async (_, args, { userId, role, c_username }) => {
    if (!userId) throw new ForbiddenError('user need to login');
    if (role === ROLES[0]) {
      const user = await prisma.jmkstdinfo.findFirst({
        where: { std_id: userId },
        include: { company: true, courses: true }
      });
      if (!user) throw new AuthenticationError('invalid user credentials');
      if (user.company.c_username !== c_username) throw new AuthenticationError('invalid user credentials');
      const course = await prisma.jmkcrsinfo.findMany({ where: { crs_company_id: user.company.serial }, include: { category: true } });
      return course
    };
    throw new ForbiddenError('Invalid user credentials !!');
  },

  //  used
  userCourseList: async (_, args, { userId, role, c_username }) => {
    if (!userId) throw new ForbiddenError('user need to login');
    if (role === ROLES[0]) {
      const user = await prisma.jmkstdinfo.findFirst({
        where: { std_id: userId },
        include: { company: true }
      });
      if (!user) throw new AuthenticationError('invalid user credentials');
      if (user.company.c_username !== c_username) throw new AuthenticationError('invalid user credentials');
      const stdcourse = await prisma.jmkstdcrsinfo.findMany({
        where: { std_id: userId, std_crs_verirfy: true },
        include: { course: true }
      });
      return stdcourse
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
        include: { course: true }
      })
      if (!stdcourse) throw new ForbiddenError('invalid')
      return stdcourse
    }
    throw new ForbiddenError('Bad request !!')
  },

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

  getNote: async (_, { serial }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login');
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    });
    if (!user) throw new AuthenticationError('invalid user credentials');

    const note = await prisma.jmk_std_note.findFirst({ where: { serial } });
    if (!note) throw new ApolloError('invalid id');

    return note
  },

  getAllNote: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    if (role === ROLES[0]) {
      const user = await prisma.jmkstdinfo.findFirst({
        where: { std_id: userId },
      });
      if (!user) throw new AuthenticationError('invalid user credentials');
      const notes = await prisma.jmk_std_note.findMany({ where: { std_id: userId, crs_id: user.crs_id } });
      if (!notes[0]) throw new ForbiddenError('Empty Note !');
      return notes
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

  getStudentCourseResult: async (_, { content_id }, { userId, role }) => {

    if (!userId) throw new ForbiddenError('user need to login');

    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    });

    if (!user) throw new AuthenticationError('invalid user');
    const data = [];
    const history = await prisma.jmk_std_test_result.findMany({ where: { content_id: content_id, std_id: userId }, orderBy: { created_at: 'desc' } });
    for (let index = 0; index < history.length; index++) {
      data.push({
        content_id,
        total_question: parseInt(history[index].score.split('/')[1] !== 'undefined' ? history[index].score.split('/')[1] : 1),
        question_attempted: history[index].question_attempted,
        correct_answer: parseInt(history[index].score.split('/')[0] ?? 0),
        time_taken: history[index].time_taken,
      })
    }
    return data
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
    if (!user) throw new AuthenticationError('invalid user');
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

  getPagesStudent: async (_, { }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user')

    const pages = await prisma.jmk_crs_blog.findMany({ where: { crs_id: user.crs_id }, include: { comments: true }, orderBy: { created_at: 'desc' } });

    if (!pages) throw new ApolloError('Pages Not Found !');

    return pages
  },

  getPageStudent: async (_, { serial }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login');
    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
    });
    if (!user) throw new AuthenticationError('invalid user')

    const page = await prisma.jmk_crs_blog.findFirst({ where: { crs_id: user.crs_id, serial }, include: { comments: { include: { student: true }, orderBy: { created_at: 'desc' } } } });

    if (!page) throw new ApolloError('Pages Not Found !');

    return {
      page: page,
      comments: page.comments
    }
  },

  getStudentAttendance: async (_, { arg }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user needs to login');

    const user = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
      include: {
        courses: {
          where: { std_crs_verirfy: true },
          include: { course: true }
        }
      }
    });
    if (!user) throw new AuthenticationError('invalid user');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalClass = 0, totalPresent = 0, totalAbsent = 0, totalClassDays = 0;
    const courseAttendance = [];
    const attendanceRecords = await prisma.jmk_std_attendance.findMany({
      where: { std_id: userId, attendance: true },
    });
    user.courses.forEach((course) => {
      const { crs_duration, crs_start_date, crs_name } = course.course;
      const plannedDays = (crs_duration * 30) ?? 0;
      const courseStartDate = new Date(crs_start_date);
      const total_class = Math.floor((today - courseStartDate) / (1000 * 60 * 60 * 24));
      const actual_ovaral_class = Math.min(total_class, plannedDays);

      const presentDays = attendanceRecords.filter(
        (record) => record.crs_id === course.crs_id
      ).length;

      const absentDays = actual_ovaral_class - presentDays;

      totalClass += plannedDays;
      totalClassDays += actual_ovaral_class;
      totalPresent += presentDays;
      totalAbsent += absentDays;

      courseAttendance.push({
        crs_name,
        is_current: course.crs_id === user.crs_id,
        totalClass: plannedDays,
        totalClassDays: actual_ovaral_class,
        totalPresent: presentDays,
        totalAbsent: absentDays,
      });
    });

    const ovaralAttendance = user.courses.flatMap((course) => {
      const startDate = new Date(course.course.crs_start_date);
      const totalClasses = Math.min(
        Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)) + 1,
        course.course.crs_duration * 30
      );

      const attendance = Array.from({ length: totalClasses }, (_, index) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + index);
        return { attendance: false, created_at: date };
      });

      attendanceRecords
        .filter((record) => record.crs_id === course.crs_id)
        .forEach((record) => {
          const dayIndex = Math.floor((new Date(record.created_at) - startDate) / (1000 * 60 * 60 * 24));
          if (dayIndex >= 0 && dayIndex < totalClasses) {
            attendance[dayIndex].attendance = true;
          }
        });

      return attendance;
    });

    const ovaral_attendance = ((attendanceRecords.length / totalClassDays) * 100).toFixed(2) ?? 0;

    return { totalClass, totalPresent, totalAbsent, totalClassDays, courseAttendance, ovaralAttendance, ovaral_attendance };
  },

  getStudentDashboardData: async (_, { arg }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login');
    const student = await prisma.jmkstdinfo.findFirst({
      where: { std_id: userId },
      include: {
        course: {
          include: {
            crs_week: {
              orderBy: { created_at: 'desc' },
              include: {
                jmk_week_content: {
                  orderBy: { date: 'desc' },
                }
              }
            }
          }
        },
        courses: {
          where: { std_crs_verirfy: true },
          include: { course: { include: { crs_week: { include: { jmk_week_content: true } } } } }
        }
      }
    });
    if (!student) throw new AuthenticationError('invalid user');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // attandance
    const total_present = await prisma.jmk_std_attendance.count({ where: { std_id: userId, crs_id: student.crs_id, attendance: true } });
    const ovaral_present = await prisma.jmk_std_attendance.count({ where: { std_id: userId, attendance: true } });
    const total_course = Math.round(student.course.crs_duration * 30);
    const start_date = new Date(student.course.crs_start_date);
    const total_class = Math.floor((today - start_date) / (1000 * 60 * 60 * 24));
    const actual_total_class = Math.min(total_class, total_course);
    const course_completion = ((actual_total_class / total_course) * 100).toFixed(2) ?? 0;
    const recent_class = await prisma.jmkstdcrsinfo.findMany({ where: { std_id: student.std_id, std_crs_verirfy: true }, include: { course: { include: { crs_week: true } } }, orderBy: { createdAt: 'desc' }, take: 2 });
    const activity = await prisma.jmk_std_track_data.findMany({ where: { user_id: student.std_id, user_type: 'Student' } });

    const resent_project = [];
    const resent_lessons = [];
    const meetings = [];
    const allQuiz = [];

    let ovaralClass = 0;

    for (let index = 0; index < student.courses.length; index++) {
      const course = student.courses[index];
      const start_date = new Date(course.course.crs_start_date);
      const total_class = Math.floor((today - start_date) / (1000 * 60 * 60 * 24));
      const total_course = Math.round(course.course.crs_duration * 30);
      const actual_ovaral_class = Math.min(total_class, total_course);
      ovaralClass += actual_ovaral_class;
      if (course?.course?.time) {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const [startTimeString, endTimeString] = course.course.time.split(",") || [];

        const [startHour, startMinute] = startTimeString.split(":").map(Number);
        const [endHour, endMinute] = endTimeString.split(":").map(Number);

        const startMinutes = startHour * 60 + startMinute;
        let endMinutes = endHour * 60 + endMinute;

        if (endMinutes < startMinutes) {
          endMinutes += 24 * 60;
        }
        if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
          meetings.push(course.course)
        }
        for (let index = 0; index < course.course.crs_week.length; index++) {
          const jmk_week_content = course.course.crs_week[index].jmk_week_content;
          jmk_week_content.forEach(item => {
            if (item.type === 'Test') {
              allQuiz.push(item)
            }
          })
        }
      }
    }

    const class_attendance = student.courses.length > 0 ? (((ovaral_present) / ovaralClass) * 100).toFixed(2) ?? 0 : 0;

    for (let index = 0; index < student.course.crs_week.length; index++) {
      const jmk_week_content = student.course.crs_week[index].jmk_week_content;
      jmk_week_content.forEach(item => {
        if (item.type === 'Video' && resent_lessons.length < 2) {
          resent_lessons.push(item);
        } else if (item.type === 'Project' && resent_project.length < 2) {
          resent_project.push(item);
        }
      });
    }

    let total_questions = 0;
    let total_correct_answers = 0;
    let total_time_spend_by_month = {};

    for (let index = 0; index < allQuiz.length; index++) {
      const week = allQuiz[index];
      const totalQuestion = await prisma.jmk_test_set.count({ where: { content_id: week.content_id } });
      total_questions += totalQuestion;
      const history = await prisma.jmk_std_test_result.findFirst({ where: { content_id: week.content_id, std_id: userId }, orderBy: { created_at: 'desc' } });

      if (history) {
        total_correct_answers += parseInt(history.score.split('/')[0] ?? 0);

        const monthKey = new Date(history.created_at).toISOString().slice(0, 7);

        if (!total_time_spend_by_month[monthKey]) {
          total_time_spend_by_month[monthKey] = 0;
        }

        total_time_spend_by_month[monthKey] += parseInt(history.time_taken.replace('minutes'));
      }
    }

    const total_time_spend = Object.keys(total_time_spend_by_month).map(monthKey => {
      return {
        date: monthKey,
        time: total_time_spend_by_month[monthKey]
      };
    });

    const total_grade = (typeof total_correct_answers === 'number' &&
      typeof total_questions === 'number' &&
      total_questions > 0)
      ? ((total_correct_answers / total_questions) * 100).toFixed(2)
      : '0.00';

    const todos = await prisma.jmk_std_todos.findMany({ where: { std_id: student.std_id, crs_id: student.crs_id }, orderBy: { created_at: 'desc' } });

    return { total_course, total_class: actual_total_class, total_present, course_completion, activity, class_attendance, todos, recent_class, resent_project, resent_lessons, meetings, quiz_report: { total_questions, total_correct_answers, total_grade: total_grade, total_time_spend } };
  }
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
    askAttendance: {
      subscribe: (_, { receiver_id, crs_id, company_id }) => {
        const receiverChannel = `attendance_channel_${receiver_id}_${crs_id}_${company_id}`;
        console.log(receiverChannel);

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
