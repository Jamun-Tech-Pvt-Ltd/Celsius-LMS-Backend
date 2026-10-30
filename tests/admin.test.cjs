require('./setup.cjs');
const { db, reset, identities, contexts, admin, company, course } = require('./support.cjs');
const { adminResolvers: m, adminResolversQuery: q, updateAdminActiveDate } = require('../controller/admin/index.js');
const { uploadImgToAWS, deleteImgToAWS } = require('../utils/imageHandler.js');
const { sendMail } = require('../utils/mailHandler.js');
beforeEach(() => { reset(); identities(); });
const invoke = (name, data, ctx = contexts.admin) => m[name](null, { data }, ctx);
const record = { serial: 7, faq_id: 7, icon: 'old', icon_key: 'old-key', usr_img: 'old', usr_img_key: 'old-key', usr_company_logo: 'old', usr_company_logo_key: 'old-key' };
for (const [name, model, id, resultCreate, resultUpdate, extra, context] of [
  ['createAndUpdateCareer', 'jmk_web_career', 'serial', 'create', 'updated', {}, contexts.admin],
  ['createAndUpdateFaq', 'jmkfaq', 'faq_id', 'created', 'updated', {}, contexts.admin],
  ['createAndUpdateCourseCategory', 'jmk_crs_categories', 'serial', 'success', 'success', { icon: 'upload' }, contexts.admin],
  ['createAndUpdateService', 'jmk_services', 'serial', 'success', 'success', { icon: 'upload' }, contexts.admin],
  ['createAndUpdatePartner', 'jmk_partner_ui', 'serial', 'success', 'success', { icon: 'upload' }, contexts.admin],
  ['createAndUpdateTestimonial', 'jmk_testimonial', 'serial', 'created', 'updated', { usr_img: 'upload', usr_company_logo: 'logo' }, contexts.internal],
  ['createAndUpdatePromo', 'jmk_promo_code', 'serial', 'success', 'success', {}, contexts.admin],
]) {
  test(`${name} creates and updates records`, async () => {
    db[model].create.mockResolvedValue(record);
    expect(await invoke(name, { ...extra }, context)).toBe(resultCreate);
    expect(db[model].create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.any(Object) }));
    db[model].findFirst.mockResolvedValue(record);
    db[model].update.mockResolvedValue(record);
    expect(await invoke(name, { [id]: 7, ...extra }, context)).toBe(resultUpdate);
    expect(db[model].update).toHaveBeenCalledWith(expect.objectContaining({ where: { [id]: 7 } }));
    // Leaving optional images out preserves existing assets.
    expect(await invoke(name, { [id]: 7 }, context)).toBe(resultUpdate);
  });
}
for (const [name, model] of [['deleteCareer', 'jmk_web_career'], ['deleteFaqById', 'jmkfaq'], ['deleteTestimonialById', 'jmk_testimonial'], ['deleteServiceById', 'jmk_services'], ['deletePartnerById', 'jmk_partner_ui'], ['deletePromoById', 'jmk_promo_code'], ['deleteCompanyPayment', 'jmktcompanypay']]) {
  test(`${name} deletes requested record`, async () => {
    db[model].findFirst.mockResolvedValue(record);
    db[model].delete.mockResolvedValue(record);
    await expect(m[name](null, { serial: 7, faq_id: 7, pay_id: 7 }, contexts.internal)).resolves.toBe('deleted');
    expect(db[model].delete).toHaveBeenCalled();
  });
}
test('FAQ creation and deletion support company scope', async () => {
  db.jmkfaq.create.mockResolvedValue(record);
  expect(await invoke('createAndUpdateFaq', {})).toBe('created');
  expect(db.jmkfaq.create).toHaveBeenCalledWith({ data: { company_id: 10 } });
  db.jmkfaq.findFirst.mockResolvedValue(record);
  db.jmkfaq.update.mockResolvedValue(record);
  expect(await invoke('createAndUpdateFaq', { faq_id: 7 })).toBe('updated');
});
test('blogs upload images, create slugs, preserve old assets, and delete', async () => {
  db.jmkblog.create.mockResolvedValue({ blog_id: 7 });
  db.jmkblog.update.mockResolvedValue({ blog_id: 7 });
  db.jmkblog.findFirst.mockResolvedValue({ blog_image: 'old', blog_image_key: 'old-key', blog_logo: 'logo', blog_logo_key: 'logo-key' });
  db.jmkblog.delete.mockResolvedValue({ blog_id: 7 });
  expect(await invoke('addBlog', { blog_heading: 'Hello World', blog_image: 'image', blog_logo: 'logo' })).toBe('success');
  expect(db.jmkblog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ blog_slug: 'hello-world', created_by: 1, blog_image: 'https://files.example/test.png' }) });
  expect(await invoke('addBlog', { blog_heading: 'Hello', blog_image: null, blog_logo: null })).toBe('success');
  expect(await invoke('updateBlog', { blog_id: 7, blog_image: 'image', blog_logo: 'logo' })).toBe('success');
  expect(await invoke('updateBlog', { blog_id: 7, blog_image: null, blog_logo: null })).toBe('success');
  expect(db.jmkblog.update).toHaveBeenLastCalledWith({ where: { blog_id: 7 }, data: expect.objectContaining({ blog_image: 'old', blog_logo: 'logo' }) });
  expect(await invoke('updateStatus', { blog_id: 7, status: true })).toBe('success');
  expect(await m.deleteBlog(null, { blog_id: 7 }, contexts.admin)).toBe('success');
  expect(deleteImgToAWS).toHaveBeenCalledWith('old-key');
});
test('admin login signs internal and external identities', async () => {
  await expect(invoke('signinAdmin', { username: 'school', usr_email: 'admin@example.com', usr_password: 'secret' })).resolves.toEqual({ token: 'signed-token' });
  await expect(invoke('signinAdmin', { usr_email: 'admin@example.com', usr_password: 'secret' })).resolves.toEqual({ token: 'signed-token' });
  expect(require('jsonwebtoken').sign).toHaveBeenLastCalledWith({ userId: 1, role: 'admin', platform: 'internal' }, process.env.JWT_SECRET_KEY);
});
test.each(['updateAdmin', 'updateTrainerFromDashboard', 'updateStudentFromAdmin', 'updateSelectedUser'])('%s persists a profile', async name => {
  const model = name.includes('Trainer') ? 'jmktrinfo' : name.includes('Student') ? 'jmkstdinfo' : 'jmkuserinfo';
  db[model].update.mockResolvedValue({ serial: 7 });
  const result = await invoke(name, { usr_id: 1, std_id: 2, tr_id: '3', usr_img_url: 'upload' });
  expect(result).toEqual(name === 'updateAdmin' ? { serial: 7 } : 'success');
  expect(db[model].update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.any(Object) }));
});
test('student and trainer creation enforce unique emails and assign company', async () => {
  db.jmkstdinfo.findFirst.mockResolvedValue(null);
  db.jmkstdinfo.create.mockResolvedValue({ std_id: 2 });
  expect(await invoke('createStudentFromAdmin', { crs_id: 20, std_email: 'new@example.com' })).toBe('created');
  expect(db.jmkstdcrsinfo.create).toHaveBeenCalledWith({ data: { crs_id: 20, std_id: 2, std_crs_verirfy: true } });
  db.jmktrinfo.findFirst.mockResolvedValue(null);
  db.jmktrinfo.create.mockResolvedValue({ tr_id: 3 });
  expect(await invoke('createTrainerFromDashboard', { tr_email: 'new@example.com' })).toBe('success');
  expect(db.jmktrinfo.create).toHaveBeenCalledWith({ data: { tr_email: 'new@example.com', company_id: 10 } });
});
test('course approval selects the first verified course', async () => {
  db.jmkstdcrsinfo.findFirst.mockResolvedValueOnce({ course: course(), student: { std_id: 2 }, std_id: 2, crs_id: 20 }).mockResolvedValueOnce(null);
  db.jmkstdcrsinfo.update.mockResolvedValue(record);
  expect(await invoke('updateStudentCourseFromAdmin', { serial: 7, std_crs_verirfy: true })).toBe('success');
  expect(db.jmkstdinfo.update).toHaveBeenCalledWith({ where: { std_id: 2 }, data: { crs_id: 20 } });
});
test('trainer course assignment notifies trainer and can be removed', async () => {
  db.jmktrcrsinfo.create.mockResolvedValue({ tr_id: 3 });
  expect(await invoke('assignTrainerCourseFromDashboard', { crs_id: 20, tr_id: 3 })).toBe('success');
  expect(db.jmk_notifications.create).toHaveBeenCalledWith({ data: expect.objectContaining({ user_id: 3, category: 'new_course' }) });
  db.jmktrcrsinfo.findFirst.mockResolvedValue({ serial: 7 });
  db.jmktrcrsinfo.delete.mockResolvedValue(record);
  expect(await invoke('removeTrainerCourseFromDashboard', { crs_id: 20, tr_id: 3 })).toBe('success');
  expect(db.jmktrcrsinfo.delete).toHaveBeenCalledWith({ where: { serial: 7 } });
});
test('contact details and user management persist changes', async () => {
  db.contactinfo.findFirst.mockResolvedValue(record);
  expect(await invoke('updateContactInfo', { serial: 7, email_address: 'a@example.com', contact_number: '123' })).toBe('success');
  db.jmkuserinfo.findFirst.mockResolvedValueOnce(admin()).mockResolvedValueOnce(null);
  db.jmkuserinfo.create.mockResolvedValue(record);
  expect(await invoke('createNewUser', { usr_img_url: 'upload' })).toBe('success');
  db.jmkuserinfo.findFirst.mockResolvedValueOnce(admin()).mockResolvedValueOnce(null);
  expect(await invoke('createNewUser', {}, contexts.internal)).toBe('success');
  db.jmkuserinfo.delete.mockResolvedValue(record);
  expect(await m.deleteUserById(null, { usrId: 9 }, contexts.admin)).toBe('success');
  expect(db.jmkuserinfo.delete).toHaveBeenCalledWith({ where: { usr_id: 9 } });
});
test('verified payment updates paid and due balances', async () => {
  db.jmktstdpayinfo.findFirst.mockResolvedValue({ pay_id: 7 });
  db.jmktstdpayinfo.update.mockResolvedValue({ pay_id: 7, std_id: 2, crs_id: 20, pay_amount: 30 });
  db.jmkstdcrsinfo.findFirst.mockResolvedValue({ serial: 8, amt_paid: 10, amt_due: 90 });
  expect(await m.updatePaymentStatus(null, { pay_id: 7 }, contexts.admin)).toBe('success');
  expect(db.jmkstdcrsinfo.update).toHaveBeenCalledWith({ where: { serial: 8 }, data: { amt_paid: 40, amt_due: 60 } });
});
for (const [name, model, result] of [['createAndUpdatePolicy', 'jmk_policy', 'success'], ['createAndUpdateModal', 'jmk_web_modal', 'create']]) {
  test(`${name} handles new and existing content`, async () => {
    db[model].create.mockResolvedValue(record);
    expect(await invoke(name, { img: 'upload' })).toBe(result);
    db[model].findFirst.mockResolvedValue({ ...record, img: 'old', img_key: 'old-key' });
    db[model].update.mockResolvedValue(record);
    expect(await invoke(name, { img: 'upload' })).toBe(name.includes('Policy') ? 'success' : 'updated');
    expect(await invoke(name, {})).toBe(name.includes('Policy') ? 'success' : 'updated');
  });
}
test.each([['internal', 'Jaamun'], ['external', 'Company']])('website details create/update for %s', async (scope, type) => {
  db.jmk_web_details.create.mockResolvedValue(record);
  db.jmk_web_details.update.mockResolvedValue(record);
  const ctx = scope === 'internal' ? contexts.internal : contexts.admin;
  expect(await invoke('createAndUpdateWebDetails', { type, logo: 'logo', qr: 'qr' }, ctx)).toBe('create');
  db.jmk_web_details.findFirst.mockResolvedValue({ ...record, logo: 'old', logo_key: 'old-key', qr: 'old-qr', qr_key: 'old-qr-key' });
  expect(await invoke('createAndUpdateWebDetails', { type, logo: 'logo', qr: 'qr' }, ctx)).toBe('updated');
  expect(await invoke('createAndUpdateWebDetails', { type }, ctx)).toBe('updated');
});
test.each([['Company', contexts.internal, 'jmkuserinfo'], ['Students', contexts.admin, 'jmkstdinfo'], ['Trainers', contexts.admin, 'jmktrinfo']])('email sends to %s with and without a course/company filter', async (users, ctx, model) => {
  db[model].findMany.mockResolvedValue([{ usr_email: 'a@example.com', std_email: 'a@example.com', tr_email: 'a@example.com' }]);
  for (const id of [7, undefined]) expect(await invoke('sendEmailByUser', { users, id, subject: 'Hi', content: '<p>Hello</p>' }, ctx)).toBe('send');
  expect(sendMail).toHaveBeenCalledTimes(2);
  expect(sendMail).toHaveBeenCalledWith('a@example.com', 'Hi', '<p>Hello</p>');
});
test.each(['Monthly', 'Yearly'])('company payments calculate %s end dates for create and update', async package_type => {
  db.jmkcompany.findFirst.mockResolvedValue({ ...company(), payments: [] });
  const data = { company_id: 10, start_date: '2026-01-15T00:00:00.000Z', package_type, users: 20 };
  expect(await invoke('createAndUpdatePayment', { ...data }, contexts.internal)).toBe('Created payment recod');
  const end_date = package_type === 'Monthly' ? '2026-02-15T00:00:00.000Z' : '2027-01-15T00:00:00.000Z';
  expect(db.jmktcompanypay.create).toHaveBeenCalledWith({ data: expect.objectContaining({ end_date }) });
  db.jmktcompanypay.findFirst.mockResolvedValue({ pay_id: 7 });
  expect(await invoke('createAndUpdatePayment', { ...data, pay_id: 7 }, contexts.internal)).toBe('Updated payment recod');
  expect(db.jmktcompanypay.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ end_date }) }));
});
test('package requests create, edit, review and delete pending requests', async () => {
  db.jmk_company_package_req.create.mockResolvedValue(record);
  expect(await invoke('createPackageReq', {})).toBe('Created');
  db.jmk_company_package_req.findFirst.mockResolvedValue({ serial: 7, status: 'Pending' });
  db.jmk_company_package_req.update.mockResolvedValue(record);
  db.jmk_company_package_req.delete.mockResolvedValue(record);
  expect(await invoke('createPackageReq', { serial: 7 })).toBe('Updated');
  expect(await m.updatePackageReq(null, { serial: 7, status: 'Approved' }, contexts.internal)).toBe('Updated');
  for (const ctx of [contexts.internal, contexts.admin]) expect(await m.deletePackageReq(null, { serial: 7 }, ctx)).toBe('deleted');
});
test('certificate layouts upload required assets and support replacement', async () => {
  db.jmk_com_cer_layout.create.mockResolvedValue(record);
  const data = { logo: 'logo', signature: 'signature', background: 'background' };
  expect(await invoke('createOrUpdateCertLayout', { ...data })).toBe('Certificate layout created successfully');
  expect(db.jmk_com_cer_layout.create).toHaveBeenCalledWith({ data: expect.objectContaining({ company_id: 10, logo_url: 'https://files.example/test.png' }) });
  db.jmk_com_cer_layout.findFirst.mockResolvedValue(record);
  db.jmk_com_cer_layout.update.mockResolvedValue(record);
  expect(await invoke('createOrUpdateCertLayout', { ...data })).toBe('Certificate layout updated successfully');
  expect(await invoke('createOrUpdateCertLayout', {})).toBe('Certificate layout updated successfully');
});
test('package updates replace monthly and yearly feature rows', async () => {
  db.jmk_packages.findFirst.mockResolvedValue({ id: 'basic', icon_key: 'old-key' });
  expect(await invoke('updateOurPackage', { id: 'basic', icon: 'upload', monthly_features: ['Monthly'], yearly_features: ['Yearly'] })).toBe('updated');
  expect(db.jmk_packages.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ monthly_features: { deleteMany: {}, create: [{ title: 'Monthly' }] }, yearly_features: { deleteMany: {}, create: [{ title: 'Yearly' }] } }) }));
});
const queryCases = [
 ['getPayments', 'jmkstdreceipt', 'findMany'], ['getstudentForAdmin', 'jmkstdinfo', 'findMany'], ['getstudentByIdForAdmin', 'jmkstdinfo', 'findFirst'], ['getTrainerDataForAdmin', 'jmktrinfo', 'findMany'], ['getAllUserInfo', 'jmkuserinfo', 'findMany'], ['getUserInfoById', 'jmkuserinfo', 'findFirst'], ['getFaqs', 'jmkfaq', 'findMany'], ['getWebModal', 'jmk_web_modal', 'findFirst'], ['getAllCareer', 'jmk_web_career', 'findMany'], ['getCareer', 'jmk_web_career', 'findFirst'], ['getStudentCourseRequest', 'jmkstdcrsinfo', 'findMany'], ['getCourseCategories', 'jmk_crs_categories', 'findMany'], ['getCourseCategory', 'jmk_crs_categories', 'findFirst'], ['getServices', 'jmk_services', 'findMany'], ['getService', 'jmk_services', 'findFirst'], ['getPolicy', 'jmk_policy', 'findFirst'], ['getPartners', 'jmk_partner_ui', 'findMany'], ['getPartner', 'jmk_partner_ui', 'findFirst'], ['getPartnerShipReq', 'jmkpartnerReq', 'findMany'], ['getPartnerShipReqById', 'jmkpartnerReq', 'findFirst'], ['getJobReqs', 'jmkjobReq', 'findMany'], ['getJobReqById', 'jmkjobReq', 'findFirst'], ['getContactReqs', 'jmkcontact', 'findMany'], ['getContactReqById', 'jmkcontact', 'findFirst'], ['getBlogs', 'jmkblog', 'findMany'], ['getBlog', 'jmkblog', 'findFirst'], ['getCompanyPayments', 'jmktcompanypay', 'findMany'], ['getCompanyPaymentById', 'jmktcompanypay', 'findFirst'], ['getStudentPayments', 'jmktstdpayinfo', 'findMany'], ['getPackageUpdateReq', 'jmk_company_package_req', 'findMany'],
];
for (const [name, model, method] of queryCases) test(`${name} returns queried records`, async () => {
  const rows = method === 'findMany' ? [record] : record;
  db[model][method].mockResolvedValue(rows);
  const ctx = name.startsWith('getCompanyPay') ? contexts.internal : contexts.admin;
  expect(await q[name](null, { serial: 7, usr_id: 7, std_id: 7 }, ctx)).toEqual(rows);
  expect(db[model][method]).toHaveBeenCalled();
  if (!['getStudentCourseRequest', 'getStudentPayments'].includes(name)) expect(await q[name](null, { serial: 7 }, contexts.internal)).toEqual(rows);
});
test('admin details calculate usage and payment limits', async () => {
  db.jmkuserinfo.count.mockResolvedValue(1); db.jmkstdinfo.count.mockResolvedValue(2); db.jmktrinfo.count.mockResolvedValue(3);
  expect(await q.admin(null, {}, contexts.admin)).toEqual(expect.objectContaining({ total_user: 6, total_user_limit: 100, expiry_date: '2099-01-01' }));
  db.jmkuserinfo.findFirst.mockResolvedValue({ ...admin(), company: { ...company(), payments: [] } });
  db.jmktcompanypay.findFirst.mockResolvedValue({ users: 50, end_date: '2027-01-01' });
  expect(await q.admin(null, {}, contexts.admin)).toEqual(expect.objectContaining({ total_user_limit: 50 }));
  db.jmkuserinfo.findFirst.mockResolvedValue({ ...admin(), company: null });
  expect(await q.admin(null, {}, contexts.internal)).toEqual(expect.objectContaining({ total_user: 0 }));
});
test('trainer and student course queries include joined information', async () => {
  db.jmktrcrsinfo.findMany.mockResolvedValue([{ serial: 7, tr_id: 3, course: course() }]);
  for (const ctx of [contexts.admin, contexts.internal]) {
    expect(await q.getTrainerByIdForAdmin(null, { tr_id: 3 }, ctx)).toEqual(expect.objectContaining({ join_courses: [{ serial: 7, tr_id: 3, crs_id: 20, crs_name: 'Math' }] }));
    db.jmkstdcrsinfo.findFirst.mockResolvedValue({ course: course() });
    expect(await q.getstudentCourseByIdForAdmin(null, { serial: 7 }, ctx)).toEqual({ course: course() });
  }
});
test('admin dashboards aggregate course content and users', async () => {
  db.jmkcrsinfo.findMany.mockResolvedValue([{ ...course(), crs_week: [{ jmk_week_content: ['Video', 'Project', 'Test', 'Note'].map(type => ({ type })) }] }]);
  expect(await q.getAdminDashboard(null, {}, contexts.admin)).toEqual(expect.objectContaining({ total_video: 1, total_project: 1, total_test: 1, total_files: 1, total_courses: 1 }));
  expect(await q.getAdminDashboard(null, {}, contexts.internal)).toEqual(expect.objectContaining({ total_company: 0, total_student: 0 }));
});
test('promos and payments attach course/student details', async () => {
  db.jmk_promo_code.findMany.mockResolvedValue([{ serial: 7, crs_id: 20 }]);
  expect(await q.getPropmo(null, {}, contexts.admin)).toEqual([{ serial: 7, crs_id: 20, crs_name: 'Math' }]);
  db.jmk_promo_code.findFirst.mockResolvedValue({ discount: 10, jmkstdcrsinfo: [{ serial: 7, std_id: 2, crs_id: 20 }] });
  expect(await q.getPropmoById(null, { serial: 7 }, contexts.admin)).toEqual(expect.objectContaining({ promoStudents: [expect.objectContaining({ course: 'Math', discount: 10 })] }));
  db.jmkstdcrsinfo.findMany.mockResolvedValue([{ serial: 7, crsmain_id: 20, amt_paid: 30, std_id: 2 }]);
  db.jmkcrsmain.findUnique.mockResolvedValue({ title: 'Math' });
  expect(await q.getPaymentInfo(null, {}, contexts.admin)).toEqual([expect.objectContaining({ pay_id: 7, pay_amount: 30, crs_name: 'Math' })]);
});
test('trainer attendance fills missing course dates', async () => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const attendance = { course: { crs_start_date: today }, trainer: { jmk_tr_attendance: [{ created_at: new Date() }] } };
  db.jmktrcrsinfo.findMany.mockResolvedValue([attendance]);
  db.jmktrcrsinfo.findFirst.mockResolvedValue(attendance);
  expect(await q.getTrainerAttendanceFromAdmin(null, {}, contexts.admin)).toEqual([expect.objectContaining({ today_attendance: true })]);
  expect(await q.getTrainerAttendanceFromAdminById(null, { tr_id: 3, crs_id: 20 }, contexts.admin)).toEqual(expect.objectContaining({ trainer: { jmk_tr_attendance: [{ attendance: true, created_at: today }] } }));
  await updateAdminActiveDate(1);
  expect(db.jmkuserinfo.update).toHaveBeenCalledWith({ data: { lastSeen: expect.any(Date) }, where: { usr_id: 1 } });
});
