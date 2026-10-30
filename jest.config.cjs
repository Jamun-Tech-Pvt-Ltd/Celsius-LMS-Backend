module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.cjs'],
  transform: { '^.+\\.[cm]?js$': ['babel-jest', { presets: [['@babel/preset-env', { targets: { node: 'current' } }]] }] },
  moduleNameMapper: { '^graphql-upload/.*\\.mjs$': '<rootDir>/tests/upload-stub.cjs' },
  collectCoverageFrom: ['**/*.js', '!node_modules/**', '!coverage/**', '!tests/**', '!**/*.config.js', '!prisma/generated/**'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'html', 'json', 'json-summary'],
  // A glob threshold applies separately to every matching source file.
  coverageThreshold: {
    '**/*.js': { statements: 80, branches: 80, functions: 80, lines: 80 },
  },
};
