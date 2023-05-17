import { ApolloError, AuthenticationError, ForbiddenError } from 'apollo-server-express'
import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';
import jwt from 'jsonwebtoken'
import prisma from './database.js'
import { deleteImgToAWS, uploadImgToAWS } from './utils/imageHandler.js';
import { sendMail } from './utils/mailHandler.js';
// 
import registerrHTML from './utils/signup.js'
import contackFormHTML from './utils/contackForm.js'
import demoRequestHTML from './utils/demoRequest.js'
import forgotPasswordHTML from './utils/forgotPassword.js'
import newUserSignupNotification from './utils/newUsersignup.js';


const ROLES = ['student', "trainer", 'consultancy']

const resolvers = {
    Upload: GraphQLUpload,

    Query: {
        me: async (_, args, { userId, role }) => {
            if (!userId) throw new ForbiddenError('user need to login');
            if (role === ROLES[0]) {
                const user = await prisma.jmkstdinfo.findFirst({ where: { std_id: userId } })
                if (!user) throw new AuthenticationError("invalid user credentials")
                const feedback = await prisma.jmkgrvinfo.findMany({ where: { std_id: userId } })
                if (!feedback[0]) return user
                return { ...user, feedback };
            }
            throw new ForbiddenError('Bad request !!');
        },
        admin: async (_, args, { userId, role }) => {
            if (!userId) throw new ForbiddenError('invalid token');
            const admin = await prisma.jmkuserinfo.findFirst({ where: { usr_id: userId, usr_role: role } })
            if (!admin) throw new AuthenticationError("invalid admin credentials")
            return admin;
        },
        trainer: async (_, args, { userId, role }) => {
            if (!userId) throw new ForbiddenError('user need to login');
            if (role === ROLES[1]) {
                const user = await prisma.jmktrinfo.findFirst({ where: { tr_id: userId } })
                if (!user) throw new AuthenticationError("invalid user credentials")
                return user
            }
            throw new ForbiddenError('Bad request !!');
        },
        myDailyVideo: async (_, args, { userId }) => {
            if (!userId) throw new ForbiddenError('user need to login');
            const user = await prisma.jmkstdinfo.findFirst({ where: { std_id: userId } })
            const videos = await prisma.jmkvidinfo.findMany({ where: { crs_id: user.crs_id } })
            return videos;
        },
        myDailyVideoByid: async (_, args, { userId }) => {
            if (!userId) throw new ForbiddenError('user need to login');
            const user = await prisma.jmkstdinfo.findFirst({ where: { std_id: userId } })
            if (!user) throw new AuthenticationError("invalid user")
            const video = await prisma.jmkvidinfo.findFirst({ where: { vid_id: args.vid_id } })
            if (!video) throw new ForbiddenError('invalid !');
            if (user.crs_id !== video.crs_id) throw new ForbiddenError('invalid !');
            return video;
        },
        myCourse: async (_, args, { userId }) => {
            if (!userId) throw new ForbiddenError('user need to login');
            const user = await prisma.jmkstdinfo.findFirst({ where: { std_id: userId } })
            const course = await prisma.jmkcrsinfo.findFirst({ where: { crs_id: user.crs_id } })
            return course;
        },
        courseList: async () => {
            const course = await prisma.jmkcrsinfo.findMany()
            const filter = course.reduce((all, course) => {
                all[course.crs_type] = [...all[course.crs_type] || [], { ...course }];
                return all;
            }, {});
            const newObj = Object.entries(filter).map(item => ({ crs_type: item[0], courses: [...item[1]] }))
            return newObj;
        },
        getAllCourseList: async (_, args, { userId, role }) => {
            if (!userId) throw new ForbiddenError('invalid token');
            const admin = await prisma.jmkuserinfo.findFirst({ where: { usr_id: userId, usr_role: role } })
            if (!admin) throw new AuthenticationError("invalid admin credentials")
            if (admin.usr_role === 'admin') {
                const courses = await prisma.jmkcrsinfo.findMany();
                if (!courses) throw new ApolloError("Courses not found !!")
                return courses
            }
        },
        getCourseById: async (_, args, { userId, role }) => {
            if (!userId) throw new ForbiddenError('invalid token');
            if (!args.crs_id) throw new ForbiddenError('crs_id is required !');
            const course = await prisma.jmkcrsinfo.findFirst({ where: { crs_id: args.crs_id } })
            if (!course) throw new ApolloError('Data Not Found');
            return course;
        },
        userCourseList: async (_, args, { userId, role }) => {
            if (!userId) throw new ForbiddenError('user need to login');
            if (role === ROLES[0]) {
                const user = await prisma.jmkstdinfo.findFirst({ where: { std_id: userId } })
                if (!user) throw new AuthenticationError("invalid user credentials")
                const stdcourse = await prisma.jmkstdcrsinfo.findMany({ where: { std_id: userId } })
                const userCourse = []
                for (let index = 0; index < stdcourse.length; index++) {
                    const course = await prisma.jmkcrsinfo.findFirst({ where: { crs_id: stdcourse[index].crs_id } })
                    userCourse.push({ ...stdcourse[index], crs_name: course.crs_name })
                }
                return userCourse;

            }
            throw new ForbiddenError('Bad request !!');
        },
        myCourseContents: async (_, args, { userId, role }) => {
            if (!userId) throw new ForbiddenError('user need to login');
            if (role === ROLES[0]) {
                const user = await prisma.jmkstdinfo.findFirst({ where: { std_id: userId } })
                if (!user) throw new AuthenticationError("invalid user credentials")
                const courseContents = await prisma.jmkcrscontents.findMany({
                    where: { crs_id: user.crs_id }, orderBy: {
                        content_date: 'desc'
                    }
                })
                if (!courseContents) throw new ApolloError("empty courseContents")
                return courseContents;

            }
            throw new ForbiddenError('Bad request !!');
        },
        myCourseContent: async (_, args, { userId, role }) => {
            if (role === ROLES[0]) {
                if (!userId) throw new ForbiddenError('user need to login');
                const user = await prisma.jmkstdinfo.findFirst({ where: { std_id: userId } })
                if (!user) throw new AuthenticationError("invalid user credentials")
                const courseContent = await prisma.jmkcrscontents.findFirst({
                    where: { serial: args.id, crs_id: user.crs_id }
                })
                if (!courseContent) throw new ApolloError("empty courseContents")
                return courseContent;

            }
            if (role === ROLES[1]) {
                if (!userId) throw new ForbiddenError('trainer need to login');
                const trainer = await prisma.jmktrinfo.findFirst({ where: { tr_id: userId } })
                if (!trainer) throw new AuthenticationError("invalid trainer credentials")
                const courseContent = await prisma.jmkcrscontents.findFirst({
                    where: { serial: args.id }
                })
                if (!courseContent) throw new ApolloError("empty courseContents")
                return courseContent;
            }
            throw new ForbiddenError('Bad request !!');
        },
        getCourseContentsByCrsId: async (_, args, { userId, role }) => {
            if (!userId) throw new ForbiddenError('trainer need to login');
            if (role === ROLES[1]) {
                const trainer = await prisma.jmktrinfo.findFirst({ where: { tr_id: userId } })
                if (!trainer) throw new AuthenticationError("invalid trainer credentials")
                const courseContent = await prisma.jmkcrscontents.findMany({
                    where: { crs_id: args.crs_id }
                })
                if (!courseContent) throw new ApolloError("empty courseContents")
                return courseContent;

            }
            throw new ForbiddenError('Bad request !!');
        },
        getActiveUserCourse: async (_, args, { userId, role }) => {
            if (!userId) throw new ForbiddenError('user need to login');
            if (role === ROLES[0]) {
                const user = await prisma.jmkstdinfo.findFirst({ where: { std_id: userId } })
                if (!user) throw new AuthenticationError("invalid user credentials")
                const stdcourse = await prisma.jmkstdcrsinfo.findFirst({ where: { std_id: userId, crs_id: user.crs_id } })
                if (!stdcourse) throw new ForbiddenError('invalid');
                const crs = await prisma.jmkcrsinfo.findFirst({ where: { crs_id: user.crs_id } })
                return { ...stdcourse, crs_rate: crs.crs_rate, crs_name: crs.crs_name };
            }
            throw new ForbiddenError('Bad request !!');
        },
        studentVideoNote: async (_, args, { userId, role }) => {
            if (!userId) throw new ForbiddenError('user need to login');
            if (role === ROLES[0]) {
                const user = await prisma.jmkstdinfo.findFirst({ where: { std_id: userId } })
                if (!user) throw new AuthenticationError("invalid user credentials")
                const note = await prisma.jmkstdvidnote.findFirst({ where: { std_id: userId, vid_id: args.vid_id } })
                if (!note) throw new ApolloError("Empty Note !")
                return note;
            }
            throw new ForbiddenError('Bad request !!');
        },
        questionSetList: async (_, args, { userId, role }) => {
            if (!userId) throw new ForbiddenError('user need to login');
            if (role === ROLES[0]) {
                const user = await prisma.jmkstdinfo.findFirst({ where: { std_id: userId } })
                if (!user) throw new AuthenticationError("invalid user credentials")
                const questionsSet = await prisma.jmkstdtestset.findMany({ where: { std_id: userId, isComplete: false, crs_id: user.crs_id } })
                if (!questionsSet) throw new ApolloError("Empty questions !")
                return questionsSet;
            }
            throw new ForbiddenError('Bad request !!');
        },
        getTestQuestion: async (_, args, { userId, role }) => {
            if (!userId) throw new ForbiddenError('user need to login');
            if (role === ROLES[0]) {
                const user = await prisma.jmkstdinfo.findFirst({ where: { std_id: userId } })
                if (!user) throw new AuthenticationError("invalid user credentials")
                const questionsSet = await prisma.jmkstdtestset.findFirst({ where: { std_id: userId, isComplete: false, crs_id: user.crs_id, serial: parseInt(args.set_id) } })
                if (!questionsSet) throw new ApolloError("Empty questions !")
                const questions = await prisma.jmkstdtestqa.findMany({ where: { std_test_set_id: parseInt(args.set_id) } })
                if (!questions) throw new ApolloError("Empty question !")
                return { questionsSet, questions };
            }
            throw new ForbiddenError('Bad request !!');
        },
        getQuestionByid: async (_, args, { userId, role }) => {
            if (!userId) throw new ForbiddenError('user need to login');
            if (role === ROLES[0]) {
                const user = await prisma.jmkstdinfo.findFirst({ where: { std_id: userId } })
                if (!user) throw new AuthenticationError("invalid user credentials")
                const question = await prisma.jmkquesans.findFirst({ where: { ques_id: parseInt(args.ques_id) } })
                if (!question) throw new ApolloError("Empty question !")
                return question;
            }
            throw new ForbiddenError('Bad request !!');
        },
        getQuestionVidew: async (_, args, { userId, role }) => {
            if (!userId) throw new ForbiddenError('user need to login');
            if (role === ROLES[0]) {
                const user = await prisma.jmkstdinfo.findFirst({ where: { std_id: userId } })
                if (!user) throw new AuthenticationError("invalid user credentials")
                const questionsSet = await prisma.jmkstdtestset.findFirst({ where: { std_id: userId, isComplete: false, crs_id: user.crs_id, serial: parseInt(args.set_id) } })
                if (!questionsSet) throw new ApolloError("Empty questions !")
                const questionsSetUpdate = await prisma.jmkstdtestset.update({
                    data: {
                        isComplete: true
                    },
                    where: {
                        serial: parseInt(args.set_id)
                    }
                })
                if (!questionsSetUpdate) throw new ApolloError("Somethig went wrong !")
                return 'success';
            }
            throw new ForbiddenError('Bad request !!');
        },
        getTrainerCourses: async (_, args, { userId, role }) => {
            if (!userId) throw new ForbiddenError('user need to login');
            if (role === ROLES[1]) {
                const trainer = await prisma.jmktrinfo.findFirst({ where: { tr_id: userId } })
                if (!trainer) throw new AuthenticationError("invalid trainer credentials")
                const trainerCourses = await prisma.jmktrcrsinfo.findMany({
                    where: {
                        tr_id: userId,
                    }
                })
                const trCourses = [];
                for (let index = 0; index < trainerCourses.length; index++) {
                    const course = await prisma.jmkcrsinfo.findFirst({ where: { crs_id: trainerCourses[index].crs_id } });
                    const total_videos = await prisma.jmkvidinfo.count({ where: { crs_id: course.crs_id } })
                    const total_student = await prisma.jmkstdcrsinfo.count({ where: { crs_id: course.crs_id } })
                    if (course) {
                        trCourses.push({ ...course, total_videos, total_student })
                    }
                }
                return trCourses;
            }
        },
        getQuestionModule: async (_, args, { userId, role }) => {
            if (!userId) throw new ForbiddenError('invalid token');
            if (role === ROLES[1]) {
                const trainer = await prisma.jmktrinfo.findFirst({ where: { tr_id: userId } })
                if (!trainer) throw new AuthenticationError("invalid trainer credentials")
                const Qmodule = await prisma.jmkcrsmodule.findMany();
                const mergeModules = Qmodule?.map(async (item) => {
                    const total_question = await prisma.jmkquesans.count({ where: { mod_id: item.mod_id } });
                    return { ...item, total_question }
                })
                if (!mergeModules) throw new ApolloError('No Module Found !');
                return mergeModules;
            }
        },
        getQuestionByModuleId: async (_, args, { userId, role }) => {
            if (!userId) throw new ForbiddenError('invalid token');
            if (role === ROLES[1]) {
                const trainer = await prisma.jmktrinfo.findFirst({ where: { tr_id: userId } })
                if (!trainer) throw new AuthenticationError("invalid trainer credentials")
                const questions = await prisma.jmkquesans.findMany({ where: { mod_id: args.mod_id } });
                if (!questions) throw new ApolloError('No Questions Found !');
                return questions;
            }
        },
        getQuestionByQuestionId: async (_, args, { userId, role }) => {
            if (!userId) throw new ForbiddenError('invalid token');
            if (role === ROLES[1]) {
                const trainer = await prisma.jmktrinfo.findFirst({ where: { tr_id: userId } })
                if (!trainer) throw new AuthenticationError("invalid trainer credentials")
                const question = await prisma.jmkquesans.findFirst({ where: { ques_id: args.ques_id } });
                if (!question) throw new ApolloError('No Questions Found !');
                return question;
            }
        },
        getstudentForTrainer: async (_, args, { userId, role }) => {
            if (!userId) throw new ForbiddenError('invalid token');
            if (role === ROLES[1]) {
                const trainer = await prisma.jmktrinfo.findFirst({ where: { tr_id: userId } })
                if (!trainer) throw new AuthenticationError("invalid trainer credentials")
                const trainerCourses = await prisma.jmktrcrsinfo.findMany({
                    where: {
                        tr_id: userId,
                    }
                })

                let students = [];
                for (let index = 0; index < trainerCourses.length; index++) {
                    const crs = await prisma.jmkstdcrsinfo.findMany({ where: { crs_id: trainerCourses[index].crs_id } })
                    for (let index = 0; index < crs.length; index++) {
                        const course = await prisma.jmkcrsinfo.findFirst({ where: { crs_id: crs[index].crs_id } })
                        const student = await prisma.jmkstdinfo.findMany({ where: { std_id: crs[index].std_id } })
                        if (crs) {
                            const mergestudent = student.map(i => ({ ...i, crs_type: course.crs_type, crs_name: course.crs_name }))
                            students.push(...mergestudent)
                        }
                    }
                }
                students = students.filter((v, i, a) => a.findIndex(v2 => (v2.std_id === v.std_id)) === i)
                return students;
            }
        },

        getstudentForAdmin: async (_, args, { userId, role }) => {
            if (!userId) throw new ForbiddenError('invalid token');
            const admin = await prisma.jmkuserinfo.findFirst({ where: { usr_role: userId, usr_role: role } })
            if (!admin) throw new AuthenticationError("invalid admin credentials")
            if (admin.usr_role === 'admin') {
                let students = [];
                const student = await prisma.jmkstdinfo.findMany()
                for (let index = 0; index < student.length; index++) {
                    const course = await prisma.jmkcrsinfo.findFirst({ where: { crs_id: student[index].crs_id } })
                    if (course) {
                        const mergestudent = student.map(i => ({ ...i, crs_type: course.crs_type, crs_name: course.crs_name }))
                        students.push(...mergestudent)
                    }
                }
                return students;
            }
        },

        getstudentByIdForAdmin: async (_, args, { userId, role }) => {
            if (!userId) throw new ForbiddenError('invalid token');
            const admin = await prisma.jmkuserinfo.findFirst({ where: { usr_role: userId, usr_role: role } })
            if (!admin) throw new AuthenticationError("invalid admin credentials")
            if (admin.usr_role === 'admin') {
                const student = await prisma.jmkstdinfo.findFirst({ where: { std_id: args.std_id } })
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
        getTrainerDataForAdmin: async (_, args, { userId, role }) => {
            if (!userId) throw new ForbiddenError('invalid token');
            const admin = await prisma.jmkuserinfo.findFirst({ where: { usr_role: userId, usr_role: role } })
            if (!admin) throw new AuthenticationError("invalid admin credentials")
            if (admin.usr_role === 'admin') {
                //let trainers = [];
                const trainers = await prisma.jmktrinfo.findMany()
              
                return trainers;
            }
        },
        getTrainerByIdForAdmin: async (_, args, { userId, role }) => {
            if (!userId) throw new ForbiddenError('invalid token');
            const admin = await prisma.jmkuserinfo.findFirst({ where: { usr_role: userId, usr_role: role } })
            if (!admin) throw new AuthenticationError("invalid admin credentials")
            if (admin.usr_role === 'admin') {
                const trainer = await prisma.jmktrinfo.findFirst({ where: { tr_id: args.tr_id } })
             
                 return trainer
            }
            throw new AuthenticationError("invalid access")

        },

        getTrainerDashboard: async (_, args, { userId, role }) => {
            if (!userId) throw new ForbiddenError('user need to login');
            if (role === ROLES[1]) {
                let students = 0;
                let videos = 0;
                const trainer = await prisma.jmktrinfo.findFirst({ where: { tr_id: userId } })
                if (!trainer) throw new AuthenticationError("invalid trainer credentials")
                const trainerCourses = await prisma.jmktrcrsinfo.findMany({
                    where: {
                        tr_id: userId,
                    }
                })
                for (let index = 0; index < trainerCourses.length; index++) {
                    const total_videos = await prisma.jmkvidinfo.count({ where: { crs_id: trainerCourses[index].crs_id } })
                    const total_student = await prisma.jmkstdcrsinfo.count({ where: { crs_id: trainerCourses[index].crs_id } })
                    if (total_videos) {
                        videos += total_videos
                    }
                    if (total_student) {
                        students += total_student
                    }
                }
                return { students, videos, courses: trainerCourses.length };
            }
        },
        getstudentCourseByIdForAdmin: async (_, args, { userId, role }) => {
            if (!userId) throw new ForbiddenError('invalid token');
            const admin = await prisma.jmkuserinfo.findFirst({ where: { usr_role: userId, usr_role: role } })
            if (!admin) throw new AuthenticationError("invalid admin credentials")
            if (admin.usr_role === 'admin') {
                const course = await prisma.jmkstdcrsinfo.findFirst({ where: { serial: args.serial } })
                if (!course) throw new ApolloError("crs not fund !!")
                return course;
            }
            throw new AuthenticationError("invalid access")

        },

        getstudentTestSetForTrainer: async (_, args, { userId, role }) => {
            if (!userId) throw new ForbiddenError('invalid token');
            if (role === ROLES[1]) {
                const trainer = await prisma.jmktrinfo.findFirst({ where: { tr_id: userId } })
                if (!trainer) throw new AuthenticationError("invalid trainer credentials")
                const trainerCourses = await prisma.jmktrcrsinfo.findMany({
                    where: {
                        tr_id: userId,
                    }
                })
                let testSet = [];
                let testList = [];


                for (let index = 0; index < trainerCourses.length; index++) {
                    const test = await prisma.jmkstdtestset.findMany({ where: { crs_id: trainerCourses[index].crs_id } })
                    test?.forEach(item => {
                        testSet.push(item)
                    })
                }

                for (let index = 0; index < testSet.length; index++) {
                    const student = await prisma.jmkstdinfo.findFirst({ where: { std_id: testSet[index].std_id } })
                    const course = await prisma.jmkcrsinfo.findFirst({ where: { crs_id: testSet[index].crs_id } })
                    testList.push({
                        ...testSet[index],
                        std_fname: student.std_fname,
                        std_mname: student.std_mname,
                        std_lname: student.std_lname,
                        std_email: student.std_email,
                        crs_name: course.crs_name ?? 'wdwd',
                        crs_type: course.crs_type ?? ''
                    })
                }

                return testList;
            }
        },

        getstudentTestResultById: async (_, args, { userId, role }) => {
            if (!userId) throw new ForbiddenError('invalid token');
            if (role === ROLES[1]) {
                const trainer = await prisma.jmktrinfo.findFirst({ where: { tr_id: userId } })
                if (!trainer) throw new AuthenticationError("invalid trainer credentials")
                const testSet = await prisma.jmkstdtestset.findFirst({ where: { serial: args.serial } })
                const student = await prisma.jmkstdinfo.findFirst({ where: { std_id: testSet.std_id } })
                const course = await prisma.jmkcrsinfo.findFirst({ where: { crs_id: testSet.crs_id } })
                const studentAns = await prisma.jmkstdtestqa.findMany({ where: { std_test_set_id: testSet.serial } })

                const studentQA = []
                let score = 0

                for (let index = 0; index < studentAns.length; index++) {
                    const question = await prisma.jmkquesans.findFirst({ where: { ques_id: studentAns[index].ques_id } })
                    if (question.rtans === studentAns[index].std_ans) {
                        score += 1
                    }
                    studentQA.push({
                        question: question.question,
                        rtans: question.rtans,
                        std_ans: studentAns[index].std_ans
                    })
                }


                const result = {
                    ...testSet,
                    ...student,
                    ...course,
                    score,
                    studentQA
                }

                return result;
            }
        },

        getTrainerStudentFeedback: async (_, args, { userId, role }) => {
            if (!userId) throw new ForbiddenError('invalid token');
            if (role === ROLES[1]) {
                const trainer = await prisma.jmktrinfo.findFirst({ where: { tr_id: userId } })
                if (!trainer) throw new AuthenticationError("invalid trainer credentials")
                const feenbacks = await prisma.jmkstdtrfeedback.findMany({ where: { std_id: args.std_id, tr_id: userId } })
                if (!feenbacks) throw new ApolloError("No Feedback")
                return feenbacks;
            }
        },


    },
    Mutation: {
        // admin 
        signinAdmin: async (_, { data }) => {
            const admin = await prisma.jmkuserinfo.findFirst({ where: { usr_email: data.usr_email } })
            if (!admin) throw new AuthenticationError("invalid admin credentials")
            const isMatch = data.usr_password == admin.usr_password;
            if (!isMatch) throw new AuthenticationError("invalid user credentials")
            const token = jwt.sign({ userId: admin.usr_id, role: admin.usr_role }, process.env.JWT_SECRET_KEY)
            return { token };
        },
        signupAdmin: async (_, { data }, { userId }) => {
            if (!userId) throw new AuthenticationError("invalid Token")
            const suAdmin = await prisma.jmkuserinfo.findFirst({ where: { usr_id: userId } })
            if (!suAdmin) throw new AuthenticationError("invalid admin credentials")
            if (suAdmin.usr_role !== 'admin') throw new AuthenticationError("You don't have acess to create admin")
            const admin = await prisma.jmkuserinfo.findFirst({ where: { usr_email: data.usr_email } })
            if (admin) throw new AuthenticationError("admin already exist with that email")
            const newAdmin = await prisma.jmkuserinfo.create({
                data: { ...data }
            })
            const token = jwt.sign({ userId: newAdmin.usr_id, role: data.usr_role }, process.env.JWT_SECRET_KEY)
            // await sendMail(newAdmin.usr_email, 'Successfully Register ', registerrHTML)
            // await sendMail('riwaz@jamuntek.com', 'New Admin Created !', newUserSignupNotification(newUser, course.crs_name))
            // await sendMail('jenish@jamuntek.com', 'New Admin Created !', newUserSignupNotification(newUser, course.crs_name))
            return { token };
        },
        updateAdmin: async (_, { data }, { userId, role }) => {
            if (!userId) throw new ForbiddenError('invalid token');
            const admin = await prisma.jmkuserinfo.findFirst({ where: { usr_id: userId, usr_role: role } })
            if (!admin) throw new AuthenticationError("invalid admin")
            const newAdmin = await prisma.jmkuserinfo.update({
                data: { ...data },
                where: { usr_id: userId, }
            })
            if (!newAdmin) throw new Error("something went wrong!!")
            return newAdmin
        },

        createCourse: async (_, { data }, { userId, role }) => {
            const access = ['admin']
            if (!userId) throw new ForbiddenError('invalid token');
            const admin = await prisma.jmkuserinfo.findFirst({ where: { usr_id: userId, usr_role: role } })
            if (!admin) throw new AuthenticationError("invalid admin")
            if (!access.includes(admin.usr_role)) throw new ForbiddenError('You dont have access to create course');
            let file;
            if (data.crs_image) {
                file = await uploadImgToAWS(data.crs_image, 'courses/')
                if (!file.data) throw new ApolloError('Someting went wrong !');
            }
            const newCourse = await prisma.jmkcrsinfo.create({
                data: { ...data, crs_image: file?.data?.Location ?? null, crs_image_key: file?.data?.key ?? '' }
            })
            if (!newCourse) throw new ApolloError("something went wrong !")
            return newCourse;
        },

        updateCourse: async (_, { data }, { userId, role }) => {
            const access = ['admin']
            if (!userId) throw new ForbiddenError('invalid token');
            const admin = await prisma.jmkuserinfo.findFirst({ where: { usr_id: userId, usr_role: role } })
            if (!admin) throw new AuthenticationError("invalid admin")
            if (!access.includes(admin.usr_role)) throw new ForbiddenError('You dont have access to create course');
            const crs = await prisma.jmkcrsinfo.findFirst({ where: { crs_id: data.crs_id } })
            if (!crs) throw new ApolloError("invalid course")
            await deleteImgToAWS(crs.crs_image_key)
            let file;
            if (data.crs_image) {
                file = await uploadImgToAWS(data.crs_image, 'courses/')
                if (!file.data) throw new ApolloError('Someting went wrong !');
            }
            const course = await prisma.jmkcrsinfo.update({
                data: { ...data, crs_image: file?.data?.Location ?? null, crs_image_key: file?.data?.key ?? '' },
                where: {
                    crs_id: parseInt(data.crs_id)
                }
            })
            if (!course) throw new ApolloError("something went wrong !")
            return "success";
        },

        deleteCourse: async (_, { data }, { userId, role }) => {
            const access = ['admin']
            if (!userId) throw new ForbiddenError('invalid token');
            const admin = await prisma.jmkuserinfo.findFirst({ where: { usr_id: userId, usr_role: role } })
            if (!admin) throw new AuthenticationError("invalid admin")
            if (!access.includes(admin.usr_role)) throw new ForbiddenError('You dont have access to create course');
            const crs = await prisma.jmkcrsinfo.findFirst({ where: { crs_id: data.crs_id } })
            await deleteImgToAWS(crs.crs_image_key)
            const course = await prisma.jmkcrsinfo.delete({ where: { crs_id: data.crs_id } })
            if (!course) throw new ApolloError("something went wrong !")
            return "success";
        },

        addQuestion: async (_, { data }, { userId, role }) => {
            if (!userId) throw new ForbiddenError('invalid token');
            if (role === ROLES[1]) {
                const trainer = await prisma.jmktrinfo.findFirst({ where: { tr_id: userId } })
                if (!trainer) throw new AuthenticationError("invalid trainer credentials")
                const question = await prisma.jmkquesans.create({
                    data: {
                        ...data
                    }
                });
                if (!question) throw new ApolloError('No Questions Found !');
                return 'success';
            }
        },

        updateQuestion: async (_, { data }, { userId, role }) => {
            if (!userId) throw new ForbiddenError('invalid token');
            if (role === ROLES[1]) {
                const trainer = await prisma.jmktrinfo.findFirst({ where: { tr_id: userId } })
                if (!trainer) throw new AuthenticationError("invalid trainer credentials")
                const question = await prisma.jmkquesans.update({
                    data: {
                        ...data
                    },
                    where: {
                        ques_id: data.ques_id
                    }
                });
                if (!question) throw new ApolloError('No Questions Found !');
                return 'success';
            }
        },

        updateStudentFromAdmin: async (_, { data }, { userId, role }) => {
            const access = ['admin']
            if (!userId) throw new ForbiddenError('invalid token');
            const admin = await prisma.jmkuserinfo.findFirst({ where: { usr_id: userId, usr_role: role } })
            if (!admin) throw new AuthenticationError("invalid admin")
            if (!access.includes(admin.usr_role)) throw new ForbiddenError('You dont have access to create course');
            const student = await prisma.jmkstdinfo.update({
                data: { ...data },
                where: { std_id: data.std_id }
            })
            if (!student) throw new AuthenticationError("Error")
            return 'success';
        },

        updateStudentCourseFromAdmin: async (_, { data }, { userId, role }) => {
            const access = ['admin']
            if (!userId) throw new ForbiddenError('invalid token');
            const admin = await prisma.jmkuserinfo.findFirst({ where: { usr_id: userId, usr_role: role } })
            if (!admin) throw new AuthenticationError("invalid admin")
            if (!access.includes(admin.usr_role)) throw new ForbiddenError('You dont have access to create course');
            const student = await prisma.jmkstdcrsinfo.update({
                data: { ...data },
                where: { serial: data.serial }
            })
            if (!student) throw new AuthenticationError("Error")
            return 'success';
        },

        // 
        signinUser: async (_, { userSignIn }) => {
            const user = await prisma.jmkstdinfo.findFirst({ where: { std_email: userSignIn.email } })
            if (!user) throw new AuthenticationError("invalid user credentials")
            const isMatch = userSignIn.password == user.std_password;
            if (!isMatch) throw new AuthenticationError("invalid user credentials")
            if (!user.std_verifyed) throw new ApolloError("You are not permitted to log in")
            const token = jwt.sign({ userId: user.std_id, role: ROLES[0] }, process.env.JWT_SECRET_KEY)
            return { token };
        },
        signupUser: async (_, { userNew }) => {
            const user = await prisma.jmkstdinfo.findFirst({ where: { std_email: userNew.std_email } })
            if (user) throw new AuthenticationError("user already exist with that email")
            const course = await prisma.jmkcrsinfo.findFirst({
                where: {
                    crs_id: userNew.crs_id
                }
            })
            if (!course) throw new AuthenticationError("invalid course")
            const newUser = await prisma.jmkstdinfo.create({
                data: { ...userNew }
            })
            await prisma.jmkstdcrsinfo.create({
                data: {
                    crs_id: userNew.crs_id,
                    crs_start_dt: userNew.crs_ecp_st_d,
                    std_id: newUser.std_id
                }
            })
            const token = jwt.sign({ userId: newUser.std_id, role: ROLES[0] }, process.env.JWT_SECRET_KEY)
            await sendMail(newUser.std_email, 'Successfully Register ', registerrHTML)
            await sendMail('riwaz@jamuntek.com', 'New User Singup Notification', newUserSignupNotification(newUser, course.crs_name))
            await sendMail('jenish@jamuntek.com', 'New User Singup Notification', newUserSignupNotification(newUser, course.crs_name))
            return { token };
        },
        signinTrainer: async (_, { data }) => {
            const trainer = await prisma.jmktrinfo.findFirst({ where: { tr_email: data.email } })
            if (!trainer) throw new AuthenticationError("invalid trainer credentials")
            const isMatch = data.password == trainer.tr_password;
            if (!isMatch) throw new AuthenticationError("invalid trainer credentials")
            if (!trainer.tr_verifyed) throw new ApolloError("You are not permitted to log in")
            const token = jwt.sign({ userId: trainer.tr_id, role: ROLES[1] }, process.env.JWT_SECRET_KEY)
            return { token };
        },
        signupTrainer: async (_, { data }) => {
            const trainer = await prisma.jmktrinfo.findFirst({ where: { tr_email: data.tr_email } })
            if (trainer) throw new AuthenticationError("trainer already exist with that email")
            let file;
            if (data.tr_resume) {
                file = await uploadImgToAWS(data.tr_resume, 'trainer_resume/')
                if (!file.data) throw new ApolloError('Someting went wrong !');
            }
            const newTrainer = await prisma.jmktrinfo.create({
                data: { ...data, tr_resume: file?.data?.Location ?? '', tr_resume_key: file?.data?.key ?? '' }
            })
            const token = jwt.sign({ userId: newTrainer.tr_id, role: ROLES[1] }, process.env.JWT_SECRET_KEY)
            // await sendMail(trainer.tr_email, 'Successfully Register ', registerrHTML)
            return { token };
        },

        signupDev: async (_, { data }) => {
            const dev = await prisma.jmkdevinfo.findFirst({ where: { developer_email: data.developer_email } })
            if (dev) throw new AuthenticationError("developer already exist with that email")
            let file;
            if (data.developer_resume) {
                file = await uploadImgToAWS(data.developer_resume, 'developer_resume/')
                if (!file.data) throw new ApolloError('Someting went wrong !');
            }
            const newDev = await prisma.jmkdevinfo.create({
                data: { ...data, developer_resume: file?.data?.Location ?? '', developer_resume_key: file?.data?.key ?? '' }
            })
            if (!newDev) throw new AuthenticationError("Invalid input")
            return 'success';
        },

        feedback: async (_, { data }, { userId }) => {
            if (!userId) throw new ForbiddenError('user need to login');
            const user = await prisma.jmkstdinfo.findFirst({ where: { std_id: userId } })
            if (!user) throw new AuthenticationError("invalid user")
            const grv = await prisma.jmkgrvinfo.findMany({ where: { std_id: userId } })
            const oldgrv = grv.find(item => item.grv_type === data.grv_type);
            if (oldgrv) {
                const updateFeedback = await prisma.jmkgrvinfo.update({
                    data: {
                        grv_type: data.grv_type,
                        grv_desc: data.grv_desc,
                        grv_rate: data.grv_rate
                    },
                    where: { grv_id: oldgrv.grv_id }
                })
                if (!updateFeedback) throw new Error("something went wrong!!")
                const newFeedback = await prisma.jmkgrvinfo.findMany({ where: { std_id: userId } })
                return newFeedback
            }
            const createFeedback = await prisma.jmkgrvinfo.create({
                data: {
                    std_id: userId,
                    grv_date: new Date(),
                    grv_type: data.grv_type,
                    grv_desc: data.grv_desc,
                    grv_rate: data.grv_rate
                }
            })
            if (!createFeedback) throw new Error("something went wrong!!")
            const newFeedback = await prisma.jmkgrvinfo.findMany({ where: { std_id: userId } })
            return newFeedback
        },
        updateUser: async (_, { data }, { userId }) => {
            if (!userId) throw new ForbiddenError('user need to login');
            const user = await prisma.jmkstdinfo.findFirst({ where: { std_id: userId } })
            if (!user) throw new AuthenticationError("invalid user")
            const newUser = await prisma.jmkstdinfo.update({
                data: {
                    std_fname: data.std_fname,
                    std_mname: data.std_mname,
                    std_lname: data.std_lname,
                    std_email: data.std_email,
                    std_mobile: data.std_mobile,
                    std_birth_dt: data.std_birth_dt,
                    std_password: data.std_password,
                },
                where: { std_id: userId, }
            })
            if (!newUser) throw new Error("something went wrong!!")
            return newUser
        },
        updateTrainer: async (_, { data }, { userId }) => {
            if (!userId) throw new ForbiddenError('user need to login');
            const trainer = await prisma.jmktrinfo.findFirst({ where: { tr_id: userId } })
            if (!trainer) throw new AuthenticationError("invalid trainer")
            const newTrainer = await prisma.jmktrinfo.update({
                data: {
                    tr_fname: data.tr_fname,
                    tr_mname: data.tr_mname,
                    tr_lname: data.tr_lname,
                    tr_email: data.tr_email,
                    tr_mobile: data.tr_mobile,
                    tr_city: data.tr_city,
                    tr_country: data.tr_country,
                    tr_main_tech1: data.tr_main_tech1,
                    tr_main_tech2: data.tr_main_tech2,
                    tr_main_tech3: data.tr_main_tech3,
                    tr_github: data.tr_github,
                    tr_linkedin: data.tr_linkedin,
                    tr_resume: data.tr_resume,
                    tr_dob: data.tr_dob,
                    tr_password: data.tr_password,
                },
                where: { tr_id: userId, }
            })
            if (!newTrainer) throw new Error("something went wrong!!")
            return newTrainer
        },
        demoRequest: async (_, { data }) => {
            const demoRequest = await prisma.jmkstddemo.create({
                data: { ...data }
            })
            if (!demoRequest) throw new ApolloError("Something wrong !!")
            await sendMail(demoRequest.std_email, 'Successfully Submit Demo Request ', demoRequestHTML)
            return 'Success'
        },
        contactForm: async (_, { data }) => {
            const contactForm = await prisma.jmkcontact.create({ data })
            if (!contactForm) throw new ApolloError("Something wrong !!")
            await sendMail(contactForm.cemail, 'Your Contact Form Has Been Received', contackFormHTML)
            return 'Success'
        },
        businessForm: async (_, { data }) => {
            const businessForm = await prisma.jmkcontactb.create({ data })
            if (!businessForm) throw new ApolloError("Something wrong !!")
            await sendMail(businessForm.bemail, 'Your Bussiness Form Has Been Received', contackFormHTML)
            return 'Success'
        },
        forgotPPEmailCheck: async (_, { data }) => {
            const user = await prisma.jmkstdinfo.findFirst({ where: { std_email: data.std_email } })
            if (!user) throw new AuthenticationError("user doesn't exist !!")
            const token = jwt.sign({ userId: user.std_id }, process.env.JWT_SECRET_KEY_FORGOT_PP, {
                expiresIn: "1d"
            })
            const url = `${process.env.CLIENT_URL}forgotpassword/verification?token=${token}`
            await sendMail(user.std_email, 'Reset your password !', forgotPasswordHTML(url))
            return 'Email send !!';
        },
        forgotPassword: async (_, { data }) => {
            if (!data.token) throw new AuthenticationError("Bad request !")
            const { userId } = jwt.verify(data.token, process.env.JWT_SECRET_KEY_FORGOT_PP);
            const user = await prisma.jmkstdinfo.findFirst({ where: { std_id: userId } })
            if (!user) throw new AuthenticationError("user doesn't exist !!")
            const reg = await prisma.jmkstdinfo.update({
                data: {
                    std_password: data.new_password,
                }, where: {
                    std_id: userId
                }
            })
            if (!reg) throw new AuthenticationError("someting went wrong !!")
            return 'success'
        },
        uploadFile: async (_, { file }, { userId }) => {
            if (!userId) throw new ForbiddenError('user need to login');
            const user = await prisma.jmkstdinfo.findFirst({ where: { std_id: userId } })
            if (!user) throw new ForbiddenError('Someting went wrong !');
            await deleteImgToAWS(user.std_pic_key)
            const data = await uploadImgToAWS(file, 'user_profiles_pic/')
            if (!data.data) throw new ApolloError('Someting went wrong !');
            const newUser = await prisma.jmkstdinfo.update({
                data: {
                    std_pic: data.data.Location,
                    std_pic_key: data.data.key
                },
                where: { std_id: userId, }
            })
            if (!newUser) throw new Error("something went wrong!!")
            return newUser
        },
        studentReview: async (_, { data }, { userId }) => {
            if (!userId) throw new ForbiddenError('user need to login');
            const user = await prisma.jmkstdinfo.findFirst({ where: { std_id: userId } })
            if (!user) throw new AuthenticationError("invalid user")
            const student_review = await prisma.jmkstdreview.create({
                data: {
                    std_id: userId,
                    std_rate: data.rate,
                    std_rate_date: new Date()
                }
            })
            if (!student_review) throw new Error("something went wrong!!")
            return 'success'
        },
        jamuntekReview: async (_, { data }) => {
            if (!data.rate) throw new ApolloError('bad request');
            const jamuntekReview = await prisma.jmkreview.create({
                data: {
                    rate: data.rate,
                    date: new Date()
                },
            })
            if (!jamuntekReview) throw new Error("something went wrong!!")
            return 'success'
        },
        addNewCourse: async (_, { data }, { userId }) => {
            if (!userId) throw new ForbiddenError('user need to login');
            const user = await prisma.jmkstdinfo.findFirst({ where: { std_id: userId } })
            const course = await prisma.jmkcrsinfo.findFirst({ where: { crs_id: parseInt(data.crs_id) } })
            const userCourse = await prisma.jmkstdcrsinfo.findFirst({ where: { std_id: userId, crs_id: parseInt(data.crs_id) } })
            if (!user) throw new AuthenticationError("invalid user")
            if (!course) throw new ApolloError("Bad Request")
            if (userCourse) throw new ApolloError("you already have this course")
            await prisma.jmkstdcrsinfo.create({
                data: {
                    crs_id: parseInt(data.crs_id),
                    crs_start_dt: data.crs_start_dt,
                    std_id: userId
                }
            })
            return 'success';
        },
        changeActiveCourse: async (_, { data }, { userId }) => {
            if (!userId) throw new ForbiddenError('user need to login');
            const user = await prisma.jmkstdinfo.findFirst({ where: { std_id: userId } })
            const course = await prisma.jmkcrsinfo.findFirst({ where: { crs_id: parseInt(data.crs_id) } })
            if (!user) throw new AuthenticationError("invalid user")
            if (!course) throw new ApolloError("Bad Request")
            const userCourse = await prisma.jmkstdcrsinfo.findFirst({
                where: {
                    std_id: userId,
                    crs_id: parseInt(data.crs_id)
                }
            })
            if (parseInt(data.crs_id) === user.crs_id) throw new ApolloError("Already selected")
            if (!userCourse.std_crs_verirfy) throw new ApolloError("your are not permited to use this course, wait for admin to approve or cantact our support !")
            const updateUser = await prisma.jmkstdinfo.update({
                data: {
                    crs_id: parseInt(data.crs_id)
                },
                where: { std_id: userId }
            })
            return updateUser;
        },
        removeCourseFromUser: async (_, { data }, { userId }) => {
            if (!userId) throw new ForbiddenError('user need to login');
            const user = await prisma.jmkstdinfo.findFirst({ where: { std_id: userId } })
            if (!user) throw new AuthenticationError("invalid user")
            if (!data.crs_id) throw new AuthenticationError("course id required")
            if (user.crs_id === parseInt(data.crs_id)) throw new AuthenticationError("Can't delete active course")
            const checkCourse = await prisma.jmkstdcrsinfo.findFirst({
                where: {
                    crs_id: parseInt(data.crs_id),
                    std_id: userId
                }
            })
            if (!checkCourse) throw new AuthenticationError("invalid")
            const deleteUserCourse = await prisma.jmkstdcrsinfo.delete({
                where: {
                    serial: checkCourse.serial
                }
            })
            if (!deleteUserCourse) throw new AuthenticationError("invalid !!")
            return 'success';
        },
        studentVideoNoteUpdate: async (_, { data }, { userId }) => {
            if (!userId) throw new ForbiddenError('user need to login');
            const user = await prisma.jmkstdinfo.findFirst({ where: { std_id: userId } })
            if (!user) throw new AuthenticationError("invalid user")
            const vid = await prisma.jmkvidinfo.findFirst({
                where: {
                    vid_id: data.vid_id,
                }
            })
            if (user.crs_id !== vid.crs_id) throw new AuthenticationError("invalid")
            const getStdNote = await prisma.jmkstdvidnote.findFirst({
                where: {
                    std_id: userId,
                    vid_id: data.vid_id,
                }
            })
            if (!getStdNote) {
                const note = await prisma.jmkstdvidnote.create({
                    data: {
                        std_id: userId,
                        vid_id: data.vid_id,
                        vid_note: data.vid_note
                    }
                })

                return note
            }
            const note = await prisma.jmkstdvidnote.update({
                data: {
                    vid_note: data.vid_note,
                },
                where: {
                    serial: data.serial
                }
            })
            return note
        },
        updateStudentAns: async (_, { data }, { userId }) => {
            if (!userId) throw new ForbiddenError('user need to login');
            const user = await prisma.jmkstdinfo.findFirst({ where: { std_id: userId } })
            if (!user) throw new AuthenticationError("invalid user")
            const questionsSet = await prisma.jmkstdtestset.findFirst({ where: { std_id: userId, isComplete: true, crs_id: user.crs_id, serial: parseInt(data[0].std_test_set_id) } })
            if (!questionsSet) throw new ApolloError("Invalid !")
            for (let index = 0; index < data.length; index++) {
                if (!data[index].std_ans) throw new AuthenticationError("std_ans id required")
                if (!data[index].std_test_set_id) throw new AuthenticationError("std_test_set_id id required")
                await prisma.jmkstdtestqa.update({
                    data: {
                        std_ans: data[index].std_ans
                    },
                    where: {
                        qserial: data[index].qserial
                    }
                })
            }
            return 'success';
        },
        addCourseContent: async (_, { data }, { userId, role }) => {
            if (!userId) throw new ForbiddenError('invalid aceess');
            if (role === ROLES[1]) {
                const trainer = await prisma.jmktrinfo.findFirst({ where: { tr_id: userId } })
                if (!trainer) throw new AuthenticationError("invalid Trainer credentials")
                const course = await prisma.jmkcrsinfo.findFirst({ where: { crs_id: parseInt(data.crs_id) } })
                if (!course) throw new ApolloError("Bad Request")
                const courseContent = await prisma.jmkcrscontents.create({
                    data: {
                        crs_id: data.crs_id,
                        content: data.content,
                        content_date: data.content_date
                    }
                })
                if (!courseContent) throw new ApolloError("something went wrong !")
                return 'success';
            }
            throw new ForbiddenError('Bad request !!');
        },
        updateCourseContent: async (_, { data }, { userId, role }) => {
            if (!userId) throw new ForbiddenError('invalid aceess');
            if (role === ROLES[1]) {
                const trainer = await prisma.jmktrinfo.findFirst({ where: { tr_id: userId } })
                if (!trainer) throw new AuthenticationError("invalid Trainer credentials")
                const courseContent = await prisma.jmkcrscontents.findFirst({
                    where: {
                        serial: data.serial
                    }
                })
                if (!courseContent) throw new ApolloError("Invalid !")
                const updateCourseContent = await prisma.jmkcrscontents.update({
                    data: {
                        content: data.content,
                        content_date: data.content_date
                    },
                    where: {
                        serial: data.serial
                    }
                })
                if (!updateCourseContent) throw new ApolloError("something went wrong !")
                return 'success';
            }
            throw new ForbiddenError('Bad request !!');
        },

        deleteCourseContent: async (_, { data }, { userId, role }) => {
            if (!userId) throw new ForbiddenError('invalid aceess');
            if (role === ROLES[1]) {
                const trainer = await prisma.jmktrinfo.findFirst({ where: { tr_id: userId } })
                if (!trainer) throw new AuthenticationError("invalid Trainer credentials")
                const deleteCourseContent = await prisma.jmkcrscontents.delete({
                    where: {
                        serial: data.serial
                    }
                })
                if (!deleteCourseContent) throw new ApolloError("something went wrong !")
                return 'success';
            }
            throw new ForbiddenError('Bad request !!');
        },


        addTrainerStudentFeedback: async (_, { data }, { userId, role }) => {
            if (!userId) throw new ForbiddenError('invalid aceess');
            if (role === ROLES[1]) {
                const trainer = await prisma.jmktrinfo.findFirst({ where: { tr_id: userId } })
                if (!trainer) throw new AuthenticationError("invalid Trainer credentials")
                const feedback = await prisma.jmkstdtrfeedback.create({
                    data: {
                        std_id: data.std_id,
                        tr_id: userId,
                        comment: data.comment,
                        content_date: new Date()
                    }
                })
                if (!feedback) throw new ApolloError("something went wrong !")
                return 'success';
            }
            throw new ForbiddenError('Bad request !!');
        },
        updateTrainerStudentFeedback: async (_, { data }, { userId, role }) => {
            if (!userId) throw new ForbiddenError('invalid aceess');
            if (role === ROLES[1]) {
                const trainer = await prisma.jmktrinfo.findFirst({ where: { tr_id: userId } })
                if (!trainer) throw new AuthenticationError("invalid Trainer credentials")
                const feedback = await prisma.jmkstdtrfeedback.findFirst({
                    where: {
                        serial: data.serial
                    }
                })
                if (!feedback) throw new ApolloError("Invalid !")
                const updateFeedback = await prisma.jmkstdtrfeedback.update({
                    data: {
                        ...feedback,
                        comment: data.comment,
                    },
                    where: {
                        serial: data.serial
                    }
                })
                if (!updateFeedback) throw new ApolloError("something went wrong !")
                return 'success';
            }
            throw new ForbiddenError('Bad request !!');
        },

        deleteTrainerStudentFeedback: async (_, { data }, { userId, role }) => {
            if (!userId) throw new ForbiddenError('invalid aceess');
            if (role === ROLES[1]) {
                const trainer = await prisma.jmktrinfo.findFirst({ where: { tr_id: userId } })
                if (!trainer) throw new AuthenticationError("invalid Trainer credentials")
                const deleteFeedback = await prisma.jmkstdtrfeedback.delete({
                    where: {
                        serial: data.serial
                    }
                })
                if (!deleteFeedback) throw new ApolloError("something went wrong !")
                return 'success';
            }
            throw new ForbiddenError('Bad request !!');
        },

    },

}

export default resolvers;