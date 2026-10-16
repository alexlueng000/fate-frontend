import { test, expect } from '@playwright/test';

test('navigation menu follows the viewport and omits the removed entry', async ({ page }, info) => {
  await page.goto('/faq');
  const menu = page.getByRole('button', { name: '导航菜单', exact: true });
  if (info.project.name === 'desktop') {
    await expect(menu).toBeHidden();
    return;
  }
  await expect(menu).toBeVisible();
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  const navigation = page.getByRole('navigation', { name: '移动端导航' });
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole('link', { name: '心镜灯', exact: true })).toHaveCount(0);
  await expect(navigation.getByRole('link', { name: '八字对话', exact: true })).toBeVisible();
  await menu.click();
  await expect(navigation).toBeHidden();
});
