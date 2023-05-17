import { gql } from 'apollo-server-express'

const typeDefs = gql`
   scalar Date 
   scalar Upload 

   input signinTrainerInput{
      email: String!
      password: String!
   }

   input SigninInput{
      email: String!
      password: String!
   }


   input SignupInput{
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

   input signupTrainerInput{
      tr_fname: String!
      tr_mname: String
      tr_lname: String!
      tr_mobile: String!
      tr_email: String!
      tr_password: String!
      tr_city: String
      tr_country: String
      tr_main_tech1: String
      tr_main_tech2: String
      tr_main_tech3: String
      tr_dob: Date
      tr_resume: Upload!
      tr_github: String
      tr_linkedin: String
   }

   input signinDevInut {
      developer_fname: String!
      developer_mname: String
      developer_lname: String!
      developer_high_qualification: String
      developer_phone: String!
      developer_email: String!
      developer_password: String!
      developer_country: String!
      developer_tech1: String!
      developer_tech2: String
      developer_tech3: String
      developer_tech1_exp: String!
      developer_tech2_exp: String
      developer_tech3_exp: String
      developer_resume: Upload
      developer_company1: String!
      developer_company1_project: String!
      developer_company1_start: Date!
      developer_company2: String
      developer_company2_start: Date
      developer_company2_end: Date
      developer_company2_project: String
      developer_type: String!
   }

   input GrievancesInput {
      grv_type: String!
      grv_desc: String!
      grv_rate: String!
   }

   input UpdateUserInput {
      std_fname: String!
      std_mname: String
      std_lname: String!
      std_email: String!
      std_mobile: String!
      std_birth_dt: String
      std_password: String
   }


   input updateTrainerInput {
      tr_fname: String
      tr_mname: String
      tr_lname: String
      tr_email: String
      tr_mobile: String
      tr_dob: String
      tr_password: String
      tr_city: String
      tr_country: String
      tr_main_tech1: String
      tr_main_tech2: String
      tr_main_tech3: String
      tr_github: String
      tr_linkedin: String
      tr_resume: Upload
   }

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

   input forgotPPEmailCheckInput {
      std_email: String!
   }

   input forgotPasswordInput {
      token: String!
      new_password: String!
   }

   input jamuntekReviewInput {
      rate: String!
   }

   input studentReviewInput {
      rate: String!
   }

   input addNewCourseInput {
      crs_id: ID!
      crs_start_dt: Date!
   }

   input removeCourseFromUserInput   {
      crs_id: ID!
   }

   input changeActiveCourseInput {
      crs_id: ID!
   }

   input studentVideoNoteUpdateInput {
      serial: Int
      vid_id: Int!
      vid_note: String!
   }

   input updateStudentAnsInput {
      qserial: Int!
      std_ans: String!
      std_test_set_id: Int!
   }

   input addCourseContentInput {
      crs_id: Int!
      content: String!
      content_date: Date
   }

   input updateCourseContentInput {
      serial: Int!
      content: String!
      content_date: Date
   }

   input deleteCourseContentInput {
      serial: Int!
   }

   input signinAdminInput {
      usr_email: String!
      usr_password: String!
   }

   input signupAdminInput {
      usr_email: String!
      usr_password: String!
      usr_role: String!
      usr_code:String
   }

   input updateAdminInput {
      usr_email: String
      usr_password: String
      usr_role: String
      usr_code:String
   }

   input createCourseInput {
      crs_name: String!
      crs_desc: String!
      crs_duration: Int!
      crs_rate: Int!
      crs_cat: String
      crs_con: String
      crs_ins: String!
      crs_type: String!
      crs_nxt_st_date: Date!
      crs_image: Upload
   }

   input updateCourseInput {
      crs_id: Int!
      crs_name: String
      crs_desc: String
      crs_duration: Int
      crs_rate: Int
      crs_cat: String
      crs_con: String
      crs_ins: String
      crs_type: String
      crs_image: Upload
      crs_nxt_st_date: Date
   }

   input deleteCourseInput {
      crs_id: Int!
   }

   input addQuestionInput {
      question: String!
      mod_id: Int!
      ans1: String!
      ans2: String!
      ans3: String!
      ans4: String!
      rtans: String!
   }

   input updateQuestionInput {
      ques_id: Int!
      question: String
      mod_id: Int
      ans1: String
      ans2: String
      ans3: String
      ans4: String
      rtans: String
   }

   input addTrainerStudentFeedbackInput {
      std_id: Int!
      comment: String!
   }

   input updateTrainerStudentFeedbackInput {
      serial: Int!
      comment: String!
   }

   input deleteTrainerStudentFeedbackInput {
      serial: Int!
   }

   input updateStudentFromAdminInput {
      std_id: Int!
      std_fname: String!
      std_mname: String
      std_lname: String!
      std_email: String!
      std_mobile: String!
      std_password: String!
      std_join_dt: Date!
      std_birth_dt: Date!
      std_verifyed: Boolean!
   }

   input updateStudentCourseFromAdminInput {
      serial : Int!
      discount: Int
      amt_paid: Int
      amt_due: Int
      std_crs_verirfy: Boolean
      crs_complete: Boolean
      crs_complete_date: Date
   }

   type Feedback {
      grv_id : ID!
      std_id: String!
      grv_date: Date!   
      grv_type: String!
      grv_rate: String!     
      grv_desc: String!   
   }

   type UserCourse {
      serial : ID!
      crs_id: ID!
      crs_start_dt: Date
      std_id: ID!
      crs_name: String!
      discount: Int
      amt_paid: Int
      amt_due: Int
      crs_rate: Int
      std_crs_verirfy: Boolean
      crs_complete: Boolean
      crs_complete_date: Date
   }

   type ActiveUserCourse {
      serial : ID
      crs_id: ID
      crs_start_dt: Date
      std_id: ID
      crs_name: String
      discount: Int
      amt_paid: Int
      amt_due: Int
      crs_rate: Int
   }

   type Token {
      token : String!
   }
   
   type User {
      std_id: ID!
      std_fname: String!
      std_mname: String
      std_lname: String!
      std_email: String!
      std_pic: String
      crs_complete: Boolean
      crs_complete_date: Date
      std_password: String!
      std_mobile: String!
      std_join_dt: Date
      std_birth_dt: Date
      std_high_ql: String
      crs_id: ID!
      std_status: Int
      std_paidup: Int
      std_due: Int
      feedback: [Feedback]
   }

   type Trainer {
      tr_id: ID!
      tr_fname: String!
      tr_mname: String
      tr_lname: String!
      tr_email: String!
      tr_mobile: String!
      tr_city: String
      tr_country: String
      tr_main_tech1: String
      tr_main_tech2: String
      tr_main_tech3: String
      tr_dob: Date
      tr_resume: String
      tr_github: String
      tr_linkedin: String
   }

   type Video {
      vid_id: String!
      vid_name: String!
      vid_loc: String
      crs_id: String!
      vid_date: Date!
      vid_summary: String!
   }

   type VideoNote {
      serial: ID!
      vid_id: ID!
      std_id: ID!
      vid_note: String!
   }

   type Course {
      crs_id: ID!
      crs_name: String!
      crs_desc: String!
      crs_cat: String
      crs_con: String
      crs_cat_id: String
      crs_con_id: String
      crs_duration: String
      crs_rate: String
      crs_ins: String!
      crs_type: String!
      crs_nxt_st_date:Date
      crs_image:String
   }

   type TrainerCourse {
      crs_id: ID!
      crs_name: String!
      crs_desc: String!
      crs_cat: String
      crs_con: String
      crs_cat_id: String
      crs_con_id: String
      crs_duration: String
      crs_rate: String
      crs_ins: String!
      crs_type: String!
      total_videos: Int!
      total_student: Int!
   }

   type PublicCourse {
      crs_id: ID!
      crs_name: String!
      crs_type: String!
      crs_nxt_st_date : Date
   }

   type PublicCourseType {
      crs_type: String!
      courses:[PublicCourse]
   }

   type Question {
      ques_id: ID!
      question: String!
      mod_id: Int!
      ans1: String!
      ans2: String!
      ans3: String!
      ans4: String!
   }

   type QuestionAdmin {
      ques_id: ID!
      question: String!
      mod_id: Int!
      ans1: String!
      ans2: String!
      ans3: String!
      ans4: String!
      rtans: String!
   }
   
   type StudentQuestionSet {
      serial: Int!
      std_id: Int!
      crs_id: Int!
      timer: Int!
      test_category: String!
   }

   type StdQuestion {
      qserial: Int!
      ques_id: Int!
      std_ans: String
      std_test_set_id: Int!
   }

   type StdQuestionType {
      questionsSet: StudentQuestionSet!
      questions: [StdQuestion]
   }

   type CourseContents {
      serial: Int!
      content: String!
      content_date: Date!
   }


   type Admin {
      usr_id: Int!
      usr_code: String
      usr_email: String!
      usr_role: String!
   }

   type QuestionModule {
      mod_id: Int!
      mod_code: String
      mod_name: String!
      total_question: Int!
   }

   type TrainerStudent {
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
   }
   
   type AdminStudent {
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

   type AdminTrainer {
      tr_id: ID!
      tr_fname: String!
      tr_mname: String
      tr_lname: String!
      tr_mobile:String
      tr_email: String
      tr_city:String
      tr_country: String
      tr_main_tech1:String
      tr_main_tech2: String
      tr_main_tech3:String
      tr_dob: String
      tr_verifyed:Boolean
      tr_password:String!
      tr_resume:String
      tr_github:String
      tr_linkedin:String
      tr_resume_key:String
      
   }

   type StudentTestSet {
      serial: Int!
      std_lname: String!
      std_fname: String!
      std_mname: String
      std_email: String!
      crs_name: String!
      crs_type: String!
      isComplete: Boolean!
      timer: Int!
   }


   type studentQA {
      question: String!
      rtans: String!
      std_ans: String
   }
   
   type StudentTestResult {
      std_lname: String!
      std_fname: String!
      std_mname: String
      std_email: String!
      crs_name: String!
      crs_type: String!
      isComplete: Boolean!
      timer: Int!
      score:Int!
      studentQA: [studentQA]
   }

   type TrainerStudentFeedback {
      serial: Int!
      std_id: Int!
      tr_id: Int!
      comment: String!
      content_date: Date!
   }

   type TrainerDashboard {
      students: Int
      courses: Int
      videos: Int
   }

   type Query {
      me:User!
      trainer:Trainer!
      admin:Admin!
      myDailyVideo:[Video]
      myDailyVideoByid(vid_id:Int!):Video!
      myCourse:Course,
      myCourseContents:[CourseContents],
      myCourseContent(id:Int!):CourseContents,
      getCourseContentsByCrsId(crs_id:Int!):[CourseContents]
      courseList:[PublicCourseType]
      userCourseList:[UserCourse]
      studentVideoNote(vid_id:Int!): VideoNote!
      questionSetList:[StudentQuestionSet]
      getTestQuestion(set_id:Int!):StdQuestionType!
      getQuestionByid(ques_id:Int!):Question!
      getQuestionVidew(set_id:Int!):String!
      getActiveUserCourse: ActiveUserCourse
      getTrainerCourses: [TrainerCourse]
      getAllCourseList:[Course!]!
      getCourseById(crs_id:Int!):Course!

      getQuestionModule:[QuestionModule]
      getQuestionByModuleId(mod_id:Int!):[Question!]!
      getQuestionByQuestionId(ques_id:Int!):QuestionAdmin!

      getTrainerDashboard:TrainerDashboard
      getstudentForTrainer:[TrainerStudent!]!
      getstudentTestSetForTrainer:[StudentTestSet!]!
      getstudentTestResultById(serial:Int!):StudentTestResult

      getTrainerStudentFeedback(std_id:Int!):[TrainerStudentFeedback]

      getstudentForAdmin:[AdminStudent]
      getstudentByIdForAdmin(std_id:Int!):AdminStudent
      getstudentCourseByIdForAdmin(serial:Int!):UserCourse

      getTrainerDataForAdmin:[AdminTrainer]
      getTrainerByIdForAdmin(std_id:Int!):AdminTrainer

   }

   type Mutation {
      signinUser(userSignIn:SigninInput!):Token
      signupUser(userNew:SignupInput!):Token
      updateUser(data:UpdateUserInput):User

      feedback(data:GrievancesInput!):[Feedback]
      demoRequest(data:demoRequestInput):String
      contactForm(data:contactFormInput):String
      businessForm(data:businessFormInput):String
      forgotPPEmailCheck(data:forgotPPEmailCheckInput): String!
      forgotPassword(data:forgotPasswordInput):String!
      uploadFile(file: Upload!): User
      jamuntekReview(data:jamuntekReviewInput):String
      studentReview(data:studentReviewInput):String

      
      addCourseContent(data:addCourseContentInput):String!
      updateCourseContent(data:updateCourseContentInput):String!
      deleteCourseContent(data:deleteCourseContentInput):String!

      addNewCourse(data:addNewCourseInput):String!
      changeActiveCourse(data:changeActiveCourseInput):User!
      removeCourseFromUser(data:removeCourseFromUserInput):String!


      signupTrainer(data:signupTrainerInput!):Token
      signinTrainer(data:signinTrainerInput!):Token
      updateTrainer(data:updateTrainerInput):Trainer!

      studentVideoNoteUpdate(data:studentVideoNoteUpdateInput):VideoNote!
      updateStudentAns(data:[updateStudentAnsInput]):String!

      signupDev(data:signinDevInut):String!

      signinAdmin(data:signinAdminInput!):Token
      signupAdmin(data:signupAdminInput!):Token
      updateAdmin(data:updateAdminInput):Admin!

      createCourse(data:createCourseInput!):Course
      updateCourse(data:updateCourseInput!):String!
      deleteCourse(data:deleteCourseInput):String

      addQuestion(data:addQuestionInput!):String!
      updateQuestion(data:updateQuestionInput!):String!

      addTrainerStudentFeedback(data:addTrainerStudentFeedbackInput!):String!
      updateTrainerStudentFeedback(data:updateTrainerStudentFeedbackInput!):String!
      deleteTrainerStudentFeedback(data:deleteTrainerStudentFeedbackInput):String!

      updateStudentFromAdmin(data:updateStudentFromAdminInput):String!
      updateStudentCourseFromAdmin(data:updateStudentCourseFromAdminInput):String!

   }
`;

export default typeDefs