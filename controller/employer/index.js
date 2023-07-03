import { ApolloError, AuthenticationError, ForbiddenError } from "apollo-server-express";
import prisma from "../../database.js";
import jwt from 'jsonwebtoken';
import { ROLES } from "../../utils/helper.js";

const employerQueryTypesAndInputs = `

    type employerLoginCredentials{
        token: String
        employer_name: String
    }
    type employerDetails{
        employer_name: String
        employer_add1: String
        employer_add2: String
        employer_city: String
        employer_country: String
        employer_contact_p1: String
        employer_contact_p2: String
        employer_email: String
        employer_contact_no1: String
        employer_contact_no2: String
        employer_password: String
    }

    input signinEmployerUserInput{
        employer_email: String
        employer_password: String
    }

    input signUpEmployerUserInput {
        employer_name: String
        employer_add1: String
        employer_add2: String
        employer_city: String
        employer_country: String
        employer_reg_date: Date
        employer_contact_p1: String
        employer_contact_p2: String
        employer_email: String
        employer_contact_no1: String
        employer_contact_no2: String
        employer_password: String
    }

`;

const employerQuery = `
    getEmployerDetails:employerDetails
`;

const employerMutation = `
    signInEmployer(data:signinEmployerUserInput!):employerLoginCredentials
    signUpEmployer(data: signUpEmployerUserInput!): String
    
    updateEmployer(data: signUpEmployerUserInput!): String

`;

const employerQueryResolver = {

    getEmployerDetails: async (_, args, { userId }) => {
        if (!userId) return new ForbiddenError("You do not have permission to access this");
        const employer = await prisma.jmkemployer.findFirst({
            where: {
                employer_id: userId
            }
        });
        if (!employer) return new ApolloError(`Could not find employer`);
        console.log(employer);
        console.log(userId);
        return employer;
    }
};

const employerMutationResolver = {
    signInEmployer: async (_, { data }) => {
        const employer = await prisma.jmkemployer.findFirst({
            where: {
                employer_email: data.employer_email
            }
        });
        if (!employer) return new AuthenticationError('Invalid Email');
        const isMatch = data.employer_password === employer.employer_password
        if (!isMatch) return new AuthenticationError('Invalid Password');
        const token = jwt.sign({ userId: employer.employer_id, role: ROLES[4] }, process.env.JWT_SECRET_KEY);
        return { token, employer_name: employer.employer_name }

    },
    signUpEmployer: async (_, { data }) => {

        const existingEmp = await prisma.jmkemployer.findFirst({
            where: {
                employer_email: data.employer_email
            }
        })
        if (existingEmp) return new AuthenticationError('Employer already exists with that email');
        try {
            const currentDate = new Date();
            const newEmployer = await prisma.jmkemployer.create({
                data: {
                    ...data,
                    employer_reg_date: currentDate
                }
            });
            // const token = jwt.sign({ userId: newEmployer.employer_id }, process.env.JWT_SECRET_KEY);
            // return { token, employer_name: newEmployer.employer_name };
            return "Success";
        } catch (error) {
            console.log(error);
            return new ApolloError("Something went wrong");
        }
    },
    updateEmployer: async (_, { data }, { userId }) => {
        if (!userId) return new ApolloError("You do not have permission to access this");

        const updatedEmployer = await prisma.jmkemployer.update({
            where: {
                employer_id: userId
            },
            data: { ...data }
        });
        if (!updatedEmployer) return new ApolloError("Employer could not be updated");
        return "success";

    }

};

export { employerQueryTypesAndInputs, employerQuery, employerMutation, employerMutationResolver, employerQueryResolver };