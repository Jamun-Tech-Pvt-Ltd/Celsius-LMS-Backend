require('./setup.cjs');
const { db, reset, identities, contexts, trainer, student, course, company } = require('./support.cjs');
const { trainerResolvers: m, trainerResolversQuery: q, updateTrainerActiveDate } = require('../controller/trainer/index.js');
beforeEach(() => { reset(); identities(); });
const call = (name, data = {}) => m[name](null, { data }, contexts.trainer);
const question = { ques_id: 7, student_id: 2, ques_title: 'Question' };
test('trainer login validates company, credentials, verification and signs token', async () => {
  const data = { username: 'school', email: 'taylor@example.com', password: 'oldpass' };
  expect(await call('signinTrainer', data)).toEqual({ token: 'signed-token' });
  for (const [model, value, message] of [['jmkcompany', null, 'invalid user'], ['jmkcompany', { c_verified: false }, 'not verify'], ['jmkcompany', { c_verified: true, payments: [] }, 'expired'], ['jmktrinfo', null, 'invalid trainer'], ['jmktrinfo', { ...trainer(), tr_password: 'wrong' }, 'invalid trainer'], ['jmktrinfo', { ...trainer(), tr_verifyed: false }, 'not permitted']]) {
    identities(); db[model].findFirst.mockResolvedValue(value);
    await expect(call('signinTrainer', data)).rejects.toThrow(message);
  }
});
test('profile and active course update return database result', async () => {
  db.jmktrinfo.update.mockResolvedValue(trainer()); db.jmktrcrsinfo.findFirst.mockResolvedValue({ crs_id: 20 });
  expect(await call('activeSession', { crs_id: 20 })).toEqual(trainer());
  expect(await call('updateTrainer', { tr_fname: 'Updated' })).toEqual(trainer());
  expect(await call('updateTrainerPic', { tr_pic: 'upload' })).toEqual(trainer());
  db.jmktrinfo.findFirst.mockResolvedValue({ ...trainer(), tr_pic_key: 'old-key' });
  expect(await call('updateTrainerPic', {})).toEqual(trainer());
  expect(require('../utils/imageHandler.js').deleteImgToAWS).toHaveBeenCalledWith('old-key');
});
test('password changes reject mismatched, repeated, and short passwords', async () => {
  db.jmktrinfo.update.mockResolvedValue(trainer());
  for (const [old_tr_password, tr_password, message] of [['wrong', 'newpass', 'didnt match'], ['oldpass', 'oldpass', 'cant be same'], ['oldpass', 'short', '6 char']]) await expect(call('updateTrainerPassword', { old_tr_password, tr_password })).rejects.toThrow(message);
  expect(await call('updateTrainerPassword', { old_tr_password: 'oldpass', tr_password: 'newpass' })).toBe('success');
  expect(db.jmktrinfo.update).toHaveBeenCalledWith({ data: { tr_password: 'newpass' }, where: { tr_id: 3 } });
});
test('week create notifies enrolled students; update and empty deletion succeed', async () => {
  db.jmk_tr_week.create.mockResolvedValue({ week_id: 7, title: 'Intro' }); db.jmk_tr_week.update.mockResolvedValue({ week_id: 7 }); db.jmk_tr_week.delete.mockResolvedValue({ week_id: 7 });
  db.jmkstdcrsinfo.findMany.mockResolvedValue([{ std_id: 2 }]);
  expect(await call('addWeek', { title: 'Intro' })).toBe('Week Successfully added');
  expect(db.jmk_notifications.create).toHaveBeenCalledWith({ data: expect.objectContaining({ user_id: 2, category: 'week' }) });
  expect(await call('updateWeek', { week_id: 7 })).toBe('Week Successfully updated');
  expect(await call('deleteWeek', { week_id: 7 })).toBe('Week Successfully deleted');
  db.jmk_week_content.findMany.mockResolvedValue([{ content_id: 8 }]);
  await expect(call('deleteWeek', { week_id: 7 })).rejects.toThrow("Can't delete");
});
for (const type of ['Video', 'Note', 'Test', 'Project']) test(`week content ${type} create and update`, async () => {
  db.jmktrinfo.findFirst.mockResolvedValue({ ...trainer(), company: { ...company(), c_storage: 0, payments: [{ storage: 10 }] } });
  db.jmk_week_content.create.mockResolvedValue({ content_id: 8, week_id: 7, title: 'Intro', type });
  db.jmk_week_content.findFirst.mockResolvedValue({ content_id: 8, week_id: 7, video_url_key: 'old-key' });
  db.jmk_week_content.update.mockResolvedValue({ content_id: 8, type });
  db.jmk_tr_week.findFirst.mockResolvedValue({ week_id: 7, crs_id: 20 });
  db.jmkstdcrsinfo.findMany.mockResolvedValue([{ std_id: 2 }]);
  const data = () => ({ type, title: 'Intro', week_id: 7, video_url: 'upload', test: [{ test_set_id: 1, question: 'Keep' }, { question: 'New' }] });
  expect(await call('addTrainerWeekContentById', data())).toBe('Successfully Created !');
  expect(db.jmk_week_content.create).toHaveBeenCalled();
  db.jmk_test_set.findMany.mockResolvedValue([{ test_set_id: 1 }, { test_set_id: 2 }]);
  expect(await call('updateTrainerWeekContentById', { ...data(), content_id: 8 })).toBe('Successfully Updated !');
  if (type === 'Test') {
    expect(db.jmk_test_set.delete).toHaveBeenCalledWith({ where: { test_set_id: 2 } });
    expect(db.jmk_test_set.update).toHaveBeenCalledWith(expect.objectContaining({ where: { test_set_id: 1 } }));
  }
  if (type === 'Video' || type === 'Note') {
    expect(await call('addTrainerWeekContentById', { type, project_url: 'https://external.example/video' })).toBe('Successfully Created !');
    expect(await call('updateTrainerWeekContentById', { type, content_id: 8, project_url: 'https://external.example/video' })).toBe('Successfully Updated !');
  }
});
test('content storage capacity, required tests, and deletion', async () => {
  db.jmktrinfo.findFirst.mockResolvedValue({ ...trainer(), company: company() });
  await expect(call('addTrainerWeekContentById', { type: 'Video' })).rejects.toThrow('Storage is full');
  db.jmktrinfo.findFirst.mockResolvedValue({ ...trainer(), company: { payments: [{ storage: 10 }] } });
  await expect(call('addTrainerWeekContentById', { type: 'Test' })).rejects.toThrow('Test question is required');
  db.jmk_week_content.findFirst.mockResolvedValue({ content_id: 8, video_url_key: 'old-key' }); db.jmk_week_content.delete.mockResolvedValue({ content_id: 8 });
  expect(await m.deleteTrainerWeekContentById(null, { week_id: 7, content_id: 8 }, contexts.trainer)).toBe('Successfully Deleted !');
  expect(db.jmk_week_content.delete).toHaveBeenCalledWith({ where: { content_id: 8 } });
});
test.each(['Question', 'Answer'])('%s votes create and update with notifications', async imp_type => {
  db.jmk_std_ques.findFirst.mockResolvedValue(question); db.jmk_ques_ans.findFirst.mockResolvedValue({ ans_id: 8, student_id: 2 });
  db.jmk_ques_ans_imp.create.mockResolvedValue({ imp_id: 9 }); db.jmk_ques_ans_imp.update.mockResolvedValue({ imp_id: 9 });
  expect(await call('createAndUpdateQuestionVoteTrainer', { imp_type, question_id: 7, ans_id: 8, upvote: 1 })).toBe('Successfully Created !');
  db.jmk_ques_ans_imp.findFirst.mockResolvedValue({ imp_id: 9 });
  expect(await call('createAndUpdateQuestionVoteTrainer', { imp_type, question_id: 7, ans_id: 8, downvote: 1 })).toBe('Successfully updated !');
  expect(db.jmk_notifications.create).toHaveBeenCalledTimes(2);
});
test('answers and group chats create related notifications and membership', async () => {
  db.jmk_std_ques.findFirst.mockResolvedValue(question); db.jmk_ques_ans.create.mockResolvedValue({ ans_id: 8 });
  expect(await call('createQuesAnsTrainer', { question_id: 7, answer: 'Answer' })).toBe('Successfully created');
  db.jmk_chat_group.create.mockResolvedValue({ group_id: 9 });
  expect(await call('createGroupChat', { group_name: 'Class', students: [{ std_id: 2 }] })).toBe('Successfully created');
  expect(db.jmk_chat_group_student.create).toHaveBeenCalledWith({ data: { group_id: 9, std_id: 2 } });
});
test('pages create, update with replacement images, and delete', async () => {
  db.jmk_crs_blog.create.mockResolvedValue({ serial: 7 }); db.jmk_crs_blog.findFirst.mockResolvedValue({ serial: 7, img_key: 'old-key' }); db.jmk_crs_blog.update.mockResolvedValue({ serial: 7 }); db.jmk_crs_blog.delete.mockResolvedValue({ serial: 7 });
  expect(await call('createAndUpdatePage', { title: 'Page', img: 'upload' })).toBe('Page Successfully Created');
  expect(await call('createAndUpdatePage', { serial: 7, img: 'upload' })).toBe('Page Successfully Updated');
  expect(await m.deletePage(null, { serial: 7 }, contexts.trainer)).toBe('page Successfully deleted');
});
test('trainer marks course completion and records daily attendance once', async () => {
  db.jmkstdcrsinfo.findFirst.mockResolvedValue({ serial: 7 }); db.jmkstdcrsinfo.update.mockResolvedValue({ serial: 7 });
  expect(await call('updateStudentCourseFromTrainer', { std_id: 2, crs_complete: true })).toBe('success');
  expect(await m.addTrainerAttendance(null, {}, contexts.trainer)).toBe('success');
  db.jmk_tr_attendance.findFirst.mockResolvedValue({ serial: 7 });
  await expect(m.addTrainerAttendance(null, {}, contexts.trainer)).rejects.toThrow('Already attendance');
});
test('week and content queries enforce course context and count content types', async () => {
  db.jmk_tr_week.findMany.mockResolvedValue([{ week_id: 7, title: 'Intro' }]); db.jmk_tr_week.findFirst.mockResolvedValue({ week_id: 7, crs_id: 20 });
  const contents = ['Note', 'Project', 'Test', 'Video'].map(type => ({ type })); db.jmk_week_content.findMany.mockResolvedValue(contents); db.jmk_week_content.findFirst.mockResolvedValue({ content_id: 8, week_id: 7 });
  expect(await q.getWeekContentBasedonActiveSession(null, {}, contexts.trainer)).toEqual([{ week_id: 7, title: 'Intro', totalNotes: 1, totalProjects: 1, totalTests: 1, totalVideos: 1 }]);
  expect(await q.getWeekDetailsById(null, { week_id: 7 }, contexts.trainer)).toEqual({ week_id: 7, crs_id: 20 });
  expect(await q.getContentByWeekId(null, { week_id: 7 }, contexts.trainer)).toEqual(contents);
  expect(await q.getContentByContentId(null, { content_id: 8 }, contexts.trainer)).toEqual({ content_id: 8, week_id: 7 });
});
test('assigned courses and trainer profile include course names', async () => {
  const joins = [{ serial: 7, tr_id: 3, course: course() }]; db.jmktrcrsinfo.findMany.mockResolvedValue(joins);
  expect(await q.getAssignedCourses(null, {}, contexts.trainer)).toEqual(joins);
  expect(await q.trainer(null, {}, contexts.trainer)).toEqual(expect.objectContaining({ join_courses: [{ serial: 7, tr_id: 3, crs_id: 20, crs_name: 'Math' }], logo: null }));
});
test('trainer dashboard counts content and current meetings', async () => {
  const crs = { ...course(), time: '00:00,23:59', crs_week: [{ jmk_week_content: ['Video', 'Note', 'Project', 'Test'].map(type => ({ type })) }] };
  db.jmktrinfo.findFirst.mockResolvedValue({ ...trainer(), course: crs, courses: [{ course: crs }] });
  expect(await q.getTrainerDashboard(null, {}, contexts.trainer)).toEqual(expect.objectContaining({ total_video: 1, total_files: 1, total_project: 1, total_test: 1, meetings: [crs] }));
});
test('enrolled students and course tests are returned', async () => {
  db.jmkstdcrsinfo.findMany.mockResolvedValue([{ std_id: 2, crs_complete: true }]); db.jmkstdcrsinfo.findFirst.mockResolvedValue({ crs_complete: true });
  expect(await q.getstudentForTrainer(null, {}, contexts.trainer)).toEqual([expect.objectContaining({ std_id: 2, crs_complete: true })]);
  expect(await q.getStudentById(null, { std_id: 2 }, contexts.trainer)).toEqual(expect.objectContaining({ std_id: 2, crs_complete: true }));
  expect(await q.getWeekContentTests(null, { content_id: 8 }, contexts.trainer)).toEqual([]);
});
test('discussion queries enrich questions, rank answers, and return votes', async () => {
  db.jmk_std_ques.findMany.mockResolvedValue([question]); db.jmk_std_ques.findFirst.mockResolvedValue(question);
  db.jmk_ques_ans_imp.findMany.mockResolvedValue([{ upvote: 1 }, { upvote: 0 }]);
  for (const name of ['getStdQuestionForTrainer', 'getStdRandomQuestionsForTrainer']) expect(await q[name](null, {}, contexts.trainer)).toEqual([expect.objectContaining({ ques_id: 7, totalUpvote: 1, user_role: 'Student' })]);
  expect(await q.getStdQuestionByIdForTrainer(null, { question_id: 7 }, contexts.trainer)).toEqual(expect.objectContaining({ ques_id: 7, user_role: 'Student' }));
  db.jmk_ques_ans.findMany.mockResolvedValue(['Student', 'Teacher', 'Student', 'Teacher'].map((user_type, ans_id) => ({ ans_id, user_type, student_id: 2, teacher_id: 3 })));
  expect((await q.getStdQuesAnsForTrainer(null, { question_id: 7 }, contexts.trainer)).map(a => a.user_role)).toEqual(['Teacher', 'Teacher', 'Student', 'Student']);
  for (const args of [{ question_id: 7 }, { answer_id: 8 }]) expect(await q.getQuestionAnsVoteForTrainer(null, args, contexts.trainer)).toEqual([{ upvote: 1 }, { upvote: 0 }]);
});
test('related students, groups and chat history are assembled', async () => {
  db.jmkstdinfo.findMany.mockResolvedValue([student()]); db.jmk_chat_group.findMany.mockResolvedValue([{ group_id: 9 }]); db.jmk_chat_group.findFirst.mockResolvedValue({ group_id: 9 });
  expect(await q.getAllRelatedCrsStdForTrainer(null, {}, contexts.trainer)).toEqual(expect.objectContaining({ students: [expect.objectContaining({ student: student() })], groups: [{ group: { group_id: 9 } }] }));
  const messages = [{ created_at: '2026-01-02' }, { created_at: '2026-01-01' }];
  db.jmk_chats.findMany.mockResolvedValueOnce(messages).mockResolvedValueOnce([]);
  expect((await q.getStudentChatForTrainer(null, { chatId: 2, chatType: 'student' }, contexts.trainer)).chat_history).toEqual([...messages].reverse());
  db.jmk_group_chats.findMany.mockResolvedValue([{ user_type: 'Student', sender_id: 2, created_at: '2026-01-02' }, { user_type: 'Teacher', sender_id: 3, created_at: '2026-01-01' }]);
  const groupChat = await q.getStudentChatForTrainer(null, { chatId: 9, chatType: 'group' }, contexts.trainer);
  expect(groupChat.chat_history[0].trainer).toEqual(trainer());
  expect(groupChat.chat_history[1].student).toEqual(student());
});
test('page queries count comments and attendance fills absences', async () => {
  db.jmk_crs_blog.findMany.mockResolvedValue([{ serial: 7, comments: [{ id: 1 }] }]); db.jmk_crs_blog.findFirst.mockResolvedValue({ serial: 7 });
  expect(await q.getPagesTrainer(null, {}, contexts.trainer)).toEqual([{ serial: 7, comments: [{ id: 1 }], comments_count: 1 }]);
  expect(await q.getPageTrainer(null, { serial: 7 }, contexts.trainer)).toEqual({ serial: 7 });
  const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - 2);
  db.jmktrinfo.findFirst.mockResolvedValue({ ...trainer(), course: { ...course(), crs_start_date: start } }); db.jmk_tr_attendance.findMany.mockResolvedValue([{ created_at: start }]);
  const attendance = await q.getTrainerAttendance(null, {}, contexts.trainer);
  expect(attendance).toHaveLength(3); expect(attendance.filter(a => a.attendance)).toHaveLength(1);
  await updateTrainerActiveDate(3);
  expect(db.jmktrinfo.update).toHaveBeenCalledWith({ data: { lastSeen: expect.any(Date) }, where: { tr_id: 3 } });
});
