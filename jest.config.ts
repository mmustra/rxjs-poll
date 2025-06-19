import { JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  collectCoverageFrom: ['./src/**'],
  coverageReporters: ['text', 'cobertura', 'html'],
  coverageThreshold: {
    global: {
      lines: 90,
    },
  },
  transform: {
    '\\.[jt]sx?$': [
      'ts-jest',
      {
        tsconfig: './ts-configs/tsconfig.json',
      },
    ],
  },
};

export default jestConfig;
