-- CreateEnum
CREATE TYPE "StatusEdital" AS ENUM ('ANALISE', 'APROVACAO', 'COTACAO', 'APROVACAO_MARGENS', 'ENVIO', 'CONCLUIDO', 'REJEITADO');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'GESTOR', 'OPERADOR');

-- CreateTable
CREATE TABLE "Edital" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "orgao" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "numero_processo" TEXT,
    "numero_pregao" TEXT,
    "plataforma" TEXT,
    "site" TEXT,
    "populacao" INTEGER,
    "valor_referencia" DOUBLE PRECISION,
    "valor_sigiloso" BOOLEAN NOT NULL DEFAULT false,
    "data_proposta" TIMESTAMP(3),
    "data_abertura" TIMESTAMP(3),
    "data_disputa" TIMESTAMP(3),
    "prazo_adequacao" TEXT,
    "validade_proposta" TEXT,
    "modalidade" TEXT,
    "status" "StatusEdital" NOT NULL DEFAULT 'ANALISE',
    "arquivo_url" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Edital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemEdital" (
    "id" TEXT NOT NULL,
    "edital_id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "participacao" TEXT,
    "unidade" TEXT,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "valor_unitario" DOUBLE PRECISION,
    "valor_total" DOUBLE PRECISION,
    "lote" TEXT,
    "cotado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ItemEdital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cotacao" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "produto_id" TEXT NOT NULL,
    "valor_cotado" DOUBLE PRECISION,
    "selecionado" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cotacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricoCotacao" (
    "id" TEXT NOT NULL,
    "cotacao_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "valor_antigo" DOUBLE PRECISION,
    "valor_novo" DOUBLE PRECISION,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoricoCotacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProdutoERP" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "apresentacao" TEXT,
    "unidade" TEXT,
    "fornecedor_nome" TEXT,
    "fornecedor_tel" TEXT,
    "custo_unitario" DOUBLE PRECISION,
    "ultima_compra" TIMESTAMP(3),
    "codigo_interno" TEXT,
    "ean" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProdutoERP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CMED" (
    "id" TEXT NOT NULL,
    "substancia" TEXT NOT NULL,
    "ean" TEXT NOT NULL,
    "produto" TEXT NOT NULL,
    "apresentacao" TEXT NOT NULL,
    "laboratorio" TEXT NOT NULL,
    "pf" DOUBLE PRECISION NOT NULL,
    "pmvg_ac" DOUBLE PRECISION,
    "pmvg_al" DOUBLE PRECISION,
    "pmvg_am" DOUBLE PRECISION,
    "pmvg_ap" DOUBLE PRECISION,
    "pmvg_ba" DOUBLE PRECISION,
    "pmvg_ce" DOUBLE PRECISION,
    "pmvg_df" DOUBLE PRECISION,
    "pmvg_es" DOUBLE PRECISION,
    "pmvg_go" DOUBLE PRECISION,
    "pmvg_ma" DOUBLE PRECISION,
    "pmvg_mg" DOUBLE PRECISION,
    "pmvg_ms" DOUBLE PRECISION,
    "pmvg_mt" DOUBLE PRECISION,
    "pmvg_pa" DOUBLE PRECISION,
    "pmvg_pb" DOUBLE PRECISION,
    "pmvg_pe" DOUBLE PRECISION,
    "pmvg_pi" DOUBLE PRECISION,
    "pmvg_pr" DOUBLE PRECISION,
    "pmvg_rj" DOUBLE PRECISION,
    "pmvg_rn" DOUBLE PRECISION,
    "pmvg_ro" DOUBLE PRECISION,
    "pmvg_rr" DOUBLE PRECISION,
    "pmvg_rs" DOUBLE PRECISION,
    "pmvg_sc" DOUBLE PRECISION,
    "pmvg_se" DOUBLE PRECISION,
    "pmvg_sp" DOUBLE PRECISION,
    "pmvg_to" DOUBLE PRECISION,

    CONSTRAINT "CMED_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'OPERADOR',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "CMED_ean_key" ON "CMED"("ean");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "ItemEdital" ADD CONSTRAINT "ItemEdital_edital_id_fkey" FOREIGN KEY ("edital_id") REFERENCES "Edital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cotacao" ADD CONSTRAINT "Cotacao_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "ItemEdital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cotacao" ADD CONSTRAINT "Cotacao_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "ProdutoERP"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoCotacao" ADD CONSTRAINT "HistoricoCotacao_cotacao_id_fkey" FOREIGN KEY ("cotacao_id") REFERENCES "Cotacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoCotacao" ADD CONSTRAINT "HistoricoCotacao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProdutoERP" ADD CONSTRAINT "ProdutoERP_ean_fkey" FOREIGN KEY ("ean") REFERENCES "CMED"("ean") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
