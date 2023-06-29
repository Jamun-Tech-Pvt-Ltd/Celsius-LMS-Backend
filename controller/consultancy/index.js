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
        cpassword: String!
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

     type totalCount{
        name:String
        count:Int
        link:String
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

     type schoolStudentFee {
        fee_id:Int!
        crs_id:Int!
        fee_desc:String
        fee_type:String
        fee_amount:Int
     }

     type studentFee {
        serial:Int!
        fee_id: Int
        fee_amount: Int
        fee_dis: Int
        net_fee: Int
     }

     type studentBill {
        bill_id:Int!
        bill_amt:Int!
        dis_amt:Int!
        net_amt:Int!
        amount_paid:Int!
        due_amt:Int!
        std_id:Int!
        bill_dt:Date!
     }


     type studentFeeSec {
        serial:Int!
        fee_id:Int!
        fee_discount_per:Int!
        std_id:Int!
     }

     type courseSubject {
        subject_id:Int!
        subject_code:String
        crs_id:Int
        subject_desc:String
        subject_full_m:Int
        subject_pass_m:Int
        subject_theory_m:Int
        subject_practical_m:Int
        subject_type:String
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
        oname:String
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


     input schoolStudentFeeInput {
        fee_id: Int
        crs_id: Int!
        fee_desc: String
        fee_type: String
        fee_amount: Int
     }

     input admitStudentInput {
        bill_amt:Int!
        dis_amt:Int!
        net_amt:Int!
        amount_paid:Int!
        due_amt:Int!
        std_id:Int!
        descount:[admitStudentDes]
     }

     input updateAdmitStudentInput {
        bill_id: Int!
        bill_amt:Int!
        dis_amt:Int!
        net_amt:Int!
        amount_paid:Int!
        due_amt:Int!
        std_id:Int!
        descount:[admitStudentDes]
     }

     input admitStudentDes {
        id:Int!
        descount:Int!
     }

     input stdFeeDecInput {
        serial:Int
        fee_id:Int!
        fee_discount_per:Int!
        std_id:Int!
     }


    input courseSubjectInput {
        subject_id:Int
        subject_code:String
        crs_id:Int
        subject_desc:String
        subject_full_m:Int
        subject_pass_m:Int
        subject_theory_m:Int
        subject_practical_m:Int
        subject_type:String
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

    getConsultancyAssignStudentsByUserAndStudentId(user_id:Int! std_id:Int!):ConsultancyAssignStudents!
    getConsultancyAssignStudentsByUserAndDeveloperId(user_id:Int! dev_id:Int!):ConsultancyAssignDeveloper

    getDataCountForAllTableInConsultancy:[totalCount]

    getSchoolFees:[schoolStudentFee]
    getSchoolFeeById(fee_id:Int!):schoolStudentFee


    getSchoolFeeByCrsId(std_id:Int!):[schoolStudentFee]

    getStudentFee(std_id:Int!):[studentFee]
    getStudentFeeBill(std_id:Int!):[studentBill]

    getStudentFeeDes(std_id:Int!):[studentFeeSec]

    getSubByCourseId(crs_id:Int!):[courseSubject]

`



const consultancyMutation = `
    signinConsultancy(data:signinConsultancyInput!):Token
    signupConsultancy(data:signupConsultancyInput!):Token
    updateConsultancy(data:updateConsultancyInput):Consultancy!

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

    updateAssignStudentDetails(data:assignStudentsToMarketersInput):String!
    updateAssignDeveloperDetails(data:assignDeveloperToMarketersInput):String!


    createSchoolFees(data:schoolStudentFeeInput):String!
    updateSchoolFees(data:schoolStudentFeeInput):String!
    deleteSchoolFees(fee_id:Int!):String!

    admitStudent(data:admitStudentInput):String!

    updateAdmitStudent(data:updateAdmitStudentInput):String!

    createStudentFeeDes(data:stdFeeDecInput):String!
    updateStudentFeeDes(data:stdFeeDecInput):String!
    deleteStudentFeeDes(serial:Int!):String!

    createCourseSub(data:courseSubjectInput):String!
    updateCourseSub(data:courseSubjectInput):String!
    deleteeCourseSub(subject_id:Int!):String!
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
        await sendMail(trainer.tr_email, 'Successfully Register ', registerrHTML)
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
            return consultancyUpate
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

    updateAssignStudentDetails: async (_, { data }, { userId, role }) => {
        if (!userId) throw new ForbiddenError('invalid token');
        const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
        if (!consultancy) throw new AuthenticationError("invalid consultancy credentials")
        if (role === ROLES[2]) {
            const assignStd = await prisma.jmkmktgstd.findFirst({ where: { user_id: data.user_id, std_id: data.std_id } })
            if (!assignStd) throw new AuthenticationError("no such data availbale !!")
            const updateStd = await prisma.jmkmktgstd.update({
                data: { ...data },
                where: { serial: assignStd.serial }
            })
            if (!updateStd) throw new AuthenticationError("invalid query")
            return 'success';
        }
    },

    updateAssignDeveloperDetails: async (_, { data }, { userId, role }) => {
        if (!userId) throw new ForbiddenError('invalid token');
        const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
        if (!consultancy) throw new AuthenticationError("invalid consultancy credentials")
        if (role === ROLES[2]) {
            const assignDev = await prisma.jmkmktgdev.findFirst({ where: { user_id: data.user_id, developer_id: data.developer_id } })
            if (!assignDev) throw new AuthenticationError("no such data availbale !!")
            const updateDev = await prisma.jmkmktgdev.update({
                data: { ...data },
                where: { serial: assignDev.serial }
            })
            if (!updateDev) throw new AuthenticationError("invalid query")
            return 'success';
        }
    },

    createSchoolFees: async (_, { data }, { userId, role }) => {
        if (userId) {
            const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
            if (role === ROLES[2] && consultancy.acc_type !== "Consultancy")
                if (!consultancy) throw new AuthenticationError("invalid credentials")
            const fee = await prisma.jmkfeemstr.create({
                data: {
                    ...data,
                    cid: userId
                },
            })
            if (!fee) throw new AuthenticationError("invalid !!")
            return "success"
        }

        throw new AuthenticationError("invalid access !!")
    },

    updateSchoolFees: async (_, { data }, { userId, role }) => {
        if (userId) {
            const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
            if (role === ROLES[2] && consultancy.acc_type !== "Consultancy")
                if (!consultancy) throw new AuthenticationError("invalid credentials")
            const fee = await prisma.jmkfeemstr.update({
                data: { ...data },
                where: { fee_id: data.fee_id }
            })
            if (!fee) throw new AuthenticationError("invalid !!")
            return "success"
        }

        throw new AuthenticationError("invalid access !!")
    },

    deleteSchoolFees: async (_, arg, { userId, role }) => {
        if (userId) {
            const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
            if (role === ROLES[2] && consultancy.acc_type !== "Consultancy");
            const fee = await prisma.jmkfeemstr.delete({ where: { fee_id: arg.fee_id } })
            if (!fee) throw new AuthenticationError("invalid !!")
            return "success"
        }

        throw new AuthenticationError("invalid access !!")
    },

    admitStudent: async (_, { data }, { userId, role }) => {
        if (userId) {
            const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
            if (role === ROLES[2] && consultancy.acc_type !== "Consultancy");
            if (!consultancy) throw new AuthenticationError("invalid credentials");
            const std = await prisma.jmkstdinfo.findFirst({ where: { std_id: data.std_id } })
            if (!std) throw new AuthenticationError("invalid !!")
            const admit = await prisma.jmkstdbillmstr.findFirst({ where: { std_id: std.std_id } })
            if (admit) throw new AuthenticationError("already admit this student !!")
            const bill = await prisma.jmkstdbillmstr.create({
                data: {
                    bill_amt: data.bill_amt,
                    dis_amt: data.dis_amt,
                    net_amt: data.net_amt,
                    amount_paid: data.amount_paid,
                    due_amt: data.due_amt,
                    std_id: data.std_id,
                },
            })
            const stdBill = await prisma.jmkfeemstr.findMany({ where: { crs_id: std.crs_id } })
            for (let index = 0; index < stdBill.length; index++) {
                const desc = data.descount.find(item => item.id === stdBill[index].fee_id)
                if (desc) {
                    await prisma.jmkstdbilldet.create({
                        data: {
                            bill_id: bill.bill_id,
                            fee_id: stdBill[index].fee_id,
                            fee_amount: stdBill[index].fee_amount,
                            fee_dis: desc.descount,
                            net_fee: stdBill[index].fee_amount - Math.round((stdBill[index].fee_amount / 100) * desc.descount)
                        }
                    })
                }

            }
            if (!bill) throw new AuthenticationError("invalid !!")
            return "success"
        }
        throw new AuthenticationError("invalid access !!")
    },

    updateAdmitStudent: async (_, { data }, { userId, role }) => {
        if (userId) {
            const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
            if (role === ROLES[2] && consultancy.acc_type !== "Consultancy");
            if (!consultancy) throw new AuthenticationError("invalid credentials");
            const std = await prisma.jmkstdinfo.findFirst({ where: { std_id: data.std_id } })
            if (!std) throw new AuthenticationError("invalid !!")
            const bill = await prisma.jmkstdbillmstr.update({
                data: {
                    bill_amt: data.bill_amt,
                    dis_amt: data.dis_amt,
                    net_amt: data.net_amt,
                    amount_paid: data.amount_paid,
                    due_amt: data.due_amt,
                    std_id: data.std_id,
                },
                where: { bill_id: data.bill_id }
            })

            await prisma.jmkstdbilldet.deleteMany({ where: { bill_id: bill.bill_id } })
            const stdBill = await prisma.jmkfeemstr.findMany({ where: { crs_id: std.crs_id } })
            for (let index = 0; index < stdBill.length; index++) {
                const desc = data.descount.find(item => item.id === stdBill[index].fee_id)
                if (desc) {
                    await prisma.jmkstdbilldet.create({
                        data: {
                            bill_id: bill.bill_id,
                            fee_id: stdBill[index].fee_id,
                            fee_amount: stdBill[index].fee_amount,
                            fee_dis: desc.descount,
                            net_fee: stdBill[index].fee_amount - Math.round((stdBill[index].fee_amount / 100) * desc.descount)
                        },
                    })
                }

            }
            if (!bill) throw new AuthenticationError("invalid !!")
            return "success"
        }
        throw new AuthenticationError("invalid access !!")
    },

    createStudentFeeDes: async (_, { data }, { userId, role }) => {
        if (userId) {
            const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
            if (role === ROLES[2] && consultancy.acc_type !== "Consultancy") {
                if (!consultancy) throw new AuthenticationError("invalid credentials")
                const dec = await prisma.jmkstdfeediscount.create({
                    data: {
                        ...data,
                    },
                })
                if (!dec) throw new AuthenticationError("invalid !!")
                return "success"
            }
            throw new AuthenticationError("invalid access !!")

        }
        throw new AuthenticationError("invalid access !!")
    },

    updateStudentFeeDes: async (_, { data }, { userId, role }) => {
        if (userId) {
            const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
            if (role === ROLES[2] && consultancy.acc_type !== "Consultancy") {
                if (!consultancy) throw new AuthenticationError("invalid credentials")
                const dec = await prisma.jmkstdfeediscount.update({
                    data: {
                        ...data,
                    },
                    where: { serial: data.serial }
                })
                if (!dec) throw new AuthenticationError("invalid !!")
                return "success"
            }
            throw new AuthenticationError("invalid access !!")
        }
        throw new AuthenticationError("invalid access !!")
    },

    deleteStudentFeeDes: async (_, { serial }, { userId, role }) => {
        if (userId) {
            const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
            if (role === ROLES[2] && consultancy.acc_type !== "Consultancy") {
                if (!consultancy) throw new AuthenticationError("invalid credentials")
                const dec = await prisma.jmkstdfeediscount.delete({
                    where: { serial: serial }
                })
                if (!dec) throw new AuthenticationError("invalid !!")
                return "success"
            }
            throw new AuthenticationError("invalid access !!")
        }
        throw new AuthenticationError("invalid access !!")
    },

    createCourseSub: async (_, { data }, { userId, role }) => {
        if (userId) {
            const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
            if (role === ROLES[2] && consultancy.acc_type !== "Consultancy") {
                if (!consultancy) throw new AuthenticationError("invalid credentials")
                const crs = await prisma.jmkcrsinfo.findFirst({ where: { crs_id: data.crs_id } })
                if (!crs) throw new AuthenticationError("invalid course id")
                const oldSub = await prisma.jmksubjectmaster.findFirst({ where: { crs_id: data.crs_id, subject_code: data.subject_code } })
                if (oldSub) throw new AuthenticationError("Alreay exist")
                const sub = await prisma.jmksubjectmaster.create({
                    data: {
                        ...data,
                    },
                })
                if (!sub) throw new AuthenticationError("invalid !!")
                return "success"
            }
            throw new AuthenticationError("invalid access !!")

        }
        throw new AuthenticationError("invalid access !!")
    },

    updateCourseSub: async (_, { data }, { userId, role }) => {
        if (userId) {
            const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
            if (role === ROLES[2] && consultancy.acc_type !== "Consultancy") {
                if (!consultancy) throw new AuthenticationError("invalid credentials")
                const crs = await prisma.jmkcrsinfo.findFirst({ where: { crs_id: data.crs_id } })
                if (!crs) throw new AuthenticationError("invalid course id")
                const sub = await prisma.jmksubjectmaster.update({
                    data: {
                        ...data,
                    },
                    where: { subject_id: data.subject_id }
                })
                if (!sub) throw new AuthenticationError("invalid !!")
                return "success"
            }
            throw new AuthenticationError("invalid access !!")

        }
        throw new AuthenticationError("invalid access !!")
    },

    deleteeCourseSub: async (_, { subject_id }, { userId, role }) => {
        if (userId) {
            const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
            if (role === ROLES[2] && consultancy.acc_type !== "Consultancy") {
                if (!consultancy) throw new AuthenticationError("invalid credentials")
                const sub = await prisma.jmksubjectmaster.delete({
                    where: { subject_id: subject_id }
                })
                if (!sub) throw new AuthenticationError("invalid !!")
                return "success"
            }
            throw new AuthenticationError("invalid access !!")
        }
        throw new AuthenticationError("invalid access !!")
    },
}


const consultancyResolversQuery = {

    getDataCountForAllTableInConsultancy: async (_, args, { userId, role }) => {
        if (!userId) throw new ForbiddenError('invalid token');
        const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
        if (!consultancy) throw new AuthenticationError("invalid consultancy credentials")

        const courses = await prisma.jmkcrsinfo.count({ where: { cid: userId } })
        const students = await prisma.jmkstdinfo.count({ where: { cid: userId } })
        const developers = await prisma.jmkdevinfo.count({ where: { cid: userId } })
        const users = await prisma.jmkconsuluserinfo.count({ where: { cid: userId } })
        const faqs = await prisma.jmkconsulfaq.count({ where: { cid: userId } })

        const tableCount = [
            {
                name: consultancy.acc_type === 'Consultancy' ? 'Courses' : "Class",
                count: courses,
                link: '/courses'
            },
            {
                name: 'Students',
                count: students,
                link: '/students'
            },
            {
                name: consultancy.acc_type === 'Consultancy' ? 'Developers' : 'Teachers',
                count: developers,
                link: '/developers'
            },
            {
                name: 'Users',
                count: users,
                link: '/users'
            },
            {
                name: 'Faqs',
                count: faqs,
                link: '/faqs'
            },
        ]
        if (consultancy.acc_type !== 'Consultancy') {
            const newTableCount = tableCount.filter(item => item.name !== 'Faqs')
            return newTableCount
        }
        return tableCount
    },
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

    getConsultancyAssignStudentsByUserAndStudentId: async (_, args, { userId, role }) => {
        if (!userId) throw new ForbiddenError('invalid token');
        const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
        if (!consultancy) throw new AuthenticationError("invalid consultancy credentials")
        if (role === ROLES[2]) {
            const assignStd = await prisma.jmkmktgstd.findFirst({ where: { user_id: args.user_id, std_id: args.std_id } })
            if (!assignStd) throw new AuthenticationError("Data Not Found !")
            return assignStd;
        }
        throw new AuthenticationError("invalid credentials !")
    },

    getConsultancyAssignStudentsByUserAndDeveloperId: async (_, args, { userId, role }) => {
        if (!userId) throw new ForbiddenError('invalid token');
        const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
        if (!consultancy) throw new AuthenticationError("invalid consultancy credentials")
        if (role === ROLES[2]) {
            const assignDev = await prisma.jmkmktgdev.findFirst({ where: { user_id: args.user_id, developer_id: args.dev_id } })
            if (!assignDev) throw new AuthenticationError("Data not found !!")
            return assignDev;
        }
        throw new AuthenticationError("invalid credentials !")
    },

    getSchoolFees: async (_, args, { userId, role }) => {
        if (!userId) throw new ForbiddenError('invalid token');
        const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
        if (!consultancy) throw new AuthenticationError("invalid consultancy credentials")
        if (role === ROLES[2] && consultancy.acc_type !== 'Consultancy') {
            const studentsFees = await prisma.jmkfeemstr.findMany({ where: { cid: userId } })
            if (!studentsFees) throw new AuthenticationError("Data not found !!")
            return studentsFees;
        }
        throw new AuthenticationError("invalid credentials !")
    },

    getSchoolFeeByCrsId: async (_, args, { userId, role }) => {
        if (!userId) throw new ForbiddenError('invalid token');
        const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
        if (!consultancy) throw new AuthenticationError("invalid consultancy credentials")
        if (role === ROLES[2] && consultancy.acc_type !== 'Consultancy') {
            const std = await prisma.jmkstdinfo.findFirst({ where: { std_id: args.std_id, cid: userId } })
            const studentsFees = await prisma.jmkfeemstr.findMany({ where: { cid: userId, crs_id: std.crs_id } })
            if (!studentsFees) throw new AuthenticationError("Data not found !!")
            return studentsFees;
        }
        throw new AuthenticationError("invalid credentials !")
    },

    getSchoolFeeById: async (_, args, { userId, role }) => {
        if (!userId) throw new ForbiddenError('invalid token');
        const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
        if (!consultancy) throw new AuthenticationError("invalid consultancy credentials")
        if (role === ROLES[2] && consultancy.acc_type !== 'Consultancy') {
            const fee = await prisma.jmkfeemstr.findFirst({ where: { fee_id: args.fee_id, cid: userId } })
            if (!fee) throw new AuthenticationError("Data not found !!")
            return fee;
        }
        throw new AuthenticationError("invalid credentials !")
    },

    getStudentFeeBill: async (_, args, { userId, role }) => {
        if (!userId) throw new ForbiddenError('invalid token');
        const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
        if (!consultancy) throw new AuthenticationError("invalid credentials")
        if (role === ROLES[2] && consultancy.acc_type !== 'Consultancy') {
            const bill = await prisma.jmkstdbillmstr.findMany({ where: { std_id: args.std_id } })
            if (!bill) throw new AuthenticationError("Data not found !!")
            return bill;
        }
        throw new AuthenticationError("invalid credentials !")
    },


    getStudentFee: async (_, args, { userId, role }) => {
        if (!userId) throw new ForbiddenError('invalid token');
        const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
        if (!consultancy) throw new AuthenticationError("invalid credentials")
        if (role === ROLES[2] && consultancy.acc_type !== 'Consultancy') {
            const bill = await prisma.jmkstdbillmstr.findMany({ where: { std_id: args.std_id } })
            const fee = await prisma.jmkstdbilldet.findMany({ where: { bill_id: bill[0].bill_id } })
            if (!fee) throw new AuthenticationError("Data not found !!")
            return fee;
        }
        throw new AuthenticationError("invalid credentials !")
    },

    getStudentFeeDes: async (_, args, { userId, role }) => {
        if (!userId) throw new ForbiddenError('invalid token');
        const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
        if (!consultancy) throw new AuthenticationError("invalid credentials")
        if (role === ROLES[2] && consultancy.acc_type !== 'Consultancy') {
            const dec = await prisma.jmkstdfeediscount.findMany({ where: { std_id: args.std_id } })
            if (!dec) throw new AuthenticationError("Data not found !!")
            return dec;
        }
        throw new AuthenticationError("invalid credentials !")
    },

    getSubByCourseId: async (_, args, { userId, role }) => {
        if (!userId) throw new ForbiddenError('invalid token');
        const consultancy = await prisma.jmkconsulinfo.findFirst({ where: { serial: userId } })
        if (!consultancy) throw new AuthenticationError("invalid consultancy credentials")
        if (role === ROLES[2] && consultancy.acc_type !== 'Consultancy') {
            const sub = await prisma.jmksubjectmaster.findMany({ where: { crs_id: args.crs_id } })
            if (!sub) throw new AuthenticationError("Data not found !!")
            return sub;
        }
        throw new AuthenticationError("invalid credentials !")
    },


}

export { consultancyQueryTypesAndInputs, consultancyQuery, consultancyMutation, consultancyResolvers, consultancyResolversQuery }
