import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./tests/setup.js'],
    include: [
      'tests/unit/**/*.test.js',
      'tests/property/**/*.property.test.js',
    ],
    environment: 'node',
  },
});
