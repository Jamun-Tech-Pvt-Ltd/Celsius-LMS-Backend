import { AuthenticationError } from 'apollo-server-express'
import prisma from '../../database.js'

const courseQueryTypesAndInputs = `
    type Course{
        crsmain_id:Int!
        crsmain_title:String!
        crsmain_desc:String!
        crsmain_overview:String!
        crsmain_duration: Int!
        crsmain_rate: Int!
        crsmain_img_url: String!     
        crsmain_type:String! 
    }

    type CourseContent{
        crsdet_id: Int!
        crsdet_title: String!
        crsmain_id:Int!
    }
    type CourseType {
      crs_type:String
    }
    input addCourseInput {
        crsmain_title:String!
        crsmain_desc:String!
        crsmain_overview:String!
        crsmain_duration: Int!
        crsmain_rate: Int!
        crsmain_img_url: String! 
        crsmain_type:String!
}

input CourseContentInput {
    crsdet_title: String!
    crsmain_id:Int!
} 
`

const courseQuery = `
  getMainCourses: [Course]
  getMainCourseById(crsmain_id: Int!): Course
  getAllCourseContentByCourseId(crsmain_id:Int!):[CourseContent]
  getAllCourseType:[CourseType]
  getCourseTitleByType(crsmain_type:String!):[Course]
`

const courseMutation = `
    addMainCourse(data:addCourseInput!):Course
    updateMainCourse(crsmain_id:Int!,data:addCourseInput!):Course
    deleteMainCourse(crsmain_id:Int!):Boolean

    addDetails(data:CourseContentInput):CourseContent
    updateDetails(crsdet_id:Int!,data:CourseContentInput):CourseContent
    deleteDetails(crsdet_id:Int!):Boolean
`

const courseQueryResolver = {
  getMainCourses: async () => {
    const courses = await prisma.jmkcrsmain.findMany()
    if (!courses) throw new AuthenticationError('No course listed')
    return courses
  },
  getMainCourseById: async (_, { crsmain_id }) => {
    const course = await prisma.jmkcrsmain.findUnique({
      where: { crsmain_id },
    })
    if (!course) throw new AuthenticationError('No such course')
    return course
  },
  getAllCourseContentByCourseId: async (_, { crsmain_id }) => {
    const content = await prisma.jmkcrsdet.findMany({
      where: { crsmain_id },
    })
    if (!content) throw new AuthenticationError('No content available')
    return content
  },
  getAllCourseType: async () => {
    const result = await prisma.jmkcrsmain.findMany({
      select: { crsmain_type: true },
    })
    const ctype = []
    result.map((c_type) => {
      if (!ctype.includes(c_type.crsmain_type)) {
        ctype.push(c_type.crsmain_type)
      }
    })

    const services = ctype.map((c) => {
      return { crs_type: c }
    })
    if (!services) throw new AuthenticationError('No content avaliable')
    return services
  },
  getCourseTitleByType: async (_, { crsmain_type }) => {
    const result = await prisma.jmkcrsmain.findMany({
      where: { crsmain_type },
    })
    if (!result) throw new AuthenticationError('No content avaliable')
    return result
  },
}

const courseMutationResolver = {
  addMainCourse: async (_, { data }) => {
    const course = await prisma.jmkcrsmain.findFirst({
      where: { crsmain_title: data.crsmain_title },
    })
    if (course)
      throw new AuthenticationError('course already exist with that name')
    const newCourse = await prisma.jmkcrsmain.create({
      data: { ...data },
    })
    return newCourse
  },
  updateMainCourse: async (_, { crsmain_id, data }, { userId, role }) => {
    const course = await prisma.jmkcrsmain.findFirst({
      where: { crsmain_id },
    })
    if (!course) throw new AuthenticationError(`This course doesn't exist`)
    const updatedCourse = await prisma.jmkcrsmain.update({
      where: { crsmain_id },
      data,
    })
    return updatedCourse
  },
  deleteMainCourse: async (_, { crsmain_id }) => {
    const course = await prisma.jmkcrsmain.findUnique({
      where: { crsmain_id },
    })
    if (!course) throw new AuthenticationError(`This course doesn't exist`)
    await prisma.jmkcrsmain.delete({
      where: { crsmain_id },
    })
    return true
  },
  addDetails: async (_, { data }) => {
    const courseContent = await prisma.jmkcrsdet.findFirst({
      where: { crsdet_title: data.crsdet_title },
    })
    if (courseContent)
      throw new AuthenticationError('course already exist with that name')
    const newContent = await prisma.jmkcrsdet.create({
      data,
    })
    return newContent
  },
  updateDetails: async (_, { crsdet_id, data }) => {
    const courseContent = await prisma.jmkcrsdet.findUnique({
      where: { crsdet_id },
    })
    if (!courseContent)
      throw new AuthenticationError(`This course doesn't exist`)
    const updatedCourseContent = await prisma.jmkcrsdet.update({
      where: { crsdet_id },
      data,
    })
    return updatedCourseContent
  },
  deleteDetails: async (_, { crsdet_id }) => {
    const courseContent = await prisma.jmkcrsdet.findUnique({
      where: { crsdet_id },
    })
    if (!courseContent)
      throw new AuthenticationError(`This course doesn't exist`)
    await prisma.jmkcrsdet.delete({
      where: { crsdet_id },
    })
    return true
  },
}

export {
  courseQuery,
  courseMutation,
  courseQueryTypesAndInputs,
  courseQueryResolver,
  courseMutationResolver,
}
