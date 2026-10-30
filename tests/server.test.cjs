require('./setup.cjs');
jest.mock('dotenv', () => ({ config: jest.fn() }));
jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn() }));
jest.mock('express', () => Object.assign(jest.fn(() => ({ use: jest.fn() })), { json: jest.fn(() => 'json') }));
jest.mock('http', () => ({ createServer: jest.fn(() => ({ listen: jest.fn((_port, callback) => callback()) })) }));
jest.mock('@graphql-tools/schema', () => ({ makeExecutableSchema: jest.fn(() => 'schema') }));
jest.mock('subscriptions-transport-ws', () => ({ SubscriptionServer: { create: jest.fn() } }));
jest.mock('graphql-rate-limit-directive', () => ({ rateLimitDirective: () => ({ rateLimitDirectiveTransformer: jest.fn(schema => schema), rateLimitDirectiveTypeDefs: 'directive @rateLimit(limit: Int, duration: Int) on OBJECT | FIELD_DEFINITION' }) }));
jest.mock('apollo-server-express', () => ({ ...jest.requireActual('apollo-server-express'), ApolloServer: jest.fn(() => ({ start: jest.fn().mockResolvedValue(), applyMiddleware: jest.fn(), graphqlPath: '/graphql' })) }));
const { db, reset, contexts } = require('./support.cjs');
const { ApolloServer } = require('apollo-server-express');
const jwt = require('jsonwebtoken');
const flush = () => new Promise(resolve => setImmediate(resolve));
beforeEach(reset);
test('schema combines controller types and resolver maps', () => {
  const defs = require('../typeDefs.js').default;
  const resolvers = require('../resolvers.js').default;
  expect(defs.kind).toBe('Document');
  expect(defs.definitions.find(d => d.name?.value === 'Query').fields.map(f => f.name.value)).toEqual(expect.arrayContaining(['me', 'admin', 'getCompany', 'trainer', 'getOurPackages']));
  expect(resolvers.Query.me).toBe(require('../controller/student/index.js').studentResolversQuery.me);
  expect(resolvers.Mutation.signupCompany).toBe(require('../controller/company/index.js').companyResolvers.signupCompany);
  expect(resolvers.Subscription.newMessage.subscribe).toEqual(expect.any(Function));
});
test('server wires HTTP, uploads, GraphQL, websocket subscriptions and authentication', async () => {
  const log = jest.spyOn(console, 'log').mockImplementation(() => {});
  require('../server.js'); await flush();
  const options = ApolloServer.mock.calls[0][0]; const server = ApolloServer.mock.results[0].value;
  expect(server.start).toHaveBeenCalled(); expect(server.applyMiddleware).toHaveBeenCalled();
  expect(require('http').createServer.mock.results[0].value.listen).toHaveBeenCalledWith(process.env.PORT || 8080, expect.any(Function));
  expect(require('subscriptions-transport-ws').SubscriptionServer.create).toHaveBeenCalledWith(expect.objectContaining({ schema: 'schema' }), expect.objectContaining({ path: '/graphql' }));
  expect(options.context({ req: { headers: {} } })).toBeNull();
  for (const role of ['student', 'trainer', 'admin']) {
    const payload = { userId: 1, role, platform: 'external', c_username: 'school', c_package_type: 'Monthly' };
    jwt.verify.mockReturnValue(payload);
    expect(options.context({ req: { headers: { authorization: 'token' } } })).toEqual(payload);
    const model = role === 'student' ? 'jmkstdinfo' : role === 'trainer' ? 'jmktrinfo' : 'jmkuserinfo';
    expect(db[model].update).toHaveBeenCalledWith({ data: { lastSeen: expect.any(Date) }, where: { [role === 'student' ? 'std_id' : role === 'trainer' ? 'tr_id' : 'usr_id']: 1 } });
  }
  jwt.verify.mockReturnValue({ userId: 1 });
  expect(options.context({ req: { headers: { authorization: 'token' } } })).toBeNull();
  jwt.verify.mockImplementation(() => { throw new Error('expired'); });
  expect(() => options.context({ req: { headers: { authorization: 'token' } } })).toThrow('Token Expired !');
  log.mockRestore();
});
