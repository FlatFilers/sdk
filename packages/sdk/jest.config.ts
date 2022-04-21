import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  testPathIgnorePatterns: ['<rootdir>/node_modules/'],
  rootDir: './',
  roots: ['<rootDir>/lib'],
  collectCoverage: false,
  testRegex: '/lib/.*\\.(test|spec).(ts|tsx|js)$',
  moduleNameMapper: {
    'src/(.*)': '<rootDir>/src/$1',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.js',
    '\\.(css|less)$': '<rootDir>/__mocks__/styleMock.js',
  },
  moduleFileExtensions: ['js', 'ts', 'tsx', 'json'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testEnvironment: 'jsdom',
  globals: {
    'ts-jest': {
      isolatedModules: false,
      tsconfig: '<rootDir>/tsconfig.spec.json',
    },
  },
}

export default config
