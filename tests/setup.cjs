jest.mock('../database.js', () => ({ __esModule: true, default: require('./support.cjs').db }));
jest.mock('../utils/imageHandler.js', () => ({ uploadImgToAWS: jest.fn(), deleteImgToAWS: jest.fn() }));
jest.mock('../utils/mailHandler.js', () => ({ sendMail: jest.fn() }));
jest.mock('jsonwebtoken', () => ({ sign: jest.fn(() => 'signed-token'), verify: jest.fn() }));
jest.mock('openai', () => jest.fn(() => ({ chat: { completions: { create: jest.fn() } } })));
