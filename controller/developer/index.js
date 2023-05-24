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


    input signinDeveloperUserInput{
        developer_email: String
        developer_password: String
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