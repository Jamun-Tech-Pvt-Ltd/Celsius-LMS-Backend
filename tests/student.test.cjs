require('./setup.cjs');
jest.mock('graphql-subscriptions', () => ({ PubSub: jest.fn(() => ({ publish: jest.fn(), asyncIterator: jest.fn(channel => ({ channel })) })) }));
const { db, reset, identities, contexts, student, trainer, course, company } = require('./support.cjs');
const { studentResolvers: m, studentResolversQuery: q, subscription, updateStdActiveDate } = require('../controller/student/index.js');
const pubsub = require('graphql-subscriptions').PubSub.mock.results[0].value;
const ai = require('openai').mock.results[0].value;
beforeEach(() => { reset(); identities(); });
const call = (name, data = {}, ctx = contexts.student) => m[name](null, { data }, ctx);
const query = (name, args = {}) => q[name](null, args, contexts.student);
const question = { ques_id: 7, student_id: 4, ques_title: 'Question', ques_image_key: 'old-key' };
test('student login checks tenant, subscription, password, and verification', async () => {
  const args = { userSignIn: { username: 'school', email: 'sam@example.com', password: 'oldpass' } };
  expect(await m.signinUser(null, args)).toEqual({ token: 'signed-token' });
  for (const [model, value, message] of [['jmkcompany', null, 'invalid user'], ['jmkcompany', { c_verified: false }, 'not verify'], ['jmkcompany', { c_verified: true, payments: [] }, 'expired'], ['jmkstdinfo', null, 'invalid user'], ['jmkstdinfo', { ...student(), std_password: 'wrong' }, 'invalid user'], ['jmkstdinfo', { ...student(), std_verifyed: false }, 'Email not verified']]) {
    identities(); db[model].findFirst.mockResolvedValue(value);
    await expect(m.signinUser(null, args)).rejects.toThrow(message);
  }
});
test('student profile updates and avatar replacement persist uploaded URLs', async () => {
  db.jmkstdinfo.update.mockResolvedValue(student());
  expect(await call('updateUser', { std_fname: 'Updated' })).toEqual(student());
  db.jmkstdinfo.findFirst.mockResolvedValue({ ...student(), std_pic_key: 'old-key' });
  expect(await m.uploadFile(null, { file: 'upload' }, contexts.student)).toEqual(student());
  expect(db.jmkstdinfo.update).toHaveBeenLastCalledWith({ data: { std_pic: 'https://files.example/test.png', std_pic_key: 'new-key' }, where: { std_id: 2 } });
});
test('student password changes validate old, reused, and short passwords', async () => {
  db.jmkstdinfo.update.mockResolvedValue(student());
  for (const [old_std_password, std_password, message] of [['wrong', 'newpass', 'didnt match'], ['oldpass', 'oldpass', 'cant be same'], ['oldpass', 'short', '6 char']]) await expect(call('updateUserPassword', { old_std_password, std_password })).rejects.toThrow(message);
  expect(await call('updateUserPassword', { old_std_password: 'oldpass', std_password: 'newpass' })).toBe('successfully changed');
  expect(db.jmkstdinfo.update).toHaveBeenCalledWith({ data: { std_password: 'newpass' }, where: { std_id: 2 } });
});
test('enrollment requests notify admins and reject repeat requests', async () => {
  db.jmkuserinfo.findMany.mockResolvedValue([{ usr_id: 1, usr_access: JSON.stringify([{ name: 'RegistrationInfo', option: [{ name: 'Students', access: [{ read: true }] }] }]) }]);
  expect(await call('addNewCourse', { crs_id: 20 })).toBe('success');
  expect(db.jmkstdcrsinfo.create).toHaveBeenCalledWith({ data: { crs_id: 20, std_id: 2 } });
  expect(db.jmk_notifications.create).toHaveBeenCalledWith({ data: expect.objectContaining({ category: 'course_red', user_id: 1 }) });
  db.jmkstdcrsinfo.findFirst.mockResolvedValue({ std_crs_verirfy: true });
  await expect(call('addNewCourse', { crs_id: 20 })).rejects.toThrow('approved');
  db.jmkstdcrsinfo.findFirst.mockResolvedValue({ std_crs_verirfy: false });
  await expect(call('addNewCourse', { crs_id: 20 })).rejects.toThrow('already requested');
});
test('active course requires approval, ownership, and a different selection', async () => {
  db.jmkstdcrsinfo.findFirst.mockResolvedValue({ crs_id: 21, std_crs_verirfy: true }); db.jmkstdinfo.update.mockResolvedValue({ ...student(), crs_id: 21 });
  expect(await call('changeActiveCourse', { crs_id: 21 })).toEqual(expect.objectContaining({ crs_id: 21 }));
  db.jmkstdcrsinfo.findFirst.mockResolvedValue({ crs_id: 20, std_crs_verirfy: true });
  await expect(call('changeActiveCourse', { crs_id: 20 })).rejects.toThrow('Already selected');
  db.jmkstdcrsinfo.findFirst.mockResolvedValue({ crs_id: 21, std_crs_verirfy: false });
  await expect(call('changeActiveCourse', { crs_id: 21 })).rejects.toThrow('not permited');
});
test('project submission records submission date and marks project submitted', async () => {
  expect(await call('submitProject', { proj_id: 9 })).toBe('No such project found ');
  db.jmkcrsproject.findFirst.mockResolvedValue({ proj_id: 9 });
  expect(await call('submitProject', { proj_id: 9 })).toBe('success');
  expect(db.jmkstdproj.create).toHaveBeenCalledWith({ data: { proj_id: 9, std_id: 2, proj_sub_date: expect.any(Date) } });
});
test('questions create notifications, replace images, and cascade dependent deletion', async () => {
  db.jmk_std_ques.create.mockResolvedValue(question); db.jmktrcrsinfo.findFirst.mockResolvedValue({ tr_id: 3 }); db.jmkstdinfo.findMany.mockResolvedValue([student(), { std_id: 4 }]);
  expect(await call('createStdQuestion', { ques_title: 'Question', ques_image: 'upload' })).toBe('Successfully created');
  db.jmk_std_ques.findFirst.mockResolvedValue(question); db.jmk_std_ques.update.mockResolvedValue(question); db.jmk_std_ques.delete.mockResolvedValue(question);
  for (const ques_image of ['upload', undefined]) expect(await call('updateStdQuestion', { ques_id: 7, ques_image })).toBe('Successfully updated !');
  db.jmk_ques_ans.findMany.mockResolvedValue([{ ans_id: 8 }]); db.jmk_ques_ans_imp.findMany.mockResolvedValue([{ imp_id: 9 }]); db.jmk_ques_sub.findMany.mockResolvedValue([{ sub_id: 10 }]);
  expect(await m.deleteStdQuestion(null, { question_id: 7 }, contexts.student)).toBe('Successfully deleted !');
  expect(db.jmk_ques_ans.delete).toHaveBeenCalledWith({ where: { ans_id: 8 } });
  expect(db.jmk_ques_sub.delete).toHaveBeenCalledWith({ where: { sub_id: 10 } });
  expect(db.jmk_ques_ans_imp.delete).toHaveBeenCalledTimes(2);
});
test('student answers create notifications and update existing answers', async () => {
  db.jmk_std_ques.findFirst.mockResolvedValue(question); db.jmk_ques_ans.create.mockResolvedValue({ ans_id: 8 }); db.jmk_ques_ans.findFirst.mockResolvedValue({ ans_id: 8 }); db.jmk_ques_ans.update.mockResolvedValue({ ans_id: 8 });
  expect(await call('createQuesAns', { question_id: 7, answer: 'Answer' })).toBe('Successfully created');
  expect(await call('updateQuesAns', { ans_id: 8, answer: 'Updated' })).toBe('Successfully updated !');
  expect(db.jmk_notifications.create).toHaveBeenCalledWith({ data: expect.objectContaining({ user_id: 4, category: 'discussion_panel_comment' }) });
});
test.each(['Question', 'Answer'])('%s voting creates and updates vote records', async imp_type => {
  db.jmk_std_ques.findFirst.mockResolvedValue(question); db.jmk_ques_ans.findFirst.mockResolvedValue({ ans_id: 8, student_id: 4, user_type: 'Student' });
  db.jmk_ques_ans_imp.create.mockResolvedValue({ imp_id: 9, student_id: 4 }); db.jmk_ques_ans_imp.update.mockResolvedValue({ imp_id: 9 });
  expect(await call('createAndUpdateQuestionVote', { imp_type, question_id: 7, ans_id: 8, upvote: 1 })).toBe('Successfully Created !');
  db.jmk_ques_ans_imp.findFirst.mockResolvedValue({ imp_id: 9 });
  expect(await call('createAndUpdateQuestionVote', { imp_type, question_id: 7, ans_id: 8, downvote: 1 })).toBe('Successfully updated !');
  expect(db.jmk_notifications.create).toHaveBeenCalledTimes(2);
});
test('discussion subscriptions toggle and expose current state', async () => {
  db.jmk_std_ques.findFirst.mockResolvedValue(question); db.jmk_ques_sub.create.mockResolvedValue({ sub_id: 9 }); db.jmk_ques_sub.delete.mockResolvedValue({ sub_id: 9 });
  expect(await query('getStdQuesSub', { question_id: 7 })).toBe('unsubscribed');
  expect(await call('createAndUpdateStdQuesSub', { question_id: 7 })).toBe('subscribed');
  db.jmk_ques_sub.findFirst.mockResolvedValue({ sub_id: 9 });
  expect(await query('getStdQuesSub', { question_id: 7 })).toBe('subscribed');
  expect(await call('createAndUpdateStdQuesSub', { question_id: 7 })).toBe('unsubscribed');
});
test.each([[25, '25 minutes'], [75, '1 hours 15 minutes']])('test submissions score answers and format %s minutes', async (time_taken, formatted) => {
  db.jmk_test_set.findFirst.mockResolvedValue({ rtans: 'A', content_id: 8 }); db.jmk_std_test_result.create.mockResolvedValue({ serial: 9 });
  expect(await call('submitStdTestAns', { time_taken, testAns: [{ test_set_id: 1, std_ans: 'a' }, { test_set_id: 2, std_ans: 'B' }] })).toBe('Submited');
  expect(db.jmk_std_test_result.create).toHaveBeenCalledWith({ data: { std_id: 2, content_id: 8, test_complete: true, score: '1/2', question_attempted: 2, time_taken: formatted } });
});
for (const [name, model, deleteName] of [['createStdNote', 'jmk_std_note', 'deleteStdNote'], ['createAndUpdateTodo', 'jmk_std_todos', 'deleteTodo']]) test(`${name} creates, updates and deletes owned records`, async () => {
  db[model].create.mockResolvedValue({ serial: 7 }); db[model].update.mockResolvedValue({ serial: 7 }); db[model].findFirst.mockResolvedValue({ serial: 7 }); db[model].delete.mockResolvedValue({ serial: 7 });
  expect(await call(name, { title: 'Title' })).toBe('Created !');
  expect(await call(name, { serial: 7, title: 'Updated' })).toBe('Updated !');
  expect(await m[deleteName](null, { serial: 7 }, contexts.student)).toBe('deleted');
  expect(db[model].findFirst).toHaveBeenCalledWith({ where: { serial: 7, crs_id: 20, std_id: 2 } });
});
test.each(['student', 'trainer'])('%s sends direct/group messages, typing and seen events', async role => {
  const ctx = contexts[role]; const user_type = role === 'student' ? 'Student' : 'Teacher';
  db.jmk_chat_group_student.findFirst.mockResolvedValue({ group_id: 9 }); db.jmk_chat_group.findFirst.mockResolvedValue({ group_id: 9 });
  for (const chat_profile_type of ['student', 'group']) {
    const model = chat_profile_type === 'group' ? 'jmk_group_chats' : 'jmk_chats';
    const message = { chat_id: 7, user_type, sender_id: ctx.userId }; db[model].create.mockImplementation(async () => ({ ...message }));
    expect(await call('createMessage', { receiver_id: 9, message: 'Hi', chat_profile_type, user_type, chat_type: 'Image', image: 'upload' }, ctx)).toEqual(expect.objectContaining(message));
    expect(pubsub.publish).toHaveBeenCalledWith(chat_profile_type === 'group' ? 'channel_group_9' : `channel_${ctx.userId}_9`, { newMessage: expect.objectContaining(message) });
    expect(await m.updateMessageSeen(null, { id: 9, type: chat_profile_type }, ctx)).toBe('Nothing to update !');
    db[model].findMany.mockResolvedValue([{ chat_id: 7 }]);
    expect(await m.updateMessageSeen(null, { id: 9, type: chat_profile_type }, ctx)).toBe('success');
    expect(db[model].update).toHaveBeenCalledWith({ data: { isSeen: true }, where: { chat_id: 7 } });
  }
  expect(await m.isTypingMessage(null, { receiver_id: 9, isTyping: true }, ctx)).toBe('Status changed');
});
test('payments, coupons and page comments use active student and course', async () => {
  expect(await call('createStudentPayment', { date: '2026-01-01', amount: 25, transaction: 'bank' })).toBe('success');
  expect(db.jmktstdpayinfo.create).toHaveBeenCalledWith({ data: { payment_date: '2026-01-01', pay_amount: 25, transaction: 'bank', crs_id: 20, std_id: 2 } });
  db.jmkstdcrsinfo.findFirst.mockResolvedValue({ serial: 7 }); db.jmk_promo_code.findFirst.mockResolvedValue({ upto: 1, created_at: '2020-01-01', code: 'SAVE' });
  expect(await m.applyCourseCoupon(null, { code: 'SAVE' }, contexts.student)).toBe('success');
  expect(db.jmkstdcrsinfo.update).toHaveBeenCalledWith({ where: { serial: 7 }, data: { promo_code: 'SAVE' } });
  db.jmk_crs_blog.findFirst.mockResolvedValue({ serial: 8 }); db.jmk_crs_blog_comments.create.mockResolvedValue({ serial: 9 });
  expect(await call('addCommentOnPage', { blog_id: 8, comment: 'Hi' })).toBe('success');
});
test('attendance creates one daily record and broadcasts requests to students', async () => {
  expect(await m.submitAttendance(null, {}, contexts.student)).toBe('success');
  db.jmk_std_attendance.findFirst.mockResolvedValue({ serial: 7 });
  await expect(m.submitAttendance(null, {}, contexts.student)).rejects.toThrow('already taken');
  db.jmkstdinfo.findMany.mockResolvedValue([student()]);
  expect(await m.takeAttendance(null, {}, contexts.trainer)).toBe('Success');
  expect(pubsub.publish).toHaveBeenCalledWith('attendance_channel_2_20_10', { askAttendance: 'Trainer is taking attendance for course 20' });
});
test.each(['student', 'trainer', 'admin'])('AI chat builds %s context and stores both messages', async role => {
  const crs = { ...course(), crs_start_date: new Date('2026-01-01'), jmk_std_todos: [{ task: 'Read' }], crs_week: [{ week_topic: 'Intro' }], crs_syllabus: 'Basics' };
  db.jmkstdinfo.findFirst.mockResolvedValue({ ...student(), course: crs }); db.jmktrinfo.findFirst.mockResolvedValue({ ...trainer(), course: crs, company: company() });
  db.jmk_ai_chats.findMany.mockResolvedValue([{ role: 'Student', message: 'Earlier' }]);
  ai.chat.completions.create.mockResolvedValue({ choices: [{ message: { content: 'AI reply' } }] });
  expect(await call('chatWithAi', { message: 'Help' }, contexts[role])).toBe('AI reply');
  expect(ai.chat.completions.create).toHaveBeenCalledWith({ model: 'gpt-3.5-turbo-16k', messages: expect.arrayContaining([{ role: 'user', content: 'Help' }]) });
  expect(db.jmk_ai_chats.createMany).toHaveBeenCalledWith({ data: [expect.objectContaining({ role, message: 'Help' }), expect.objectContaining({ role: 'AI', message: 'AI reply' })] });
});
test('student profile and course queries validate company identity', async () => {
  expect(await query('me')).toEqual(expect.objectContaining({ std_id: 2, logo: null }));
  expect(await query('courseList')).toEqual([]); expect(await query('userCourseList')).toEqual([]);
  for (const name of ['me', 'courseList', 'userCourseList']) await expect(q[name](null, {}, { ...contexts.student, c_username: 'other' })).rejects.toThrow('invalid user credentials');
  db.jmkstdcrsinfo.findFirst.mockResolvedValue({ serial: 7 });
  expect(await query('getActiveUserCourse')).toEqual({ serial: 7 });
  db.jmk_week_content.findFirst.mockResolvedValue({ content_id: 8 });
  expect(await query('getWeeklyTest', { content_id: 8 })).toEqual({ courseWeekContent: { content_id: 8 }, questions: [] });
});
test('notes, weeks, page queries and quiz histories return expected records', async () => {
  db.jmk_std_note.findFirst.mockResolvedValue({ serial: 7 }); db.jmk_std_note.findMany.mockResolvedValue([{ serial: 7 }]); db.jmk_tr_week.findMany.mockResolvedValue([{ week_id: 9 }]);
  expect(await query('getNote', { serial: 7 })).toEqual({ serial: 7 }); expect(await query('getAllNote')).toEqual([{ serial: 7 }]); expect(await query('getStudentCourseWeek')).toEqual([{ week_id: 9 }]);
  db.jmk_week_content.findMany.mockResolvedValue([{ type: 'Test', content_id: 8 }, { type: 'Note' }]); db.jmk_std_test_result.findFirst.mockResolvedValue({ score: '1/2', test_complete: true });
  expect(await query('getStudentCourseWeekContent', { week_id: 9 })).toEqual([{ type: 'Test', content_id: 8, score: '1/2', test_complete: true }, { type: 'Note' }]);
  db.jmk_std_test_result.findMany.mockResolvedValue([{ score: '1/2', question_attempted: 2, time_taken: '5 minutes' }]);
  expect(await query('getStudentCourseResult', { content_id: 8 })).toEqual([{ content_id: 8, total_question: 2, correct_answer: 1, question_attempted: 2, time_taken: '5 minutes' }]);
  db.jmk_crs_blog.findMany.mockResolvedValue([{ serial: 7 }]); db.jmk_crs_blog.findFirst.mockResolvedValue({ serial: 7, comments: [] });
  expect(await query('getPagesStudent')).toEqual([{ serial: 7 }]); expect(await query('getPageStudent', { serial: 7 })).toEqual({ page: { serial: 7, comments: [] }, comments: [] });
});
test.each(['student', 'trainer', 'group'])('%s chat histories sort by timestamp', async chatType => {
  db.jmk_chat_group_student.findFirst.mockResolvedValue({ group_id: 9 }); db.jmk_chat_group.findFirst.mockResolvedValue({ group_id: 9 });
  const messages = [{ created_at: '2026-01-02', user_type: 'Student' }, { created_at: '2026-01-01', user_type: 'Teacher' }];
  db.jmk_chats.findMany.mockResolvedValueOnce(messages).mockResolvedValueOnce([]); db.jmk_group_chats.findMany.mockResolvedValue(messages);
  const result = await query('getStudentChats', { chatType, chatId: 9 });
  expect(result.chat_history.map(m => m.created_at)).toEqual(['2026-01-01', '2026-01-02']);
});
test('student chat list includes peers, trainer and joined groups', async () => {
  db.jmkstdinfo.findMany.mockResolvedValue([student(), { ...student(), std_id: 4 }]); db.jmktrcrsinfo.findFirst.mockResolvedValue({ tr_id: 3 }); db.jmk_chat_group_student.findMany.mockResolvedValue([{ group_id: 9 }]); db.jmk_chat_group.findFirst.mockResolvedValue({ group_id: 9 });
  expect(await query('getStuentChatList')).toEqual(expect.objectContaining({ students: [expect.objectContaining({ student: expect.objectContaining({ std_id: 4 }) })], trainer: expect.objectContaining({ trainer: expect.objectContaining({ tr_id: 3 }) }), groups: [{ group: { group_id: 9 } }] }));
});
test('discussion lists enrich questions and put trainer answers first', async () => {
  db.jmkstdcrsinfo.findFirst.mockResolvedValue({ std_crs_verirfy: true });
  db.jmk_std_ques.findMany.mockResolvedValue([question]); db.jmk_std_ques.findFirst.mockResolvedValue(question); db.jmk_ques_ans_imp.findMany.mockResolvedValue([{ upvote: 1 }, { upvote: 0 }]);
  for (const name of ['getStdQuestions', 'getStdRandomQuestions']) expect(await query(name)).toEqual([expect.objectContaining({ ques_id: 7, totalUpvote: 1 })]);
  expect(await query('getStdQuestionById', { question_id: 7 })).toEqual(expect.objectContaining({ ques_id: 7 }));
  db.jmk_ques_ans.findMany.mockResolvedValue(['Student', 'Teacher', 'Student', 'Teacher'].map((user_type, ans_id) => ({ ans_id, user_type, student_id: 2, teacher_id: 3 })));
  expect((await query('getStdQuesAns', { question_id: 7 })).map(a => a.user_role)).toEqual(['Teacher', 'Teacher', 'Student', 'Student']);
  for (const args of [{ question_id: 7 }, { answer_id: 8 }]) expect(await query('getQuestionAnsVote', args)).toEqual([{ upvote: 1 }, { upvote: 0 }]);
  db.jmkstdcrsinfo.findMany.mockResolvedValue([{ crs_id: 20 }]);
  expect(await query('getStdCrsRelatedQuesInfo', { data: {} })).toEqual([expect.objectContaining({ crs_id: 20, name: 'Math', totalDiscussions: 0 })]);
});
test('student attendance and dashboard aggregate classes, quizzes, and recent content', async () => {
  const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - 2);
  const crs = { ...course(), crs_start_date: start, time: '00:00,23:59', crs_week: [{ jmk_week_content: ['Video', 'Project', 'Test'].map((type, content_id) => ({ type, content_id })) }] };
  db.jmkstdinfo.findFirst.mockResolvedValue({ ...student(), course: crs, courses: [{ crs_id: 20, course: crs }] }); db.jmk_std_attendance.findMany.mockResolvedValue([{ crs_id: 20, created_at: start }]);
  const attendance = await query('getStudentAttendance');
  expect(attendance.totalPresent).toBe(1); expect(attendance.ovaralAttendance).toHaveLength(3);
  db.jmk_test_set.count.mockResolvedValue(2); db.jmk_std_test_result.findFirst.mockResolvedValue({ score: '1/2', time_taken: '5 minutes', created_at: new Date('2026-01-01') });
  const dashboard = await query('getStudentDashboardData');
  expect(dashboard.resent_project).toHaveLength(1); expect(dashboard.resent_lessons).toHaveLength(1); expect(dashboard.meetings).toEqual([crs]);
  expect(dashboard.quiz_report).toEqual({ total_questions: 2, total_correct_answers: 1, total_grade: '50.00', total_time_spend: [{ date: '2026-01', time: 5 }] });
});
test('subscriptions select channels and active-date updates persist', async () => {
  const log = jest.spyOn(console, 'log').mockImplementation(() => {});
  const subs = subscription.Subscription;
  expect(subs.newMessage.subscribe(null, { receiver_id: 9, user_id: 2, subsType: 'group' })).toEqual({ channel: 'channel_group_9' });
  expect(subs.newMessage.subscribe(null, { receiver_id: 9, user_id: 2 })).toEqual({ channel: 'channel_9_2' });
  expect(subs.messageSeen.subscribe(null, { receiver_id: 9, user_id: 2 })).toEqual({ channel: 'message_seen_9_2' });
  expect(subs.messageTyping.subscribe(null, { receiver_id: 9, user_id: 2 })).toEqual({ channel: 'channel_9_2' });
  expect(subs.askAttendance.subscribe(null, { receiver_id: 2, crs_id: 20, company_id: 10 })).toEqual({ channel: 'attendance_channel_2_20_10' });
  log.mockRestore();
  await updateStdActiveDate(2);
  expect(db.jmkstdinfo.update).toHaveBeenCalledWith({ data: { lastSeen: expect.any(Date) }, where: { std_id: 2 } });
});
