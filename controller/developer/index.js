import prisma from '../../database.js'
import jwt from 'jsonwebtoken'
import {
  ApolloError,
  AuthenticationError,
  ForbiddenError,
} from 'apollo-server-express'
import { ROLES } from '../../utils/helper.js'
import { uploadImgToAWS, deleteImgToAWS } from '../../utils/imageHandler.js'
import { compareDates } from '../../utils/DateHelper.js'
import { sendMail } from '../../utils/mailHandler.js'
import emailVerificationHTML from '../../utils/EmailVerification.js'

const developerQueryTypesAndInputs = `
    type Developer {
        developer_id: Int!
        developer_fname: String
        developer_mname: String
        developer_lname: String
        developer_email: String
        developer_phone: String
        developer_country: String
        developer_type: String
        developer_password: String
        developer_prof_summary: String
    }

    type DeveloperUser {
      developer_id: Int!
      developer_fname: String
      developer_mname: String
      developer_lname: String
      developer_high_qualification: String
      developer_tech1: String
      developer_tech2: String
      developer_tech3: String
      developer_email: String
      developer_phone: String
      developer_country: String
      developer_tech1_exp: String
      developer_tech2_exp: String
      developer_tech3_exp: String
      developer_company1: String
      developer_company1_start: String
      developer_company2: String
      developer_company2_start: String
      developer_company2_end: String
      developer_company1_project: String
      developer_company2_project: String
      developer_resume_key: String
      developer_resume: String
      developer_password: String
      developer_type: String
      cid: Int
      developer_prof_summary: String
      developer_reg_date: String
      dev_verified: Boolean
      developer_add_house_no: String
      developer_add_street: String
      developer_add_city: String
      developer_add_ward_no: Int
      developer_add_district: String
      developer_add_province: String
      developer_add_zone: String
    }
    type Dashboard{
        experience: Int!
        projects:Int!
    }
    type Experience{
        serial: Int!
        tech_stack: String
        tech_stack_exp: String
        tech_last_used: Date
        developer_id: Int 
        techstk_id: techStack  
    }

    type Project{
        serial:Int!
        developer_id:Int
        proj_title: String
        proj_desc: String
        proj_type: String
        proj_techs_used:String
        proj_end_dt: Date
        proj_strt_dt: Date
    }

    type techStack{
        techstk_id:Int!
        techstk_name:String
        techstk_desc: String
    }


    type JobRecommendation{
        consulreqmnts_id: Int!
        cid: Int
        reqd_tech_stack:String
        reqd_no:Int
        reqd_exp:Int
        reqd_edu: String
        techstk_id: techStack
        reqd_additional:String
    }
    type developerExperience{
        exp_id: Int!
        developer_id: Int
        exp_start_date: Date
        exp_end_date: Date
        company_name: String
        exp_desc: String
        exp_role_pos: String
    }

    type DeveloperTestDetail{
        testmstr_id: Int!
        developer_id: Int
        techstk_id: techStack
        test_status: String
        marks_obt: Int
        test_dt: Date
        next_attempt:Date
    }

    type loginInCredentials{
        token: String
        acc_type: String
    }

    type Resume{
        resume:Upload
    }

    type TermDetail{
      termdet_id: Int
      term_id:Int
      term_code: String
      crs_id: Int
      start_date: Date
      end_date: Date
    }

    type subjectDetail{
      subject_id: Int
      subject_code: String
      subject_full_m: Int
      subject_pass_m: Int
    }
    type courseDetail{
      crs_id: Int
      crs_name: String
    }
    type StudentTermSubject{
      serial: Int
      std_id: Int
      student_name: String
      subject_name: String
      termdet_id: Int
      subject_id: Int
      marks_obtained:Int
    }
  
    
    input signinDeveloperUserInput{
        developer_email: String
        developer_password: String
    }

    input techStackDetail{
      techstk_id:Int!
      techstk_name:String
      techstk_desc: String
  }

    input techStackDetail{
        techstk_id:Int!
        techstk_name:String
        techstk_desc: String
    }

    input createTechStack{
        techstk_name:String
        techstk_desc: String
    }
    input deleteTechStack{
        techstk_id:Int!
    }
    input signupDevInput {
        developer_fname: String!
        developer_mname: String
        developer_lname: String!
        developer_high_qualification: String
        developer_phone: String!
        developer_email: String!
        developer_password: String!
        developer_country: String!
        developer_tech1: String
        developer_tech2: String
        developer_tech3: String
        developer_tech1_exp: String
        developer_tech2_exp: String
        developer_tech3_exp: String
        developer_resume: Upload
        developer_company1: String
        developer_company1_project: String
        developer_company1_start: Date!
        developer_company2: String
        developer_company2_start: Date
        developer_company2_end: Date
        developer_company2_project: String
        developer_type: String!
     }

     

    input DeveloperDetails{
        developer_fname: String
        developer_mname: String
        developer_lname: String
        developer_email: String
        developer_phone: String
        developer_country: String
        developer_password: String
        developer_type: String
        developer_prof_summary: String
        developer_add_house_no: String
        developer_add_street: String
        developer_add_city: String
        developer_add_ward_no: Int
        developer_add_district: String
        developer_add_province: String
        developer_add_zone: String
    }
    input ExperienceDetails{
        tech_stack: String
        tech_stack_exp: String
        techstk_id: Int
        tech_last_used: String
        developer_id: Int
    }
    input UpdateExperienceDetails{
        serial:Int!
        tech_stack: String
        tech_stack_exp: String
        tech_last_used: Date
        developer_id: Int
        techstk_id: Int
    }
    input deleteExpInput{
        serial: Int!
    }

    input ProjectDetails{
        proj_title: String
        proj_desc: String
        proj_type: String
        proj_techs_used:String
        proj_end_dt: Date
        proj_strt_dt: Date

    }
    input deleteProjInput{
        serial:Int!
    }
    input UpdateProjectDetails{
        serial:Int!
        developer_id: Int
        proj_title: String
        proj_desc: String
        proj_type: String
        proj_techs_used:String
        proj_strt_dt: Date
        proj_end_dt: Date
    }

    input UpdateWorkExperience{
        exp_id: Int!
        exp_start_date: Date
        exp_end_date: Date
        company_name: String
        exp_desc: String
        exp_role_pos: String
    }
    input AddWorkExperience{
        developer_id: Int
        exp_start_date: Date
        exp_end_date: Date
        company_name: String
        exp_desc: String
        exp_role_pos: String
    }
    input DeleteWorkExperience{
        exp_id: Int
    }

    input searchTest{
      termdet_id:Int
      subject_id: Int
    }


    input UpdateResumeAWS{
        developer_resume: Upload!
    }
    
    input emailVerifyDev{
      token: String!
     }

     input StudentTermSubjectInput {
      serial: Int!
      std_id: Int!
      subject_id: Int!
      marks_obtained: Int!
    }
`

const developerQuery = `
    getDeveloper:[Developer]
    getDeveloperUser: DeveloperUser

    getDashboard: Dashboard

    getExperienceList: [Experience]
    getExperienceById(serial: Int!): Experience!
    
    getProjectById(serial: Int!): Project!
    getDeveloperProjectList: [Project]
    
    getConsultancyRecommendation:[JobRecommendation]
    getJobRecommendationById(consulreqmnts_id: Int!):JobRecommendation

    getTechStackById(techstk_id: Int!): techStack
    getTechStackList: [techStack]

    getDeveloperExperienceList:[developerExperience]
    getDeveloperExperienceById(exp_id: Int!):developerExperience

    getDeveloperTestDetailList:[DeveloperTestDetail]

    getTestDetail(data:searchTest): String

    getCourseList:[courseDetail]
    getTermList(crs_id: Int):[TermDetail]
    getSubjectList(crs_id: Int):[subjectDetail]
    getStudentTermSubjectList(data:searchTest):[StudentTermSubject]

    getTchrQuestion:[stdQuestion]
    getTchrQuestionById(question_id:Int!):stdQuestion

    getStdQueAnswer(question_id:Int!):[stdQuesAns]
    
    

    getQuestionAnsVoteTeacher(question_id:Int,answer_id:Int):[quesAndAnsVote]
`

const developerMutation = `
    signinDeveloper(data:signinDeveloperUserInput!):loginInCredentials
    signupDeveloper(data:signupDevInput!):String
    updateDeveloper(data:DeveloperDetails!):String

    createExperience(data:ExperienceDetails!):String
    updateExperience(data:UpdateExperienceDetails!): String
    deleteExperience(data:deleteExpInput!): String

    updateProject(data:UpdateProjectDetails!): String
    deleteProject(data:deleteProjInput!):String
    createProject(data:ProjectDetails!):String

    updateWorkExperience(data:UpdateWorkExperience!):String
    AddWorkExperience(data:AddWorkExperience!):String
    deleteWorkExperience(data:DeleteWorkExperience!):String

    updateTechStack(data:techStackDetail!):String
    addTechStack(data:createTechStack!):String
    deleteTechStack(data:deleteTechStack!):String

    updateResumeDetails(data:UpdateResumeAWS!):String

    developerEmailVerify(data: emailVerifyDev!): String!

    updateStudentMarks(data: [StudentTermSubjectInput!]!): Boolean

    
    createAndUpdateTeacherQueSub(data:stdQuesSubInput!):String!

    createAndUpdateQuestionVoteTeacher(data:quesAndAnsVoteInput!):String!

    createQuesAnsTeacher(data:stdQuesAnsInput!):String!
    updateQuesAnsTeacher(data:stdQuesAnsInput!):String!
`

const developerQueryResolvers = {
  getTchrQuestionById: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkdevinfo.findFirst({
      where: { developer_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user')
    const questionData = await prisma.jmk_std_ques.findFirst({
      where: { ques_id: args.question_id },
    })
    if (!questionData) throw new ForbiddenError('No Questions Found !')
    const questionUser = await prisma.jmkstdinfo.findFirst({
      where: { std_id: questionData.student_id },
    })
    if (!user) throw new ForbiddenError('No Questions Found !')
    return { ...questionData, ...questionUser, user_role: 'Student' }
  },
  getQuestionAnsVoteTeacher: async (
    _,
    { question_id, answer_id },
    { userId }
  ) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkdevinfo.findFirst({
      where: { developer_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user')
    let vote
    if (question_id) {
      vote = await prisma.jmk_ques_ans_imp.findMany({
        where: { question_id: question_id },
      })
    }
    if (answer_id) {
      vote = await prisma.jmk_ques_ans_imp.findMany({
        where: { ans_id: answer_id },
      })
      console.log(vote)
    }
    if (!vote) throw new ApolloError('No Data !')
    return vote
  },

  getTchrQuestion: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('User needs to login')
    const user = await prisma.jmkdevinfo.findFirst({
      where: { developer_id: userId },
    })
    if (!user) {
      throw new Error('No such User')
    }
    let questions = []
    const questionsData = await prisma.jmk_std_ques.findMany({
      where: { instance_id: user.crs_id },
    })
    for (let index = 0; index < questionsData.length; index++) {
      let totalUpvote = 0
      const vote = await prisma.jmk_ques_ans_imp.findMany({
        where: { question_id: questionsData[index].ques_id },
      })
      vote.forEach((item) => {
        if (item.upvote === 1) {
          totalUpvote = +1
        }
      })
      const user = await prisma.jmkstdinfo.findFirst({
        where: { std_id: questionsData[index].student_id },
      })
      questions.push({
        ...questionsData[index],
        std_fname: user.std_fname,
        std_mname: user.std_mname,
        std_lname: user.std_lname,
        std_pic: user.std_pic,
        user_role: 'Student',
        totalUpvote: totalUpvote,
      })
    }
    if (!questions) throw new ForbiddenError('No Questions Found !')
    return questions
  },
  getStdQueAnswer: async (_, { question_id }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkdevinfo.findFirst({
      where: { developer_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user')
    let answers = []
    const answersData = await prisma.jmk_ques_ans.findMany({
      where: { question_id: question_id },
    })
    for (let index = 0; index < answersData.length; index++) {
      if (answersData?.[index].user_type === 'Student') {
        let totalUpvote = 0
        const vote = await prisma.jmk_ques_ans_imp.findMany({
          where: { ans_id: answersData[index].ans_id },
        })
        vote.forEach((item) => {
          if (item.upvote === 1) {
            totalUpvote = +1
          }
        })
        const user = await prisma.jmkstdinfo.findFirst({
          where: { std_id: answersData[index].student_id },
        })
        answers.push({
          ...answersData[index],
          user_fname: user.std_fname,
          user_mname: user.std_mname,
          user_lname: user.std_lname,
          user_pic: user.std_pic,
          user_role: 'Student',
          totalUpvote,
        })
      } else {
        const user = await prisma.jmkdevinfo.findFirst({
          where: { developer_id: answersData[index].teacher_id },
        })
        answers.push({
          ...answersData[index],
          user_fname: user.developer_fname,
          user_mname: user.developer_mname,
          user_lname: user.developer_lname,
          user_pic: '',
          user_role: 'Teacher',
        })
      }
    }
    // answers = [...answers].sort((a, b) => {
    //   return b.totalUpvote - a.totalUpvote;
    // });
    // Filter and sort teachers
    const teacherAnswers = answers.filter(
      (item) => item.user_role === 'Teacher'
    )
    teacherAnswers.sort((a, b) => (b.totalUpvote || 0) - (a.totalUpvote || 0))

    // Filter and sort non-teachers
    const nonTeacherAnswers = answers.filter(
      (item) => item.user_role !== 'Teacher'
    )
    nonTeacherAnswers.sort(
      (a, b) => (b.totalUpvote || 0) - (a.totalUpvote || 0)
    )

    // Concatenate the two sorted arrays
    answers = [...teacherAnswers, ...nonTeacherAnswers]

    if (!answers) throw new ForbiddenError('No Answer Found !')
    return answers
  },
  getDeveloperUser: async (_, args, { userId }) => {
    const developer = await prisma.jmkdevinfo.findFirst({
      where: { developer_id: userId },
    })
    if (!developer) throw new ForbiddenError('Developer not found')
    return developer
  },
  getDeveloper: async (_, args, { userId }) => {
    // if (!userId) throw new ForbiddenError('user need to login');
    const developerList = await prisma.jmkdevinfo.findMany()
    return developerList
  },
  getDashboard: async (_, args, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const dashboardData = await prisma.$transaction([
      prisma.jmkdevtechdet.findMany({
        where: {
          developer_id: userId,
        },
      }),
      prisma.jmkdevprojdet.findMany({
        where: {
          developer_id: userId,
        },
      }),
    ])

    const [experienceList, projectList] = dashboardData

    const dashboard = {
      experience: experienceList.length,
      projects: projectList.length,
    }

    return dashboard
  },
  getExperienceList: async (_, args, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const experienceList = await prisma.jmkdevtechdet.findMany({
      where: {
        developer_id: userId,
      },
    })
    const techStack = await prisma.jmktechstk.findMany()
    experienceList.forEach((experience) => {
      if (experience.techstk_id) {
        const techStackItem = techStack.find(
          (item) => item.techstk_id === experience.techstk_id
        )
        experience.techstk_id = techStackItem
      }
    })
    return experienceList
  },
  getExperienceById: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (!args.serial) throw new ForbiddenError('serial is required !')
    const experience = await prisma.jmkdevtechdet.findFirst({
      where: {
        serial: args.serial,
      },
    })
    if (!experience) return new ApolloError('Experience does not exist!')
    const techStack = await prisma.jmktechstk.findFirst({
      where: {
        techstk_id: experience.techstk_id,
      },
    })

    if (experience.tech_last_used) {
      const timestamp = experience.tech_last_used.getTime()
      experience.tech_last_used = new Date(timestamp).toLocaleDateString()
    }
    experience.techstk_id = techStack
    return experience
  },

  getProjectById: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    if (!args.serial) throw new ForbiddenError('serial is required !')
    const project = await prisma.jmkdevprojdet.findFirst({
      where: {
        serial: args.serial,
      },
    })

    if (!project) return new ApolloError('Project does not exist!')

    return project
  },
  getDeveloperProjectList: async (_, args, { userId, role }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const projectList = await prisma.jmkdevprojdet.findMany({
      where: {
        developer_id: args.userId,
      },
    })
    projectList.forEach((project) => {
      if (project.proj_strt_dt) {
        const timestamp = project.proj_strt_dt.getTime()
        project.proj_strt_dt = new Date(timestamp).toLocaleDateString()
      }
      if (project.proj_end_dt) {
        const timestamp = project.proj_end_dt.getTime()
        project.proj_end_dt = new Date(timestamp).toLocaleDateString()
      }
    })
    return projectList
  },
  getConsultancyRecommendation: async (_, args, { userId }) => {
    if (!userId) return new AuthenticationError('Login to continue')
    const techStackList = await prisma.jmkdevtechdet.findMany({
      where: {
        developer_id: userId,
      },
      select: {
        techstk_id: true,
      },
      distinct: ['techstk_id'],
    })
    const projTechsUsedList = techStackList.map((p) => p.techstk_id)
    const matchingRequirements = await prisma.jmkconsulreqmnts.findMany({
      where: {
        techstk_id: {
          in: projTechsUsedList,
        },
      },
    })

    const techStack = await prisma.jmktechstk.findMany()
    matchingRequirements.forEach((req) => {
      if (req.techstk_id) {
        const techStackItem = techStack.find(
          (item) => item.techstk_id === req.techstk_id
        )
        req.techstk_id = techStackItem
      }
    })

    return matchingRequirements
  },
  getJobRecommendationById: async (_, args, { userId }) => {
    if (!userId) return new AuthenticationError('Login to continue')
    const jobRecommendation = await prisma.jmkconsulreqmnts.findFirst({
      where: {
        consulreqmnts_id: args.consulreqmnts_id,
      },
    })
    if (!jobRecommendation) return new ApolloError('Job not found')
    return jobRecommendation
  },
  getTechStackList: async (_) => {
    const techStackList = await prisma.jmktechstk.findMany()
    return techStackList
  },
  getTechStackById: async (_, args, { userId }) => {
    const techStack = await prisma.jmktechstk.findFirst({
      where: {
        techstk_id: args.techstk_id,
      },
    })
    return techStack
  },
  getDeveloperExperienceList: async (_, args, { userId }) => {
    if (!userId) return new AuthenticationError('Login to continue')
    const developerExperienceList = await prisma.jmkdevexp.findMany({
      where: {
        developer_id: userId,
      },
    })
    developerExperienceList.forEach((experience) => {
      if (experience.exp_start_date) {
        const timestamp = experience.exp_start_date.getTime()
        experience.exp_start_date = new Date(timestamp).toLocaleDateString()
      }
      if (experience.exp_end_date) {
        const timestamp = experience.exp_end_date.getTime()
        experience.exp_end_date = new Date(timestamp).toLocaleDateString()
      }
    })
    return developerExperienceList
  },
  getDeveloperExperienceById: async (_, args, { userId }) => {
    // if (!userId) return new AuthenticationError("Login to continue");
    const experience = await prisma.jmkdevexp.findFirst({
      where: {
        exp_id: args.exp_id,
      },
    })

    return experience
  },
  getDeveloperTestDetailList: async (_, args, { userId }) => {
    const testDetailList = await prisma.jmkdevtestmstr.findMany({
      where: {
        developer_id: userId,
      },
    })

    const techStack = await prisma.jmktechstk.findMany()
    testDetailList.forEach((testDetail) => {
      if (testDetail.test_dt) {
        const timestamp = testDetail.test_dt.getTime()
        testDetail.test_dt = new Date(timestamp).toLocaleDateString()
      }
      if (testDetail.next_attempt) {
        const timestamp = testDetail.next_attempt.getTime()
        testDetail.next_attempt = new Date(timestamp).toLocaleDateString()
      }

      if (testDetail.techstk_id) {
        testDetail.techstk_id = techStack[testDetail.techstk_id]
      }
    })

    return testDetailList
  },

  getCourseList: async (_, args, { userId }) => {
    const courseDetail = await prisma.jmkcrsinfo.findMany()
    return courseDetail
  },
  getTermList: async (_, args, { userId }) => {
    const termDetail = await prisma.jmktermdet.findMany({
      where: { crs_id: args.crs_id },
    })
    // Use map to create an array of promises that resolve to updated elements
    const updatedTermDetail = await Promise.all(
      termDetail.map(async (element) => {
        const value = await prisma.jmktermmstr.findFirstOrThrow({
          where: {
            term_id: element.term_id,
          },
        })
        element.term_code = value.term_code
        return element // Return the updated element
      })
    )

    return updatedTermDetail
  },

  getSubjectList: async (_, args, { userId }) => {
    if (!userId) throw new AuthenticationError('Please login to continue')

    const subjectDetail = await prisma.jmksubjectmaster.findMany({
      where: {
        crs_id: args.crs_id,
      },
    })
    return subjectDetail
  },

  getStudentTermSubjectList: async (_, args, { userId }) => {
    const stdtermsub = await prisma.jmkstdtermsub.findMany({
      where: {
        subject_id: args.data.subject_id,
        termdet_id: args.data.termdet_id,
      },
    })

    const updatedValue = await Promise.all(
      stdtermsub.map(async (element) => {
        const StudentName = await prisma.jmkstdinfo.findFirst({
          where: {
            std_id: element.std_id,
          },
        })
        const subjectCode = await prisma.jmksubjectmaster.findFirst({
          where: {
            subject_id: element.subject_id,
          },
        })
        element.subject_name = subjectCode.subject_code
        element.student_name = `${StudentName.std_fname} ${StudentName.std_lname}`

        return element
      })
    )

    return updatedValue
  },
}

const developerMutationResolver = {
  createQuesAnsTeacher: async (_, { data }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkdevinfo.findFirst({
      where: { developer_id: userId },
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
  updateQuesAnsTeacher: async (_, { data }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkdevinfo.findFirst({
      where: { developer_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user')
    const oldAns = await prisma.jmk_ques_ans.findFirst({
      where: {
        ans_id: data.ans_id,
        teacher_id: userId,
      },
    })
    if (!oldAns) throw new ApolloError('invalid !')

    const answer = await prisma.jmk_ques_ans.update({
      data: { ...data },
      where: { ans_id: data.ans_id },
    })

    if (!answer) throw new ApolloError('Someting went wrong !')

    return 'Successfully updated !'
  },
  createAndUpdateQuestionVoteTeacher: async (_, { data }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkdevinfo.findFirst({
      where: { developer_id: userId },
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
  createAndUpdateTeacherQueSub: async (_, { data }, { userId }) => {
    if (!userId) throw new ForbiddenError('user need to login')
    const user = await prisma.jmkdevinfo.findFirst({
      where: { developer_id: userId },
    })
    if (!user) throw new AuthenticationError('invalid user')

    //Should the teacher be able to subscribe as well?
    const subscribe = await prisma.jmk_ques_sub.findFirst({
      where: {
        question_id: data.question_id,
        student_id: userId,
      },
    })
    if (subscribe) {
      const stdSubscribe = await prisma.jmk_ques_sub.delete({
        where: { sub_id: subscribe.sub_id },
      })

      if (!stdSubscribe) throw new ApolloError('Someting went wrong !')

      return 'unsubscribed'
    }

    const stdSubscribe = await prisma.jmk_ques_sub.create({
      data: { ...data, student_id: userId },
    })

    if (!stdSubscribe) throw new ApolloError('Someting went wrong !')

    return 'subscribed'
  },
  developerEmailVerify: async (_, { data }) => {
    const decodedToken = jwt.decode(data.token, process.env.JWT_SECRET_KEY)
    if (!decodedToken) throw new AuthenticationError('The token is not valid')
    const developer = await prisma.jmkdevinfo.findFirst({
      where: { developer_id: decodedToken.userId },
    })
    if (!developer) throw new AuthenticationError('Invalid Token')

    const updateStatus = await prisma.jmkdevinfo.update({
      where: {
        developer_id: developer.developer_id,
      },
      data: {
        dev_verified: true,
      },
    })
    if (!updateStatus)
      throw new AuthenticationError('Could not verify your email')
    return 'Email Verification Complete'

    // const generatedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIzLCJyb2xlIjoidHJhaW5lciIsImlhdCI6MTY5MDAwMTI3NX0.jnArqzd6dCS8vhIMKU8CEm4v-uGdkP1988Vlvq9Vxp8';
    // await sendMail("py.suhant@gmail.com", 'Successfully Register ', emailVerificationHTML(generatedToken))
    // return "mail sent";
  },
  signinDeveloper: async (_, { data }) => {
    const developer = await prisma.jmkdevinfo.findFirst({
      where: {
        developer_email: data.developer_email,
      },
    })

    if (!developer) {
      throw new AuthenticationError('Invalid email')
    }

    if (!developer.dev_verified) {
      throw new AuthenticationError('Please verify your email')
    }

    const isMatch = data.developer_password === developer.developer_password
    if (!isMatch) {
      throw new AuthenticationError('Invalid Password')
    }

    let acc_type = 'Consultancy'
    if (developer.cid) {
      const consultinfo = await prisma.jmkconsulinfo.findFirst({
        where: {
          serial: developer.cid,
        },
      })
      if (consultinfo) {
        acc_type = consultinfo.acc_type
      }
    }

    const token = jwt.sign(
      { userId: developer.developer_id, role: ROLES[3] },
      process.env.JWT_SECRET_KEY
    )

    return {
      token,
      acc_type,
    }
  },

  signupDeveloper: async (_, { data }) => {
    const dev = await prisma.jmkdevinfo.findFirst({
      where: { developer_email: data.developer_email },
    })
    if (dev)
      throw new AuthenticationError('developer already exist with that email')
    let file
    if (data.developer_resume) {
      file = await uploadImgToAWS(data.developer_resume, 'developer_resume/')
      if (!file.data) throw new ApolloError('Someting went wrong !')
    }
    const newDev = await prisma.jmkdevinfo.create({
      data: {
        ...data,
        developer_resume: file?.data?.Location ?? '',
        developer_resume_key: file?.data?.key ?? '',
        // developer_resume: '',
        // developer_resume_key: '',
      },
    })
    if (!newDev) throw new AuthenticationError('Invalid input')
    const currentDate = new Date()
    const createTechStack = async (techStackId, techStackExp) => {
      const techStack = await prisma.jmktechstk.findFirst({
        where: {
          techstk_id: parseInt(techStackId),
        },
      })
      try {
        await prisma.jmkdevtechdet.create({
          data: {
            techstk_id: parseInt(techStackId),
            tech_stack_exp: techStackExp,
            tech_last_used: currentDate,
            tech_stack: techStack.techstk_name,
            developer_id: newDev.developer_id,
          },
        })
      } catch (e) {
        throw new ApolloError(e.message)
      }
    }

    const createCompanyExperience = async (
      companyName,
      projectDescription,
      startDate
    ) => {
      try {
        await prisma.jmkdevexp.create({
          data: {
            company_name: companyName,
            exp_desc: projectDescription,
            exp_start_date: startDate,
            developer_id: newDev.developer_id,
          },
        })
      } catch (error) {
        throw new ApolloError(error.message)
      }
    }

    if (data.developer_tech1 != null) {
      await createTechStack(data.developer_tech1, data.developer_tech1_exp)
    }

    if (data.developer_tech2 != null) {
      await createTechStack(data.developer_tech2, data.developer_tech2_exp)
    }

    if (data.developer_tech3 != null) {
      await createTechStack(data.developer_tech3, data.developer_tech3_exp)
    }

    if (data.developer_company1) {
      await createCompanyExperience(
        data.developer_company1,
        data.developer_company1_project,
        data.developer_company1_start
      )
    }
    const token = jwt.sign(
      { userId: newDev.developer_id, role: ROLES[3] },
      process.env.JWT_SECRET_KEY
    )
    await sendMail(
      newDev.developer_email,
      'Successfully Register ',
      emailVerificationHTML(
        token,
        `${newDev.developer_fname} ${newDev.developer_lname}`,
        'developerVerification'
      )
    )

    return 'success'
  },

  updateDeveloper: async (_, { data }, { userId }) => {
    const updatedDeveloper = await prisma.jmkdevinfo.update({
      where: { developer_id: userId },
      data: { ...data },
    })

    if (!updatedDeveloper) throw new ForbiddenError('Developer not found')
    return 'success'
  },
  createExperience: async (_, { data }, { userId }) => {
    if (!userId) return new AuthenticationError('Login to continue')
    const techLastUsed = data.tech_last_used
      ? new Date(data.tech_last_used)
      : null

    const exisitingTechStack = await prisma.jmkdevtechdet.findFirst({
      where: {
        techstk_id: data.techstk_id,
        developer_id: userId,
      },
    })
    if (exisitingTechStack) return new ApolloError('Tech stack already exists')

    const techStackName = await prisma.jmktechstk.findFirst({
      where: {
        techstk_id: data.techstk_id,
      },
    })

    const newExperience = await prisma.jmkdevtechdet.create({
      data: {
        techstk_id: data.techstk_id,
        tech_stack_exp: data.tech_stack_exp,
        tech_last_used: techLastUsed,
        tech_stack: techStackName.techstk_name,
        developer_id: userId,
      },
    })
    if (!newExperience) return new ApolloError('Something went wrong')
    return 'success'
  },
  updateExperience: async (_, { data }, { userId }) => {
    const { serial, ..._updatedData } = data

    const updatedExperience = await prisma.jmkdevtechdet.update({
      where: {
        serial: serial,
        developer_id: _updatedData.developer_id,
      },
      data: {
        ..._updatedData,
      },
    })
    if (!updatedExperience) return new ApolloError('Cannot find the experience')
    return 'success'
  },
  deleteExperience: async (_, { data }, { userId, role }) => {
    // if (!userId) throw new ForbiddenError('invalid token')

    const experience = await prisma.jmkdevtechdet.findFirst({
      where: {
        serial: data.serial,
      },
    })
    if (!experience) throw new ApolloError('Invalid ID')
    const exp = await prisma.jmkdevtechdet.delete({
      where: {
        serial: data.serial,
      },
    })
    if (!exp) throw new ApolloError('Something went wrong!')
    return 'success'
  },
  deleteProject: async (_, { data }, { userId }) => {
    const project = await prisma.jmkdevprojdet.findFirst({
      where: {
        serial: data.serial,
      },
    })

    if (!project) throw new ApolloError('Invalid ID')

    const prj = await prisma.jmkdevprojdet.delete({
      where: {
        serial: data.serial,
      },
    })

    if (!prj) throw new ApolloError('Something went wrong')

    return 'success'
  },
  updateProject: async (_, { data }, { userId }) => {
    const { serial, ..._updatedData } = data
    //Comparing start and end date
    compareDates(data.proj_strt_dt, data.proj_end_dt)

    const project = await prisma.jmkdevprojdet.findFirst({
      where: {
        serial: serial,
      },
    })
    if (!project.developer_id == userId)
      return new ForbiddenError('This is not your to modify')
    const updatedProject = await prisma.jmkdevprojdet.update({
      where: {
        serial: serial,
      },
      data: {
        ..._updatedData,
      },
    })
    if (!updatedProject) return new ApolloError('Cannot find the project')
    return 'success'
  },
  createProject: async (_, { data }, { userId }) => {
    if (!userId) return new AuthenticationError('Login to continue')
    compareDates(data.proj_strt_dt, data.proj_end_dt)
    const newProject = await prisma.jmkdevprojdet.create({
      data: {
        developer_id: userId ?? data.developer_id,
        proj_title: data.proj_title,
        proj_desc: data.proj_desc,
        proj_techs_used: data.proj_techs_used,
        proj_type: data.proj_type,
        proj_end_dt: data.proj_end_dt,
        proj_strt_dt: data.proj_strt_dt,
      },
    })
    if (!newProject) return new ApolloError('Something went wrong!')
    return 'success'
  },
  updateWorkExperience: async (_, { data }, { userId }) => {
    if (!userId) return new AuthenticationError('Login to continue')

    const { exp_id, ..._updatedData } = data

    //Comparing Start and End dates
    compareDates(data.exp_start_date, data.exp_end_date)

    const newWorkExperience = await prisma.jmkdevexp.update({
      where: {
        exp_id: exp_id,
      },
      data: {
        ..._updatedData,
      },
    })
    if (!newWorkExperience) return new ApolloError('Something went wrong!')
    return 'success'
  },
  AddWorkExperience: async (_, { data }, { userId }) => {
    if (!userId) return new AuthenticationError('Login to continue')

    //Comparing Start and End dates
    compareDates(data.exp_start_date, data.exp_end_date)

    const newWorkExperience = await prisma.jmkdevexp.create({
      data: {
        company_name: data.company_name,
        exp_desc: data.exp_desc,
        exp_start_date: data.exp_start_date,
        exp_end_date: data.exp_end_date,
        exp_role_pos: data.exp_role_pos,
        developer_id: userId ?? data.developer_id,
      },
    })
    if (!newWorkExperience) throw new ApolloError('Something went wrong')
    return 'success'
  },
  deleteWorkExperience: async (_, { data }, { userId }) => {
    // if (!userId) return new AuthenticationError("Login to continue");
    const workExperience = await prisma.jmkdevexp.findFirst({
      where: {
        exp_id: data.exp_id,
      },
    })
    if (!workExperience) throw new ApolloError('Invalid ID')
    if (userId !== workExperience.developer_id)
      return new ApolloError('Invalid ID')
    const exp = await prisma.jmkdevexp.delete({
      where: {
        exp_id: data.exp_id,
      },
    })
    if (!exp) throw new ApolloError('Something went wrong!')
    return 'success'
  },
  updateResumeDetails: async (_, { data }, { userId }) => {
    try {
      if (!userId) return new AuthenticationError('Please login!')

      const selectedDeveloper = await prisma.jmkdevinfo.findFirst({
        where: {
          developer_id: userId,
        },
      })
      let file
      if (data.developer_resume) {
        await deleteImgToAWS(selectedDeveloper?.developer_resume_key)

        file = await uploadImgToAWS(data.developer_resume, 'developer_resume/')
        if (!file.data) throw new ApolloError('Someting went wrong !')
      }
      const newTrainer = await prisma.jmkdevinfo.update({
        where: {
          developer_id: userId,
        },
        data: {
          developer_resume: file?.data?.Location ?? '',
          developer_resume_key: file?.data?.key ?? '',
        },
      })

      if (!newTrainer) return new ApolloError('Someting went wrong')
      return 'success'
    } catch (error) {
      return new ApolloError(error.message)
    }
  },
  updateTechStack: async (_, { data }, { userId, role }) => {
    const { techstk_id, ...udpatedData } = data
    if (!userId) throw new ForbiddenError('invalid token')
    // const admin = await prisma.jmkuserinfo.findFirst({
    //     where: { usr_id: userId, usr_role: role },
    // })
    // if (!admin) throw new AuthenticationError('invalid admin')

    // const existingTechStack = await prisma.jmktechstk.findFirst(
    //     {
    //         where: {
    //             techstk_name: udpatedData.techstk_name
    //         }
    //     }
    // );

    // if (existingTechStack) return new ApolloError("Tech Stack already exists");
    const updatedTechStack = await prisma.jmktechstk.update({
      where: {
        techstk_id: techstk_id,
      },
      data: {
        ...udpatedData,
      },
    })

    if (!updatedTechStack) return new ApolloError('Cannot find the tech stack')
    return 'success'
  },
  addTechStack: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')
    const admin = await prisma.jmkuserinfo.findFirst({
      where: { usr_id: userId, usr_role: role },
    })
    if (!admin) throw new AuthenticationError('invalid admin')
    const existingTechStack = await prisma.jmktechstk.findFirst({
      where: {
        techstk_name: data.techstk_name,
      },
    })
    if (existingTechStack) return new ApolloError('Tech Stack already exists')

    const createdTechStack = await prisma.jmktechstk.create({
      data: {
        ...data,
      },
    })
    if (!createdTechStack) return new ApolloError('Cannot find the tech stack')
    return 'success'
  },
  deleteTechStack: async (_, { data }, { userId, role }) => {
    if (!userId) throw new ForbiddenError('invalid token')

    const techStack = await prisma.jmktechstk.findFirst({
      where: {
        techstk_id: data.techstk_id,
      },
    })

    if (!techStack) return new ApolloError('Invalid ID')

    const deleteTechStack = await prisma.jmktechstk.delete({
      where: {
        techstk_id: data.techstk_id,
      },
    })
    if (!deleteTechStack) throw new ApolloError('Something went wrong!')
    return 'success'
  },
  updateStudentMarks: async (_, args, { userId }) => {
    const marksList = args.data

    marksList.forEach(async (element) => {
      await prisma.jmkstdtermsub.update({
        where: {
          serial: element.serial,
        },
        data: {
          marks_obtained: element.marks_obtained,
        },
      })
    })

    return true
  },
}

export {
  developerQueryTypesAndInputs,
  developerQuery,
  developerQueryResolvers,
  developerMutationResolver,
  developerMutation,
}
