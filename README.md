# Panorama — Gestão de Licitações de Medicamentos

> Internal platform for managing public pharmaceutical tenders — built for Panorama Distribuidora.

---

## English

### What is Panorama?

Panorama is an internal web platform that digitalizes and automates the end-to-end process of participating in Brazilian public procurement auctions (*pregões eletrônicos*) for pharmaceutical products.

It eliminates manual, error-prone steps and enforces regulatory price caps automatically — protecting the company from multi-million-dollar fines for non-compliance with ANVISA/CMED pricing rules.

### Core Workflow

Each tender (*edital*) progresses through five sequential stages:

| # | Stage | Description |
|---|-------|-------------|
| 1 | **Analysis** | Upload the tender PDF; Claude AI extracts all structured data automatically |
| 2 | **Approval** | User reviews and corrects the extracted data, then approves or rejects the tender |
| 3 | **Quotation** | Match catalog products to tender items; real-time PMVG price cap validation |
| 4 | **Margin Approval** | Manager reviews and approves quoted margins |
| 5 | **Proposal Submission** | Export and register the final proposal |

### Key Features

- **AI-powered extraction** — uploads a PDF and Claude (claude-sonnet-4-6) returns a fully structured JSON with all tender metadata and line items
- **Inline editing** — all AI-extracted fields are editable before approval
- **PMVG enforcement** — quoted prices are validated against ANVISA's regulatory ceiling (PMVG) in real time; values above the cap are blocked at both UI and API levels
- **CMED integration** — full ANVISA pricing table (~26,000 records) with per-state PMVG values
- **ERP catalog** — product data sourced from Nexus ERP (manual CSV import while API integration is pending)
- **Audit trail** — every price change is recorded with user and timestamp

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Database | PostgreSQL + Prisma ORM |
| AI | Anthropic Claude API (`claude-sonnet-4-6`) |
| Auth | NextAuth.js v5 |
| UI | Tailwind CSS + shadcn/ui |
| Deploy | Vercel (frontend) + Google Cloud VM (backend/scripts) |

### Environment Variables

```env
DATABASE_URL=postgresql://...
ANTHROPIC_API_KEY=sk-ant-...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

### Running Locally

```bash
npm install
npx prisma migrate dev
npm run dev
```

---

## Português (BR)

### O que é o Panorama?

O Panorama é uma plataforma web interna que digitaliza e automatiza o processo completo de participação em pregões eletrônicos de medicamentos no setor público brasileiro.

Ele elimina etapas manuais e propensas a erros, e aplica automaticamente os limites de preço regulatórios — protegendo a empresa de multas milionárias por desrespeito às regras de precificação da ANVISA/CMED.

### Fluxo Principal

Cada edital percorre obrigatoriamente cinco etapas sequenciais:

| # | Etapa | Descrição |
|---|-------|-----------|
| 1 | **Análise do Edital** | Upload do PDF; a IA Claude extrai automaticamente todos os dados estruturados |
| 2 | **Aprovação do Edital** | Usuário revisa e corrige os dados extraídos, depois aprova ou rejeita o edital |
| 3 | **Cotação dos Itens** | Vincula produtos do catálogo aos itens do edital; validação do teto PMVG em tempo real |
| 4 | **Aprovação de Margens** | Gestor revisa e aprova as margens das cotações |
| 5 | **Envio da Proposta** | Exportação e registro da proposta final |

### Principais Funcionalidades

- **Extração por IA** — faz o upload do PDF e o Claude (`claude-sonnet-4-6`) retorna um JSON estruturado com todos os metadados do edital e a lista de itens
- **Edição inline** — todos os campos extraídos pela IA são editáveis antes da aprovação
- **Validação de PMVG** — os valores cotados são validados em tempo real contra o teto regulatório da ANVISA (PMVG); valores acima do limite são bloqueados na UI e na API
- **Integração CMED** — tabela oficial da ANVISA (~26.000 registros) com valores de PMVG por estado
- **Catálogo ERP** — dados de produtos originados do Nexus ERP (importação manual via CSV enquanto a integração por API está pendente)
- **Trilha de auditoria** — toda alteração de preço é registrada com usuário e timestamp

### Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router) |
| Banco de Dados | PostgreSQL + Prisma ORM |
| IA | Anthropic Claude API (`claude-sonnet-4-6`) |
| Autenticação | NextAuth.js v5 |
| UI | Tailwind CSS + shadcn/ui |
| Deploy | Vercel (frontend) + Google Cloud VM (backend/scripts) |

### Variáveis de Ambiente

```env
DATABASE_URL=postgresql://...
ANTHROPIC_API_KEY=sk-ant-...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

### Rodando Localmente

```bash
npm install
npx prisma migrate dev
npm run dev
```
