import { AuthenticationError, ForbiddenError } from 'apollo-server-express'
import prisma from '../../database.js'
import { sendMail } from '../../utils/mailHandler.js'
import saaSRequsteEmailHTML from '../../utils/SaaSRequsteEmail.js'
import saaSRequsteConfirmEmailHTML from '../../utils/SaaSRequsteConfirmEmail.js'
import { DefaultUserAccess, generatePasswordFromUsername } from '../../utils/helper.js'

const companyQueryTypesAndInputs = `
    type Company {
        serial:Int!
        c_name: String!
        c_email: String!
        c_username:String!
        c_country: String!
        c_package:Package!
        c_package_type:PackageType!
        c_bussiness_type:String!
        created_at:Date!
        c_verified:Boolean
        c_storage: Float!
        payments:[CompanyPayment]
        totalAdmins:Int
        totalTrainer:Int
        totalStudents:Int
        totalCourses:Int
        files:[companyFiles]
    }

 
   type companyFiles {
        content_id: Int!
        title: String!
        type: String!
        video_url: String
        file_size: Float
        project_url: String
    }

    type CompanyPayment {
        pay_id: Int!
        start_date: Date!
        end_date: Date!
        pay_amount: Int!
        transaction: String!
        users: Int!
        storage: Float!
        company: Company!
    }

     input signupCompanyInput{
        c_name: String!
        c_email: String!
        c_username:String! 
        c_country: String!
        c_package:Package!
        c_package_type:PackageType!
        c_bussiness_type:String!
     }

     input updateCompanyInput{
        serial: Int!
        c_name: String
        c_email: String
        c_country: String
        c_verified:Boolean
        c_phone:String
        c_address:String
        c_taxid:String
     }

`
const companyQuery = `
    getCompany(serial:Int!):Company
    getCompanyList:[Company]
`

const companyMutation = `
    signupCompany(data:signupCompanyInput!):String!
    updateCompany(data:updateCompanyInput):Company!
`

const companyResolvers = {
    signupCompany: async (_, { data }) => {
        const company = await prisma.jmkcompany.findFirst({ where: { c_email: data.c_email, c_username: data.c_username } })
        if (company) throw new AuthenticationError("company already exist with that email and username")
        const newCompany = await prisma.jmkcompany.create({
            data: { ...data }
        });
        if (!newCompany) throw new AuthenticationError("Something went wrong !");
        await sendMail(newCompany.c_email, 'Successfully Requested ', saaSRequsteEmailHTML(newCompany.c_name, newCompany.c_email, newCompany.c_package, newCompany.c_package_type));
        return 'success';
    },

    updateCompany: async (_, { data }, { userId, role, platform }) => {
        if (!userId) throw new AuthenticationError("Invalid Token!!");
        if (platform === 'internal' && role === 'admin') {
            const company = await prisma.jmkcompany.findFirst({ where: { serial: data.serial } });
            if (!company) throw new AuthenticationError("Invalid Credentials");
            const companyUpate = await prisma.jmkcompany.update({
                data: { ...data, },
                where: { serial: data.serial }
            });
            if (companyUpate.c_verified) {
                const admin = await prisma.jmkuserinfo.findFirst({ where: { company_id: companyUpate.serial } });
                if (!admin) {
                    const newAdmin = await prisma.jmkuserinfo.create({
                        data: {
                            usr_email: companyUpate.c_email,
                            usr_password: generatePasswordFromUsername(companyUpate.c_username),
                            usr_fname: companyUpate.c_username,
                            usr_lname: "Company",
                            company_id: companyUpate.serial,
                            usr_access: DefaultUserAccess
                        }
                    });
                    await sendMail(companyUpate.c_email, 'Successfully Comany Account Verifyed', saaSRequsteConfirmEmailHTML(companyUpate.c_name, companyUpate.c_email, companyUpate.c_username, newAdmin.usr_password));
                }
            }
            if (!companyUpate) throw new AuthenticationError("Invalid !!")
            return companyUpate;
        }
        // not sure what companey can update on there account
        if (platform === 'external' && role === 'admin') {
            const admin = await prisma.jmkuserinfo.findFirst({ where: { usr_id: userId } });
            const company = await prisma.jmkcompany.findFirst({ where: { serial: admin.company_id } });
            if (!company) throw new AuthenticationError("Invalid Credentials");
            const companyUpate = await prisma.jmkcompany.update({
                data: { ...data, },
                where: { serial: company.serial }
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
            const company = await prisma.jmkcompany.findFirst({ where: { serial }, include: { payments: true } });
            company.totalAdmins = await prisma.jmkuserinfo.count({ where: { company_id: company.serial } });
            company.totalTrainer = await prisma.jmktrinfo.count({ where: { company_id: company.serial } });
            company.totalStudents = await prisma.jmkstdinfo.count({ where: { company_id: company.serial } });
            const courses = await prisma.jmkcrsinfo.findMany({
                where: { crs_company_id: company.serial },
                include: {
                    crs_week: {
                        include: {
                            jmk_week_content: {
                                where: {
                                    OR: [
                                        { type: 'Note', video_url_key: { not: null } },
                                        { type: 'Video', video_url_key: { not: null } },
                                    ],
                                },
                            },
                        },
                    },
                },
            });
            company.totalCourses = courses?.length ?? 0;
            company.files = [];
            for (let index = 0; index < courses.length; index++) {
                const course = courses[index];
                for (let index = 0; index < course.crs_week.length; index++) {
                    company.files = company.files.concat(course.crs_week[index].jmk_week_content);
                }
            }
            if (!company) throw new AuthenticationError("invalid");
            return company;
        }
        throw new AuthenticationError("invalid acccess");
    },
    getCompanyList: async (_, args, { userId, role }) => {
        if (!userId) throw new AuthenticationError("invalid token");
        if (role === 'admin') {
            const company = await prisma.jmkcompany.findMany({
                orderBy: {
                    created_at: 'desc',
                },
            })
            if (!company) throw new AuthenticationError("invalid")
            return company;
        }
        throw new AuthenticationError("invalid acccess")
    },
}

export { companyQueryTypesAndInputs, companyQuery, companyMutation, companyResolvers, companyResolversQuery }
