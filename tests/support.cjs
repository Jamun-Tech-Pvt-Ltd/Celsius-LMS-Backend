// Explicit Prisma delegates: unexpected models/methods fail rather than contacting a database.
const models = [
  "contactinfo",
  "jmk_ai_chats",
  "jmk_chat_group",
  "jmk_chat_group_student",
  "jmk_chats",
  "jmk_com_cer_layout",
  "jmk_company_package_req",
  "jmk_crs_blog",
  "jmk_crs_blog_comments",
  "jmk_crs_categories",
  "jmk_group_chats",
  "jmk_notifications",
  "jmk_packages",
  "jmk_packages_features",
  "jmk_partner_ui",
  "jmk_policy",
  "jmk_promo_code",
  "jmk_ques_ans",
  "jmk_ques_ans_imp",
  "jmk_ques_sub",
  "jmk_services",
  "jmk_std_attendance",
  "jmk_std_note",
  "jmk_std_ques",
  "jmk_std_test_ans",
  "jmk_std_test_result",
  "jmk_std_todos",
  "jmk_std_track_data",
  "jmk_test_set",
  "jmk_testimonial",
  "jmk_ticket",
  "jmk_ticket_image",
  "jmk_tr_attendance",
  "jmk_tr_week",
  "jmk_web_career",
  "jmk_web_details",
  "jmk_web_modal",
  "jmk_week_content",
  "jmkblog",
  "jmkcompany",
  "jmkcontact",
  "jmkcrsinfo",
  "jmkcrsmain",
  "jmkcrsproject",
  "jmkfaq",
  "jmkjobReq",
  "jmkpartnerReq",
  "jmkstdcrsinfo",
  "jmkstdinfo",
  "jmkstdproj",
  "jmkstdreceipt",
  "jmktcompanypay",
  "jmktrcrsinfo",
  "jmktrinfo",
  "jmktstdpayinfo",
  "jmkuserinfo"
];
const db = Object.fromEntries([...models].map(model => [model, Object.fromEntries(
  ['findFirst', 'findUnique', 'findMany', 'create', 'update', 'delete', 'deleteMany', 'updateMany', 'count', 'aggregate', 'groupBy', 'createMany'].map(method => [method, jest.fn()])
)]));
function reset() {
  jest.clearAllMocks();
  for (const delegate of Object.values(db)) for (const [method, mock] of Object.entries(delegate)) {
    mock.mockReset();
    mock.mockResolvedValue(method === 'findMany' || method === 'groupBy' ? [] : method === 'count' ? 0 : null);
  }
  const { uploadImgToAWS, deleteImgToAWS } = require('../utils/imageHandler.js');
  uploadImgToAWS.mockReset().mockResolvedValue({ data: { Location: 'https://files.example/test.png', key: 'new-key', Key: 'new-key' }, fileSizeInGB: '0.001' });
  deleteImgToAWS.mockReset().mockResolvedValue(true);
}
const company = () => ({ serial: 10, c_username: 'school', c_name: 'School', c_email: 'school@example.com', c_verified: true, c_package_type: 'Monthly', c_package: 'Basic', payments: [{ users: 100, end_date: '2099-01-01' }], jmkstdinfo: [], jmktrinfo: [], jmkuserinfo: [] });
const admin = () => ({ usr_id: 1, company_id: 10, usr_email: 'admin@example.com', usr_role: 'staff', usr_access: '[]', company: company() });
const student = () => ({ std_id: 2, company_id: 10, crs_id: 20, std_fname: 'Sam', std_email: 'sam@example.com', std_password: 'oldpass', std_verifyed: true, company: company() });
const trainer = () => ({ tr_id: 3, company_id: 10, crs_id: 20, tr_fname: 'Taylor', tr_email: 'taylor@example.com', tr_password: 'oldpass', tr_verifyed: true });
const course = () => ({ crs_id: 20, crs_company_id: 10, crs_name: 'Math', crs_week: [], crs_rate: 100, crs_duration: 2, crs_start_date: '2026-01-01' });
const contexts = { admin: { userId: 1, role: 'admin', platform: 'external' }, internal: { userId: 1, role: 'admin', platform: 'internal' }, student: { userId: 2, role: 'student', platform: 'external', c_username: 'school' }, trainer: { userId: 3, role: 'trainer', platform: 'external' } };
function identities() {
  db.jmkuserinfo.findFirst.mockResolvedValue(admin());
  db.jmkstdinfo.findFirst.mockResolvedValue(student());
  db.jmktrinfo.findFirst.mockResolvedValue(trainer());
  db.jmkcompany.findFirst.mockResolvedValue(company());
  db.jmkcrsinfo.findFirst.mockResolvedValue(course());
}
module.exports = { db, reset, identities, company, admin, student, trainer, course, contexts };
