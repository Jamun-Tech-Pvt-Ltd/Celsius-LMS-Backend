import {
  ApolloError,
  AuthenticationError,
  ForbiddenError,
} from 'apollo-server-express'
import prisma from '../../database.js'
import jwt from 'jsonwebtoken'
import { sendMail } from '../../utils/mailHandler.js'
import emailVerificationHTML from '../../utils/EmailVerification.js'
import { ROLES, getRandomItemsFromArray } from '../../utils/helper.js'
import { deleteImgToAWS, uploadImgToAWS } from '../../utils/imageHandler.js'

const trainerQueryTypesAndInputs = `

    enum ContentTypes{
      Test
      Project
      Video
      Note
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
        tr_resume: Upload
        tr_password: String
        tr_city: String
        tr_country: String
        tr_dob: Date
        tr_github: String
        tr_linkedin: String
        tr_role: String
        tr_remark: String
     }

     input updateTrainerInput {
        tr_fname: String
        tr_mname: String
        tr_lname: String
        tr_email: String
        tr_mobile: String
        tr_dob: String
        tr_city: String
        tr_country: String
        tr_github: String
        tr_linkedin: String
     }

     input updateTrainerPicInput {
      tr_pic: Upload!
     }

     input updateTrainerPasswordInput {
      old_tr_password: String!
      tr_password: String!
     }

     input updateActiveSession {
      crs_id:Int!
     }
  
     input emailVerifyTrainer{
      token: String!
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
      week_id:Int!
      title:String!
      description:String!
      type: ContentTypes!
      video_url:Upload
      project_url:String
      duration:String
      level:String
      share_date:String
      content_id:Int
      test: [TestInput]
     }

     input TestInput{
      test_set_id:Int
      question:String
      ans1: String
      ans2: String
      ans3: String
      ans4: String
      hint: String
      rtans: String
     }
      
     input TrainerStudentInput {
        std_fname: String!
        std_mname: String
        std_lname: String!
        std_email: String!
        crs_complete: Boolean
        crs_complete_date: Date
        std_mobile: String!
        std_birth_dt: Date
        std_add_house_no:String
        std_add_street:String
        std_add_city:String
        std_add_district:String
        std_add_ward_no:String
        std_add_province:String
        std_add_zone:String
        std_country:String
        std_password:String
      }

      input TrainerStudentUpdateInput {
        std_id: Int!
        std_fname: String!
        std_mname: String
        std_lname: String!
        std_email: String!
        crs_complete: Boolean
        crs_complete_date: Date
        std_mobile: String!
        std_birth_dt: Date
        std_add_house_no:String
        std_add_street:String
        std_add_city:String
        std_add_district:String
        std_add_ward_no:String
        std_add_province:String
        std_add_zone:String
        std_country:String
        std_password:String
      }

      input createGroupChatInput {
        group_name:String!
        students: [addGroupChatStudent!]!
      }

      input addGroupChatStudent {
        std_id:Int!
      }

     type Trainer {
        tr_id: Int!
        tr_fname: String!
        tr_mname: String
        tr_lname: String!
        tr_email: String!
        tr_mobile: String!
        tr_city: String
        tr_country: String
        tr_dob: Date
        tr_github: String
        tr_pic:String
        tr_linkedin: String
        crs_id: String
     }

     type TrainerStudent {
        std_id: Int!
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
        std_add_house_no:String
        std_add_street:String
        std_add_city:String
        std_add_district:String
        std_add_ward_no:String
        std_add_province:String
        std_add_zone:String
        std_country:String
     }
  
     type TrainerDashboard {
        students: Int
        courses: Int
        weeks: Int
        videos: Int
        files: Int
        projects: Int
        tests: Int
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
      meetLink:String
      time:String
    }

    type weekDetails {
      title: String!
      totalNotes:Int!
      totalProjects:Int!
      totalTests:Int!
      totalVideos:Int!
      week_id:Int!
    }

    type jmkWeekContent{
      content_id:Int!
      title:String!
      description:String
      type:String!
      video_url:String
      project_url:String
      level:String
      duration:String
      share_date:String
      date:Date
    }

    type Week{
      week_id:Int!
      title:String!
      description:String!
      created_at:Date
    }

    type WeekContentTest{
      test_set_id:Int!
      content_id:Int!
      question:String!
      ans1: String!
      ans2: String!
      ans3: String!
      ans4: String!
      hint: String
      rtans: String!
     }

`

const trainerQuery = `
    trainer:Trainer!

    getAssignedSessions:[sessionDetail]

    getTrainerDashboard:TrainerDashboard

    getstudentForTrainer:[TrainerStudent!]!
    getStudentById(std_id:Int!):TrainerStudent!

    getWeekContentBasedonActiveSession:[weekDetails]!
    getWeekDetailsById(week_id:Int!):Week
    getContentByWeekId(week_id:Int!):[jmkWeekContent]
    getContentByContentId(content_id:Int!):jmkWeekContent

    getWeekContentTests(content_id:Int!):[WeekContentTest!]!

    getStdQuestionForTrainer:[stdQuestion]!

    getStdQuestionByIdForTrainer(question_id:Int!):stdQuestion

    getStdRandomQuestionsForTrainer:[stdQuestion]

    getStdQuesAnsForTrainer(question_id:Int!):[stdQuesAns]

    getQuestionAnsVoteForTrainer(question_id:Int,answer_id:Int):[quesAndAnsVote]

    getAllRelatedCrsStdForTrainer:studentChatList
    getStudentChatForTrainer(chatId:Int!,chatType:String!):StudentChatHistory!

`

const trainerMutation = `
    signupTrainer(data:signupTrainerInput!):Token
    signinTrainer(data:signinTrainerInput!):Token
    updateTrainer(data:updateTrainerInput):Trainer!
    updateTrainerPic(data:updateTrainerPicInput):Trainer!
    updateTrainerPassword(data:updateTrainerPasswordInput):String!


    trainerEmailVerify(data: emailVerifyTrainer!): String!

    activeSession(data:updateActiveSession!): Trainer!

    createStudentFromTrainer(data:TrainerStudentInput!):String!
    updateStudentFromTrainer(data:TrainerStudentUpdateInput!):String!

    addWeek(data:weekInput!):String!
    updateWeek(data:updateWeekInput!):String!
    deleteWeek(data:deleteWeekInput!):String!

    addTrainerWeekContentById(data:weekContentInput):String!
    updateTrainerWeekContentById(data:weekContentInput):String!
    deleteTrainerWeekContentById(week_id:Int!,content_id:Int!):String!

    createAndUpdateQuestionVoteTrainer(data:quesAndAnsVoteInput!):String!

    createQuesAnsTrainer(data:stdQuesAnsInput!):String!

    createGroupChat(data:createGroupChatInput!):String!

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

  createStudentFromTrainer: async (_, { data }, { userId }) => {
    const trainer = await prisma.jmktrinfo.findFirst({
      where: { tr_id: userId },
    })

    if (!trainer) throw new AuthenticationError('invalid token');

    const checkEmailUnique = await prisma.jmkstdinfo.findFirst({ where: { std_email: data.std_email } })

    if (checkEmailUnique) throw new ApolloError('Email is already taken');

    let newStudentData = {}

    for (let key in data) {
      if (data.hasOwnProperty(key) && key !== 'crs_complete' && key !== 'crs_complete_date' && data[key] !== '') {
        if (key === 'std_add_ward_no') {
          newStudentData[key] = parseInt(data[key])
        } else if (key === 'std_birth_dt') {
          newStudentData[key] = new Date(data[key])
        } else {
          newStudentData[key] = data[key];
        }
      }
    }

    const newStudent = await prisma.jmkstdinfo.create({
      data: { ...newStudentData, cid: null, crs_id: trainer.crs_id, std_verifyed: true, std_join_dt: new Date() },
    })

    const stdCrs = await prisma.jmkstdcrsinfo.create({
      data: {
        crsmain_id: 2,
        crs_start_dt: new Date(),
        std_id: newStudent.std_id,
        crs_complete: data.crs_complete,
        crs_complete_date: data.crs_complete_date ?? null,
        crs_start_dt: new Date(),
        crs_id: trainer.crs_id,
        std_crs_verirfy: true
      },
    })

    if (!stdCrs) {
      await prisma.jmkstdinfo.delete({ where: { std_id: newStudent.std_id } })
      throw new ApolloError('Something went wrong');
    }

    if (!stdCrs) throw new ApolloError('Something went wrong');

    return 'Success'
  },

  updateStudentFromTrainer: async (_, { data }, { userId }) => {
    const trainer = await prisma.jmktrinfo.findFirst({
      where: { tr_id: userId },
    })

    if (!trainer) throw new AuthenticationError('invalid token');

    let newStudentData = {}

    for (let key in data) {
      if (data.hasOwnProperty(key) && key !== 'crs_complete' && key !== 'crs_complete_date' && data[key] !== '') {
        if (key === 'std_add_ward_no') {
          newStudentData[key] = parseInt(data[key])
        } else if (key === 'std_birth_dt') {
          newStudentData[key] = new Date(data[key])
        } else {
          newStudentData[key] = data[key];
        }
      }
    }

    const updateStudent = await prisma.jmkstdinfo.update({
      data: { ...newStudentData },
      where: { std_id: data.std_id }
    })

    if (!updateStudent) throw new ApolloError('Something went wrong');

    const stdCrs = await prisma.jmkstdcrsinfo.findFirst({ where: { std_id: data.std_id, crs_id: trainer.crs_id } });

    if (!stdCrs) throw new ApolloError('invalid req');

    const updateStdCrs = await prisma.jmkstdcrsinfo.update({
      data: {
        crs_complete: data.crs_complete,
        crs_complete_date: data.crs_complete_date,
      },
      where: { serial: stdCrs.serial }
    })

    if (!updateStdCrs) throw new ApolloError('Something went wrong');

    return 'Success'
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

  signupTrainer: async (_, { data }, { userId }) => {
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
        tr_label: userId ? 'internal' : 'external'
      },
    })
    const token = jwt.sign(
      { userId: newTrainer.tr_id, purpose: 'Trainer Verification' },
      process.env.JWT_SECRET_KEY
    )

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
      data,
      where: { tr_id: userId },
    })
    if (!newTrainer) throw new Error('something went wrong!!')
    return newTrainer
  },

  updateTrainerPic: async (_, { data }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const trainer = await prisma.jmktrinfo.findFirst({
      where: { tr_id: userId },
    })
    if (!trainer) throw new AuthenticationError('invalid trainer');
    let file;

    if (trainer.tr_pic_key) {
      await deleteImgToAWS(trainer.tr_pic_key)
    }

    if (data.tr_pic) {
      file = await uploadImgToAWS(data.tr_pic, 'trainer_profile_pics');
      if (!file.data) throw new ApolloError("Something went wrong!");
      data['tr_pic'] = file?.data?.Location ?? null;
      data['tr_pic_key'] = file?.data?.Key ?? '';
    }

    const newTrainer = await prisma.jmktrinfo.update({
      data,
      where: { tr_id: userId },
    })
    if (!newTrainer) throw new Error('something went wrong!!')
    return newTrainer
  },

  updateTrainerPassword: async (_, { data }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const trainer = await prisma.jmktrinfo.findFirst({
      where: { tr_id: userId },
    })
    if (!trainer) throw new AuthenticationError('invalid trainer')
    if (trainer.tr_password !== data.old_tr_password) throw new AuthenticationError('old password didnt match !');
    if (trainer.tr_password === data.tr_password) throw new AuthenticationError('old password new password cant be same !');
    if (data.tr_password.length < 6) throw new AuthenticationError('password must be 6 char long !');

    const newTrainer = await prisma.jmktrinfo.update({
      data: {
        tr_password: data.tr_password,
      },
      where: { tr_id: userId },
    })
    if (!newTrainer) throw new Error('something went wrong!!')
    return 'success'
  },

  addWeek: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (role === ROLES[1]) {
      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      });
      if (!trainer) throw new AuthenticationError('invalid trainer credentials');
      const course = await prisma.jmkcrsinfo.findFirst({
        where: { crs_id: trainer.crs_id },
      });
      if (!course) throw new AuthenticationError('invalid trainer');
      const week = await prisma.jmk_tr_week.create({
        data: {
          ...data,
          crs_id: trainer.crs_id,
        },
      });
      if (!week) throw new ApolloError('Unable to create the week')
      const allStudentFromCourse = await prisma.jmkstdcrsinfo.findMany({ where: { crs_id: trainer.crs_id } });
      for (let index = 0; index < allStudentFromCourse.length; index++) {
        await prisma.jmk_notifications.create({
          data: {
            user_id: allStudentFromCourse[index].std_id,
            label1: trainer.tr_fname,
            label2: course.crs_name,
            user_type: "Student",
            category: "week",
            message: `just added a new week named : ${week.title}`,
            link: `${process.env.CLIENT_URL}weeks/${week.title}?week_id=${week.week_id}`
          }
        });
      }
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

      if (weekContents[0]) throw new ApolloError("Week is full of content. Can't delete")

      const week = await prisma.jmk_tr_week.delete({
        where: {
          week_id: data.week_id,
        },
      })

      if (!week) throw new ApolloError("something went wrong !");

      return 'Week Successfully deleted'
    }
  },

  addTrainerWeekContentById: async (_, { data }, { userId, role }) => {

    if (!userId) throw new ForbiddenError('invalid token')

    if (role === ROLES[1]) {

      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      })

      if (!trainer) throw new AuthenticationError('invalid trainer credentials');

      if (data.type === 'Video' || data.type === 'Note') {
        if (!data.video_url && data.project_url) {
          data['video_url'] = data.project_url;
          delete data.project_url;
        } else {
          let file;
          file = await uploadImgToAWS(data.video_url, data.type === 'Video' ? 'videos/' : 'notes/');
          if (!file.data) throw new ApolloError("Something went wrong!");
          data['video_url'] = file?.data?.Location ?? null;
          data['video_url_key'] = file?.data?.Key ?? '';
        }
      }
      let tests;

      if (data.type === 'Test') {
        if (!data.test) {
          throw new AuthenticationError('Test question is required');
        } else {
          tests = data.test;
          delete data.test;
        }
      }

      const weekContent = await prisma.jmk_week_content.create({ data });

      if (!weekContent) throw new ApolloError('Something went wrong !');

      if (data.type === 'Test') {
        for (let index = 0; index < tests.length; index++) {
          await prisma.jmk_test_set.create({
            data: { ...tests[index], content_id: weekContent.content_id }
          })
        }
      }

      return 'Successfully Created !'
    }

    throw new AuthenticationError('invalid access !')
  },

  updateTrainerWeekContentById: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')

    if (role === ROLES[1]) {

      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      })

      if (!trainer) throw new AuthenticationError('invalid trainer credentials');

      // trainer aceess validations
      if (!data.content_id) throw new AuthenticationError('invalid request');
      const oldWeekContent = await prisma.jmk_week_content.findFirst({ where: { content_id: data.content_id } });
      if (!oldWeekContent) throw new AuthenticationError('invalid request');
      const week = await prisma.jmk_tr_week.findFirst({ where: { week_id: oldWeekContent.week_id } });
      if (!week) throw new AuthenticationError('invalid request');
      const course = await prisma.jmkcrsinfo.findFirst({ where: { crs_id: week.crs_id } });
      if (!course) throw new AuthenticationError('invalid request');
      if (trainer.crs_id !== course.crs_id) throw new AuthenticationError('invalid access');

      if (data.type === 'Video' || data.type === 'Note') {
        if (!data.video_url && data.project_url) {
          data['video_url'] = data.project_url;
          delete data.project_url;
        } else {
          // delete file 
          if (oldWeekContent.video_url_key) {
            await deleteImgToAWS(oldWeekContent.video_url_key)
          }
          // upload new file
          let file;
          file = await uploadImgToAWS(data.video_url, data.type === 'Video' ? 'videos/' : 'notes/');
          if (!file.data) throw new ApolloError("Something went wrong!");
          data['video_url'] = file?.data?.Location ?? null;
          data['video_url_key'] = file?.data?.Key ?? '';
        }
      }

      let tests;

      if (data.type === 'Test') {
        if (!data.test) {
          throw new AuthenticationError('Test question is required');
        } else {
          tests = data.test;
          delete data.test;
        }
      }

      if (data.type) {
        delete data.type;
      }

      if (data.week_id) {
        delete data.week_id;
      }

      const weekContent = await prisma.jmk_week_content.update({ data: data, where: { content_id: data.content_id } });

      if (!weekContent) throw new ApolloError('Something went wrong !');

      if (weekContent.type === 'Test') {
        const oldTestList = await prisma.jmk_test_set.findMany({ where: { content_id: weekContent.content_id } });

        const questionsToDelete = oldTestList.filter((oldQuestion) => {
          return !tests.some((newQuestion) => newQuestion.test_set_id === oldQuestion.test_set_id);
        });

        if (questionsToDelete?.[0]) {
          for (let i = 0; i < questionsToDelete.length; i++) {
            await prisma.jmk_test_set.delete({
              where: {
                test_set_id: questionsToDelete[i].test_set_id,
              },
            });
          }
        }

        for (let index = 0; index < tests.length; index++) {
          if (tests[index].test_set_id) {
            await prisma.jmk_test_set.update({
              data: { ...tests[index], },
              where: { test_set_id: tests[index].test_set_id }
            })
          } else {
            await prisma.jmk_test_set.create({
              data: { ...tests[index], content_id: weekContent.content_id }
            })
          }
        }
      }
      return 'Successfully Updated !'
    }

    throw new AuthenticationError('invalid access !')
  },

  deleteTrainerWeekContentById: async (_, { week_id, content_id }, { userId, role }) => {

    if (!userId) throw new ForbiddenError('invalid token')

    if (role === ROLES[1]) {

      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      })

      // need to add trainer crs relation validation -----

      if (!trainer) throw new AuthenticationError('invalid trainer credentials');

      const weekContent = await prisma.jmk_week_content.findFirst({ where: { week_id, content_id } });

      if (!weekContent) throw new AuthenticationError('invalid request !');

      if (weekContent.video_url_key) {
        await deleteImgToAWS(weekContent.video_url_key)
      }

      const deleteWeekContent = await prisma.jmk_week_content.delete({ where: { content_id } });

      if (!deleteWeekContent) throw new ApolloError('Something went wrong !');

      return 'Successfully Deleted !'
    }

    throw new AuthenticationError('invalid access !')
  },

  createAndUpdateQuestionVoteTrainer: async (_, { data }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmktrinfo.findFirst({
      where: { tr_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user')

    if (data.imp_type === 'Question') {
      const oldVote = await prisma.jmk_ques_ans_imp.findFirst({
        where: {
          teacher_id: userId,
          question_id: data.question_id,
        },
      })

      if (oldVote) {
        const vote = await prisma.jmk_ques_ans_imp.update({
          data: { ...data },
          where: { imp_id: oldVote.imp_id },
        })

        if (!vote) throw new ApolloError('Someting went wrong !')
        return 'Successfully updated !'
      }

      const vote = await prisma.jmk_ques_ans_imp.create({
        data: { ...data, user_type: 'Teacher', teacher_id: userId },
      })

      if (!vote) throw new ApolloError('Someting went wrong !')

      return 'Successfully Created !'
    }
    if (data.imp_type === 'Answer') {
      const oldVote = await prisma.jmk_ques_ans_imp.findFirst({
        where: {
          teacher_id: userId,
          ans_id: data.ans_id,
        },
      })
      if (oldVote) {
        const vote = await prisma.jmk_ques_ans_imp.update({
          data: { ...data },
          where: { imp_id: oldVote.imp_id },
        })

        if (!vote) throw new ApolloError('Someting went wrong !')
        return 'Successfully updated !'
      }

      const vote = await prisma.jmk_ques_ans_imp.create({
        data: { ...data, user_type: 'Teacher', teacher_id: userId },
      })

      if (!vote) throw new ApolloError('Someting went wrong !')

      return 'Successfully Created !'
    }
    throw new AuthenticationError('invalid !')
  },

  createQuesAnsTrainer: async (_, { data }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmktrinfo.findFirst({
      where: { tr_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user')
    const question = await prisma.jmk_std_ques.findFirst({
      where: {
        ques_id: data.question_id,
      },
    })
    if (!question) throw new ApolloError('invalid question_id')

    const answer = await prisma.jmk_ques_ans.create({
      data: { ...data, teacher_id: userId, user_type: 'Teacher' },
    })

    if (!answer) throw new ApolloError('Someting went wrong !')

    return 'Successfully created'
  },

  createGroupChat: async (_, { data }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmktrinfo.findFirst({
      where: { tr_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user');

    const newGroup = await prisma.jmk_chat_group.create({
      data: {
        teacher_id: userId,
        group_name: data.group_name,
        crs_id: user.crs_id,
      }
    })

    if (!newGroup) throw new ApolloError('something went wrong !')

    for (let index = 0; index < data.students.length; index++) {
      await prisma.jmk_chat_group_student.create({
        data: {
          group_id: newGroup.group_id,
          std_id: data.students[index].std_id
        }
      });
    }

    return 'Successfully created'
  },

}

const trainerResolversQuery = {

  getWeekContentBasedonActiveSession: async (_, args, { userId, role }) => {

    if (!userId) throw new ForbiddenError('user need to login');

    const trainer = await prisma.jmktrinfo.findFirst({
      where: { tr_id: userId },
    })

    if (!trainer) throw new AuthenticationError('invalid trainer');

    let weeksData = [];

    const weeks = await prisma.jmk_tr_week.findMany({
      where: {
        crs_id: trainer.crs_id,
      },
    });

    if (!weeks) throw new AuthenticationError('No Data !')

    for (let index = 0; index < weeks.length; index++) {

      const weekContent = await prisma.jmk_week_content.findMany({
        where: {
          week_id: weeks[index].week_id
        },
      });

      if (weekContent) {
        const totalNotes = weekContent.filter(content => content.type === "Note").length;
        const totalProjects = weekContent.filter(content => content.type === "Project").length;
        const totalTests = weekContent.filter(content => content.type === "Test").length;
        const totalVideos = weekContent.filter(content => content.type === "Video").length;

        weeksData.push({
          week_id: weeks[index].week_id,
          title: weeks[index].title,
          totalNotes: totalNotes ?? 0,
          totalProjects: totalProjects ?? 0,
          totalTests: totalTests ?? 0,
          totalVideos: totalVideos ?? 0,
        });
      }
    }
    return weeksData
  },

  getWeekDetailsById: async (_, { week_id }, { userId, role }) => {

    if (!userId) throw new ForbiddenError('user need to login');

    const trainer = await prisma.jmktrinfo.findFirst({
      where: { tr_id: userId },
    })

    if (!trainer) throw new AuthenticationError('invalid trainer');

    const week = await prisma.jmk_tr_week.findFirst({
      where: {
        crs_id: trainer.crs_id,
        week_id: week_id
      },
    });

    if (!week) throw new AuthenticationError('No Data !')

    return week
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

    if (!contents) throw new ApolloError('No Data!')

    return contents
  },

  getContentByContentId: async (_, { content_id }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')

    const trainer = await prisma.jmktrinfo.findFirst({
      where: { tr_id: userId },
    })

    if (!trainer) throw new AuthenticationError('invalid trainer')

    const content = await prisma.jmk_week_content.findFirst({
      where: {
        content_id: content_id,
      },
    });
    if (!content) throw new AuthenticationError('No data found');

    const week = await prisma.jmk_tr_week.findFirst({
      where: {
        week_id: content.week_id,
      },
    })
    if (!week) throw new AuthenticationError('Invalid access');

    const crs = await prisma.jmkcrsinfo.findFirst({
      where: {
        crs_id: week.crs_id,
      },
    })
    if (!crs) throw new AuthenticationError('Invalid access');
    if (crs.crs_id !== trainer.crs_id) throw new AuthenticationError('Invalid access')

    return content
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
      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      })
      if (!trainer) throw new AuthenticationError('invalid trainer credentials');
      let videos = 0;
      let files = 0;
      let projects = 0;
      let tests = 0;
      const weeks = await prisma.jmk_tr_week.count({ where: { crs_id: trainer.crs_id } });
      const currentWeeks = await prisma.jmk_tr_week.findMany({ where: { crs_id: trainer.crs_id } });
      const courses = await prisma.jmktrcrsinfo.count({ where: { tr_id: userId, } });
      const students = await prisma.jmkstdcrsinfo.count({ where: { crs_id: trainer.crs_id, } });
      for (let index = 0; index < currentWeeks.length; index++) {
        const videosCount = await prisma.jmk_week_content.count({ where: { type: 'Video', week_id: currentWeeks[index].week_id } });
        const filesCount = await prisma.jmk_week_content.count({ where: { type: 'Note', week_id: currentWeeks[index].week_id } });
        const projectsCount = await prisma.jmk_week_content.count({ where: { type: 'Project', week_id: currentWeeks[index].week_id } });
        const testsCount = await prisma.jmk_week_content.count({ where: { type: 'Test', week_id: currentWeeks[index].week_id } });
        videos = +videosCount;
        files = +filesCount;
        projects = +projectsCount;
        tests = +testsCount;
      }
      return { students, weeks, videos, files, projects, tests, courses }
    }
  },

  getstudentForTrainer: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (role === ROLES[1]) {

      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      });

      if (!trainer) throw new AuthenticationError('invalid trainer credentials');

      const course = await prisma.jmkcrsinfo.findFirst({
        where: { crs_id: trainer.crs_id },
      });

      if (!course) throw new AuthenticationError('invalid trainer');

      const studentList = await prisma.jmkstdcrsinfo.findMany({
        where: { crs_id: course.crs_id },
      });

      if (!studentList) throw new ApolloError('No data');

      let students = [];

      for (let index = 0; index < studentList.length; index++) {
        if (studentList[index].std_id) {
          const student = await prisma.jmkstdinfo.findFirst({
            where: { std_id: studentList[index].std_id },
          })
          students.push({ ...student, crs_complete: studentList[index].crs_complete, crs_complete_date: studentList[index].crs_complete_date })
        }
      }
      return students
    }
  },

  getStudentById: async (_, { std_id }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (role === ROLES[1]) {
      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      })
      if (!trainer) throw new AuthenticationError('invalid trainer credentials');

      const stdCrs = await prisma.jmkstdcrsinfo.findFirst({ where: { std_id: std_id, crs_id: trainer.crs_id } });

      if (!stdCrs) throw new AuthenticationError('invalid');

      const student = await prisma.jmkstdinfo.findFirst({ where: { std_id: std_id } });

      if (!student) throw new AuthenticationError('invalid');

      return { ...student, crs_complete: stdCrs.crs_complete, crs_complete_date: stdCrs.crs_complete_date }
    }
    throw new AuthenticationError('invalid access');
  },

  getWeekContentTests: async (_, { content_id }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')

    if (role === ROLES[1]) {

      const trainer = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      })

      if (!trainer) throw new AuthenticationError('invalid trainer credentials');

      const tests = await prisma.jmk_test_set.findMany({ where: { content_id } });

      if (!tests) throw new AuthenticationError('invalid content_id');

      return tests;
    }

    throw new AuthenticationError('invalid access');
  },

  getStdQuestionForTrainer: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmktrinfo.findFirst({
      where: { tr_id: userId },
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

  getStdQuestionByIdForTrainer: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmktrinfo.findFirst({
      where: { tr_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user')
    const questionData = await prisma.jmk_std_ques.findFirst({ where: { ques_id: args.question_id } });
    if (!questionData) throw new ForbiddenError('No Questions Found !')
    const questionUser = await prisma.jmkstdinfo.findFirst({ where: { std_id: questionData.student_id } })
    if (!user) throw new ForbiddenError('No Questions Found !')
    return { ...questionData, ...questionUser, user_role: "Student" }
  },

  getStdRandomQuestionsForTrainer: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmktrinfo.findFirst({
      where: { tr_id: userId },
    });
    if (!user) throw new AuthenticationError('invalid user');
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

  getStdQuesAnsForTrainer: async (_, { question_id }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmktrinfo.findFirst({
      where: { tr_id: userId },
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
        answers.push({ ...answersData[index], user_fname: user.tr_fname, user_mname: user.tr_mname, user_lname: user.tr_lname, user_pic: '', user_role: "Teacher", totalUpvote })
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

  getQuestionAnsVoteForTrainer: async (_, { question_id, answer_id }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmktrinfo.findFirst({
      where: { tr_id: userId },
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

  getAllRelatedCrsStdForTrainer: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    if (role === ROLES[1]) {
      const user = await prisma.jmktrinfo.findFirst({
        where: { tr_id: userId },
      })
      if (!user) throw new AuthenticationError('invalid user credentials')
      let studentsData = await prisma.jmkstdinfo.findMany({ where: { crs_id: user.crs_id } });
      let students = []
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
      const groups = [];
      const myGroups = await prisma.jmk_chat_group.findMany({ where: { teacher_id: userId, crs_id: user.crs_id } });
      if (myGroups?.[0]) {
        for (let index = 0; index < myGroups.length; index++) {
          const group = await prisma.jmk_chat_group.findFirst({ where: { group_id: myGroups[index].group_id } });
          const message = await prisma.jmk_group_chats.findFirst({
            where: { receiver_id: group?.group_id },
            orderBy: {
              created_at: 'desc'
            }
          });
          if (message) {
            groups.push({ group, message })
          } else {
            if (group) {
              groups.push({ group })
            }
          }
        };
      }

      return { students, groups }
    }
    throw new ForbiddenError('Bad request !!')
  },

  getStudentChatForTrainer: async (_, { chatId, chatType }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')

    const trainer = await prisma.jmktrinfo.findFirst({
      where: { tr_id: userId },
    })

    if (!trainer) throw new AuthenticationError('invalid trainer')

    if (chatType === 'student') {
      const student = await prisma.jmkstdinfo.findFirst({
        where: { std_id: chatId },
      });
      if (!student) throw new AuthenticationError('invalid student')

      const chats = await prisma.jmk_chats.findMany({ where: { receiver_id: userId, sender_id: chatId, user_type: 'Student' } })
      const myChats = await prisma.jmk_chats.findMany({ where: { receiver_id: chatId, sender_id: userId, user_type: 'Teacher' } })

      let filterchat = [...chats, ...myChats]

      const sortedMessages = filterchat.sort((a, b) => {
        return new Date(a.created_at) - new Date(b.created_at);
      });

      return {
        student: student,
        group: null,
        chat_history: sortedMessages
      }
    }

    if (chatType === 'group') {
      const mygroup = await prisma.jmk_chat_group.findFirst({
        where: { teacher_id: userId, group_id: chatId },
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
        student: null,
        group: group,
        chat_history: sortedMessages
      }
    };
    throw new AuthenticationError('invalid request');
  },
}

const updateTrainerActiveDate = async (userId) => {
  await prisma.jmktrinfo.update({
    data: {
      lastSeen: new Date()
    }, where: {
      tr_id: userId
    }
  })
}

export {
  trainerQueryTypesAndInputs,
  trainerQuery,
  trainerMutation,
  trainerResolvers,
  trainerResolversQuery,
  updateTrainerActiveDate
}
