import { AuthenticationError } from "apollo-server-express"
import prisma from "../../database.js"
import jwt from 'jsonwebtoken'


const ROLES = ['student', "trainer", 'consultancy']

const consultancyQueryTypesAndInputs = `
    type Consultancy {
        serial: String!
        cfname: String!
        cmname: String
        cemail: String!
        creg_date: Date
        cid: String!
        acc_type: String!
    }

    type ConsultancyUser {
        serial: String!
        cufname: String!
        cumname: String
        culname: String!
        cu_role: String!
        cuemail: String!
        cid: String!
    }

    input signinConsultancyInput{
        cemail: String!
        cpassword: String!
     }

     input signupConsultancyInput{
        cfname: String!
        cmname: String
        clname: String!
        cemail: String!
        cpassword: String!
        creg_date: Date
        acc_type:String
     }


     input updateConsultancyInput{
        serial: Int!
        cfname: String!
        cmname: String
        clname: String!
        cemail: String!
        cpassword: String!
        creg_date: Date
        acc_type:String
     }


     input signinConsultancyUserInput{
        cuemail: String!
        cupassword: String!
     }

     input signupConsultancyUserInput{
        cufname: String!
        cumname: String
        culname: String!
        cuemail: String!
        cupassword: String!
        cid: Int
        cu_role:String
     }


     input updateConsultancyUserInput{
        serial: Int!
        cufname: String!
        cumname: String
        culname: String!
        cuemail: String!
        cupassword: String!
        cid: Int
        cu_role:String
     }

`

const consultancyQuery = `
    getConsultancy:Consultancy
    getConsultancyUsers:[ConsultancyUser]
    getConsultancyUser(user_id:Int!):ConsultancyUser
`

const consultancyMutation = `
    signinConsultancy(data:signinConsultancyInput!):Token
    signupConsultancy(data:signupConsultancyInput!):Token
    updateConsultancy(data:updateConsultancyInput):String!

    signinConsultancyUser(data:signinConsultancyUserInput!):Token
    signupConsultancyUser(data:signupConsultancyUserInput!):Token
    updateConsultancyUser(data:updateConsultancyUserInput):String!
`

const consultancyResolvers = {
    signupConsultancy: async (_, { data }) => {
        const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { cemail: data.cemail } })
        if (consultancy) throw new AuthenticationError("consultancy already exist with that email")
        const newConsultancy = await prisma.jmkconsulinfo.create({
            data: { ...data }
        })
        if (!newConsultancy) throw new AuthenticationError("Something went wrong !")
        const token = jwt.sign({ userId: newConsultancy.serial, role: ROLES[2] }, process.env.JWT_SECRET_KEY)
        // await sendMail(trainer.tr_email, 'Successfully Register ', registerrHTML)
        return { token };
    },
    signinConsultancy: async (_, { data }) => {
        const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { cemail: data.cemail } })
        if (!consultancy) throw new AuthenticationError("invalid credentials")
        const isMatch = data.cpassword == consultancy.cpassword;
        if (!isMatch) throw new AuthenticationError("invalid credentials")
        const token = jwt.sign({ userId: consultancy.serial, role: ROLES[2] }, process.env.JWT_SECRET_KEY)
        return { token };
    },
}

export { consultancyQueryTypesAndInputs, consultancyQuery, consultancyMutation, consultancyResolvers }