import { ApolloError, AuthenticationError } from 'apollo-server-express'
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

`

const jamuntekQuery = `


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

const jamuntekResolversQuery = {}

export {
  jamuntekQueryTypesAndInputs,
  jamuntekQuery,
  jamuntekMutation,
  jamuntekResolvers,
  jamuntekResolversQuery,
}
