require('./setup.cjs');
const { db, reset, identities, contexts, company, course } = require('./support.cjs');
const { companyResolvers: c, companyResolversQuery: cq } = require('../controller/company/index.js');
const { jamuntekResolvers: j, jamuntekResolversQuery: jq } = require('../controller/jamuntek/index.js');
const { sendMail } = require('../utils/mailHandler.js');
beforeEach(reset);
test('company signup checks duplicates and sends confirmation', async () => {
  db.jmkcompany.create.mockResolvedValue(company());
  expect(await c.signupCompany(null, { data: company() })).toBe('success');
  expect(sendMail).toHaveBeenCalledWith('school@example.com', 'Successfully Requested ', expect.stringContaining('School'));
  db.jmkcompany.findFirst.mockResolvedValue(company());
  await expect(c.signupCompany(null, { data: company() })).rejects.toThrow('Company already exist');
  db.jmkcompany.findFirst.mockResolvedValue(null); db.jmkcompany.create.mockResolvedValue(null);
  await expect(c.signupCompany(null, { data: company() })).rejects.toThrow('Something went wrong');
});
test('internal company verification provisions its first administrator once', async () => {
  db.jmkcompany.findFirst.mockResolvedValue(company()); db.jmkcompany.update.mockResolvedValue(company());
  db.jmkuserinfo.create.mockResolvedValue({ usr_password: 'generated' });
  expect(await c.updateCompany(null, { data: { serial: 10, c_verified: true } }, contexts.internal)).toEqual(company());
  expect(db.jmkuserinfo.create).toHaveBeenCalledWith({ data: expect.objectContaining({ company_id: 10, usr_email: 'school@example.com' }) });
  expect(sendMail).toHaveBeenCalledWith('school@example.com', expect.any(String), expect.stringContaining('generated'));
  db.jmkuserinfo.findFirst.mockResolvedValue({ usr_id: 1 });
  await c.updateCompany(null, { data: { serial: 10 } }, contexts.internal);
  expect(db.jmkuserinfo.create).toHaveBeenCalledTimes(1);
  db.jmkcompany.update.mockResolvedValue({ ...company(), c_verified: false });
  await expect(c.updateCompany(null, { data: { serial: 10 } }, contexts.internal)).resolves.toEqual(expect.objectContaining({ c_verified: false }));
});
test('external company updates use the authenticated company', async () => {
  identities(); db.jmkcompany.update.mockResolvedValue(company());
  expect(await c.updateCompany(null, { data: { c_name: 'New name' } }, contexts.admin)).toEqual(company());
  expect(db.jmkcompany.update).toHaveBeenCalledWith({ where: { serial: 10 }, data: { c_name: 'New name' } });
  db.jmkcompany.update.mockResolvedValue(null);
  await expect(c.updateCompany(null, { data: {} }, contexts.admin)).rejects.toThrow('Invalid !!');
});
test('company query computes totals and flattens course assets', async () => {
  identities(); db.jmkcrsinfo.findMany.mockResolvedValue([{ crs_week: [{ jmk_week_content: [{ content_id: 7 }] }] }]);
  const result = await cq.getCompany(null, { serial: 10 }, contexts.admin);
  expect(result).toEqual(expect.objectContaining({ totalCourses: 1, totalAdmins: 0, totalTrainer: 0, totalStudents: 0, files: [{ content_id: 7 }] }));
  db.jmkcompany.findMany.mockResolvedValue([company()]);
  expect(await cq.getCompanyList(null, {}, contexts.admin)).toEqual([company()]);
  for (const name of ['getCompany', 'getCompanyList']) {
    await expect(cq[name](null, {}, contexts.student)).rejects.toThrow('invalid acccess');
    db.jmkcompany[name === 'getCompany' ? 'findFirst' : 'findMany'].mockResolvedValue(null);
    await expect(cq[name](null, {}, contexts.admin)).rejects.toThrow('invalid');
  }
});
for (const [name, model, option, data, expected] of [
  ['contactForm', 'jmkcontact', 'Contact Request', { cfname: 'Sam', cemail: 'sam@example.com', serial: 7 }, 'Success'],
  ['signupPartner', 'jmkpartnerReq', 'Partnership Request', { pr_fname: 'Sam', pr_email: 'sam@example.com', pr_id: 7 }, 'success'],
  ['jobReq', 'jmkjobReq', 'Job Request', { fname: 'Sam', email: 'sam@example.com', serial: 7, career_id: 4, resume: 'upload' }, 'success'],
]) {
  test(`${name} saves request and notifies admins with read access`, async () => {
    db[model].create.mockResolvedValue(data);
    const permissions = [{ name: 'RegistrationInfo', option: [{ name: option, access: [{ read: true }] }] }];
    db.jmkuserinfo.findMany.mockResolvedValue([{ usr_id: 1, usr_access: JSON.stringify(permissions) }, { usr_id: 9, usr_access: '[]' }]);
    expect(await j[name](null, { data: { ...data } })).toBe(expected);
    expect(db[model].create).toHaveBeenCalledWith({ data: expect.any(Object) });
    expect(db.jmk_notifications.create).toHaveBeenCalledTimes(1);
    expect(db.jmk_notifications.create).toHaveBeenCalledWith({ data: expect.objectContaining({ user_id: 1, is_read: false }) });
  });
  test(`${name} rejects a failed creation`, async () => {
    await expect(j[name](null, { data: { ...data } })).rejects.toThrow(/Something/);
  });
  if (name !== 'contactForm') test(`${name} rejects duplicate requests`, async () => {
    db[model].findFirst.mockResolvedValue(data);
    await expect(j[name](null, { data: { ...data } })).rejects.toThrow('already exist');
    expect(db[model].create).not.toHaveBeenCalled();
  });
}
test('job applications require a resume and successful upload', async () => {
  await expect(j.jobReq(null, { data: {} })).rejects.toThrow('Resume is Required');
  require('../utils/imageHandler.js').uploadImgToAWS.mockResolvedValue({});
  await expect(j.jobReq(null, { data: { resume: 'upload' } })).rejects.toThrow('Something went wrong');
});
test('promo validation covers missing, exhausted, future, wrong-course, and valid codes', async () => {
  const call = () => j.applyCheck(null, { data: { code: 'SAVE', crs_name: 'Math' } });
  await expect(call()).rejects.toThrow('Invalid Promo Code');
  db.jmk_promo_code.findFirst.mockResolvedValue({ upto: 0 });
  await expect(call()).rejects.toThrow('Invalid');
  db.jmk_promo_code.findFirst.mockResolvedValue({ upto: 1, created_at: '2099-01-01' });
  await expect(call()).rejects.toThrow('Promo Code Expire');
  db.jmk_promo_code.findFirst.mockResolvedValue({ upto: 1, created_at: '2020-01-01', crs_id: 20, discount: 15 });
  db.jmkcrsinfo.findFirst.mockResolvedValue({ crs_name: 'Other' });
  await expect(call()).rejects.toThrow('Invalid Promo Code');
  db.jmkcrsinfo.findFirst.mockResolvedValue(course());
  expect(await call()).toBe(15);
});
for (const [name, model, method] of [['getAllCareerPage', 'jmk_web_career', 'findMany'], ['getAllCareerPageById', 'jmk_web_career', 'findFirst'], ['getServicByTitle', 'jmk_services', 'findFirst']]) test(`${name} returns data or reports missing records`, async () => {
  const result = method === 'findMany' ? [{ serial: 7 }] : { serial: 7 };
  db[model][method].mockResolvedValue(result);
  expect(await jq[name](null, { serial: 7, title: 'Service' }, {})).toEqual(result);
  db[model][method].mockResolvedValue(null);
  await expect(jq[name](null, {}, {})).rejects.toThrow('Data Not Found');
});
