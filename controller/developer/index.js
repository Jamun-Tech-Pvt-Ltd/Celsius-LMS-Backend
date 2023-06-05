import prisma from "../../database.js";
import jwt from 'jsonwebtoken';
import { ApolloError, AuthenticationError, ForbiddenError } from 'apollo-server-express';
import { ROLES } from "../../utils/helper.js";
import { uploadImgToAWS, deleteImgToAWS } from '../../utils/imageHandler.js'

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
    }
    type Dashboard{
        experience: Int!
        projects:Int!
    }
    type Experience{
        serial: Int!
        tech_stack: String
        tech_stack_exp: String
        tech_last_used: String
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

    type Resume{
        resume:Upload
    }
    
    input signinDeveloperUserInput{
        developer_email: String
        developer_password: String
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
    `;

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

    getTechStackList: [techStack]

    getDeveloperExperienceList:[developerExperience]
    getDeveloperExperienceById(exp_id: Int!):developerExperience

    getDeveloperTestDetailList:[DeveloperTestDetail]


`;



const developerMutation = `
    signinDeveloper(data:signinDeveloperUserInput!):Token
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

    updateResumeDetails(data:UpdateResumeAWS!):String
    `;

// updateResume(data:UpdateResumeDetails!):String



const developerQueryResolvers = {
    getDeveloperUser: async (_, args, { userId }) => {
        const developer = await prisma.jmkdevinfo.findFirst({ where: { developer_id: userId } });
        if (!developer) throw new ForbiddenError('Developer not found')
        return developer;
    },
    getDeveloper: async (_, args, { userId }) => {
        if (!userId) throw new ForbiddenError('user need to login');
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
            if (experience.tech_last_used) {
                const timestamp = experience.tech_last_used.getTime();
                experience.tech_last_used = new Date(timestamp).toLocaleDateString();
            }
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
        if (!project) return new ApolloError('Experience does not exist!');

        return project;
    },
    getDeveloperProjectList: async (_, args, { userId, role }) => {
        // if (!userId) throw new ForbiddenError('user need to login');

        const projectList = await prisma.jmkdevprojdet.findMany({
            where: {
                developer_id: args.userId
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
const developerMutationResolver = {
    signinDeveloper: async (_, { data }) => {
        const developer = await prisma.jmkdevinfo.findFirstOrThrow({
            where: {
                developer_email: data.developer_email
            }
        });
        if (!developer) throw AuthenticationError('Invalid Credential');
        const isMatch = data.developer_password == developer.developer_password
        if (!isMatch) throw new AuthenticationError("invalid credentials")
        const token = jwt.sign({ userId: developer.developer_id, role: ROLES[3] }, process.env.JWT_SECRET_KEY)
        return { token };
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
            },
        })
        if (!newDev) throw new AuthenticationError('Invalid input')
        return 'success'
    },

    updateDeveloper: async (_, { data }, { userId }) => {
        const updatedDeveloper = await prisma.jmkdevinfo.update({
            where: { developer_id: userId },
            data: { ...data },
        });

        if (!updatedDeveloper) throw new ForbiddenError('Developer not found');
        return 'success';

    },
    createExperience: async (_, { data }, { userId }) => {
        if (!userId) return new AuthenticationError("Login to continue");
        const techLastUsed = data.tech_last_used ? new Date(data.tech_last_used) : null;

        const exisitingTechStack = await prisma.jmkdevtechdet.findFirst({
            where: {
                techstk_id: data.techstk_id,
                developer_id: userId
            }
        });
        if (exisitingTechStack) return new ApolloError('Tech stack already exists');

        const newExperience = await prisma.jmkdevtechdet.create({
            data: {
                techstk_id: data.techstk_id,
                tech_stack_exp: data.tech_stack_exp,
                tech_last_used: techLastUsed,
                developer_id: userId,
            },
        });
        if (!newExperience) return new ApolloError('Something went wrong');
        return 'success';

    },
    updateExperience: async (_, { data }, { userId }) => {
        const { serial, ..._updatedData } = data;

        const updatedExperience = await prisma.jmkdevtechdet.update({
            where: {
                serial: serial,
                developer_id: _updatedData.developer_id
            },
            data: {
                ..._updatedData,

            }
        });
        if (!updatedExperience) return new ApolloError("Cannot find the experience");
        return 'success';

    },
    deleteExperience: async (_, { data }, { userId, role }) => {
        // if (!userId) throw new ForbiddenError('invalid token')

        const experience = await prisma.jmkdevtechdet.findFirst({
            where: {
                serial: data.serial
            }
        });
        if (!experience) throw new ApolloError("Invalid ID");
        const exp = await prisma.jmkdevtechdet.delete({
            where: {
                serial: data.serial
            }
        });
        if (!exp) throw new ApolloError('Something went wrong!');
        return 'success';
    },
    deleteProject: async (_, { data }, { userId }) => {
        const project = await prisma.jmkdevprojdet.findFirst({
            where: {
                serial: data.serial,
            },
        });

        if (!project) throw new ApolloError("Invalid ID");

        const prj = await prisma.jmkdevprojdet.delete({
            where: {
                serial: data.serial,
            },
        });

        if (!prj) throw new ApolloError('Something went wrong');

        return 'success';
    },
    updateProject: async (_, { data }, { userId }) => {
        const { serial, ..._updatedData } = data;
        const project = await prisma.jmkdevprojdet.findFirst({
            where: {
                serial: serial
            }
        });
        if (!project.developer_id == userId) return new ForbiddenError("This is not your to modify");
        const updatedProject = await prisma.jmkdevprojdet.update({
            where: {
                serial: serial,
            },
            data: {
                ..._updatedData
            }
        });
        if (!updatedProject) return new ApolloError("Cannot find the project");
        return 'success';

    },
    createProject: async (_, { data }, { userId }) => {
        if (!userId) return new AuthenticationError("Login to continue");

        const newProject = await prisma.jmkdevprojdet.create({
            data: {
                developer_id: userId ?? data.developer_id,
                proj_title: data.proj_title,
                proj_desc: data.proj_desc,
                proj_techs_used: data.proj_techs_used,
                proj_type: data.proj_type,
            },
        });
        if (!newProject) return new ApolloError('Something went wrong!');
        return 'success';

    },
    updateWorkExperience: async (_, { data }, { userId }) => {
        // if (!userId) return new AuthenticationError("Login to continue");

        const { exp_id, ..._updatedData } = data;

        const newWorkExperience = await prisma.jmkdevexp.update({
            where: {
                exp_id: exp_id,
            },
            data: {
                ..._updatedData
            }
        });
        if (!newWorkExperience) return new ApolloError('Something went wrong!');
        return 'success';
    },
    AddWorkExperience: async (_, { data }, { userId }) => {
        // if (!userId) return new AuthenticationError("Login to continue");
        const startDateObj = new Date(data.exp_start_date);
        const endDateObj = new Date(data.exp_end_date);
        if (startDateObj >= endDateObj) {
            throw new ApolloError('Start date must be before end date');
        }
        const newWorkExperience = await prisma.jmkdevexp.create({
            data: {
                company_name: data.company_name,
                exp_desc: data.exp_desc,
                exp_start_date: data.exp_start_date,
                exp_end_date: data.exp_end_date,
                exp_role_pos: data.exp_role_pos,
                developer_id: userId ?? data.developer_id,
            },
        });
        if (!newWorkExperience) throw new ApolloError('Something went wrong');
        return 'success';
    },
    deleteWorkExperience: async (_, { data }, { userId }) => {
        // if (!userId) return new AuthenticationError("Login to continue");
        const workExperience = await prisma.jmkdevexp.findFirst({
            where: {
                exp_id: data.exp_id
            }
        });
        if (!workExperience) throw new ApolloError("Invalid ID");
        if (userId !== workExperience.developer_id) return new ApolloError('Invalid ID')
        const exp = await prisma.jmkdevexp.delete({
            where: {
                exp_id: data.exp_id
            }
        });
        if (!exp) throw new ApolloError('Something went wrong!');
        return 'success';
    },
    updateResumeDetails: async (_, { data }, { userId }) => {
        try {
            if (!userId) return new AuthenticationError("Please login!");

            const selectedDeveloper = await prisma.jmkdevinfo.findFirst({
                where: {
                    developer_id: userId
                }
            })
            let file
            if (data.developer_resume) {
                await deleteImgToAWS(selectedDeveloper?.developer_resume_key);

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
            });

            if (!newTrainer) return new ApolloError("Someting went wrong");
            return "success";
        } catch (error) {
            return new ApolloError(error.message)
        }

    }





}


export { developerQueryTypesAndInputs, developerQuery, developerQueryResolvers, developerMutationResolver, developerMutation }