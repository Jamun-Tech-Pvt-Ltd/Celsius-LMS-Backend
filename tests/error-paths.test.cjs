require('./setup.cjs');
const { db, reset, identities, contexts, admin, student, trainer, course, company } = require('./support.cjs');
const a = require('../controller/admin/index.js');
const t = require('../controller/trainer/index.js');
const s = require('../controller/student/index.js');
const c = require('../controller/common/index.js');
const { ApolloError } = require('apollo-server-express');
beforeEach(() => { reset(); identities(); });
const invoke = (resolvers, name, data, ctx) => resolvers[name](null, { data, serial: 7, faq_id: 7, crs_id: 20, pay_id: 7, usrId: 9, std_id: 2, content_id: 8, week_id: 7, question_id: 7 }, ctx);
for (const [name, model, method, data, ctx] of [
  ['updateAdmin', 'jmkuserinfo', 'update', {}], ['updateStudentFromAdmin', 'jmkstdinfo', 'update', { std_id: 2 }], ['updateTrainerFromDashboard', 'jmktrinfo', 'update', { tr_id: 3 }],
  ['createTrainerFromDashboard', 'jmktrinfo', 'create', {}], ['assignTrainerCourseFromDashboard', 'jmktrcrsinfo', 'create', {}], ['removeTrainerCourseFromDashboard', 'jmktrcrsinfo', 'delete', {}],
  ['createAndUpdateCareer', 'jmk_web_career', 'create', {}], ['createAndUpdateCareer', 'jmk_web_career', 'update', { serial: 7 }],
  ['createAndUpdateFaq', 'jmkfaq', 'create', {}], ['createAndUpdateFaq', 'jmkfaq', 'update', { faq_id: 7 }],
  ['createAndUpdateCourseCategory', 'jmk_crs_categories', 'create', { icon: 'upload' }], ['createAndUpdateCourseCategory', 'jmk_crs_categories', 'update', { serial: 7 }],
  ['createAndUpdateService', 'jmk_services', 'create', { icon: 'upload' }], ['createAndUpdateService', 'jmk_services', 'update', { serial: 7 }],
  ['createAndUpdatePartner', 'jmk_partner_ui', 'create', { icon: 'upload' }], ['createAndUpdatePartner', 'jmk_partner_ui', 'update', { serial: 7 }],
  ['createAndUpdatePromo', 'jmk_promo_code', 'create', {}], ['createAndUpdatePromo', 'jmk_promo_code', 'update', { serial: 7 }],
  ['createAndUpdatePolicy', 'jmk_policy', 'create', {}], ['createAndUpdatePolicy', 'jmk_policy', 'update', { serial: 7 }],
  ['createAndUpdateModal', 'jmk_web_modal', 'create', { img: 'upload' }], ['createAndUpdateModal', 'jmk_web_modal', 'update', { img: 'upload' }],
  ['createAndUpdateTestimonial', 'jmk_testimonial', 'create', { usr_img: 'upload' }, contexts.internal], ['createAndUpdateTestimonial', 'jmk_testimonial', 'update', { serial: 7 }, contexts.internal],
  ['deleteCareer', 'jmk_web_career', 'delete', {}], ['deletePromoById', 'jmk_promo_code', 'delete', {}], ['deleteCompanyPayment', 'jmktcompanypay', 'delete', {}, contexts.internal],
  ['createPackageReq', 'jmk_company_package_req', 'create', {}], ['createPackageReq', 'jmk_company_package_req', 'update', { serial: 7 }],
  ['updatePackageReq', 'jmk_company_package_req', 'update', {}, contexts.internal], ['deletePackageReq', 'jmk_company_package_req', 'delete', {}],
  ['createOrUpdateCertLayout', 'jmk_com_cer_layout', 'create', { logo: 'logo', background: 'bg', signature: 'sign' }], ['createOrUpdateCertLayout', 'jmk_com_cer_layout', 'update', {}],
  ['createNewUser', 'jmkuserinfo', 'create', {}], ['updateSelectedUser', 'jmkuserinfo', 'update', { usr_id: 9 }], ['deleteUserById', 'jmkuserinfo', 'delete', {}],
]) test(`admin ${name} reports unsuccessful ${model}.${method}`, async () => {
  const existing = { serial: 7, faq_id: 7, status: 'Pending', img: 'old', company_id: 10 };
  if (['update', 'delete'].includes(method)) db[model].findFirst.mockResolvedValue(existing);
  if (model === 'jmkuserinfo') db.jmkuserinfo.findFirst.mockResolvedValueOnce(admin()).mockResolvedValue(method === 'create' ? null : { ...admin(), usr_role: 'staff' });
  if (name === 'createTrainerFromDashboard') db.jmktrinfo.findFirst.mockResolvedValue(null);
  if (name === 'removeTrainerCourseFromDashboard') db.jmktrcrsinfo.findFirst.mockResolvedValue(existing);
  db[model][method].mockResolvedValue(null);
  await expect(invoke(a.adminResolvers, name, data, ctx || contexts.admin)).rejects.toThrow(/wrong|Error|fail|invalid id/i);
  expect(db[model][method]).toHaveBeenCalled();
});
for (const [name, model, method] of [
  ['getFaqs', 'jmkfaq', 'findMany'], ['getWebModal', 'jmk_web_modal', 'findFirst'], ['getAllCareer', 'jmk_web_career', 'findMany'], ['getCareer', 'jmk_web_career', 'findFirst'], ['getStudentCourseRequest', 'jmkstdcrsinfo', 'findMany'], ['getCourseCategories', 'jmk_crs_categories', 'findMany'], ['getCourseCategory', 'jmk_crs_categories', 'findFirst'], ['getServices', 'jmk_services', 'findMany'], ['getService', 'jmk_services', 'findFirst'], ['getPolicy', 'jmk_policy', 'findFirst'], ['getPartners', 'jmk_partner_ui', 'findMany'], ['getPartner', 'jmk_partner_ui', 'findFirst'], ['getPartnerShipReq', 'jmkpartnerReq', 'findMany'], ['getPartnerShipReqById', 'jmkpartnerReq', 'findFirst'], ['getJobReqs', 'jmkjobReq', 'findMany'], ['getJobReqById', 'jmkjobReq', 'findFirst'], ['getContactReqs', 'jmkcontact', 'findMany'], ['getContactReqById', 'jmkcontact', 'findFirst'],
]) test(`admin ${name} reports missing records`, async () => {
  db[model][method].mockResolvedValue(null);
  await expect(invoke(a.adminResolversQuery, name, {}, contexts.admin)).rejects.toThrow('Data Not Found');
});
test('internal FAQs support creation, updates and duplicate detection', async () => {
  db.jmkfaq.create.mockResolvedValue({ faq_id: 7 }); db.jmkfaq.update.mockResolvedValue({ faq_id: 7 });
  expect(await invoke(a.adminResolvers, 'createAndUpdateFaq', { question: 'Q' }, contexts.internal)).toBe('created');
  expect(await invoke(a.adminResolvers, 'createAndUpdateFaq', { faq_id: 7 }, contexts.internal)).toBe('updated');
  db.jmkfaq.findFirst.mockResolvedValue({ faq_id: 7 });
  for (const ctx of [contexts.internal, contexts.admin]) await expect(invoke(a.adminResolvers, 'createAndUpdateFaq', {}, ctx)).rejects.toThrow('Already exist');
});
test('admin login rejects unknown accounts and inactive companies', async () => {
  const call = () => invoke(a.adminResolvers, 'signinAdmin', { username: 'school' }, contexts.admin);
  db.jmkcompany.findFirst.mockResolvedValue(null); await expect(call()).rejects.toThrow('invalid user');
  identities(); db.jmkuserinfo.findFirst.mockResolvedValue(null); await expect(call()).rejects.toThrow('invalid admin');
  db.jmkuserinfo.findFirst.mockResolvedValue({ ...admin(), company: { c_verified: false } }); await expect(call()).rejects.toThrow('not verify');
  db.jmkuserinfo.findFirst.mockResolvedValue({ ...admin(), company: { c_verified: true, payments: [] } }); await expect(call()).rejects.toThrow('expired');
  db.jmkuserinfo.findFirst.mockResolvedValue(null); await expect(invoke(a.adminResolvers, 'signinAdmin', {}, contexts.admin)).rejects.toThrow('invalid admin');
});
test.each(['createStudentFromAdmin', 'createTrainerFromDashboard', 'createNewUser'])('%s respects subscription user limits', async name => {
  db.jmkuserinfo.findFirst.mockResolvedValueOnce({ ...admin(), company: { ...company(), payments: [{ users: 0 }] } }).mockResolvedValue(null);
  await expect(invoke(a.adminResolvers, name, {}, contexts.admin)).rejects.toThrow('user limit');
});
test('blog writes report failure as Apollo errors', async () => {
  db.jmkblog.findFirst.mockResolvedValue({ blog_image: 'old', blog_logo: 'old' });
  for (const name of ['updateStatus', 'deleteBlog', 'addBlog', 'updateBlog']) {
    const result = await invoke(a.adminResolvers, name, { blog_heading: 'Title', blog_image: null, blog_logo: null }, contexts.admin);
    expect(result).toBeInstanceOf(ApolloError);
  }
});
for (const [name, model, method, data] of [
  ['updateTrainer', 'jmktrinfo', 'update', {}], ['updateTrainerPic', 'jmktrinfo', 'update', {}], ['updateTrainerPassword', 'jmktrinfo', 'update', { old_tr_password: 'oldpass', tr_password: 'newpass' }], ['addWeek', 'jmk_tr_week', 'create', {}], ['updateWeek', 'jmk_tr_week', 'update', {}], ['deleteWeek', 'jmk_tr_week', 'delete', {}], ['createQuesAnsTrainer', 'jmk_ques_ans', 'create', {}], ['createGroupChat', 'jmk_chat_group', 'create', {}], ['createAndUpdatePage', 'jmk_crs_blog', 'create', {}], ['createAndUpdatePage', 'jmk_crs_blog', 'update', { serial: 7 }], ['deletePage', 'jmk_crs_blog', 'delete', {}], ['updateStudentCourseFromTrainer', 'jmkstdcrsinfo', 'update', {}],
]) test(`trainer ${name} reports unsuccessful ${method}`, async () => {
  db.jmk_std_ques.findFirst.mockResolvedValue({ ques_id: 7 }); db.jmk_crs_blog.findFirst.mockResolvedValue({ serial: 7 }); db.jmkstdcrsinfo.findFirst.mockResolvedValue({ serial: 7 });
  db[model][method].mockResolvedValue(null);
  await expect(invoke(t.trainerResolvers, name, data, contexts.trainer)).rejects.toThrow(/wrong|found|Error|Unable/i);
  expect(db[model][method]).toHaveBeenCalled();
});
for (const [name, model, method, message] of [
  ['getWeekContentBasedonActiveSession', 'jmk_tr_week', 'findMany', 'No Data'], ['getWeekDetailsById', 'jmk_tr_week', 'findFirst', 'No Data'], ['getContentByWeekId', 'jmk_week_content', 'findMany', 'No Data'], ['getContentByContentId', 'jmk_week_content', 'findFirst', 'No data'], ['getAssignedCourses', 'jmktrcrsinfo', 'findMany', 'No Course'], ['getstudentForTrainer', 'jmkstdcrsinfo', 'findMany', 'No data'], ['getStudentById', 'jmkstdcrsinfo', 'findFirst', 'invalid'], ['getWeekContentTests', 'jmk_test_set', 'findMany', 'invalid content'], ['getStdQuestionByIdForTrainer', 'jmk_std_ques', 'findFirst', 'No Questions'], ['getPageTrainer', 'jmk_crs_blog', 'findFirst', 'Pages Not Found'],
]) test(`trainer ${name} reports missing related data`, async () => {
  db[model][method].mockResolvedValue(null);
  await expect(invoke(t.trainerResolversQuery, name, {}, contexts.trainer)).rejects.toThrow(message);
});
for (const [name, model, method, data] of [
  ['updateUser', 'jmkstdinfo', 'update', {}], ['updateUserPassword', 'jmkstdinfo', 'update', { old_std_password: 'oldpass', std_password: 'newpass' }],
  ['updateStdQuestion', 'jmk_std_ques', 'update', {}], ['deleteStdQuestion', 'jmk_std_ques', 'delete', {}], ['createQuesAns', 'jmk_ques_ans', 'create', {}], ['updateQuesAns', 'jmk_ques_ans', 'update', {}], ['createAndUpdateStdQuesSub', 'jmk_ques_sub', 'create', {}],
  ['createStdNote', 'jmk_std_note', 'create', {}], ['createStdNote', 'jmk_std_note', 'update', { serial: 7 }], ['deleteStdNote', 'jmk_std_note', 'delete', {}], ['createAndUpdateTodo', 'jmk_std_todos', 'create', {}], ['createAndUpdateTodo', 'jmk_std_todos', 'update', { serial: 7 }], ['deleteTodo', 'jmk_std_todos', 'delete', {}], ['addCommentOnPage', 'jmk_crs_blog_comments', 'create', {}],
]) test(`student ${name} reports unsuccessful ${method}`, async () => {
  db.jmk_std_ques.findFirst.mockResolvedValue({ ques_id: 7 }); db.jmk_ques_ans.findFirst.mockResolvedValue({ ans_id: 8 }); db.jmk_std_note.findFirst.mockResolvedValue({ serial: 7 }); db.jmk_std_todos.findFirst.mockResolvedValue({ serial: 7 }); db.jmk_crs_blog.findFirst.mockResolvedValue({ serial: 7 });
  db[model][method].mockResolvedValue(null);
  await expect(invoke(s.studentResolvers, name, data, contexts.student)).rejects.toThrow(/wrong|invalid note/i);
  expect(db[model][method]).toHaveBeenCalled();
});
test('student coupon rejects absent, used, exhausted, or future codes', async () => {
  const call = code => s.studentResolvers.applyCourseCoupon(null, { code }, contexts.student);
  await expect(call('SAVE')).rejects.toThrow('invalid User Course');
  db.jmkstdcrsinfo.findFirst.mockResolvedValue({ promo_code: 'used' }); await expect(call('SAVE')).rejects.toThrow('already applyed');
  db.jmkstdcrsinfo.findFirst.mockResolvedValue({ serial: 7 }); await expect(call('SAVE')).rejects.toThrow('Invalid Promo Code');
  db.jmk_promo_code.findFirst.mockResolvedValue({ upto: 0 }); await expect(call('SAVE')).rejects.toThrow('Expire'); await expect(call(null)).rejects.toThrow('Invalid Promo Code');
  db.jmk_promo_code.findFirst.mockResolvedValue({ upto: 1, created_at: '2099-01-01' }); await expect(call('SAVE')).rejects.toThrow('Expire');
});
for (const [role, model] of [['admin', 'jmkuserinfo'], ['student', 'jmkstdinfo'], ['trainer', 'jmktrinfo']]) {
  for (const name of ['deleteAllNotification', 'userActiveTime', 'createTicket']) test(`common ${name} rejects missing ${role}`, async () => {
    db[model].findFirst.mockResolvedValue(null);
    await expect(invoke(c.commonResolvers, name, {}, contexts[role])).rejects.toThrow(/invalid/i);
  });
  for (const name of ['getMyNotifications', 'getTickets', 'getTicket']) test(`common ${name} rejects missing ${role}`, async () => {
    db[model].findFirst.mockResolvedValue(null);
    await expect(invoke(c.commonResolversQuery, name, {}, contexts[role])).rejects.toThrow(/invalid/i);
  });
}
for (const [name, model, method] of [['createCourse', 'jmkcrsinfo', 'create'], ['updateCourse', 'jmkcrsinfo', 'update']]) test(`common ${name} reports failed persistence`, async () => {
  if (name === 'createCourse') db.jmkcrsinfo.findFirst.mockResolvedValue(null);
  await expect(invoke(c.commonResolvers, name, { crs_image: 'upload' }, contexts.admin)).rejects.toThrow('something went wrong');
  expect(db[model][method]).toHaveBeenCalled();
});
test('common course mutations reject missing principals, duplicates and courses', async () => {
  await expect(invoke(c.commonResolvers, 'createCourse', {}, contexts.admin)).rejects.toThrow('already exist');
  db.jmkcrsinfo.findFirst.mockResolvedValue(null);
  await expect(invoke(c.commonResolvers, 'updateCourse', {}, contexts.admin)).rejects.toThrow('invalid course');
  await expect(invoke(c.commonResolvers, 'deleteCourse', {}, contexts.admin)).rejects.toThrow('Course not found');
  db.jmkuserinfo.findFirst.mockResolvedValue(null);
  for (const name of ['createCourse', 'updateCourse', 'deleteCourse']) await expect(invoke(c.commonResolvers, name, {}, contexts.admin)).rejects.toThrow('invalid admin');
});
test.each(['admin', 'trainer'])('attendance validates %s arguments and identity', async role => {
  const ctx = contexts[role]; const args = role === 'admin' ? {} : { crs_id: 20 };
  await expect(c.commonResolvers.updateAttendance(null, args, ctx)).rejects.toThrow(role === 'admin' ? 'need to provide' : 'doesnt need');
  db[role === 'admin' ? 'jmkuserinfo' : 'jmktrinfo'].findFirst.mockResolvedValue(null);
  await expect(c.commonResolvers.updateAttendance(null, role === 'admin' ? { crs_id: 20 } : {}, ctx)).rejects.toThrow('invalid');
  await expect(c.commonResolvers.addCourseSyllabus(null, role === 'admin' ? {} : { crs_id: 20 }, ctx)).rejects.toThrow(role === 'admin' ? 'need to provide' : 'Doesnt need');
});
test('internal admin cannot take or query attendance or create tickets', async () => {
  for (const [group, name] of [[c.commonResolvers, 'updateAttendance'], [c.commonResolvers, 'createTicket'], [c.commonResolversQuery, 'getAttendance'], [c.commonResolversQuery, 'getAttendanceByStudentId']]) await expect(invoke(group, name, {}, contexts.internal)).rejects.toThrow(/internal admin/i);
});
test.each(['admin', 'internal'])('ticket status rejects missing tickets or unsuccessful writes for %s', async role => {
  await expect(c.commonResolvers.updateTicket(null, { serial: 7 }, contexts[role])).rejects.toThrow('invalid id');
  db.jmk_ticket.findFirst.mockResolvedValue({ serial: 7 });
  await expect(c.commonResolvers.updateTicket(null, { serial: 7 }, contexts[role])).rejects.toThrow('invalid id');
  db.jmkuserinfo.findFirst.mockResolvedValue(null);
  await expect(c.commonResolvers.updateTicket(null, { serial: 7 }, contexts[role])).rejects.toThrow('invalid admin');
});
test('ticket creation permits no attachments and reports failed inserts', async () => {
  await expect(invoke(c.commonResolvers, 'createTicket', {}, contexts.student)).rejects.toThrow('someting went wrong');
  db.jmk_ticket.create.mockResolvedValue({ serial: 7 });
  expect(await invoke(c.commonResolvers, 'createTicket', {}, contexts.student)).toBe('Ticket created');
});
test('common queries report unavailable courses, contact details and invalid parameters', async () => {
  for (const ctx of [contexts.admin, contexts.internal]) {
    db.jmkcrsinfo.findMany.mockResolvedValue(null); db.jmkcrsinfo.findFirst.mockResolvedValue(null);
    await expect(invoke(c.commonResolversQuery, 'getAllCourseList', {}, ctx)).rejects.toThrow('Courses not found');
    await expect(invoke(c.commonResolversQuery, 'getCourseById', {}, ctx)).rejects.toThrow('No data found');
  }
  for (const ctx of [contexts.student, contexts.internal]) await expect(invoke(c.commonResolversQuery, 'getContactInfo', {}, ctx)).rejects.toThrow('Info not found');
  await expect(c.commonResolversQuery.getBlogBySlug(null, {})).rejects.toThrow('blog_slug is required');
  await expect(c.commonResolversQuery.getFaqById(null, {})).rejects.toThrow('faq id is required');
  await expect(c.commonResolversQuery.getFaqByType(null, {}, {})).rejects.toThrow('faq type is required');
  for (const [type, ctx, model] of [['Student', contexts.student, 'jmkstdinfo'], ['Trainer', contexts.trainer, 'jmktrinfo'], ['Public', {}, null]]) {
    db.jmkfaq.findMany.mockResolvedValue(null);
    await expect(c.commonResolversQuery.getFaqByType(null, { type }, ctx)).rejects.toThrow('Data Not Found');
    if (model) { db[model].findFirst.mockResolvedValue(null); await expect(c.commonResolversQuery.getFaqByType(null, { type }, ctx)).rejects.toThrow('invalid credentials'); }
  }
});
test('invalid common roles and platforms cannot access protected operations', async () => {
  const ctx = { userId: 1, role: 'unknown', platform: 'unknown' };
  for (const [group, names] of [[c.commonResolvers, ['createCourse', 'updateCourse', 'deleteCourse', 'deleteAllNotification', 'updateAttendance', 'createTicket', 'addCourseSyllabus']], [c.commonResolversQuery, ['getAllCourseList', 'getCourseById', 'getMyNotifications', 'getAttendance', 'getAttendanceByStudentId', 'getTicket', 'getCertLayout']]]) {
    for (const name of names) await expect(invoke(group, name, {}, ctx)).rejects.toThrow();
  }
});
test('certificate layouts reject missing layouts, unsupported roles and internal scope', async () => {
  for (const ctx of [contexts.admin, contexts.student]) await expect(invoke(c.commonResolversQuery, 'getCertLayout', {}, ctx)).rejects.toThrow('No layout created');
  await expect(invoke(c.commonResolversQuery, 'getCertLayout', {}, contexts.trainer)).rejects.toThrow('Invalid role');
  await expect(invoke(c.commonResolversQuery, 'getCertLayout', {}, contexts.internal)).rejects.toThrow('Invalid token');
});
test('trainer roles cannot use trainer-only content, pages, or dashboard access', async () => {
  for (const name of ['addTrainerWeekContentById', 'updateTrainerWeekContentById', 'deleteTrainerWeekContentById', 'addTrainerAttendance']) await expect(invoke(t.trainerResolvers, name, {}, contexts.student)).rejects.toThrow(/access/i);
  for (const name of ['trainer', 'getStudentById', 'getWeekContentTests', 'getAllRelatedCrsStdForTrainer', 'getTrainerAttendance']) await expect(invoke(t.trainerResolversQuery, name, {}, contexts.student)).rejects.toThrow(/access|request/i);
});
test('student message inputs reject missing receiver, body, profile and seen IDs', async () => {
  for (const [data, message] of [[{}, 'receiver cant be null'], [{ receiver_id: 3 }, 'message cant be empty'], [{ receiver_id: 3, message: 'Hi' }, 'chat_profile_type cant be empty']]) await expect(invoke(s.studentResolvers, 'createMessage', data, contexts.student)).rejects.toThrow(message);
  await expect(s.studentResolvers.isTypingMessage(null, {}, contexts.student)).rejects.toThrow('receiver cant be null');
  await expect(s.studentResolvers.updateMessageSeen(null, {}, contexts.student)).rejects.toThrow('id cant be null');
  await expect(s.studentResolvers.updateMessageSeen(null, { id: 3 }, contexts.student)).rejects.toThrow('type cant be null');
});
test('student protected mutations reject nonstudent roles and internal payment scope', async () => {
  for (const name of ['createStudentPayment', 'applyCourseCoupon', 'addCommentOnPage', 'submitAttendance']) await expect(invoke(s.studentResolvers, name, {}, contexts.trainer)).rejects.toThrow(/access|only student/i);
  await expect(invoke(s.studentResolvers, 'createStudentPayment', {}, { ...contexts.student, platform: 'internal' })).rejects.toThrow('invalid token');
  await expect(invoke(s.studentResolvers, 'takeAttendance', {}, contexts.student)).rejects.toThrow('Invalid access');
  await expect(invoke(s.studentResolvers, 'chatWithAi', {}, contexts.internal)).rejects.toThrow('Invalid Role');
});
test('student-specific queries reject other roles', async () => {
  for (const name of ['me', 'courseList', 'userCourseList', 'getActiveUserCourse', 'getWeeklyTest', 'getStuentChatList', 'getAllNote']) await expect(invoke(s.studentResolversQuery, name, {}, contexts.trainer)).rejects.toThrow(/credentials|request/i);
});
test('student queries report missing records and empty lists', async () => {
  for (const [name, message] of [['getActiveUserCourse', 'invalid'], ['getWeeklyTest', 'Wrong content_id'], ['getNote', 'invalid id'], ['getAllNote', 'Empty Note'], ['getStudentCourseWeek', 'Course not started'], ['getStudentCourseWeekContent', 'No data'], ['getStdQuestionById', 'No Questions'], ['getStdCrsRelatedQuesInfo', 'doesnt have course'], ['getPageStudent', 'Pages Not Found']]) await expect(invoke(s.studentResolversQuery, name, {}, contexts.student)).rejects.toThrow(message);
  db.jmk_crs_blog.findMany.mockResolvedValue(null);
  await expect(invoke(s.studentResolversQuery, 'getPagesStudent', {}, contexts.student)).rejects.toThrow('Pages Not Found');
});
test('student enrollment and active course reject unavailable resources', async () => {
  db.jmkcrsinfo.findFirst.mockResolvedValue(null);
  await expect(invoke(s.studentResolvers, 'addNewCourse', { crs_id: 20 }, contexts.student)).rejects.toThrow('Invalid crs id');
  await expect(invoke(s.studentResolvers, 'changeActiveCourse', { crs_id: 20 }, contexts.student)).rejects.toThrow('invalid crs id');
  db.jmkstdcrsinfo.findFirst.mockResolvedValue({ crs_id: 20 });
  await expect(invoke(s.studentResolvers, 'changeActiveCourse', { crs_id: 20 }, contexts.student)).rejects.toThrow('invalid crs id');
});
test('student discussion operations reject missing questions and answers', async () => {
  for (const [name, message] of [['updateStdQuestion', 'Invalid'], ['deleteStdQuestion', 'Invalid'], ['createQuesAns', 'invalid question_id'], ['updateQuesAns', 'invalid'], ['createAndUpdateQuestionVote', 'invalid opration'], ['createAndUpdateStdQuesSub', 'invalid opration'], ['submitStdTestAns', 'invalid submit'], ['deleteStdNote', 'invalid access'], ['deleteTodo', 'invalid access'], ['addCommentOnPage', 'invalid Blog Id']]) await expect(invoke(s.studentResolvers, name, {}, contexts.student)).rejects.toThrow(message);
  db.jmk_std_ques.findFirst.mockResolvedValue({ ques_id: 7 });
  await expect(invoke(s.studentResolvers, 'createStdQuestion', {}, contexts.student)).rejects.toThrow('Already Exist');
  await expect(invoke(s.studentResolvers, 'createAndUpdateQuestionVote', { imp_type: 'Answer' }, contexts.student)).rejects.toThrow('invalid opration');
  await expect(invoke(s.studentResolvers, 'createAndUpdateQuestionVote', { imp_type: 'Invalid' }, contexts.student)).rejects.toThrow('invalid !');
});
