require('./setup.cjs');
const { db, reset, identities, contexts, course, trainer, student } = require('./support.cjs');
const { commonResolvers: m, commonResolversQuery: q } = require('../controller/common/index.js');
beforeEach(() => { reset(); identities(); });
test('courses create with company ownership, update images, and soft delete', async () => {
  db.jmkcrsinfo.findFirst.mockResolvedValueOnce(null);
  db.jmkcrsinfo.create.mockResolvedValue({ crs_id: 20 });
  db.jmkcrsinfo.update.mockResolvedValue(course());
  expect(await m.createCourse(null, { data: { crs_name: 'Math', crs_image: 'upload' } }, contexts.admin)).toBe('Success');
  expect(db.jmkcrsinfo.create).toHaveBeenCalledWith({ data: expect.objectContaining({ crs_company_id: 10, crs_image_key: 'new-key' }) });
  for (const crs_image of ['upload', null]) expect(await m.updateCourse(null, { data: { crs_id: '20', crs_image } }, contexts.admin)).toBe('success');
  expect(await m.deleteCourse(null, { crs_id: 20 }, contexts.admin)).toBe('success');
  expect(db.jmkcrsinfo.update).toHaveBeenLastCalledWith({ where: { crs_id: 20 }, data: { isDeleted: true } });
});
test.each(['admin', 'student', 'trainer'])('notifications and activity use the %s identity', async role => {
  const ctx = contexts[role];
  expect(await m.deleteAllNotification(null, { data: {} }, ctx)).toBe('success');
  expect(db.jmk_notifications.deleteMany).toHaveBeenCalledWith({ where: { user_id: ctx.userId, user_type: role[0].toUpperCase() + role.slice(1) } });
  db.jmk_notifications.findMany.mockResolvedValue([{ serial: 7 }]);
  expect(await q.getMyNotifications(null, {}, ctx)).toEqual([{ serial: 7 }]);
  db.jmk_notifications.findMany.mockResolvedValue(null);
  expect(await q.getMyNotifications(null, {}, ctx)).toEqual([]);
  expect(await m.userActiveTime(null, {}, ctx)).toBe('User activity tracked successfully');
  expect(db.jmk_std_track_data.create).toHaveBeenCalledWith({ data: { user_id: ctx.userId, user_type: role[0].toUpperCase() + role.slice(1), time: 1 } });
  db.jmk_std_track_data.findFirst.mockResolvedValue({ serial: 7, time: 5 });
  await m.userActiveTime(null, {}, ctx);
  expect(db.jmk_std_track_data.update).toHaveBeenCalledWith({ where: { serial: 7 }, data: { time: 6 } });
});
test('individual notifications update and delete by serial', async () => {
  expect(await m.updateNotification(null, { serial: 7 }, contexts.student)).toBe('success');
  expect(db.jmk_notifications.update).toHaveBeenCalledWith({ where: { serial: 7 }, data: { is_read: true } });
  expect(await m.deleteNotification(null, { serial: 7 }, contexts.student)).toBe('success');
  expect(db.jmk_notifications.delete).toHaveBeenCalledWith({ where: { serial: 7 } });
  await expect(m.updateNotification(null, {}, contexts.student)).rejects.toThrow('invalid serial');
});
test.each(['admin', 'trainer'])('%s toggles attendance and updates syllabus', async role => {
  const ctx = contexts[role]; const crs_id = role === 'admin' ? 20 : undefined;
  const args = { date: '2026-10-01', std_id: 2, crs_id };
  expect(await m.updateAttendance(null, args, ctx)).toBe('attendance added');
  expect(db.jmk_std_attendance.create).toHaveBeenCalledWith({ data: { std_id: 2, crs_id: 20, attendance: true, created_at: '2026-10-01' } });
  db.jmk_std_attendance.findFirst.mockResolvedValue({ serial: 7 });
  expect(await m.updateAttendance(null, args, ctx)).toBe('attendance removed');
  expect(db.jmk_std_attendance.delete).toHaveBeenCalledWith({ where: { serial: 7 } });
  expect(await m.addCourseSyllabus(null, { crs_id, crs_syllabus: 'Week one' }, ctx)).toBe('success');
  expect(db.jmkcrsinfo.update).toHaveBeenCalledWith({ where: { crs_id: 20 }, data: { crs_syllabus: 'Week one' } });
});
test.each(['admin', 'student', 'trainer'])('%s creates support tickets and uploads attachments', async role => {
  db.jmk_ticket.create.mockResolvedValue({ serial: 7 });
  expect(await m.createTicket(null, { data: { title: 'Help', img: ['upload'] } }, contexts[role])).toBe('Ticket created');
  expect(db.jmk_ticket.create).toHaveBeenCalledWith({ data: { user_id: contexts[role].userId, user_type: role[0].toUpperCase() + role.slice(1), title: 'Help' } });
  expect(db.jmk_ticket_image.create).toHaveBeenCalledWith({ data: { ticket_id: 7, url: 'https://files.example/test.png', key: 'new-key' } });
});
test.each([contexts.admin, contexts.internal])('admins update support ticket status', async ctx => {
  db.jmk_ticket.findFirst.mockResolvedValue({ serial: 7 });
  db.jmk_ticket.update.mockResolvedValue({ serial: 7 });
  expect(await m.updateTicket(null, { serial: 7, status: 'Completed' }, ctx)).toBe('Ticket status updatde');
  expect(db.jmk_ticket.update).toHaveBeenCalledWith({ where: { serial: 7 }, data: { status: 'Completed' } });
});
test.each(['admin', 'student', 'trainer', 'internal'])('%s reads tickets with associated users', async role => {
  const user_type = role === 'internal' ? 'Admin' : role[0].toUpperCase() + role.slice(1);
  const ticket = { serial: 7, user_type, user_id: contexts[role].userId };
  db.jmk_ticket.findMany.mockResolvedValue([ticket]); db.jmk_ticket.findFirst.mockResolvedValue(ticket);
  expect(await q.getTickets(null, {}, contexts[role])).toEqual([expect.objectContaining(ticket)]);
  expect(await q.getTicket(null, { serial: 7 }, contexts[role])).toEqual(expect.objectContaining(ticket));
});
test('company admins attach student and trainer identities to support requests', async () => {
  db.jmk_ticket.findMany.mockResolvedValue([{ user_type: 'Student', user_id: 2 }, { user_type: 'Trainer', user_id: 3 }]);
  expect(await q.getTickets(null, {}, contexts.admin)).toEqual([expect.objectContaining({ student: student() }), expect.objectContaining({ trainer: trainer() })]);
  for (const user_type of ['Student', 'Trainer']) {
    db.jmk_ticket.findFirst.mockResolvedValue({ user_type });
    expect(await q.getTicket(null, { serial: 7 }, contexts.admin)).toEqual(expect.objectContaining({ user_type }));
  }
});
for (const [name, model, method, args] of [
  ['getPopupModal', 'jmk_web_modal', 'findFirst', {}], ['getAllActiveBlogs', 'jmkblog', 'findMany', {}], ['getBlogBySlug', 'jmkblog', 'findFirst', { blog_slug: 'hello' }], ['getFaqById', 'jmkfaq', 'findFirst', { faq_id: 7 }], ['getTestimonials', 'jmk_testimonial', 'findMany', {}], ['getTestimonial', 'jmk_testimonial', 'findFirst', { serial: 7 }], ['getOurPackageById', 'jmk_packages', 'findFirst', { id: 'basic' }],
]) test(`${name} returns data and reports missing records`, async () => {
  const result = method === 'findMany' ? [{ serial: 7 }] : { serial: 7 };
  db[model][method].mockResolvedValue(result);
  expect(await q[name](null, args, contexts.admin)).toEqual(result);
  if (name !== 'getOurPackageById') {
    db[model][method].mockResolvedValue(null);
    await expect(q[name](null, args, contexts.admin)).rejects.toThrow();
  }
});
test.each(['admin', 'student', 'internal'])('contact info supports %s scope', async role => {
  db.jmk_web_details.findFirst.mockResolvedValue({ serial: 7 });
  expect(await q.getContactInfo(null, { type: 'Jaamun' }, contexts[role])).toEqual({ serial: 7 });
  expect(db.jmk_web_details.findFirst).toHaveBeenCalledWith({ where: role === 'internal' ? { company_id: null, type: 'Jaamun' } : { company_id: 10, type: 'Company' } });
});
test.each(['admin', 'internal'])('course queries support %s scope', async role => {
  db.jmkcrsinfo.findMany.mockResolvedValue([course()]);
  expect(await q.getAllCourseList(null, {}, contexts[role])).toEqual([course()]);
  expect(await q.getCourseById(null, { crs_id: 20 }, contexts[role])).toEqual(course());
});
test.each([['Student', contexts.student], ['Trainer', contexts.trainer], ['Public', {}]])('FAQ %s applies correct company filter', async (type, ctx) => {
  expect(await q.getFaqByType(null, { type }, ctx)).toEqual([]);
  expect(db.jmkfaq.findMany).toHaveBeenCalledWith({ where: { type, company_id: type === 'Public' ? null : 10 } });
});
test.each(['admin', 'trainer', 'student'])('%s attendance fills absent dates', async role => {
  const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - 2);
  const crs = { ...course(), crs_start_date: start };
  db.jmkcrsinfo.findFirst.mockResolvedValue(crs);
  db.jmkstdinfo.findFirst.mockResolvedValue({ ...student(), course: crs });
  db.jmktrinfo.findFirst.mockResolvedValue({ ...trainer(), course: crs });
  db.jmk_std_attendance.findMany.mockResolvedValue([{ created_at: start }]);
  const args = role === 'admin' ? { std_id: 2, crs_id: 20 } : role === 'trainer' ? { std_id: 2 } : {};
  const result = await q.getAttendanceByStudentId(null, args, contexts[role]);
  expect(result.total_present).toBe(1);
  expect(result.attendance).toHaveLength(3);
  expect(result.attendance.filter(day => day.attendance)).toHaveLength(1);
  if (role !== 'student') {
    db.jmkcrsinfo.findMany.mockResolvedValue([crs]);
    db.jmkstdcrsinfo.findMany.mockResolvedValue([{ std_id: 2, crs_id: 20, course: crs, student: student() }]);
    const summary = await q.getAttendance(null, {}, contexts[role]);
    expect(summary.total_course).toBe(1);
    expect(summary.attendance).toHaveLength(1);
  }
});
test.each([[null, 'Notfound'], [{ c_verified: false }, 'Unverified'], [{ c_verified: true, payments: [] }, 'Payment'], [{ c_verified: true, payments: [{}] }, 'Success']])('company availability maps to %s', async (company, expected) => {
  db.jmkcompany.findFirst.mockResolvedValue(company);
  expect(await q.checkValidCompany(null, { username: 'school' }, {})).toBe(expected);
});
test.each(['admin', 'student'])('certificate layout is scoped to %s company', async role => {
  db.jmk_com_cer_layout.findFirst.mockResolvedValue({ serial: 7 });
  expect(await q.getCertLayout(null, {}, contexts[role])).toEqual({ serial: 7 });
  expect(db.jmk_com_cer_layout.findFirst).toHaveBeenCalledWith({ where: { company_id: 10 } });
});
test('packages bootstrap defaults and their features only for an empty store', async () => {
  db.jmk_packages.create.mockResolvedValue({ id: 'new' });
  db.jmk_packages.findMany.mockResolvedValueOnce([]).mockResolvedValue([{ id: 'new' }]);
  expect(await q.getOurPackages(null, {})).toEqual([{ id: 'new' }]);
  expect(db.jmk_packages.create).toHaveBeenCalledTimes(3);
  expect(db.jmk_packages_features.createMany).toHaveBeenCalledTimes(6);
  expect(await q.getOurPackages(null, {})).toEqual([{ id: 'new' }]);
  expect(db.jmk_packages.create).toHaveBeenCalledTimes(3);
});
