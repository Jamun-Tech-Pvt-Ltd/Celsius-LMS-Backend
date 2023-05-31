import prisma from "../../database.js";
import jwt from 'jsonwebtoken';
import { ApolloError, AuthenticationError, ForbiddenError } from 'apollo-server-express';
import { ROLES } from "../../utils/helper.js";

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
        tech_last_used: Date
        developer_id: Int   
    }

    type Project{
        serial:Int!
        developer_id:Int
        proj_title: String
        proj_desc: String
        proj_type: String
        proj_techs_used: String
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
        tech_last_used: Date
        developer_id: Int
    }
    
`;

const developerQuery = `
    getDeveloper:[Developer]
    getDeveloperUser: DeveloperUser
    getDashboard: Dashboard
    getExperienceList: [Experience]
    getExperienceById(serial: Int!): Experience!
    getDeveloperProjectList: [Project]

    getExperiencesByDeveloperId(dev_id:Int!):[Experience]
    getProjectsDeveloperId(dev_id:Int!):[Project]
`;

const developerMutation = `
    signinDeveloper(data:signinDeveloperUserInput!):Token
    updateDeveloper(data:DeveloperDetails!):DeveloperUser
    
    createExperience(data:ExperienceDetails!):Experience
    updateExperience(data:ExperienceDetails!):Experience

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

        const totalTechStackExp = experienceList.reduce(
            (total, item) => total + parseInt(item.tech_stack_exp),
            0
        );

        const dashboard = {
            experience: totalTechStackExp,
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
        return experience;
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

    getExperiencesByDeveloperId: async (_, args, { userId, role }) => {
        if (!userId) throw new ForbiddenError('user need to login');
        if (role === ROLES[2] || role === ROLES[3]) {
            const experiences = await prisma.jmkdevtechdet.findMany({
                where: {
                    developer_id: args.devId
                }
            });
            if (!experiences) throw new AuthenticationError("Data not Found !")
            return experiences;
        }
        throw new AuthenticationError("Invalid Acccess !")
    },

    getProjectsDeveloperId: async (_, args, { userId, role }) => {
        if (!userId) throw new ForbiddenError('user need to login');
        if (role === ROLES[2] || role === ROLES[3]) {
            const projects = await prisma.jmkdevprojdet.findMany({
                where: {
                    developer_id: args.devId
                }
            });
            if (!projects) throw new AuthenticationError("Data not Found !")
            return projects;
        }
        throw new AuthenticationError("Invalid Acccess !")
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
        try {
            console.log(userId);
            const updatedDeveloper = await prisma.jmkdevinfo.update({
                where: { developer_id: userId },
                data: { ...data },
            });

            if (!updatedDeveloper) throw new ForbiddenError('Developer not found');
            return updatedDeveloper;
        } catch (error) {
            console.log(error);
            return new ForbiddenError("Error Occured");
        }
    },
    createExperience: async (_, { data }) => {
        try {
            const techLastUsed = data.tech_last_used ? new Date(data.tech_last_used) : null;
            const newExperience = await prisma.jmkdevtechdet.create({
                data: {
                    tech_stack: data.tech_stack,
                    tech_stack_exp: data.tech_stack_exp,
                    tech_last_used: techLastUsed,
                    developer_id: data.developer_id,
                },
            });
            return newExperience;
        } catch (error) {
            console.log(error);
            throw new ForbiddenError('Error occured!!!');
        }
    }
    ,
    updateExperience: async (_, { data }) => {
        const { developer_id, ..._updatedData } = data;
    }

}


export { developerQueryTypesAndInputs, developerQuery, developerQueryResolvers, developerMutationResolver, developerMutation }