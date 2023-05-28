import { AuthenticationError, ForbiddenError } from 'apollo-server-express'
import prisma from '../../database.js'
import jwt from 'jsonwebtoken'
import { sendMail } from '../../utils/mailHandler.js'
import registerrHTML from '../../utils/signup.js'
import { ROLES } from '../../utils/helper.js'


const consultancyQueryTypesAndInputs = `
    type Consultancy {
        serial: String!
        cfname: String!
        cmname: String
        clname:String!
        oname:String!
        cemail: String!
        creg_date: Date
        acc_type: String!
    }

    type ConsultancyUser {
        serial: String!
        cufname: String!
        cumname: String
        culname: String!
        cu_role: String!
        cuemail: String!
        cupassword: String!
        cid: String!
    }

    type ConsultancyStudent {
        std_id: ID!
        std_fname: String!
        std_mname: String
        std_lname: String!
        std_email: String!
        std_pic: String
        crs_complete: Boolean
        crs_complete_date: Date
        std_mobile: String!
        std_join_dt: Date
        std_birth_dt: Date
        crs_type: String!
        crs_name: String!
        std_password: String!
        std_high_ql: String
        crs_id: String!
        std_status: String
        std_paidup: String
        std_due: String
        std_verifyed: Boolean!
        join_courses: [UserCourse]
     }

     type ConsultancyFaq {
        serial: Int!
        question: String!
        answer: String!
     }

     type ConsultancyAssignStudents {
        user_id:Int!
        serial:Int!
        std_id:Int!
        mktg_date:Date
        mktg_status:String
        std_status:Boolean!
     }

     type ConsultancyAssignDeveloper {
        user_id:Int!
        serial:Int!
        developer_id:Int!
        mktg_date:Date
        mktg_status:String
        dev_status:Boolean!
     }

     type AssignStudents {
        serial:Int!
        user_id:Int!
        std_name:String!
        std_email:String!
        std_verifyed:Boolean!
        std_id:Int!
        mktg_date:Date
        mktg_status:String
        std_status:Boolean!
     }

     type AssignDeveloper {
        user_id:Int!
        serial:Int!
        dev_name:String!
        dev_email:String!
        developer_type:String!
        developer_id:Int!
        mktg_date:Date
        mktg_status:String
        dev_status:Boolean!
     }

    input signinConsultancyInput{
        cemail: String!
        cpassword: String!
     }
     

     input signupConsultancyInput{
        cfname: String!
        cmname: String
        clname: String!
        oname:String!
        cemail: String!
        cpassword: String!
        acc_type:String
     }


     input updateConsultancyInput{
        serial: Int!
        cfname: String
        cmname: String
        clname: String
        cemail: String
        cpassword: String
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
        serial: Int
        cufname: String!
        cumname: String
        culname: String!
        cuemail: String!
        cupassword: String!
        cu_role:String
     }

     input consultancyFaqInput {
        serial: Int
        question: String!
        answer: String!
     }

     input assignStudentsToMarketersInput {
        user_id:Int!
        std_id:Int!
        mktg_date:Date
        mktg_status:String
        std_status:Boolean
     }


     input assignDeveloperToMarketersInput {
        user_id:Int!
        developer_id:Int!
        mktg_date:Date
        mktg_status:String
        dev_status:Boolean
     }

`

const consultancyQuery = `
    getConsultancy:Consultancy
    getConsultancyUsers:[ConsultancyUser]
    getConsultancyUser(serial:Int!):ConsultancyUser
    getConsultancyStudents:[ConsultancyStudent]
    getConsultancyStudent(std_id:Int!):ConsultancyStudent
    getConsultancyFaqs:[ConsultancyFaq]
    getConsultancyFaq(serial:Int!):ConsultancyFaq
    getConsultancyAssignStudents(std_id:Int!):[ConsultancyAssignStudents]

    getConsultancyDevelopers:[adminDeveloper]
    getConsultancyAssignDevelopers(developer_id:Int!):[ConsultancyAssignDeveloper]

    getConsultancyAssignStudentsByUserId(user_id:Int!):[AssignStudents]
    getConsultancyAssignDevelopersByUserId(user_id:Int!):[AssignDeveloper]

`

const consultancyMutation = `
    signinConsultancy(data:signinConsultancyInput!):Token
    signupConsultancy(data:signupConsultancyInput!):Token
    updateConsultancy(data:updateConsultancyInput):String!

    signinConsultancyUser(data:signinConsultancyUserInput!):Token
    signupConsultancyUser(data:signupConsultancyUserInput!):Token
    createConsultancyUser(data:updateConsultancyUserInput):String!
    updateConsultancyUser(data:updateConsultancyUserInput):String!
    deleteConsultancyUser(serial:Int!):String!

    createConsultancyFaq(data:consultancyFaqInput):String!
    updateConsultancyFaq(data:consultancyFaqInput):String!
    deleteConsultancyFaq(serial:Int!):String!

    assignStudentsToMarketers(data:assignStudentsToMarketersInput):String!
    removeStudentsFromMarketers(serial:Int!):String!

    assignDeveloperToMarketers(data:assignDeveloperToMarketersInput):String!
    removeDeveloperFromMarketers(serial:Int!):String!
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
        await sendMail(newConsultancy.cemail, 'Successfully Register ', registerrHTML)
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

    updateConsultancy: async (_, { data }, { userId, role }) => {
        if (!userId) throw new AuthenticationError("Invalid Token!!")
        if (role === ROLES[2]) {
            const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
            if (!consultancy) throw new AuthenticationError("Invalid Credentials")
            const consultancyUpate = await prisma.jmkconsulinfo.update({
                data: { ...data, },
                where: { serial: data.serial }
            })
            if (!consultancyUpate) throw new AuthenticationError("Invalid !!")
            return "success"
        }
        throw new AuthenticationError("invalid access !!")
    },

    createConsultancyUser: async (_, { data }, { userId, role }) => {
        if (role === ROLES[2]) {
            const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
            if (!consultancy) throw new AuthenticationError("invalid credentials")
            const usr = await prisma.jmkconsuluserinfo.findFirst({
                where: {
                    cuemail: data.cuemail,
                    cid: userId
                }
            })
            if (usr) throw new AuthenticationError("Email is already register !!")
            const user = await prisma.jmkconsuluserinfo.create({
                data: {
                    ...data,
                    cid: userId
                },
            })
            if (!user) throw new AuthenticationError("invalid !!")
            return "success"
        }

        throw new AuthenticationError("invalid access !!")
    },
    updateConsultancyUser: async (_, { data }, { userId, role }) => {
        if (role === ROLES[2]) {
            const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
            if (!consultancy) throw new AuthenticationError("invalid credentials")
            const usr = await prisma.jmkconsuluserinfo.findFirst({
                where: {
                    serial: data.serial,
                    cid: userId
                }
            })
            if (!usr) throw new AuthenticationError("invalid access !!")
            const updateUser = await prisma.jmkconsuluserinfo.update({
                data: {
                    ...data,
                    cid: userId
                },
                where: {
                    serial: data.serial
                }
            })
            if (!updateUser) throw new AuthenticationError("invalid !!")
            return "success"
        }

        throw new AuthenticationError("invalid access !!")
    },

    deleteConsultancyUser: async (_, { serial }, { userId, role }) => {
        if (role === ROLES[2]) {
            const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
            if (!consultancy) throw new AuthenticationError("invalid credentials")
            const usr = await prisma.jmkconsuluserinfo.findFirst({ where: { serial: serial, cid: userId } })
            if (!usr) throw new AuthenticationError("invalid access !!")
            const user = await prisma.jmkconsuluserinfo.delete({ where: { serial: serial } })
            if (!user) throw new AuthenticationError("invalid !!")
            return "success"
        }

        throw new AuthenticationError("invalid access !!")
    },

    createConsultancyFaq: async (_, { data }, { userId, role }) => {
        if (role === ROLES[2]) {
            const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
            if (!consultancy) throw new AuthenticationError("invalid credentials")
            const faq = await prisma.jmkconsulfaq.create({
                data: {
                    ...data,
                    cid: userId
                },
            })
            if (!faq) throw new AuthenticationError("invalid !!")
            return "success"
        }

        throw new AuthenticationError("invalid access !!")
    },

    updateConsultancyFaq: async (_, { data }, { userId, role }) => {
        if (role === ROLES[2]) {
            const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
            if (!consultancy) throw new AuthenticationError("invalid credentials")
            const faq = await prisma.jmkconsulfaq.findFirst({
                where: {
                    serial: data.serial,
                    cid: userId
                }
            })
            if (!faq) throw new AuthenticationError("invalid access !!")
            const updateFaq = await prisma.jmkconsulfaq.update({
                data: {
                    ...data,
                    cid: userId
                },
                where: {
                    serial: data.serial
                }
            })
            if (!updateFaq) throw new AuthenticationError("invalid !!")
            return "success"
        }

        throw new AuthenticationError("invalid access !!")
    },

    deleteConsultancyFaq: async (_, { serial }, { userId, role }) => {
        if (role === ROLES[2]) {
            const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
            if (!consultancy) throw new AuthenticationError("invalid credentials")
            const faq = await prisma.jmkconsulfaq.findFirst({ where: { serial: serial, cid: userId } })
            if (!faq) throw new AuthenticationError("invalid access !!")
            const deleteFaq = await prisma.jmkconsulfaq.delete({ where: { serial: serial } })
            if (!deleteFaq) throw new AuthenticationError("invalid !!")
            return "success"
        }

        throw new AuthenticationError("invalid access !!")
    },

    assignStudentsToMarketers: async (_, { data }, { userId, role }) => {
        if (!userId) throw new ForbiddenError('invalid token');
        const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
        if (!consultancy) throw new AuthenticationError("invalid consultancy credentials")
        if (role === ROLES[2]) {
            const check = await prisma.jmkmktgstd.findFirst({ where: { std_id: data.std_id, user_id: data.user_id } })
            if (check) throw new AuthenticationError("Already assign !!")
            const assignStd = await prisma.jmkmktgstd.create({ data: { ...data } })
            if (!assignStd) throw new AuthenticationError("invalid !!")
            return 'success';
        }
    },

    removeStudentsFromMarketers: async (_, args, { userId, role }) => {
        if (!userId) throw new ForbiddenError('invalid token');
        const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
        if (!consultancy) throw new AuthenticationError("invalid consultancy credentials")
        if (role === ROLES[2]) {
            const assignStd = await prisma.jmkmktgstd.delete({ where: { serial: args.serial } })
            if (!assignStd) throw new AuthenticationError("invalid !!")
            return 'success';
        }
    },

    assignDeveloperToMarketers: async (_, { data }, { userId, role }) => {
        if (!userId) throw new ForbiddenError('invalid token');
        const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
        if (!consultancy) throw new AuthenticationError("invalid consultancy credentials")
        if (role === ROLES[2]) {
            const check = await prisma.jmkmktgdev.findFirst({ where: { developer_id: data.developer_id, user_id: data.user_id } })
            if (check) throw new AuthenticationError("Already assign !!")
            const assignDev = await prisma.jmkmktgdev.create({ data: { ...data } })
            if (!assignDev) throw new AuthenticationError("invalid !!")
            return 'success';
        }
    },

    removeDeveloperFromMarketers: async (_, args, { userId, role }) => {
        if (!userId) throw new ForbiddenError('invalid token');
        const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
        if (!consultancy) throw new AuthenticationError("invalid consultancy credentials")
        if (role === ROLES[2]) {
            const assignDev = await prisma.jmkmktgdev.delete({ where: { serial: args.serial } })
            if (!assignDev) throw new AuthenticationError("invalid !!")
            return 'success';
        }
    },
}

const consultancyResolversQuery = {
    getConsultancy: async (_, args, { userId, role }) => {
        if (!userId) throw new AuthenticationError("invalid token")
        if (role === ROLES[2]) {
            const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
            if (!consultancy) throw new AuthenticationError("invalid")
            return consultancy;
        }
        throw new AuthenticationError("invalid acccess")
    },

    getConsultancyUsers: async (_, args, { userId, role }) => {
        if (!userId) throw new AuthenticationError("invalid token")
        if (role === ROLES[2]) {
            const users = await prisma.jmkconsuluserinfo.findMany({ where: { cid: userId } })
            if (!users) throw new AuthenticationError("invalid")
            return users;
        }
        throw new AuthenticationError("invalid acccess")
    },

    getConsultancyUser: async (_, args, { userId, role }) => {
        if (!userId) throw new AuthenticationError("invalid token")
        if (role === ROLES[2]) {
            const user = await prisma.jmkconsuluserinfo.findFirst({ where: { serial: args.serial } })
            if (!user) throw new AuthenticationError("invalid")
            return user;
        }
        throw new AuthenticationError("invalid acccess")
    },

    getConsultancyStudents: async (_, args, { userId, role }) => {
        if (!userId) throw new ForbiddenError('invalid token');
        const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
        if (!consultancy) throw new AuthenticationError("invalid consultancy credentials")
        if (role === ROLES[2]) {
            let students = [];
            const student = await prisma.jmkstdinfo.findMany({ where: { cid: userId } })
            for (let index = 0; index < student.length; index++) {
                const course = await prisma.jmkcrsinfo.findFirst({ where: { crs_id: student[index].crs_id } })
                if (course) {
                    students.push({ ...student[index], crs_type: course.crs_type, crs_name: course.crs_name })
                }
            }
            return students;
        }
    },

    getConsultancyStudent: async (_, args, { userId, role }) => {
        if (!userId) throw new ForbiddenError('invalid token');
        const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
        if (!consultancy) throw new AuthenticationError("invalid consultancy credentials")
        if (role === ROLES[2]) {
            const student = await prisma.jmkstdinfo.findFirst({ where: { std_id: args.std_id, cid: userId } })
            if (!student) throw new AuthenticationError("invalid access")
            const course = await prisma.jmkcrsinfo.findFirst({ where: { crs_id: student.crs_id } })
            const join_courses = []
            const joinCourses = await prisma.jmkstdcrsinfo.findMany({ where: { std_id: student.std_id } })
            for (let index = 0; index < joinCourses.length; index++) {
                const course = await prisma.jmkcrsinfo.findFirst({ where: { crs_id: joinCourses[index].crs_id } })
                join_courses.push({ ...joinCourses[index], crs_name: course.crs_name, crs_rate: course.crs_rate })
            }
            if (course) {
                const mergestudent = { ...student, crs_type: course.crs_type, crs_name: course.crs_name, join_courses }
                return mergestudent;
            }
        }
        throw new AuthenticationError("invalid access")
    },

    getConsultancyFaqs: async (_, args, { userId, role }) => {
        if (!userId) throw new ForbiddenError('invalid token');
        const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
        if (!consultancy) throw new AuthenticationError("invalid consultancy credentials")
        if (role === ROLES[2]) {
            const faqs = await prisma.jmkconsulfaq.findMany({ where: { cid: userId } })
            return faqs;
        }
    },

    getConsultancyFaq: async (_, args, { userId, role }) => {
        if (!userId) throw new ForbiddenError('invalid token');
        const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
        if (!consultancy) throw new AuthenticationError("invalid consultancy credentials")
        if (role === ROLES[2]) {
            const faqs = await prisma.jmkconsulfaq.findFirst({ where: { cid: userId, serial: args.serial } })
            return faqs;
        }
    },

    getConsultancyAssignStudents: async (_, args, { userId, role }) => {
        if (!userId) throw new ForbiddenError('invalid token');
        const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
        if (!consultancy) throw new AuthenticationError("invalid consultancy credentials")
        if (role === ROLES[2]) {
            const assignStd = await prisma.jmkmktgstd.findMany({ where: { std_id: args.std_id } })
            return assignStd;
        }
    },

    getConsultancyDevelopers: async (_, args, { userId, role }) => {
        if (!userId) throw new ForbiddenError('invalid token');
        const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
        if (!consultancy) throw new AuthenticationError("invalid consultancy credentials")
        if (role === ROLES[2]) {
            const developers = await prisma.jmkdevinfo.findMany({ where: { cid: userId } })
            return developers;
        }
    },

    getConsultancyAssignDevelopers: async (_, args, { userId, role }) => {
        if (!userId) throw new ForbiddenError('invalid token');
        const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
        if (!consultancy) throw new AuthenticationError("invalid consultancy credentials")
        if (role === ROLES[2]) {
            const assignDev = await prisma.jmkmktgdev.findMany({ where: { developer_id: args.developerId } })
            return assignDev;
        }
        throw new AuthenticationError("invalid credentials !")
    },

    getConsultancyAssignStudentsByUserId: async (_, args, { userId, role }) => {
        if (!userId) throw new ForbiddenError('invalid token');
        const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
        if (!consultancy) throw new AuthenticationError("invalid consultancy credentials")
        if (role === ROLES[2]) {
            const students = [];
            const assignStd = await prisma.jmkmktgstd.findMany({ where: { user_id: args.user_id } })
            for (let index = 0; index < assignStd.length; index++) {
                const std = await prisma.jmkstdinfo.findFirst({ where: { std_id: assignStd[index].std_id } })
                students.push({
                    ...assignStd[index],
                    std_name: std.std_fname + ' ' + std.std_mname + ' ' + std.std_fname,
                    std_email: std.std_email,
                    std_verifyed: std.std_verifyed
                })
            }
            return students;
        }
        throw new AuthenticationError("invalid credentials !")
    },

    getConsultancyAssignDevelopersByUserId: async (_, args, { userId, role }) => {
        if (!userId) throw new ForbiddenError('invalid token');
        const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
        if (!consultancy) throw new AuthenticationError("invalid consultancy credentials")
        if (role === ROLES[2]) {
            const developers = [];
            const assignDev = await prisma.jmkmktgdev.findMany({ where: { user_id: args.user_id } })
            for (let index = 0; index < assignDev.length; index++) {
                const dev = await prisma.jmkdevinfo.findFirst({ where: { developer_id: assignDev[index].developer_id } })
                developers.push({
                    ...assignDev[index],
                    dev_name: dev.developer_fname + ' ' + dev.developer_mname + ' ' + dev.developer_lname,
                    dev_email: dev.developer_email,
                    developer_type: dev.developer_type
                })
            }
            return developers;
        }
        throw new AuthenticationError("invalid credentials !")
    },


}

export { consultancyQueryTypesAndInputs, consultancyQuery, consultancyMutation, consultancyResolvers, consultancyResolversQuery }
