import { ApolloError } from 'apollo-server-express'
import prisma from '../../database.js'
import { sendMail } from '../../utils/mailHandler.js'
import demoRequestHTML from '../../utils/demoRequest.js'
import contackFormHTML from '../../utils/contackForm.js'

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

    type CourseForCat {
      crsmain_id:Int!
      category: String!
      title: String!
      description: String!
      crsmain_img_url: String!
      duration: Int!
      label: String!
      language: String!
      lavel: String!
      rate: Int!
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
      location:String!
     }

     type CategoryAndCourse {
      category: CourseCategory
      courses: [CourseForCat]
     }

`

const jamuntekQuery = `
   getAllCareerPage: [CareerPage!]!
   getCategoryAndCourse: [CategoryAndCourse]
   getDynamicCourseById(crsmain_id:Int!): staticCourse!

`

const jamuntekMutation = `

    demoRequest(data:demoRequestInput):String
    contactForm(data:contactFormInput):String
    businessForm(data:businessFormInput):String
    jamuntekReview(data:jamuntekReviewInput):String

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
      const coursesData = await prisma.jmkcrsmain.findMany({ where: { category: categories[index].title } });
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

  getDynamicCourseById: async (_, { crsmain_id }, { userId, role }) => {
    if (!crsmain_id) throw new ApolloError('Data Not Found');
    const staticCourse = await prisma.jmkcrsmain.findFirst({
      where: { crsmain_id },
    })
    if (!staticCourse) throw new ApolloError('No data found')
    const curriculum = await prisma.jmkcrsdet.findMany({ where: { crsmain_id: staticCourse.crsmain_id }, select: { topic: true, description: true } });
    let learning = await prisma.jmkcrsLearing.findMany({ where: { crsmain_id: staticCourse.crsmain_id } });
    learning = learning.map(i => i.title)
    let timing = await prisma.jmkcrsTiming.findMany({ where: { crsmain_id: staticCourse.crsmain_id } });
    timing = timing.map(i => i.time)
    return ({ ...staticCourse, learning, curriculum, timing })
  }
}

export {
  jamuntekQueryTypesAndInputs,
  jamuntekQuery,
  jamuntekMutation,
  jamuntekResolvers,
  jamuntekResolversQuery,
}
