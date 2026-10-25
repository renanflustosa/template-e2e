import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

if (existsSync('.env')) process.loadEnvFile('.env');

// Sem BASE_URL o template roda contra o servidor de demonstração, para validar o kit.
const DEMO_PORT = 3999;
const baseURL = process.env.BASE_URL || `http://localhost:${DEMO_PORT}`;

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'evidencias/artefatos',
  workers: 1, // testes de aceite mexem em estado real do cliente; rodar em série evita colisão
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'evidencias/relatorio', open: 'never' }],
  ],
  use: {
    baseURL,
    // Evidência para o cliente: todo teste gera vídeo, print e trace no relatório.
    video: 'on',
    screenshot: 'on',
    trace: 'on',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: `node scripts/demo-server.mjs ${DEMO_PORT}`,
        url: baseURL,
        reuseExistingServer: false,
      },
});
