import prisma from "../../database.js";
import jwt from 'jsonwebtoken';
import { ApolloError, AuthenticationError, ForbiddenError } from 'apollo-server-express';

const ROLE = "Developer"

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

    input signinDeveloperUserInput{
        developer_email: String
        developer_password: String
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
        tech_last_used: String
        developer_id: Int
    }
    input UpdateExperienceDetails{
        serial:Int!
        tech_stack: String
        tech_stack_exp: String
        tech_last_used: Date
        developer_id: Int
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
`;



const developerMutation = `
    signinDeveloper(data:signinDeveloperUserInput!):Token
    updateDeveloper(data:DeveloperDetails!):String

    
    createExperience(data:ExperienceDetails!):String
    updateExperience(data:UpdateExperienceDetails!): String
    deleteExperience(data:deleteExpInput!): String

    updateProject(data:UpdateProjectDetails!): String
    deleteProject(data:deleteProjInput!):String
    createProject(data:ProjectDetails!):String

`;




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
        experienceList.forEach((experience) => {
            if (experience.tech_last_used) {
                const timestamp = experience.tech_last_used.getTime();
                experience.tech_last_used = new Date(timestamp).toLocaleDateString();
            }
        });
        return experienceList;

    },
    getExperienceById: async (_, args, { userId, role }) => {
        // if (!userId) throw new ForbiddenError('invalid token');
        if (!args.serial) throw new ForbiddenError('serial is required !');
        const experience = await prisma.jmkdevtechdet.findFirst({
            where: {
                serial: args.serial,
            }
        });
        if (!experience) return new ApolloError('Experience does not exist!');

        if (experience.tech_last_used) {
            const timestamp = experience.tech_last_used.getTime();
            experience.tech_last_used = new Date(timestamp).toLocaleDateString();
        }
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
        if (!userId) return new AuthenticationError("Login to continue");
        const techStackList = await prisma.jmkdevtechdet.findMany({
            where: {
                developer_id: userId,
            },
            select: {
                tech_stack: true,
            },
            distinct: ['tech_stack'],
        });
        const projTechsUsedList = techStackList.map((p) => p.tech_stack);
        const matchingRequirements = await prisma.jmkconsulreqmnts.findMany({
            where: {
                reqd_tech_stack: {
                    in: projTechsUsedList,
                },
            },
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
        const token = jwt.sign({ userId: developer.developer_id, role: ROLE }, process.env.JWT_SECRET_KEY)
        return { token };
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
        const newExperience = await prisma.jmkdevtechdet.create({
            data: {
                tech_stack: data.tech_stack,
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




}


export { developerQueryTypesAndInputs, developerQuery, developerQueryResolvers, developerMutationResolver, developerMutation }