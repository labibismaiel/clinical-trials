import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Navigate to the app before each test
  await page.goto('/', { waitUntil: 'networkidle' });
});

test('has title', async ({ page }) => {
  await expect(page).toHaveTitle('ClinicalTrialsExplorer');
});

test('shows trial list', async ({ page }) => {
  // Wait for the trial list component to be ready
  const trialList = page.locator('app-trial-list');
  await expect(trialList).toBeVisible({ timeout: 10000 });
  
  // Wait for at least one trial card to be visible
  const trialCard = page.locator('.trial-card').first();
  await expect(trialCard).toBeVisible({ timeout: 10000 });
});

test('can navigate to trial details', async ({ page }) => {
  // Wait for trials to load
  const trialCard = page.locator('.trial-card').first();
  await expect(trialCard).toBeVisible({ timeout: 10000 });
  
  // Click the first trial card
  await trialCard.click();
  
  // Wait for navigation and verify we're on the details page
  const detailsPage = page.locator('app-trial-details');
  await expect(detailsPage).toBeVisible({ timeout: 10000 });
});
