import { defineConfig } from 'vitest/config';

/**
 * Vitest Configuration
 * @see https://vitest.dev/config/
 */
export default defineConfig({
    test: {
        // Test file patterns
        include: ['tests/**/*.test.js'],

        // Timeout per test (increased for API integration tests)
        testTimeout: 15000,

        // Reporter format
        reporters: ['verbose'],

        // Coverage configuration
        coverage: {
            provider: 'v8',
            include: ['server.js', 'public/knowledge.js'],
            exclude: ['node_modules', 'tests'],
            reporter: ['text', 'lcov'],
            thresholds: {
                statements: 60,
                branches: 50,
                functions: 50,
                lines: 60,
            },
        },
    },
});
