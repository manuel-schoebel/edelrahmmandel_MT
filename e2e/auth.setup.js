const { test: setup, expect } = require('@playwright/test');
const path = require('path');

const authFile = path.join(__dirname, '.auth/user.json');

setup('login as admin', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.fill('#LoginForm_username', 'admin');
    await page.fill('#LoginForm_password', 'password');
    await page.click('button[type="submit"]');

    // wait for redirect away from login
    await page.waitForFunction(() => !document.querySelector('#LoginForm_username'), { timeout: 15000 });
    await page.context().storageState({ path: authFile });
});
