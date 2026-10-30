require('./setup.cjs');
const { reset, db } = require('./support.cjs');
const { AuthenticationError } = require('apollo-server-express');
const protectedOperations = {
  "admin": {
    "adminResolvers": [
      "updateStatus",
      "deleteBlog",
      "updateBlog",
      "addBlog",
      "updateAdmin",
      "createStudentFromAdmin",
      "updateStudentFromAdmin",
      "updateStudentCourseFromAdmin",
      "updateTrainerFromDashboard",
      "createTrainerFromDashboard",
      "assignTrainerCourseFromDashboard",
      "removeTrainerCourseFromDashboard",
      "updateContactInfo",
      "createNewUser",
      "updateSelectedUser",
      "deleteUserById",
      "updatePaymentStatus",
      "createAndUpdateFaq",
      "deleteFaqById",
      "createAndUpdateWebDetails",
      "createAndUpdateModal",
      "createAndUpdateCareer",
      "deleteCareer",
      "createAndUpdateCourseCategory",
      "createAndUpdateTestimonial",
      "deleteTestimonialById",
      "createAndUpdateService",
      "deleteServiceById",
      "createAndUpdatePolicy",
      "createAndUpdatePartner",
      "deletePartnerById",
      "createAndUpdatePromo",
      "deletePromoById",
      "sendEmailByUser",
      "createAndUpdatePayment",
      "deleteCompanyPayment",
      "createPackageReq",
      "updatePackageReq",
      "deletePackageReq",
      "createOrUpdateCertLayout",
      "updateOurPackage"
    ],
    "adminResolversQuery": [
      "admin",
      "getPayments",
      "getstudentForAdmin",
      "getstudentByIdForAdmin",
      "getTrainerDataForAdmin",
      "getTrainerByIdForAdmin",
      "getstudentCourseByIdForAdmin",
      "getAdminDashboard",
      "getAllUserInfo",
      "getUserInfoById",
      "getPaymentInfo",
      "getFaqs",
      "getWebModal",
      "getAllCareer",
      "getCareer",
      "getStudentCourseRequest",
      "getCourseCategories",
      "getCourseCategory",
      "getService",
      "getPartnerShipReq",
      "getPartnerShipReqById",
      "getJobReqs",
      "getJobReqById",
      "getContactReqs",
      "getContactReqById",
      "getPropmo",
      "getPropmoById",
      "getBlogs",
      "getBlog",
      "getCompanyPayments",
      "getCompanyPaymentById",
      "getStudentPayments",
      "getPackageUpdateReq",
      "getTrainerAttendanceFromAdmin",
      "getTrainerAttendanceFromAdminById"
    ]
  },
  "common": {
    "commonResolvers": [
      "createCourse",
      "updateCourse",
      "deleteCourse",
      "deleteNotification",
      "deleteAllNotification",
      "updateNotification",
      "updateAttendance",
      "userActiveTime",
      "createTicket",
      "updateTicket",
      "addCourseSyllabus"
    ],
    "commonResolversQuery": [
      "getAllCourseList",
      "getCourseById",
      "getMyNotifications",
      "getTestimonial",
      "getAttendance",
      "getAttendanceByStudentId",
      "getTickets",
      "getTicket",
      "getCertLayout"
    ]
  },
  "company": {
    "companyResolvers": [
      "updateCompany"
    ],
    "companyResolversQuery": [
      "getCompany",
      "getCompanyList"
    ]
  },
  "trainer": {
    "trainerResolvers": [
      "activeSession",
      "updateTrainer",
      "updateTrainerPic",
      "updateTrainerPassword",
      "addWeek",
      "updateWeek",
      "deleteWeek",
      "addTrainerWeekContentById",
      "updateTrainerWeekContentById",
      "deleteTrainerWeekContentById",
      "createAndUpdateQuestionVoteTrainer",
      "createQuesAnsTrainer",
      "createGroupChat",
      "createAndUpdatePage",
      "deletePage",
      "updateStudentCourseFromTrainer",
      "addTrainerAttendance"
    ],
    "trainerResolversQuery": [
      "getWeekContentBasedonActiveSession",
      "getWeekDetailsById",
      "getContentByWeekId",
      "getContentByContentId",
      "getAssignedCourses",
      "trainer",
      "getTrainerDashboard",
      "getstudentForTrainer",
      "getStudentById",
      "getWeekContentTests",
      "getStdQuestionForTrainer",
      "getStdQuestionByIdForTrainer",
      "getStdRandomQuestionsForTrainer",
      "getStdQuesAnsForTrainer",
      "getQuestionAnsVoteForTrainer",
      "getAllRelatedCrsStdForTrainer",
      "getStudentChatForTrainer",
      "getPagesTrainer",
      "getPageTrainer",
      "getTrainerAttendance"
    ]
  },
  "student": {
    "studentResolvers": [
      "updateUser",
      "updateUserPassword",
      "uploadFile",
      "addNewCourse",
      "changeActiveCourse",
      "submitProject",
      "createStdQuestion",
      "updateStdQuestion",
      "deleteStdQuestion",
      "createQuesAns",
      "updateQuesAns",
      "createAndUpdateQuestionVote",
      "createAndUpdateStdQuesSub",
      "submitStdTestAns",
      "createStdNote",
      "deleteStdNote",
      "createAndUpdateTodo",
      "deleteTodo",
      "createMessage",
      "isTypingMessage",
      "updateMessageSeen",
      "createStudentPayment",
      "applyCourseCoupon",
      "addCommentOnPage",
      "submitAttendance",
      "takeAttendance",
      "chatWithAi"
    ],
    "studentResolversQuery": [
      "me",
      "courseList",
      "userCourseList",
      "getActiveUserCourse",
      "getWeeklyTest",
      "getStuentChatList",
      "getNote",
      "getAllNote",
      "getStudentCourseWeek",
      "getStudentCourseWeekContent",
      "getStudentCourseResult",
      "getStudentChats",
      "getStdQuestions",
      "getStdRandomQuestions",
      "getStdQuestionById",
      "getStdQuesAns",
      "getQuestionAnsVote",
      "getStdQuesSub",
      "getStdCrsRelatedQuesInfo",
      "getPagesStudent",
      "getPageStudent",
      "getStudentAttendance",
      "getStudentDashboardData"
    ]
  }
};
beforeEach(reset);
for (const [name, groups] of Object.entries(protectedOperations)) {
  const mod = require(`../controller/${name}/index.js`);
  for (const [group, operations] of Object.entries(groups)) for (const operation of operations) {
    const resolver = mod[group][operation];
    test(`${name}.${operation} rejects missing authentication before database access`, async () => {
      const result = resolver(null, { data: {}, userSignIn: {} }, { role: 'student' });
      if (['updateStatus', 'deleteBlog', 'updateBlog', 'addBlog'].includes(operation)) {
        await expect(result).resolves.toBeInstanceOf(AuthenticationError);
      } else {
        await expect(result).rejects.toBeInstanceOf(Error);
      }
      for (const delegate of Object.values(db)) for (const mock of Object.values(delegate)) expect(mock).not.toHaveBeenCalled();
    });
  }
}
