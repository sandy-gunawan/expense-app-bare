import { expect, test } from '@playwright/test';

test('employee submits a fictional claim and sees it in the ledger', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Judul klaim').fill('Taksi bandara');
  await page.getByLabel('Jumlah (IDR)').fill('250000');
  await page.locator('#submit').click();
  await expect(page.getByRole('status')).toHaveText('Klaim berhasil diajukan.');
  await expect(page.getByRole('row', { name: /Taksi bandara/ })).toContainText('Menunggu manager');
});

test('manager approves a pending claim for their team', async ({ page }) => {
  await page.goto('/manager.html');
  const pending = page.getByRole('row').filter({ hasText: 'Klaim latihan 1' });
  await pending.getByRole('button', { name: /Setujui/ }).click();
  await expect(page.getByRole('status')).toHaveText('Status klaim: Disetujui.');
  await expect(pending).toHaveCount(0);
});

test('Finance reads a monthly report and sees the empty state for another month', async ({ page }) => {
  await page.goto('/report.html');
  await expect(page.getByRole('row').filter({ hasText: 'Operasional' }).first()).toBeVisible();
  await page.getByLabel('Bulan laporan').fill('2000-01');
  await expect(page.getByText('Belum ada data.')).toBeVisible();
});
