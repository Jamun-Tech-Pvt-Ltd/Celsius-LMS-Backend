import prisma from "../../database.js";
import jwt from 'jsonwebtoken';
import { ApolloError, AuthenticationError, ForbiddenError } from 'apollo-server-express';
import { uploadImgToAWS } from "../../utils/imageHandler.js";

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


    input signinDeveloperUserInput{
        developer_email: String
        developer_password: String
    }

    input signinDevInput {
        developer_fname: String!
        developer_mname: String
        developer_lname: String!
        developer_high_qualification: String
        developer_phone: String!
        developer_email: String!
        developer_password: String!
        developer_country: String!
        developer_tech1: String!
        developer_tech2: String
        developer_tech3: String
        developer_tech1_exp: String!
        developer_tech2_exp: String
        developer_tech3_exp: String
        developer_resume: Upload
        developer_company1: String!
        developer_company1_project: String!
        developer_company1_start: Date!
        developer_company2: String
        developer_company2_start: Date
        developer_company2_end: Date
        developer_company2_project: String
        developer_type: String!
     }

    input DeveloperDetails{
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
    
`;

const developerQuery = `
    getDeveloper:[Developer]
    getDeveloperUser: DeveloperUser
    getDashboard(userId: Int!): Dashboard
`;

const developerMutation = `

    signupDev(data:signinDevInput):String!
    signinDeveloper(data:signinDeveloperUserInput!):Token
    updateDeveloper(data:DeveloperDetails!):DeveloperUser

`;


const developerQueryResolvers = {

    getDeveloperUser: async (_, args, { userId }) => {
        console.log(userId);
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
        console.log('hitting');
        const dashboard = {
            experience: 3,
            projects: 5
        };
        return dashboard;
    },

};
const developerMutationResolver = {

    signupDev: async (_, { data }) => {
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

    updateDeveloper: async (_, { data }) => {
        const { developer_id, ...updatedData } = data;

        const updatedDeveloper = await prisma.jmkdevinfo.update({
            where: { developer_id },
            data: updatedData,
        });

        if (!updatedDeveloper) throw new ForbiddenError('Developer not found');
        console.log(updatedData);
        return updatedDeveloper;
    }

}


export { developerQueryTypesAndInputs, developerQuery, developerQueryResolvers, developerMutationResolver, developerMutation }