# Template de entrega com teste e2e

[![ci](https://github.com/renanflustosa/template-e2e/actions/workflows/ci.yml/badge.svg)](https://github.com/renanflustosa/template-e2e/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> 🇺🇸 Acceptance-test shell for client projects, any stack. Every acceptance criterion in the proposal becomes one Playwright test with the same wording, so the HTML report, with a video, screenshot and trace per test, is the sign-off checklist the client reads. Includes a demo server so the kit runs out of the box, and a daily smoke workflow for maintenance contracts. Docs below in Portuguese.

Casca de aceite que vai em todo projeto, qualquer stack: os testes agem como o usuário (navegador, HTTP, webhook, banco), então servem para código seu, n8n, WordPress ou sistema legado do cliente.

## Novo projeto

1. Crie o repositório do projeto com **Use this template** (ou copie esta pasta para ele).
2. Apague `scripts/demo-server.mjs` e o bloco `webServer` do `playwright.config.ts`.
3. `npm install` e `node node_modules/@playwright/test/cli.js install chromium`.
4. `cp .env.example .env` e preencha `BASE_URL` (homologação de preferência) e o usuário de teste.
5. Reescreva `e2e/aceite.spec.ts`: **um `test()` por critério de aceite da proposta, com o mesmo texto**. Apague os blocos de tipo que não se aplicam.
6. Ajuste `e2e/smoke.spec.ts` para 2–5 checagens só de leitura.
7. Crie o `ENTREGA.md` com o documento de entrega: o que mudou, como validar e como reverter.
8. Troque o `.github/workflows/ci.yml` (que valida o kit contra a demo) por um job do projeto.
9. Código do projeto (se houver) vai em `app/`; backup e reversão em `scripts/`.

## Rodar

| Comando | O que faz |
|---|---|
| `node node_modules/@playwright/test/cli.js test` | Todos os testes de aceite + smoke |
| `node node_modules/@playwright/test/cli.js test --grep @smoke` | Só o smoke |
| `node node_modules/@playwright/test/cli.js show-report evidencias/relatorio` | Abre o relatório com vídeos |

Sem `BASE_URL`, roda contra o servidor de demonstração (serve para validar o kit).

## Evidência para o cliente

- `evidencias/relatorio/`: relatório HTML com cada critério, status, vídeo, print e trace. Compacte e envie, ou mande o vídeo do teste principal.
- Rode a versão final **no ambiente do cliente** e cite a data no `ENTREGA.md`.

## Regras dos testes

- Nomes de teste = texto do critério de aceite; o relatório é o checklist.
- Dados de teste identificáveis e únicos (`Teste E2E <timestamp>`), para o cliente distinguir e apagar.
- Automação assíncrona: `expect.poll` com timeout, nunca `waitForTimeout`.
- Em produção, só o smoke (leitura). Testes que criam dados rodam em homologação ou com dado marcado como teste, combinado com o cliente.
- Nada de segredo no código: tudo via `.env` (local) ou secrets (Actions).
- Banco de dados: crie `e2e/helpers/banco.ts` com o driver do cliente (`pg`, `mysql2`…) e um usuário **somente leitura**.

## Manutenção mensal (monitoramento)

`.github/workflows/smoke.yml` roda o smoke todo dia às 08h BRT e manda e-mail se falhar. Suba o projeto para um repositório privado, cadastre o secret `BASE_URL` e rode uma vez por "Run workflow" para conferir. Neste repositório do template ele fica desativado, porque não há sistema real para monitorar; num repositório criado a partir dele, confira em Actions → smoke que o workflow está ativo.
