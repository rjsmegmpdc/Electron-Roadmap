/** @type {import('jest').Config} */
module.exports = {
  // Different test environments for different test types
  projects: [
    {
      displayName: 'node',
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/tests'],
      testMatch: [
        '<rootDir>/tests/integration/ipc/**/*.test.ts', 
        '<rootDir>/tests/integration/**/!(stores)*.test.ts',
        '<rootDir>/tests/unit/**/*.test.ts'
      ],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: {
            target: 'es2020',
            module: 'commonjs',
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
            resolveJsonModule: true,
            skipLibCheck: true,
          },
        }],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/app/$1',
      },
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
      testTimeout: 10000,
    },
    {
      displayName: 'jsdom',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      roots: ['<rootDir>/tests'],
      testMatch: ['<rootDir>/tests/integration/stores/**/*.test.ts', '<rootDir>/tests/components/**/*.test.tsx', '<rootDir>/tests/integration/components/**/*.test.tsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: {
            target: 'es2020',
            module: 'commonjs',
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
            resolveJsonModule: true,
            skipLibCheck: true,
          },
        }],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/app/$1',
      },
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
      testTimeout: 10000,
    }
  ],
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    '!app/**/*.d.ts',
    '!app/**/node_modules/**',
    '!app/**/__tests__/**',
    '!app/**/*.test.*',
    '!app/**/*.spec.*',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true
};
