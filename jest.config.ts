import { JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    /* eslint-disable @typescript-eslint/naming-convention */
    '\\.[jt]sx?$': [
      'ts-jest',
      {
        tsconfig: './ts-configs/tsconfig.json',
      },
    ],
  },
};

export default jestConfig;
