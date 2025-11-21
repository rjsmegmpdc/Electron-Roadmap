export default {
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'src/js/**/*.js',
    '!src/js/app.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.js',
    '<rootDir>/tests/integration/**/*.test.js'
  ],
  verbose: true,
  transform: {
    '^.+\\.js$': 'babel-jest'
  }
};
