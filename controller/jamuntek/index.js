import { ApolloError } from 'apollo-server-express'
import prisma from '../../database.js'
import { sendMail } from '../../utils/mailHandler.js'
import demoRequestHTML from '../../utils/demoRequest.js'
import contackFormHTML from '../../utils/contackForm.js'
import { getRandomItemsFromArray } from '../../utils/helper.js'
import { uploadImgToAWS } from '../../utils/imageHandler.js'

const jamuntekQueryTypesAndInputs = `
    input demoRequestInput {
        std_fname: String!
        std_mname: String
        std_lname: String!
        std_email: String!
        std_mobile: String!
        std_demo_dt: String!
        std_demo_crs: String!
    }

    input contactFormInput {
        cfname: String!
        clname: String!
        cmobile: String!
        cemail: String!
        csubject: String!
        cmessage: String!
    }

    input businessFormInput{
        bfname: String!
        blname: String!
        bmobile: String!
        bemail: String!
        bcompname: String!
        bgovnpr: String!
        bcompsize: String!
        blrnum: String!
        bcountry: String!
        bneeds: String!
        bjobrole: String!
    }

    input jamuntekReviewInput {
        rate: String!
    }

    input signupPartnerInput{
      pr_fname: String!
      pr_lname: String!
      pr_mobile: String!
      pr_email: String!
      pr_company: String!
      pr_company_site: String
      pr_role: String!
      pr_remark: String
    }

    input jobReqInput{
      fname: String!
      lname: String!
      mobile: String!
      email: String!
      linkedin: String!
      career_id: Int!
      role: String!
      resume: Upload!
      remark: String
    }

    input promoCheck {
      code: String!
      crs_name: String!
    }

    type CourseForCat {
      crsmain_id:Int!
      category: String!
      title: String!
      description: String!
      crsmain_img_url: String!
      duration: Float!
      label: String!
      language: String!
      lavel: String!
      rate: Int!
      rateUs: Float
      start_date: String!
      short_description: String!
      timing: [String!]!
    }

    type CareerPage {
      serial:Int!
      title:String!
      description:String!
      department:String!
      employment_type:String!
      employment_structure:String!
      seo_title:String
      seo_description:String
      location:String!
     }

     type CategoryAndCourse {
      category: CourseCategory
      courses: [CourseForCat]
     }

     type PopularAndUpcoming {
      popularCourse: [staticCourse!]
      upcomingCourse: [staticCourse!]
     }

`

const jamuntekQuery = `
   getAllCareerPage: [CareerPage!]!
   getCategoryAndCourse: [CategoryAndCourse]
   getDynamicCourseById(crsmain_id:Int!): staticCourse!
   getDynamicCourseBySlug(slug:String!): staticCourse!
   getPopularAndUpcomingCourse: PopularAndUpcoming!
   getAutoComplete:[staticCourse]!
   getServicByTitle(title:String!):Service

`

const jamuntekMutation = `
    demoRequest(data:demoRequestInput):String
    contactForm(data:contactFormInput):String
    businessForm(data:businessFormInput):String
    jamuntekReview(data:jamuntekReviewInput):String
    signupPartner(data:signupPartnerInput!):String!
    jobReq(data:jobReqInput!):String!

    applyCheck(data:promoCheck!):Int!
`

const jamuntekResolvers = {
  demoRequest: async (_, { data }) => {
    const demoRequest = await prisma.jmkstddemo.create({
      data: { ...data },
    })
    if (!demoRequest) throw new ApolloError('Something wrong !!')
    await sendMail(
      demoRequest.std_email,
      'Successfully Submit Demo Request ',
      demoRequestHTML
    )
    return 'Success'
  },

  contactForm: async (_, { data }) => {
    const contactForm = await prisma.jmkcontact.create({ data })
    if (!contactForm) throw new ApolloError('Something wrong !!')
    await sendMail(
      contactForm.cemail,
      'Your Contact Form Has Been Received',
      contackFormHTML
    )

    const admins = await prisma.jmkuserinfo.findMany();
    for (let index = 0; index < admins.length; index++) {
      const admin = admins[index];
      const accessData = JSON.parse(admin.usr_access);
      if (admin?.usr_access?.[0]) {
        const findRegistrationAccess = accessData.find((item) => item.name === 'RegistrationInfo');
        if (findRegistrationAccess && findRegistrationAccess?.option) {
          const registration = findRegistrationAccess.option.find((item) => item.name === 'Contact Request');
          if (registration?.access?.[0]?.read) {
            await prisma.jmk_notifications.create({
              data: {
                user_id: admin.usr_id,
                label1: `${contactForm.cfname}`,
                label2: '',
                user_type: "Admin",
                category: 'contact',
                message: `has filled the contact us form. Please check what he/she is looking for.`,
                link: `/contactRequest/${contactForm.serial}`,
                is_read: false,
              }
            });
          }
        }
      }
    }
    return 'Success'
  },

  businessForm: async (_, { data }) => {
    const businessForm = await prisma.jmkcontactb.create({ data })
    if (!businessForm) throw new ApolloError('Something wrong !!')
    await sendMail(
      businessForm.bemail,
      'Your Bussiness Form Has Been Received',
      contackFormHTML
    )
    const admins = await prisma.jmkuserinfo.findMany();
    for (let index = 0; index < admins.length; index++) {
      const admin = admins[index];
      const accessData = JSON.parse(admin.usr_access);
      if (admin?.usr_access?.[0]) {
        const findRegistrationAccess = accessData.find((item) => item.name === 'RegistrationInfo');
        if (findRegistrationAccess && findRegistrationAccess?.option) {
          const registration = findRegistrationAccess.option.find((item) => item.name === 'Contact Request');
          if (registration?.access?.[0]?.read) {
            await prisma.jmk_notifications.create({
              data: {
                user_id: admin.usr_id,
                label1: `${contactForm.cfname}`,
                label2: '',
                user_type: "Admin",
                category: 'contact',
                message: `has filled the contact us form. Please check what he/she is looking for.`,
                link: `/contactRequest/${contactForm.serial}`,
                is_read: false,
              }
            });
          }
        }
      }
    }
    return 'Success'
  },

  jamuntekReview: async (_, { data }) => {
    if (!data.rate) throw new ApolloError('bad request')
    const jamuntekReview = await prisma.jmkreview.create({
      data: {
        rate: data.rate,
        date: new Date(),
      },
    })
    if (!jamuntekReview) throw new Error('something went wrong!!')
    return 'success'
  },

  signupPartner: async (_, { data }) => {
    const partner = await prisma.jmkpartnerReq.findFirst({
      where: { pr_email: data.pr_email },
    })
    if (partner) throw new ApolloError('Partner already exist with that email')
    const newPartner = await prisma.jmkpartnerReq.create({ data });
    if (!newPartner) throw new ApolloError('Something went wrong')


    const admins = await prisma.jmkuserinfo.findMany();
    for (let index = 0; index < admins.length; index++) {
      const admin = admins[index];
      const accessData = JSON.parse(admin.usr_access);
      if (admin?.usr_access?.[0]) {
        const findRegistrationAccess = accessData.find((item) => item.name === 'RegistrationInfo');
        if (findRegistrationAccess && findRegistrationAccess?.option) {
          const registration = findRegistrationAccess.option.find((item) => item.name === 'Partnership Request');
          if (registration?.access?.[0]?.read) {
            await prisma.jmk_notifications.create({
              data: {
                user_id: admin.usr_id,
                label1: `${newPartner.pr_fname}`,
                label2: '',
                user_type: "Admin",
                category: 'parnter',
                message: `wants to join Jaamun as a partner and has filled the become parnter form.`,
                link: `/partnership/${newPartner.pr_id}`,
                is_read: false,
              }
            });
          }
        }
      }
    }
    return 'success'
  },

  jobReq: async (_, { data }) => {
    const jobReq = await prisma.jmkjobReq.findFirst({
      where: { career_id: data.career_id, email: data.email },
    })
    if (jobReq) throw new ApolloError('Job Request already exist with that email')
    if (!data.resume) throw new ApolloError('Resume is Required')
    const file = await uploadImgToAWS(data.resume, 'job_resume/')
    if (!file.data) throw new ApolloError('Something went wrong !');
    data.resume = file?.data?.Location;
    data.resume_key = file?.data?.key;
    const newJobReq = await prisma.jmkjobReq.create({ data });
    if (!newJobReq) throw new ApolloError('Something went wrong')

    const admins = await prisma.jmkuserinfo.findMany();
    for (let index = 0; index < admins.length; index++) {
      const admin = admins[index];
      const accessData = JSON.parse(admin.usr_access);
      if (admin?.usr_access?.[0]) {
        const findRegistrationAccess = accessData.find((item) => item.name === 'RegistrationInfo');
        if (findRegistrationAccess && findRegistrationAccess?.option) {
          const registration = findRegistrationAccess.option.find((item) => item.name === 'Job Request');
          if (registration?.access?.[0]?.read) {
            await prisma.jmk_notifications.create({
              data: {
                user_id: admin.usr_id,
                label1: `${newJobReq.fname}`,
                label2: newJobReq.role,
                user_type: "Admin",
                category: 'job',
                message: `applied for the role of`,
                link: `/jobRequest/${newJobReq.serial}`,
                is_read: false,
              }
            });
          }
        }
      }
    }
    return 'success'
  },

  applyCheck: async (_, { data, }) => {
    const promo = await prisma.jmk_promo_code.findFirst({
      where: { code: data.code },
    });
    if (!promo) throw new ApolloError('Invalid Promo Code');
    if (promo.upto < 1) throw new ApolloError('Invalid');
    if (new Date(promo.created_at).getTime() > Date.now()) throw new ApolloError('Promo Code Expire');
    const crs = await prisma.jmkcrsinfo.findFirst({ where: { crs_id: promo.crs_id } })
    console.log(crs);
    if (data.crs_name !== crs.crs_name) throw new ApolloError('Invalid Promo Code');
    return promo.discount
  },
}

const jamuntekResolversQuery = {
  getAllCareerPage: async (_, { args }, { userId, role }) => {
    const careers = await prisma.jmk_web_career.findMany({ where: { status: true } });
    if (!careers) throw new ApolloError('Data Not Found')
    return careers
  },

  getCategoryAndCourse: async (_) => {
    const categories = await prisma.jmk_crs_categories.findMany();
    if (!categories) throw new ApolloError('Data not found');
    const sendData = [];
    for (let index = 0; index < categories.length; index++) {
      const courses = []
      const coursesData = await prisma.jmkcrsmain.findMany({ where: { category: categories[index].title, isDeleted: false } });
      for (let index = 0; index < coursesData.length; index++) {
        const course = coursesData[index];
        let timing = await prisma.jmkcrsTiming.findMany({ where: { crsmain_id: course.crsmain_id } });
        timing = timing.map(i => i.time)
        courses.push({ ...course, timing })
      }
      sendData.push({
        category: categories[index],
        courses: courses
      })
    }

    if (!sendData) throw new Error('No Data Found')
    return sendData
  },

  getAutoComplete: async (_) => {
    const coursesData = await prisma.jmkcrsmain.findMany({ where: { isDeleted: false } });
    if (!coursesData) throw new Error('No Data Found')
    return coursesData
  },

  getDynamicCourseById: async (_, { crsmain_id }, { userId, role }) => {
    if (!crsmain_id) throw new ApolloError('Data Not Found');
    const staticCourse = await prisma.jmkcrsmain.findFirst({
      where: { crsmain_id, isDeleted: false },
    })
    if (!staticCourse) throw new ApolloError('No data found')
    const curriculum = await prisma.jmkcrsdet.findMany({ where: { crsmain_id: staticCourse.crsmain_id }, select: { topic: true, description: true } });
    let learning = await prisma.jmkcrsLearing.findMany({ where: { crsmain_id: staticCourse.crsmain_id } });
    learning = learning.map(i => i.title)
    let timing = await prisma.jmkcrsTiming.findMany({ where: { crsmain_id: staticCourse.crsmain_id } });
    timing = timing.map(i => i.time)
    return ({ ...staticCourse, learning, curriculum, timing })
  },

  getDynamicCourseBySlug: async (_, { slug }, { userId, role }) => {
    if (!slug) throw new ApolloError('Slug is required');
    const staticCourse = await prisma.jmkcrsmain.findFirst({
      where: { title: slug, isDeleted: false },
    })
    if (!staticCourse) throw new ApolloError('No data found')
    const curriculum = await prisma.jmkcrsdet.findMany({ where: { crsmain_id: staticCourse.crsmain_id }, select: { topic: true, description: true } });
    let learning = await prisma.jmkcrsLearing.findMany({ where: { crsmain_id: staticCourse.crsmain_id } });
    learning = learning.map(i => i.title)
    let timing = await prisma.jmkcrsTiming.findMany({ where: { crsmain_id: staticCourse.crsmain_id } });
    timing = timing.map(i => i.time)
    return ({ ...staticCourse, learning, curriculum, timing })
  },

  getPopularAndUpcomingCourse: async (_, { args }, { userId, role }) => {
    const staticCourse = await prisma.jmkcrsmain.findMany({ where: { isDeleted: false } })
    if (!staticCourse) throw new ApolloError('No data found');
    let upcomingCourse = []
    let popularCourse = []
    const popularCourseRendom = await getRandomItemsFromArray(staticCourse, 8)
    for (let index = 0; index < staticCourse.length; index++) {
      let timing = await prisma.jmkcrsTiming.findMany({ where: { crsmain_id: staticCourse[index].crsmain_id } });
      timing = timing.map(i => i.time)
      if (new Date(staticCourse[index].start_date).getTime() > Date.now()) {
        upcomingCourse.push({ ...staticCourse[index], timing })
      }
    }
    for (let index = 0; index < popularCourseRendom.length; index++) {
      let timing = await prisma.jmkcrsTiming.findMany({ where: { crsmain_id: popularCourseRendom[index].crsmain_id } });
      timing = timing.map(i => i.time)
      popularCourse.push({ ...popularCourseRendom[index], timing })
    }
    return ({ popularCourse, upcomingCourse })
  },

  getServicByTitle: async (_, { title }, { userId, role }) => {
    const service = await prisma.jmk_services.findFirst({ where: { title } });
    if (!service) throw new ApolloError('Data Not Found')
    return service
  },
}

export {
  jamuntekQueryTypesAndInputs,
  jamuntekQuery,
  jamuntekMutation,
  jamuntekResolvers,
  jamuntekResolversQuery,
}
