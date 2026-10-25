import { expect, test } from '@playwright/test';

// Smoke: checagem rápida e sem efeito colateral, para rodar após deploy e todo dia na manutenção.
// Só leitura: nada de criar pedido, mandar mensagem ou alterar dado real do cliente.

test('Sistema no ar e página inicial carrega @smoke', async ({ page }) => {
  const res = await page.goto('/');
  expect(res?.status()).toBeLessThan(400);
  await expect(page.locator('h1')).toBeVisible();
});

test('API de relatório responde em menos de 2 segundos @smoke', async ({ request }) => {
  const inicio = Date.now();
  const res = await request.get('/api/relatorio');
  expect(res.ok()).toBe(true);
  expect(Date.now() - inicio).toBeLessThan(2_000);
});
