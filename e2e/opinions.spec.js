const { test, expect } = require('@playwright/test');

test.describe('Opinions', () => {
    test('shows opinions list after login', async ({ page }) => {
        await page.goto('/opinions');
        await page.waitForLoadState('networkidle');

        // page header should be visible
        await expect(page.locator('h1, .ant-page-header-heading-title').first()).toBeVisible({ timeout: 10000 });
    });

    test('can create a new Gutachten', async ({ page }) => {
        await page.goto('/opinions');
        await page.waitForLoadState('networkidle');

        // click the "Gutachten" create button
        await page.click('button:has-text("Gutachten")');

        // modal should open
        await expect(page.locator('.ant-modal-content')).toBeVisible({ timeout: 5000 });

        const timestamp = Date.now();
        const title = `E2E Test Gutachten ${timestamp}`;

        // fill title
        await page.fill('#title', title);

        // fill description
        await page.fill('#description', 'Automatisch erstelltes Testgutachten');

        // fill date range (Zeitraum) - click the picker container to open calendar, then click date cells
        await page.locator('.ant-picker-range').click();
        await page.waitForSelector('.ant-picker-panel');
        await page.click('[title="2026-05-01"]'); // start date
        await page.click('[title="2026-06-30"]'); // end date (calendar closes)

        // select Ausgabeformat (required)
        await page.locator('#outputTemplate').click();
        await page.locator('.ant-select-item-option').first().click();

        // fill Kunde tab (customer fields are required by schema)
        await page.click('.ant-tabs-tab:has-text("Kunde")');
        await page.fill('input[placeholder="Firmenname"]', 'E2E Testfirma');
        await page.fill('input[placeholder="Straße"]', 'Teststraße 1');
        await page.fill('input[placeholder="PLZ"]', '12345');
        await page.fill('input[placeholder="Ort"]', 'Teststadt');

        // submit
        await page.click('.ant-modal-footer .ant-btn-primary');

        // modal should close
        await expect(page.locator('.ant-modal-content')).not.toBeVisible({ timeout: 10000 });

        // new opinion should appear in list
        await expect(page.locator(`text=${title}`)).toBeVisible({ timeout: 10000 });
    });

    test('can open a Gutachten and see detail view', async ({ page }) => {
        await page.goto('/opinions');
        await page.waitForLoadState('networkidle');

        // click first opinion link in the table
        const firstOpinionLink = page.locator('table tbody tr:first-child a').first();
        await firstOpinionLink.waitFor({ timeout: 10000 });
        await firstOpinionLink.click();

        // should navigate to opinion detail
        await page.waitForURL(/opinions\/.+/, { timeout: 10000 });
        await page.waitForLoadState('networkidle');

        // detail view should be visible
        await expect(page).toHaveURL(/opinions\/.+/);
    });

    test('can add a content block (Baustein) to an opinion', async ({ page }) => {
        await page.goto('/opinions');
        await page.waitForLoadState('networkidle');

        // open first opinion
        const firstOpinionLink = page.locator('table tbody tr:first-child a').first();
        await firstOpinionLink.waitFor({ timeout: 10000 });
        await firstOpinionLink.click();
        await page.waitForURL(/opinions\/.+/, { timeout: 10000 });
        await page.waitForLoadState('networkidle');

        // look for the plus-circle dropdown trigger (add Baustein)
        const addButton = page.locator('.mbac-action-add .anticon-plus-circle').first();
        await addButton.waitFor({ timeout: 10000 });
        await addButton.click();

        // dropdown menu should appear
        await expect(page.locator('.ant-dropdown-menu')).toBeVisible({ timeout: 5000 });

        // no error modal should appear
        await expect(page.locator('.ant-modal-content:has-text("Fehler")')).not.toBeVisible();
    });
});
