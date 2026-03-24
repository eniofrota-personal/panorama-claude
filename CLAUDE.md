# CLAUDE.md — Projeto Panorama

## Contexto do Projeto

**Panorama** é uma plataforma interna de gestão de licitações públicas de medicamentos, desenvolvida pela distribuidora Panorama para uso próprio.

O objetivo é digitalizar e automatizar o processo de participação em pregões eletrônicos do setor público de saúde, desde a análise do edital até o envio da proposta — com validações regulatórias automáticas que evitam multas milionárias.

---

## Entidades Envolvidas

- **Panorama** — distribuidora de medicamentos, cliente e dona do produto
- **Nexus ERP** (`nexuserp.com.br`) — ERP usado pela Panorama, fonte de dados de produtos, preços e fornecedores
- **CMED/ANVISA** — tabela oficial de preços de medicamentos (PF e PMVG por estado), fonte regulatória

---

## Stack Técnica

- **Frontend + API:** Next.js (App Router)
- **Banco de dados:** PostgreSQL
- **ORM:** Prisma
- **Deploy:** Vercel (frontend) + Google Cloud (VM para backend/scripts)
- **IA:** Claude API (`claude-sonnet-4-20250514`) para extração de editais
- **Autenticação:** NextAuth.js
- **UI:** Tailwind CSS + shadcn/ui

---

## Fluxo Principal — 5 Etapas

Cada edital percorre obrigatoriamente estas etapas em ordem:

```
1. Análise do Edital
      ↓
2. Aprovação do Edital
      ↓
3. Cotação dos Itens       ← etapa mais complexa
      ↓
4. Aprovação de Margens
      ↓
5. Envio da Proposta
```

O status do edital sempre reflete em qual etapa ele está.

---

## Etapas Detalhadas

### Etapa 1 — Análise do Edital

- Usuário faz upload de um PDF de edital de pregão eletrônico
- Sistema envia o PDF para a Claude API
- Claude extrai e retorna JSON estruturado com:
  - Órgão licitante
  - Tipo de pregão (eletrônico, aberto/fechado, por item)
  - Número do processo e pregão
  - Datas: envio da proposta, abertura da sessão, início da disputa
  - Prazo de adequação
  - Validade da proposta
  - Valor de referência (pode ser sigiloso)
  - População do município
  - Plataforma (ComprasNet, ComprasGov, etc.)
  - Site
  - Lista de itens com: número, descrição, participação (exclusiva/ampla), unidade, quantidade, valor unitário, valor total, lote

### Etapa 2 — Aprovação do Edital

- Usuário revisa os dados extraídos pela IA
- Pode corrigir campos manualmente
- Aprova ou rejeita o edital
- Se aprovado, avança para Cotação dos Itens

### Etapa 3 — Cotação dos Itens

**Esta é a etapa mais crítica e complexa.**

Layout: grid estilo tabela/Excel com os itens do edital. Cada item pode ser expandido para mostrar os produtos do catálogo interno (vindo do Nexus ERP) que podem ser cotados para aquele item.

**Colunas do item (nível superior):**
- Checkbox de seleção
- Número do item
- Descrição
- Badge de status (Cotado / Em cotação)
- Participação (Exclusiva / Ampla)
- Unidade
- Quantidade
- Valor Unitário (editável)
- Valor Total (calculado)
- Lote

**Colunas do produto (nível expandido, vindo do ERP):**
- Descrição do produto
- Apresentação
- UND
- Fornecedor (nome + telefone)
- Custo Unitário
- Última Compra (data)
- PF (Preço de Fábrica — vindo da tabela CMED)
- PMVG (Preço Máximo de Venda ao Governo — vindo da tabela CMED)
- Valor Cotado (campo editável)
- Última Cotação (data)

**Regra crítica de negócio — PMVG:**
```
SE valor_cotado > PMVG:
  → Mostrar erro vermelho abaixo do campo: "Max: R$ X,XX (PMVG)"
  → Bloquear salvamento
  → NUNCA permitir prosseguir com valor acima do PMVG
```

Esta regra é inegociável. Cotar acima do PMVG em licitação pública pode gerar multas milionárias e suspensão do fornecedor.

**Outras funcionalidades da tela:**
- Busca de produtos por nome ou fabricante
- Botão "Novo produto avulso" (adicionar produto não cadastrado no ERP)
- Botão "Extrair Itens do Edital" (reprocessar com IA)
- Botão "Editar Itens" (edição manual da lista)
- Botão "Enviar para Aprovação"
- Botão "Exportar Excel"
- Campo de busca por descrição do item
- Total estimado exibido em tempo real

### Etapa 4 — Aprovação de Margens

- Gestor revisa as margens de cada item cotado
- Aprova ou solicita revisão
- Detalhes a definir conforme necessidade do negócio

### Etapa 5 — Envio da Proposta

- Exportação da proposta no formato adequado para a plataforma do pregão
- Registro de envio com data/hora
- Detalhes a definir conforme necessidade do negócio

---

## Módulo CMED

Tabela de medicamentos da ANVISA com preços regulatórios.

- Fonte: arquivo XLS oficial da ANVISA, atualizado periodicamente
- Total: ~26.000 registros
- Colunas relevantes: Substância, EAN, Produto, Apresentação, Laboratório, PF, PMVG
- Filtro por estado (o PMVG varia por estado — alíquota de ICMS)
- Interface: tabela com busca por nome, substância ou EAN

---

## Integração com Nexus ERP

**Status atual:** a definir — pendente contato com suporte do Nexus para verificar:
1. Se existe API REST documentada
2. Se é possível acesso de leitura direto ao banco SQL

**Dados necessários do ERP (por produto):**
- Descrição e apresentação
- Custo unitário
- Data e valor das últimas entradas (notas fiscais de compra)
- Fornecedor (nome + contato)
- Código interno

**Enquanto a integração não estiver disponível:**
- Implementar importação manual via CSV/Excel exportado do Nexus
- Criar tabela `produtos_erp` no banco local que recebe esses dados

**Quando a integração estiver disponível:**
- Criar serviço de sincronização periódica (cron job) ou consulta em tempo real

---

## Estrutura do Banco de Dados (Prisma Schema)

```prisma
model Edital {
  id                String      @id @default(cuid())
  titulo            String
  orgao             String
  tipo              String      // "PREGAO_ELETRONICO", etc.
  numero_processo   String?
  numero_pregao     String?
  plataforma        String?
  site              String?
  populacao         Int?
  valor_referencia  Float?
  valor_sigiloso    Boolean     @default(false)
  data_proposta     DateTime?
  data_abertura     DateTime?
  data_disputa      DateTime?
  prazo_adequacao   String?
  validade_proposta String?
  modalidade        String?     // "ABERTO_FECHADO", "POR_ITEM"
  status            StatusEdital @default(ANALISE)
  arquivo_url       String?
  criado_em         DateTime    @default(now())
  atualizado_em     DateTime    @updatedAt
  itens             ItemEdital[]
}

enum StatusEdital {
  ANALISE
  APROVACAO
  COTACAO
  APROVACAO_MARGENS
  ENVIO
  CONCLUIDO
  REJEITADO
}

model ItemEdital {
  id              String    @id @default(cuid())
  edital_id       String
  edital          Edital    @relation(fields: [edital_id], references: [id])
  numero          Int
  descricao       String
  participacao    String?   // "EXCLUSIVA", "AMPLA"
  unidade         String?
  quantidade      Float
  valor_unitario  Float?
  valor_total     Float?
  lote            String?
  cotado          Boolean   @default(false)
  cotacoes        Cotacao[]
}

model Cotacao {
  id              String      @id @default(cuid())
  item_id         String
  item            ItemEdital  @relation(fields: [item_id], references: [id])
  produto_id      String
  produto         ProdutoERP  @relation(fields: [produto_id], references: [id])
  valor_cotado    Float?
  selecionado     Boolean     @default(false)
  criado_em       DateTime    @default(now())
  atualizado_em   DateTime    @updatedAt
}

model ProdutoERP {
  id              String    @id @default(cuid())
  descricao       String
  apresentacao    String?
  unidade         String?
  fornecedor_nome String?
  fornecedor_tel  String?
  custo_unitario  Float?
  ultima_compra   DateTime?
  codigo_interno  String?
  ean             String?
  cotacoes        Cotacao[]
  cmed            CMED?     @relation(fields: [ean], references: [ean])
}

model CMED {
  id            String    @id @default(cuid())
  substancia    String
  ean           String    @unique
  produto       String
  apresentacao  String
  laboratorio   String
  pf            Float
  pmvg_ce       Float?    // PMVG por estado
  pmvg_sp       Float?
  pmvg_rj       Float?
  // adicionar outros estados conforme necessário
  produtos      ProdutoERP[]
}
```

---

## Navegação (Menu Principal)

- **Dashboard** — visão geral, editais recentes, gráficos de status
- **Editais** — lista de todos os editais com status e datas
- **Produtos** — catálogo de produtos do ERP
- **Fornecedores** — cadastro de fornecedores
- **CMED** — consulta da tabela oficial ANVISA
- **Admin** — configurações, usuários, importações

---

## Regras de Negócio Críticas

1. **PMVG é inviolável** — nenhum valor cotado pode ultrapassar o PMVG do produto. Bloquear na UI e na API.
2. **Etapas são sequenciais** — não é possível pular etapas. Um edital só avança quando a etapa atual é concluída.
3. **Audit trail** — toda alteração de valor cotado deve ser registrada com usuário e timestamp.
4. **CMED sempre atualizada** — a tabela CMED deve refletir a versão mais recente publicada pela ANVISA.

---

## Plano de Execução

### Semana 1 — Setup + CMED
- [ ] Inicializar projeto Next.js com Prisma + PostgreSQL
- [ ] Criar schema do banco e rodar migrations
- [ ] Importar tabela CMED (XLS ANVISA) para o banco
- [ ] Criar tela `/cmed` com busca e filtro por estado
- [ ] Deploy no Vercel

### Semana 2 — Upload e Análise de Edital
- [ ] Criar rota `POST /api/editais/analisar` que recebe PDF
- [ ] Integrar Claude API para extração estruturada
- [ ] Criar tela de upload de edital
- [ ] Criar tela de Revisão da Análise (etapa 1)
- [ ] Implementar aprovação/rejeição (etapa 2)

### Semana 3 — Cotação dos Itens
- [ ] Criar tela de Cotação (etapa 3)
- [ ] Implementar grid expansível por item
- [ ] Busca de produtos do catálogo interno
- [ ] Validação PMVG em tempo real
- [ ] Exportar Excel

### Semana 4 — Fluxo Completo
- [ ] Etapas 4 e 5 (Aprovação de Margens + Envio)
- [ ] Dashboard com métricas e editais recentes
- [ ] Autenticação com NextAuth.js
- [ ] Testes com editais reais da Panorama

### Futuro — Integração ERP
- [ ] Definir método de integração com Nexus ERP
- [ ] Implementar sincronização de produtos e preços
- [ ] Substituir catálogo manual pela fonte ERP em tempo real

---

## Variáveis de Ambiente Necessárias

```env
DATABASE_URL=postgresql://...
ANTHROPIC_API_KEY=sk-ant-...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

---

## Observações para o Claude Code

- Sempre validar PMVG tanto no frontend quanto na API — nunca confiar só no cliente
- Usar Server Actions do Next.js para operações de banco sempre que possível
- Componentes de tabela devem suportar ordenação e paginação desde o início
- O estado do edital (`StatusEdital`) deve ser atualizado atomicamente com a ação que o dispara
- Ao chamar a Claude API para extração de edital, usar temperature 0 para máxima consistência
- Preferir shadcn/ui para componentes base — já alinhado com o visual do Panorama existente
