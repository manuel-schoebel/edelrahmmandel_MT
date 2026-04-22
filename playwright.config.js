const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './e2e',
    timeout: 30000,
    use: {
        baseURL: 'https://edelrahmmandel-staging.kumpel.cloud',
        httpCredentials: {
            username: 'staging',
            password: 'Staging2026x',
        },
        screenshot: 'only-on-failure',
        video: 'off',
    },
    projects: [
        {
            name: 'setup',
            testMatch: /auth\.setup\.js/,
        },
        {
            name: 'chromium',
            use: {
                browserName: 'chromium',
                storageState: 'e2e/.auth/user.json',
            },
            dependencies: ['setup'],
        },
    ],
});
