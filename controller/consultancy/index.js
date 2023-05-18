import prisma from "../../database.js"


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
        std_fname: String!
        std_mname: String
        std_lname: String!
        std_mobile: String!
        std_email: String!
        std_password: String!
        std_birth_dt: Date
        std_remark:String
        crs_id:Int!,
        crs_ecp_st_d:Date!
     }

     input signupConsultancyInput{
        std_fname: String!
     }


     input updateConsultancyInput{
        std_fname: String!
     }


     input signinConsultancyUserInput{
        std_fname: String!
     }

     input signupConsultancyUserInput{
        std_fname: String!
     }


     input updateConsultancyUserInput{
        std_fname: String!
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

const resolvers = {
    signupConsultancy: async (_, { data }) => {
        const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { cemail: data.cemail } })
        if (consultancy) throw new AuthenticationError("consultancy already exist with that email")
        const newConsultancy = await prisma.jmkconsulinfo.create({
            data: { ...data }
        })
        if(!newConsultancy) throw new AuthenticationError("Something went wrong !")
        const token = jwt.sign({ userId: newConsultancy.serial, role: ROLES[2] }, process.env.JWT_SECRET_KEY)
        // await sendMail(trainer.tr_email, 'Successfully Register ', registerrHTML)
        return { token };
    },
}

export { consultancyQueryTypesAndInputs, consultancyQuery, consultancyMutation, resolvers }