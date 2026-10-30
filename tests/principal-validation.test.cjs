require('./setup.cjs');
const { db, reset, contexts } = require('./support.cjs');
const { AuthenticationError, ForbiddenError } = require('apollo-server-express');
const controllerCases = [
  ['admin', 'jmkuserinfo', contexts.admin, {
    adminResolvers: 'updateAdmin createStudentFromAdmin updateStudentFromAdmin updateStudentCourseFromAdmin updateTrainerFromDashboard createTrainerFromDashboard assignTrainerCourseFromDashboard removeTrainerCourseFromDashboard updateContactInfo createNewUser updateSelectedUser deleteUserById updatePaymentStatus createAndUpdateFaq deleteFaqById createAndUpdateWebDetails createAndUpdateModal createAndUpdateCareer deleteCareer createAndUpdateCourseCategory createAndUpdateService deleteServiceById createAndUpdatePolicy createAndUpdatePartner deletePartnerById createAndUpdatePromo deletePromoById sendEmailByUser createPackageReq deletePackageReq createOrUpdateCertLayout updateOurPackage',
    adminResolversQuery: 'admin getstudentForAdmin getstudentByIdForAdmin getTrainerDataForAdmin getTrainerByIdForAdmin getstudentCourseByIdForAdmin getAdminDashboard getAllUserInfo getUserInfoById getPaymentInfo getFaqs getWebModal getAllCareer getCareer getStudentCourseRequest getCourseCategories getCourseCategory getService getPartnerShipReq getPartnerShipReqById getJobReqs getJobReqById getContactReqs getContactReqById getPropmo getPropmoById getStudentPayments getPackageUpdateReq getTrainerAttendanceFromAdmin getTrainerAttendanceFromAdminById',
  }],
  ['trainer', 'jmktrinfo', contexts.trainer, {
    trainerResolvers: 'activeSession updateTrainer updateTrainerPic updateTrainerPassword addWeek updateWeek deleteWeek addTrainerWeekContentById updateTrainerWeekContentById deleteTrainerWeekContentById createAndUpdateQuestionVoteTrainer createQuesAnsTrainer createGroupChat createAndUpdatePage deletePage updateStudentCourseFromTrainer addTrainerAttendance',
    trainerResolversQuery: 'getWeekContentBasedonActiveSession getWeekDetailsById getContentByWeekId getContentByContentId getAssignedCourses getTrainerDashboard getstudentForTrainer getStudentById getWeekContentTests getStdQuestionForTrainer getStdQuestionByIdForTrainer getStdRandomQuestionsForTrainer getStdQuesAnsForTrainer getQuestionAnsVoteForTrainer getAllRelatedCrsStdForTrainer getStudentChatForTrainer getPagesTrainer getPageTrainer getTrainerAttendance',
  }],
  ['student', 'jmkstdinfo', contexts.student, {
    studentResolvers: 'updateUser updateUserPassword uploadFile addNewCourse changeActiveCourse submitProject createStdQuestion updateStdQuestion deleteStdQuestion createQuesAns updateQuesAns createAndUpdateQuestionVote createAndUpdateStdQuesSub submitStdTestAns createStdNote deleteStdNote createAndUpdateTodo deleteTodo createStudentPayment applyCourseCoupon addCommentOnPage chatWithAi',
    studentResolversQuery: 'me courseList userCourseList getActiveUserCourse getWeeklyTest getStuentChatList getNote getAllNote getStudentCourseWeek getStudentCourseWeekContent getStudentCourseResult getStudentChats getStdQuestions getStdRandomQuestions getStdQuestionById getStdQuesAns getQuestionAnsVote getStdQuesSub getStdCrsRelatedQuesInfo getPagesStudent getPageStudent getStudentAttendance getStudentDashboardData',
  }],
];
beforeEach(reset);
for (const [name, model, ctx, groups] of controllerCases) {
  const mod = require(`../controller/${name}/index.js`);
  for (const [group, operations] of Object.entries(groups)) for (const operation of operations.split(' ')) {
    test(`${name}.${operation} rejects deleted or unknown principal`, async () => {
      const result = mod[group][operation](null, { data: {}, file: 'upload' }, ctx);
      await expect(result).rejects.toEqual(expect.any(Error));
      await result.catch(error => {
        expect(error instanceof AuthenticationError || error instanceof ForbiddenError).toBe(true);
      });
      expect(db[model].findFirst).toHaveBeenCalled();
    });
  }
}
