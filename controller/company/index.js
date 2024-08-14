import { AuthenticationError, ForbiddenError } from 'apollo-server-express'
import prisma from '../../database.js'
import jwt from 'jsonwebtoken'
import { sendMail } from '../../utils/mailHandler.js'
import saaSRequsteEmailHTML from '../../utils/SaaSRequsteEmail.js'
import { generatePasswordFromUsername, ROLES } from '../../utils/helper.js'
import crypto from 'crypto'

const companyQueryTypesAndInputs = `
    type Company {
        c_name: String!
        c_email: String!
        c_username:String!
        c_panno: String!
        c_package:String!
        c_package_type:String!
    }

    input signinCompanyInput{
        c_username: String!
        c_email: String!
        c_password: String!
     }
     
     input signupCompanyInput{
        c_name: String!
        c_email: String!
        c_username:String!
        c_panno: String!
        c_package:String!
        c_package_type:String!
     }

     input updateCompanyInput{
        serial: String
        c_name: String
        c_email: String
        c_panno: String
        c_package:String
        c_verified:Boolean
        c_package_type:String
     }

`

const companyQuery = `
    getCompany(serial:Int!):Company
    getCompanyList:[Company]
`

const companyMutation = `
    signupCompany(data:signupCompanyInput!):String!
    signinCompany(data:signinCompanyInput!):Token!
    updateCompany(data:updateCompanyInput):Company!
    verifyCompaney(serial:Int!):String!

`

const companyResolvers = {
    signupCompany: async (_, { data }) => {
        const company = await prisma.jmkcompany.findFirst({ where: { c_email: data.c_email, c_username: data.c_username } })
        if (company) throw new AuthenticationError("company already exist with that email and username")
        const newCompany = await prisma.jmkcompany.create({
            data: { ...data, c_password: generatePasswordFromUsername(data.c_username) }
        });
        if (!newCompany) throw new AuthenticationError("Something went wrong !");
        await sendMail(newCompany.c_name, newCompany.c_email, newCompany.c_package, newCompany.c_package_type, 'Successfully Requested ', saaSRequsteEmailHTML);
        return 'success';
    },

    signinCompany: async (_, { data }) => {
        const company = await prisma.jmkcompany.findFirst({ where: { c_email: data.c_email, c_username: data.c_username } });
        if (!consultancy) throw new AuthenticationError("invalid credentials");
        const isMatch = data.c_password == consultancy.c_password;
        if (!isMatch) throw new AuthenticationError("invalid credentials");
        const token = jwt.sign({ userId: company.serial, role: ROLES[2], platform: 'external', c_username: company.c_username, c_package_type: company.c_username }, process.env.JWT_SECRET_KEY, { expiresIn: "7d" })
        return { token };
    },

    verifyCompaney: async (_, { serial }, { userId, role }) => {
        if (!userId) throw new AuthenticationError("Invalid Token!!")
        if (role === 'admin') {
            const company = await prisma.jmkcompany.findFirst({ where: { serial } });
            if (!company) throw new AuthenticationError("Invalid Credentials");
            const companyUpate = await prisma.jmkcompany.update({
                data: { c_verified: true },
                where: { serial }
            });
            if (!companyUpate) throw new AuthenticationError("Invalid !!");
            await sendMail(companyUpate.c_name, companyUpate.c_email, companyUpate.c_username, companyUpate.c_password, 'Successfully Requested ', saaSRequsteEmailHTML)
            return companyUpate;
        }
        throw new AuthenticationError("invalid access !!")
    },

    updateCompany: async (_, { data }, { userId, role }) => {
        if (!userId) throw new AuthenticationError("Invalid Token!!")
        if (role === ROLES[2]) {
            const company = await prisma.jmkcompany.findFirst({ where: { serial: userId } });
            if (!company) throw new AuthenticationError("Invalid Credentials");
            const companyUpate = await prisma.jmkcompany.update({
                data: { ...data, },
                where: { serial: data.serial }
            })
            if (!companyUpate) throw new AuthenticationError("Invalid !!")
            return companyUpate
        }
        throw new AuthenticationError("invalid access !!")
    },
}

const companyResolversQuery = {
    getCompany: async (_, { serial }, { userId, role }) => {
        if (!userId) throw new AuthenticationError("invalid token");
        if (role === 'admin') {
            const company = await prisma.jmkcompany.findFirst({ where: { serial } });
            if (!company) throw new AuthenticationError("invalid");
            return company;
        }
        if (role === ROLES[2]) {
            const company = await prisma.jmkcompany.findFirst({ where: { serial: userId } });
            if (!company) throw new AuthenticationError("invalid");
            return company;
        }
        throw new AuthenticationError("invalid acccess");
    },
    getCompanyList: async (_, args, { userId, role }) => {
        if (!userId) throw new AuthenticationError("invalid token");
        if (role === 'admin') {
            const company = await prisma.jmkcompany.find()
            if (!company) throw new AuthenticationError("invalid")
            return company;
        }
        throw new AuthenticationError("invalid acccess")
    },
}

export { companyQueryTypesAndInputs, companyQuery, companyMutation, companyResolvers, companyResolversQuery }
