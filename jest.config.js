module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Module paths
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  
  // File patterns
  testMatch: [
    '<rootDir>/tests/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/tests/**/?(*.)(spec|test).{js,jsx,ts,tsx}'
  ],
  
  // Transform files
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
    '^.+\\.(js|jsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
      ],
    }],
  },
  
  // Module name mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^electron$': '<rootDir>/tests/__mocks__/electron.js',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
  ],
  
  // Coverage thresholds - 80%+ requirement
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Critical paths require 100% coverage
    './src/components/TiptapEditor.tsx': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    './src/database/database.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/release/',
  ],
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Add Jest globals
  globals: {
    'ts-jest': {
      useESM: false,
    },
  },
};