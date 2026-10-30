const { Readable } = require('stream');
jest.mock('aws-sdk', () => ({ Config: jest.fn(() => ({ update: jest.fn() })), S3: jest.fn(() => ({ upload: jest.fn(), deleteObject: jest.fn() })) }));
jest.mock('mailgun-js', () => jest.fn(() => ({ messages: () => ({ send: mockSend }) })));
const mockSend = jest.fn();
const AWS = require('aws-sdk');
const { compareDates } = require('../utils/DateHelper.js');
const helper = require('../utils/helper.js');
const images = require('../utils/imageHandler.js');
const { sendMail } = require('../utils/mailHandler.js');
afterEach(() => jest.restoreAllMocks());
test('groupBy collects all records and handles empty input', () => {
  const rows = [{ type: 'a', id: 1 }, { type: 'b', id: 2 }, { type: 'a', id: 3 }];
  expect(helper.groupBy(rows, 'type')).toEqual({ a: [rows[0], rows[2]], b: [rows[1]] });
  expect(helper.groupBy([], 'type')).toEqual({});
});
test('random selection is unique, sized, and does not mutate its source', () => {
  const source = [1, 2, 3, 4];
  jest.spyOn(Math, 'random').mockReturnValue(0.25);
  const result = helper.getRandomItemsFromArray(source, 2);
  expect(result).toHaveLength(2);
  expect(new Set(result).size).toBe(2);
  expect(result.every(value => source.includes(value))).toBe(true);
  expect(source).toEqual([1, 2, 3, 4]);
  expect(helper.getRandomItemsFromArray(source, 9)).toBe(source);
  expect(helper.getRandomItemsFromArray(source, 0)).toEqual([]);
});
test('passwords include the username hash and a random suffix', () => {
  jest.spyOn(Math, 'random').mockReturnValue(0.123456789);
  const hash = require('crypto').createHash('sha256').update('sam').digest('hex').slice(0, 12);
  expect(helper.generatePasswordFromUsername('sam')).toBe(hash + (0.123456789).toString(36).substring(2, 10));
});
test('default permissions and package definitions are usable', () => {
  expect(helper.ROLES).toEqual(['student', 'trainer', 'companey']);
  expect(JSON.parse(helper.DefaultUserAccess)).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Dashboard' })]));
  expect(helper.defaultPackages).toHaveLength(3);
});
test('compareDates accepts increasing dates and rejects equal or reversed dates', () => {
  expect(compareDates('2026-01-01', '2026-01-02')).toBeUndefined();
  expect(() => compareDates('2026-01-02', '2026-01-01')).toThrow('Start date must be before end date');
  expect(() => compareDates('2026-01-01', '2026-01-01')).toThrow('Start date must be before end date');
});
const s3 = AWS.S3.mock.results[0].value;
test('uploads stream bytes, metadata, and calculated size', async () => {
  jest.spyOn(Date, 'now').mockReturnValue(123);
  s3.upload.mockImplementation((input, callback) => callback(null, { Location: 'url', Key: input.Key }));
  const result = await images.uploadImgToAWS(Promise.resolve({ createReadStream: () => Readable.from([Buffer.from('hello'), Buffer.from(' world')]), filename: 'a.txt', mimetype: 'text/plain', encoding: 'utf8' }), 'notes/');
  expect(s3.upload).toHaveBeenCalledWith(expect.objectContaining({ Key: 'notes/123a.txt', Body: Buffer.from('hello world'), ACL: 'public-read' }), expect.any(Function));
  expect(result).toEqual(expect.objectContaining({ filename: 'a.txt', fileSizeInBytes: 11, fileSizeInGB: '0.000', data: { Location: 'url', Key: 'notes/123a.txt' } }));
});
test('upload errors reject', async () => {
  s3.upload.mockImplementation((_, callback) => callback(new Error('offline')));
  await expect(images.uploadImgToAWS({ createReadStream: () => Readable.from([Buffer.from('a')]), filename: 'a' }, '')).rejects.toThrow('There was an error uploading your file');
});
test.each([null, new Error('offline')])('deletion completes even when S3 reports %s', async error => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  s3.deleteObject.mockImplementation((_, callback) => callback(error, {}));
  await expect(images.deleteImgToAWS('old-key')).resolves.toBe(true);
  expect(s3.deleteObject).toHaveBeenCalledWith({ Bucket: process.env.BUCKET, Key: 'old-key' }, expect.any(Function));
});
test('uploader accepts a custom AWS region', () => {
  AWS.Config.mockImplementation(() => ({ update: jest.fn() }));
  new images.AWSS3Uploader({ region: 'eu-west-1', accessKeyId: 'test', secretAccessKey: 'secret' });
  expect(AWS.config.update).toHaveBeenCalledWith({ region: 'eu-west-1', accessKeyId: 'test', secretAccessKey: 'secret' });
});
test('mail handler forwards recipient, subject, and HTML', async () => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  mockSend.mockImplementation((data, callback) => { callback(null, { id: 'mail-id' }); return Promise.resolve(); });
  await sendMail('sam@example.com', 'Welcome', '<p>Hello</p>');
  expect(mockSend).toHaveBeenCalledWith({ from: 'Jaamun <no-reply@jaamun.com>', to: 'sam@example.com', subject: 'Welcome', html: '<p>Hello</p>' }, expect.any(Function));
});
test.each(['SaaSRequsteEmail', 'SaaSRequsteConfirmEmail', 'QuestionInformEmail', 'SubscriptionEmail', 'contackForm'])('%s produces an email template', name => {
  const template = require(`../utils/${name}.js`).default;
  const html = typeof template === 'function' ? template('Sam', 'sam@example.com', 'Basic', 'Monthly', 'test') : template;
  expect(html).toEqual(expect.any(String));
  expect(html).toMatch(/html|table|body/i);
});
