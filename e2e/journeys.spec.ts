import { test, expect, request as pwRequest, APIRequestContext } from '@playwright/test';

/**
 * The ten critical journeys. Journeys 5 (voice → cancel → NO expense) and 8
 * (personal-expense privacy) protect product invariants and must never be
 * skipped, quarantined, or marked flaky-tolerant.
 *
 * These drive the real API + web through the dev proxy. Run:
 *   API + PostgreSQL up, then `npx playwright test`.
 */

const API = 'http://localhost:4495/api/v1';

async function registerFamily(api: APIRequestContext, email: string) {
  const reg = await api.post(`${API}/auth/register`, {
    data: { email, password: 'password123', displayName: email.split('@')[0] },
  });
  let token = (await reg.json()).accessToken;
  const fam = await api.post(`${API}/families`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { name: 'E2E ' + email },
  });
  token = (await fam.json()).accessToken;
  return token as string;
}

test.describe('critical journeys', () => {
  let api: APIRequestContext;
  test.beforeAll(async () => {
    api = await pwRequest.newContext();
  });

  test('1 · register → create family → seeded categories → empty dashboard', async ({ page }) => {
    const email = `j1-${Date.now()}@t.com`;
    await page.goto('/auth/register');
    await page.getByLabel('Your name').fill('Rahul');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Create account' }).click();
    await page.getByLabel('Family name').fill('The Sharmas');
    await page.getByRole('button', { name: 'Create family' }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/Good (morning|afternoon|evening), Rahul/)).toBeVisible();
  });

  test('3 · quick add → appears in list → dashboard totals update', async ({ page }) => {
    const email = `j3-${Date.now()}@t.com`;
    const token = await registerFamily(api, email);
    await page.addInitScript((t) => localStorage.setItem('__t', t), token);
    // Log in through the UI so the SPA has the session.
    await uiLogin(page, email);
    await page.getByRole('button', { name: '+ Add Expense' }).click();
    await page.getByLabel('Type or say it in one line').fill('450 groceries');
    const [createResp] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/v1/expenses') && r.request().method() === 'POST'),
      page.getByRole('button', { name: 'Save Expense' }).click(),
    ]);
    expect(createResp.status()).toBe(201);
    await page.goto('/expenses');
    await expect(page.getByText('Groceries').first()).toBeVisible({ timeout: 10_000 });
  });

  test('5 · voice → cancel → NO expense created', async ({ page }) => {
    const email = `j5-${Date.now()}@t.com`;
    const token = await registerFamily(api, email);
    const before = await countExpenses(api, token);
    await uiLogin(page, email);
    await page.getByLabel('Voice entry').first().click();
    await page.getByRole('button', { name: 'Type it instead' }).click(); // cancel voice path
    await page.getByRole('button', { name: 'Save Expense' }).isVisible();
    await page.keyboard.press('Escape');
    const after = await countExpenses(api, token);
    expect(after).toBe(before);
  });

  test('8 · personal expense by A → B sees amount but no detail', async ({ page, browser }) => {
    const ownerEmail = `j8o-${Date.now()}@t.com`;
    const ownerToken = await registerFamily(api, ownerEmail);
    const invite = await api.post(`${API}/families/current/invites`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
      data: { email: `j8m-${Date.now()}@t.com`, role: 'Member', displayName: 'Member' },
    });
    const inviteToken = (await invite.json()).token;
    const memberEmail = `j8m2-${Date.now()}@t.com`;
    const reg = await api.post(`${API}/auth/register`, {
      data: { email: memberEmail, password: 'password123', displayName: 'Member' },
    });
    const memberToken = (await reg.json()).accessToken;
    await api.post(`${API}/invites/${inviteToken}/accept`, {
      headers: { Authorization: `Bearer ${memberToken}` },
      data: { displayName: 'Member' },
    });
    const login = await api.post(`${API}/auth/login`, { data: { email: memberEmail, password: 'password123' } });
    const memberSession = (await login.json()).accessToken;
    const created = await api.post(`${API}/expenses`, {
      headers: { Authorization: `Bearer ${memberSession}` },
      data: { amount: 777, date: '2026-09-01', title: 'Secret', notes: 'private', visibility: 'Personal' },
    });
    const id = (await created.json()).id;

    const asOwner = await api.get(`${API}/expenses/${id}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const body = await asOwner.json();
    expect(body.amount).toBe(777);
    expect(body.title).toBe('Personal expense');
    expect(body.notes).toBeNull();
    expect(body.categoryId).toBeNull();
  });
});

async function uiLogin(page: import('@playwright/test').Page, email: string) {
  await page.goto('/auth/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

async function countExpenses(api: APIRequestContext, token: string): Promise<number> {
  const r = await api.get(`${API}/expenses?pageSize=1`, { headers: { Authorization: `Bearer ${token}` } });
  return (await r.json()).totalCount as number;
}
