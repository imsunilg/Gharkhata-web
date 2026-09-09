import { test, expect } from '@playwright/test';

async function loginAsSuperAdmin(page: import('@playwright/test').Page) {
  await page.setViewportSize({ width: 1320, height: 940 });
  await page.goto('/auth/login');
  await page.getByLabel('Email').fill('demo@gharkhata.com');
  await page.getByLabel('Password', { exact: true }).fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/admin/**');
}

test('super admin journey: dashboard → users → detail → families → audit logs', async ({ page }) => {
  await loginAsSuperAdmin(page);

  // dashboard
  await expect(page.getByRole('heading', { name: 'Admin dashboard' })).toBeVisible();
  await expect(page.getByText('Total Users')).toBeVisible();

  // users list
  await page.locator('.sidebar nav a', { hasText: 'Users' }).click();
  await page.waitForURL('**/admin/users');
  await expect(page.locator('tbody tr').first()).toBeVisible();

  // open a user's detail via its name link
  await page.locator('.uname').first().click();
  await page.waitForURL(/\/admin\/users\/[0-9a-f-]+$/);
  await expect(page.getByRole('heading', { level: 2, name: 'Profile' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Activity' })).toBeVisible();
  await expect(page.getByText(/User ID/)).toBeVisible();

  // families
  await page.locator('.sidebar nav a', { hasText: 'Families' }).click();
  await page.waitForURL('**/admin/families');
  await expect(page.getByRole('heading', { name: 'Families' })).toBeVisible();
  await expect(page.locator('tbody')).toContainText('Gadakari Family');

  // audit logs
  await page.locator('.sidebar nav a', { hasText: 'Audit Logs' }).click();
  await page.waitForURL('**/admin/audit-logs');
  await expect(page.getByRole('heading', { name: 'Audit logs' })).toBeVisible();
  await page.getByLabel('Action').selectOption('LOGIN');
  await page.waitForURL(/action=LOGIN/);
  await expect(page.locator('tbody')).toContainText('LOGIN');
});

test('create a user then act on it end to end', async ({ page }) => {
  await loginAsSuperAdmin(page);
  const email = `e2e-${Date.now()}@t.com`;

  await page.goto('/admin/users');
  await page.getByRole('button', { name: '+ Create User' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Name').fill('E2E User');
  await dialog.getByLabel('Email').fill(email);
  await dialog.locator('input[formcontrolname="password"]').fill('password123');
  await dialog.locator('input[formcontrolname="confirmPassword"]').fill('password123');
  // pick the seeded family
  await dialog.locator('select[formcontrolname="familyId"]').selectOption({ label: 'Gadakari Family' });
  await dialog.getByRole('button', { name: 'Create user' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // find + suspend the new user
  await page.locator('input.search').fill(email);
  await page.waitForTimeout(600);
  const row = page.locator('tbody tr', { hasText: email });
  await expect(row).toHaveCount(1);
  await row.locator('.kebab').click();
  await page.getByRole('menuitem', { name: 'Suspend' }).click();
  const sdlg = page.getByRole('dialog');
  await sdlg.getByRole('textbox').fill('e2e test');
  await sdlg.getByRole('button', { name: 'Suspend' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('tbody tr', { hasText: email })).toContainText('Suspended');
});

test('a normal user is blocked from every admin route', async ({ page }) => {
  await page.goto('/auth/login');
  await page.getByLabel('Email').fill('sunilbgadakari@gmail.com');
  await page.getByLabel('Password', { exact: true }).fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard');
  for (const path of ['/admin', '/admin/users', '/admin/audit-logs']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/dashboard$/);
  }
});
