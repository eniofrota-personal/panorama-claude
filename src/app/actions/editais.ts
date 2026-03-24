"use server"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import Anthropic from "@anthropic-ai/sdk"
import { revalidatePath } from "next/cache"

const client = new Anthropic()

const EXTRACTION_TOOL: Anthropic.Tool = {
  name: "salvar_edital",
  description: "Salva os dados estruturados extraídos do edital de licitação pública",
  input_schema: {
    type: "object",
    properties: {
      titulo: { type: "string", description: "Título ou identificação principal do edital" },
      orgao: { type: "string", description: "Nome completo do órgão licitante" },
      tipo: { type: "string", description: "Tipo de licitação. Use PREGAO_ELETRONICO para pregões eletrônicos" },
      numero_processo: { type: "string", description: "Número do processo administrativo" },
      numero_pregao: { type: "string", description: "Número do pregão eletrônico" },
      plataforma: { type: "string", description: "Portal de licitação (ComprasGov, BLL, Licitanet, etc.)" },
      site: { type: "string", description: "URL do edital ou portal" },
      populacao: { type: "number", description: "População do município (se mencionada)" },
      valor_referencia: { type: "number", description: "Valor de referência total do edital em reais" },
      valor_sigiloso: { type: "boolean", description: "true se o valor de referência for sigiloso" },
      data_proposta: { type: "string", description: "Data limite para envio da proposta (ISO 8601)" },
      data_abertura: { type: "string", description: "Data de abertura da sessão pública (ISO 8601)" },
      data_disputa: { type: "string", description: "Data de início da disputa (ISO 8601)" },
      prazo_adequacao: { type: "string", description: "Prazo de adequação da proposta" },
      validade_proposta: { type: "string", description: "Validade da proposta (ex: 60 dias)" },
      modalidade: { type: "string", description: "Modalidade: ABERTO_FECHADO ou POR_ITEM" },
      itens: {
        type: "array",
        description: "Lista completa de itens/lotes do edital",
        items: {
          type: "object",
          properties: {
            numero: { type: "number", description: "Número do item" },
            descricao: { type: "string", description: "Descrição completa do item" },
            participacao: { type: "string", description: "EXCLUSIVA (ME/EPP) ou AMPLA" },
            unidade: { type: "string", description: "Unidade de medida (CX, FR, AMP, etc.)" },
            quantidade: { type: "number", description: "Quantidade solicitada" },
            valor_unitario: { type: "number", description: "Valor unitário de referência" },
            valor_total: { type: "number", description: "Valor total do item (quantidade × valor unitário)" },
            lote: { type: "string", description: "Número ou identificação do lote" },
          },
          required: ["numero", "descricao", "quantidade"],
        },
      },
    },
    required: ["titulo", "orgao", "tipo", "itens"],
  },
}

const EXTRACTION_PROMPT = `Você é um especialista em licitações públicas de medicamentos no Brasil.

Analise o edital PDF fornecido e extraia TODOS os dados estruturados usando a ferramenta salvar_edital.

Instruções:
- Extraia TODOS os itens da lista de itens/lotes do edital, sem exceção
- Para datas, converta para formato ISO 8601 (ex: 2025-06-15T10:00:00)
- Se o valor de referência for sigiloso, defina valor_sigiloso como true e omita valor_referencia
- Para participacao: identifique "EXCLUSIVA" (restrita a ME/EPP) ou "AMPLA"
- Para tipo: use "PREGAO_ELETRONICO" para pregões eletrônicos
- Para plataforma: identifique o portal (ComprasGov, BLL, Licitanet, etc.)
- Para titulo: use o padrão "Pregão Eletrônico Nº X/AAAA – Nome do Órgão" se possível
- Seja preciso nos valores numéricos — não arredonde`

export type ExtrairEditalResult =
  | { success: true; editalId: string }
  | { success: false; error: string }

export async function extrairEdital(formData: FormData): Promise<ExtrairEditalResult> {
  const session = await getSession()
  const file = formData.get("pdf") as File | null

  if (!file || file.size === 0) {
    return { success: false, error: "Nenhum arquivo enviado." }
  }

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  if (!isPdf) {
    return { success: false, error: "O arquivo deve ser um PDF." }
  }

  if (file.size > 20 * 1024 * 1024) {
    return { success: false, error: "O arquivo não pode exceder 20 MB." }
  }

  try {
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString("base64")

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8096,
      temperature: 0,
      tools: [EXTRACTION_TOOL],
      tool_choice: { type: "any" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64,
              },
            },
            {
              type: "text",
              text: EXTRACTION_PROMPT,
            },
          ],
        },
      ],
    })

    const toolUse = response.content.find((b) => b.type === "tool_use")
    if (!toolUse || toolUse.type !== "tool_use") {
      return { success: false, error: "A IA não retornou dados estruturados. Tente novamente." }
    }

    const data = toolUse.input as {
      titulo: string
      orgao: string
      tipo: string
      numero_processo?: string
      numero_pregao?: string
      plataforma?: string
      site?: string
      populacao?: number
      valor_referencia?: number
      valor_sigiloso?: boolean
      data_proposta?: string
      data_abertura?: string
      data_disputa?: string
      prazo_adequacao?: string
      validade_proposta?: string
      modalidade?: string
      itens: Array<{
        numero: number
        descricao: string
        participacao?: string
        unidade?: string
        quantidade: number
        valor_unitario?: number
        valor_total?: number
        lote?: string
      }>
    }

    const edital = await prisma.edital.create({
      data: {
        titulo: data.titulo,
        orgao: data.orgao,
        tipo: data.tipo,
        numero_processo: data.numero_processo,
        numero_pregao: data.numero_pregao,
        plataforma: data.plataforma,
        site: data.site,
        populacao: data.populacao,
        valor_referencia: data.valor_referencia,
        valor_sigiloso: data.valor_sigiloso ?? false,
        data_proposta: data.data_proposta ? new Date(data.data_proposta) : undefined,
        data_abertura: data.data_abertura ? new Date(data.data_abertura) : undefined,
        data_disputa: data.data_disputa ? new Date(data.data_disputa) : undefined,
        prazo_adequacao: data.prazo_adequacao,
        validade_proposta: data.validade_proposta,
        modalidade: data.modalidade,
        status: "ANALISE",
        itens: {
          create: data.itens.map((item) => ({
            numero: item.numero,
            descricao: item.descricao,
            participacao: item.participacao,
            unidade: item.unidade,
            quantidade: item.quantidade,
            valor_unitario: item.valor_unitario,
            valor_total: item.valor_total,
            lote: item.lote,
          })),
        },
      },
    })

    revalidatePath("/editais")
    return { success: true, editalId: edital.id }
  } catch (err) {
    console.error("Erro ao extrair edital:", err)
    return { success: false, error: "Erro interno ao processar o edital. Tente novamente." }
  }
}
