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

    type DeveloperUser{
        developer_id: Int!
        developer_fname: String
        developer_mname: String
        developer_lname: String
        developer_email: String
        developer_phone: String
        developer_country: String
        developer_password: String
        developer_type: String
        developer_prof_summary: String
        developer_resume: String
        developer_resume_key: String
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
        developer_fname: String
        developer_lname:String
    }

    type Resume{
        resume:Upload
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


    input UpdateResumeAWS{
        developer_resume: Upload!
    }


    input EmailVerification{
        token: String
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
    getTechStackById(techstk_id: Int!): techStack

    getDeveloperExperienceList:[developerExperience]
    getDeveloperExperienceById(exp_id: Int!):developerExperience

    getDeveloperTestDetailList:[DeveloperTestDetail]


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


    updateTechStack(data:techStackDetail!):String
    addTechStack(data:createTechStack!):String
    deleteTechStack(data:deleteTechStack!):String



`

const developerQueryResolvers = {

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
    // if (!userId) throw new ForbiddenError('invalid token');
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
    // if (!userId) throw new ForbiddenError('user need to login');
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
    // if (!userId) return new AuthenticationError("Login to continue");
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
    // if (!userId) return new AuthenticationError("Login to continue");

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
}

const developerMutationResolver = {
  signinDeveloper: async (_, { data }) => {
    const developer = await prisma.jmkdevinfo.findFirst({
      where: {
        developer_email: data.developer_email,
      },
    })
    if (!developer) throw AuthenticationError('Invalid email')
    const isMatch = data.developer_password == developer.developer_password
    if (!isMatch) throw new AuthenticationError('Invalid Password')
    const token = jwt.sign(
      { userId: developer.developer_id, role: ROLES[3] },
      process.env.JWT_SECRET_KEY
    )
    return {
      token,
      developer_fname: developer.developer_fname,
      developer_lname: developer.developer_lname,
    }
  },

  signupDeveloper: async (_, { data }) => {
    const dev = await prisma.jmkdevinfo.findFirst({
      where: { developer_email: data.developer_email },
    })
    if (dev)
      throw new AuthenticationError('developer already exist with that email')
    // let file
    // if (data.developer_resume) {
    //     file = await uploadImgToAWS(data.developer_resume, 'developer_resume/')
    //     if (!file.data) throw new ApolloError('Someting went wrong !')
    // }
    const newDev = await prisma.jmkdevinfo.create({
      data: {
        ...data,
        // developer_resume: file?.data?.Location ?? '',
        // developer_resume_key: file?.data?.key ?? '',
        developer_resume: '',
        developer_resume_key: '',
      },
    })
    if (!newDev) throw new AuthenticationError('Invalid input')
    const currentDate = new Date()
    const createTechStack = async (techStackId, techStackExp) => {
      try {
        await prisma.jmkdevtechdet.create({
          data: {
            techstk_id: parseInt(techStackId),
            tech_stack_exp: techStackExp,
            tech_last_used: currentDate,
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
    }; 

  },

    getDeveloperUser: async (_, args, { userId }) => {
        const developer = await prisma.jmkdevinfo.findFirst({ where: { developer_id: userId } });
        if (!developer) throw new ForbiddenError('Developer not found')
        return developer;
    },


    getDeveloper: async (_, args, { userId }) => {
        // if (!userId) throw new ForbiddenError('user need to login');
        const developerList = await prisma.jmkdevinfo.findMany();
        return developerList;
    },
    getDashboard: async (_, args, { userId }) => {
        if (!userId) throw new ForbiddenError('user need to login');

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
        ]);

        const [experienceList, projectList] = dashboardData;


        const dashboard = {
            experience: experienceList.length,
            projects: projectList.length,
        };

        return dashboard;
    },
    getExperienceList: async (_, args, { userId }) => {
        if (!userId) throw new ForbiddenError('user need to login');
        const experienceList = await prisma.jmkdevtechdet.findMany({
            where: {
                developer_id: userId
            }
        });
        const techStack = await prisma.jmktechstk.findMany();
        experienceList.forEach((experience) => {
            if (experience.techstk_id) {
                const techStackItem = techStack.find((item) => item.techstk_id === experience.techstk_id);
                experience.techstk_id = techStackItem;
            }
        });
        return experienceList;

    },
    getExperienceById: async (_, args, { userId, role }) => {
        if (!userId) throw new ForbiddenError('invalid token');
        if (!args.serial) throw new ForbiddenError('serial is required !');
        const experience = await prisma.jmkdevtechdet.findFirst({
            where: {
                serial: args.serial,
            }
        });
        if (!experience) return new ApolloError('Experience does not exist!');
        const techStack = await prisma.jmktechstk.findFirst({
            where: {
                techstk_id: experience.techstk_id
            }
        });

        if (experience.tech_last_used) {
            const timestamp = experience.tech_last_used.getTime();
            experience.tech_last_used = new Date(timestamp).toLocaleDateString();
        }
        experience.techstk_id = techStack
        return experience;
    },

    getProjectById: async (_, args, { userId, role }) => {
        // if (!userId) throw new ForbiddenError('invalid token');
        if (!args.serial) throw new ForbiddenError('serial is required !');
        const project = await prisma.jmkdevprojdet.findFirst({
            where: {
                serial: args.serial,
            }
        });

        if (!project) return new ApolloError('Project does not exist!');

        return project;
    },
    getDeveloperProjectList: async (_, args, { userId, role }) => {
        // if (!userId) throw new ForbiddenError('user need to login');
        const projectList = await prisma.jmkdevprojdet.findMany({
            where: {
                developer_id: args.userId
            }
        });
        projectList.forEach((project) => {
            if (project.proj_strt_dt) {
                const timestamp = project.proj_strt_dt.getTime();
                project.proj_strt_dt = new Date(timestamp).toLocaleDateString();
            }
            if (project.proj_end_dt) {
                const timestamp = project.proj_end_dt.getTime();
                project.proj_end_dt = new Date(timestamp).toLocaleDateString();
            }
        });
        return projectList;
    },
    getConsultancyRecommendation: async (_, args, { userId }) => {
        // if (!userId) return new AuthenticationError("Login to continue");
        const techStackList = await prisma.jmkdevtechdet.findMany({
            where: {
                developer_id: userId,
            },
            select: {
                techstk_id: true,
            },
            distinct: ['techstk_id'],
        });
        const projTechsUsedList = techStackList.map((p) => p.techstk_id);
        const matchingRequirements = await prisma.jmkconsulreqmnts.findMany({
            where: {
                techstk_id: {
                    in: projTechsUsedList,
                },
            },
        });

        const techStack = await prisma.jmktechstk.findMany();
        matchingRequirements.forEach((req) => {
            if (req.techstk_id) {
                const techStackItem = techStack.find((item) => item.techstk_id === req.techstk_id);
                req.techstk_id = techStackItem;
            }
        });


        return matchingRequirements;
    },
    getJobRecommendationById: async (_, args, { userId }) => {
        if (!userId) return new AuthenticationError("Login to continue");
        const jobRecommendation = await prisma.jmkconsulreqmnts.findFirst({
            where: {
                consulreqmnts_id: args.consulreqmnts_id
            }
        });
        if (!jobRecommendation) return new ApolloError("Job not found");
        return jobRecommendation;
    },
    getTechStackList: async (_) => {
        const techStackList = await prisma.jmktechstk.findMany();
        return techStackList;
    },
    getTechStackById: async (_, args, { userId }) => {
        const techStack = await prisma.jmktechstk.findFirst({
            where: {
                techstk_id: args.techstk_id
            }
        });
        return techStack;
    },
    getDeveloperExperienceList: async (_, args, { userId }) => {
        if (!userId) return new AuthenticationError("Login to continue");
        const developerExperienceList = await prisma.jmkdevexp.findMany({
            where: {
                developer_id: userId
            }
        });
        developerExperienceList.forEach((experience) => {
            if (experience.exp_start_date) {
                const timestamp = experience.exp_start_date.getTime();
                experience.exp_start_date = new Date(timestamp).toLocaleDateString();
            }
            if (experience.exp_end_date) {
                const timestamp = experience.exp_end_date.getTime();
                experience.exp_end_date = new Date(timestamp).toLocaleDateString();
            }
        });
        return developerExperienceList;
    },
    getDeveloperExperienceById: async (_, args, { userId }) => {
        // if (!userId) return new AuthenticationError("Login to continue");
        const experience = await prisma.jmkdevexp.findFirst({
            where: {
                exp_id: args.exp_id,
            }
        });

        return experience;
    },
    getDeveloperTestDetailList: async (_, args, { userId }) => {
        // if (!userId) return new AuthenticationError("Login to continue");

        const testDetailList = await prisma.jmkdevtestmstr.findMany({
            where: {
                developer_id: userId
            }
        });

        const techStack = await prisma.jmktechstk.findMany();
        testDetailList.forEach((testDetail) => {
            if (testDetail.test_dt) {
                const timestamp = testDetail.test_dt.getTime();
                testDetail.test_dt = new Date(timestamp).toLocaleDateString();
            }
            if (testDetail.next_attempt) {
                const timestamp = testDetail.next_attempt.getTime();
                testDetail.next_attempt = new Date(timestamp).toLocaleDateString();
            }

            if (testDetail.techstk_id) {
                testDetail.techstk_id = techStack[testDetail.techstk_id];
            }
        });

        return testDetailList;



    },
};


export {
  developerQueryTypesAndInputs,
  developerQuery,
  developerQueryResolvers,
  developerMutationResolver,
  developerMutation,
}
