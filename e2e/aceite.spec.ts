import { expect, test } from '@playwright/test';

// Regra do template: 1 teste = 1 critério de aceite da proposta, com o MESMO texto.
// Assim o relatório HTML vira, sozinho, o checklist de aceite que o cliente lê.
// Os exemplos abaixo rodam contra scripts/demo-server.mjs; troque pelos critérios do projeto.

const unico = (prefixo: string) => `${prefixo} ${Date.now()}`;

test.describe('Site / sistema web', () => {
  test('Pedido enviado pelo formulário aparece na lista de pedidos', async ({ page }) => {
    const nome = unico('Teste E2E');
    await page.goto('/');
    await page.getByLabel('Nome').fill(nome);
    await page.getByRole('button', { name: 'Enviar' }).click();
    await expect(page.getByRole('listitem').filter({ hasText: nome })).toBeVisible();
  });

  test('Formulário não aceita pedido sem nome', async ({ request }) => {
    const res = await request.post('/pedido', { form: { nome: '' }, maxRedirects: 0 });
    expect(res.status()).toBe(400);
  });
});

test.describe('API / automação', () => {
  test('Mensagem recebida no webhook é respondida em até 10 segundos', async ({ request }) => {
    const id = unico('msg').replace(' ', '-');
    const envio = await request.post('/webhook', { data: { id, texto: 'Qual o horário?' } });
    expect(envio.status()).toBe(202);

    // Automação é assíncrona: espere o efeito, nunca use sleep fixo.
    await expect
      .poll(async () => (await (await request.get(`/api/mensagens/${id}`)).json()).status, { timeout: 10_000 })
      .toBe('respondida');
  });
});

test.describe('Relatório / dashboard', () => {
  test('Painel mostra o mesmo total de pedidos que a fonte de dados', async ({ page, request }) => {
    // Num projeto real, a "fonte" é uma query direta no banco (helper com o driver do cliente).
    const { total_pedidos } = await (await request.get('/api/relatorio')).json();
    await page.goto('/painel');
    await expect(page.getByTestId('total')).toHaveText(String(total_pedidos));
  });
});

test.describe('Infra / segurança', () => {
  test('Respostas trazem os headers de segurança básicos', async ({ request }) => {
    const headers = (await request.get('/')).headers();
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBeTruthy();
    expect(headers['content-security-policy']).toBeTruthy();
  });

  test('Acesso por HTTP é redirecionado para HTTPS (ou a porta 80 está fechada)', async ({ baseURL }) => {
    const alvo = new URL(baseURL!);
    test.skip(alvo.protocol !== 'https:', 'Só se aplica a sistemas publicados em HTTPS');

    let http: Response;
    try {
      http = await fetch(`http://${alvo.hostname}/`, { redirect: 'manual', signal: AbortSignal.timeout(5_000) });
    } catch (err) {
      // Porta 80 fechada também é configuração segura; o anexo registra isso no relatório.
      test.info().annotations.push({ type: 'porta 80', description: `sem resposta: ${(err as Error).message}` });
      return;
    }
    expect([301, 302, 307, 308]).toContain(http.status);
    expect(http.headers.get('location')).toMatch(/^https:/);
  });

  test('Certificado HTTPS vale por mais 15 dias', async ({ baseURL }) => {
    const alvo = new URL(baseURL!);
    test.skip(alvo.protocol !== 'https:', 'Só se aplica a sistemas publicados em HTTPS');

    const { connect } = await import('node:tls');
    const validoAte = await new Promise<Date>((resolve, reject) => {
      const socket = connect({ host: alvo.hostname, port: Number(alvo.port || 443), servername: alvo.hostname }, () => {
        resolve(new Date(socket.getPeerCertificate().valid_to));
        socket.end();
      });
      socket.on('error', reject);
    });
    const dias = (validoAte.getTime() - Date.now()) / 86_400_000;
    expect(dias, `certificado vence em ${validoAte.toISOString()}`).toBeGreaterThan(15);
  });
});
