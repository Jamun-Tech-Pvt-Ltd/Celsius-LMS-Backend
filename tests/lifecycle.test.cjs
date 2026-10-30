jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn() }));
const { PrismaClient } = require('@prisma/client');
const flush = () => new Promise(resolve => setImmediate(resolve));
beforeEach(() => { jest.resetModules(); jest.spyOn(console, 'log').mockImplementation(() => {}); jest.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => jest.restoreAllMocks());
test('database connects and disconnects on startup', async () => {
  const prisma = { $connect: jest.fn().mockResolvedValue(), $disconnect: jest.fn().mockResolvedValue() };
  require('@prisma/client').PrismaClient.mockImplementation(() => prisma);
  expect(require('../database.js').default).toBe(prisma);
  await flush();
  expect(prisma.$connect).toHaveBeenCalledTimes(1); expect(prisma.$disconnect).toHaveBeenCalledTimes(1);
});
test('database logs connection failures, disconnects and exits unsuccessfully', async () => {
  const error = new Error('database unavailable');
  const prisma = { $connect: jest.fn().mockRejectedValue(error), $disconnect: jest.fn().mockResolvedValue() };
  require('@prisma/client').PrismaClient.mockImplementation(() => prisma);
  jest.spyOn(process, 'exit').mockImplementation(() => {});
  require('../database.js'); await flush();
  expect(console.error).toHaveBeenCalledWith(error); expect(prisma.$disconnect).toHaveBeenCalled(); expect(process.exit).toHaveBeenCalledWith(1);
});
test.each([true, false])('seed %s existing admin and always disconnects', async exists => {
  const prisma = { jmkuserinfo: { findFirst: jest.fn().mockResolvedValue(exists ? { usr_id: 1 } : null), create: jest.fn().mockResolvedValue({}), update: jest.fn().mockResolvedValue({}) }, $disconnect: jest.fn().mockResolvedValue() };
  require('@prisma/client').PrismaClient.mockImplementation(() => prisma);
  require('../prisma/seed.js'); await flush();
  const write = exists ? prisma.jmkuserinfo.update : prisma.jmkuserinfo.create;
  expect(write).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ usr_role: 'admin', usr_fname: 'Super' }) }));
  expect(JSON.parse(write.mock.calls[0][0].data.usr_access)[0].name).toBe('StakeHolders');
  expect(prisma.$disconnect).toHaveBeenCalledTimes(1);
});
test('seed errors exit unsuccessfully and release the client', async () => {
  const error = new Error('seed failed');
  const prisma = { jmkuserinfo: { findFirst: jest.fn().mockRejectedValue(error) }, $disconnect: jest.fn().mockResolvedValue() };
  require('@prisma/client').PrismaClient.mockImplementation(() => prisma); jest.spyOn(process, 'exit').mockImplementation(() => {});
  require('../prisma/seed.js'); await flush();
  expect(console.error).toHaveBeenCalledWith(error); expect(process.exit).toHaveBeenCalledWith(1); expect(prisma.$disconnect).toHaveBeenCalled();
});
