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
        videos: Int
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


`

const trainerMutation = `
    signupTrainer(data:signupTrainerInput!):Token
    signinTrainer(data:signinTrainerInput!):Token
    updateTrainer(data:updateTrainerInput):Trainer!

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
      data: { ...newStudentData, cid: 1, crs_id: trainer.crs_id, std_verifyed: true, std_join_dt: new Date(), crs_id: trainer.crs_id },
    })

    const stdCrs = await prisma.jmkstdcrsinfo.create({
      data: {
        crsmain_id: 1,
        crs_start_dt: new Date(),
        std_id: newStudent.std_id,
        crs_complete: data.crs_complete,
        crs_complete_date: data.crs_complete_date,
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
}

export {
  trainerQueryTypesAndInputs,
  trainerQuery,
  trainerMutation,
  trainerResolvers,
  trainerResolversQuery,
}
