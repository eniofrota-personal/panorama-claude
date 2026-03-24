import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { StatusEdital } from "@/generated/prisma/enums"

const STATUS_LABEL: Record<StatusEdital, string> = {
  ANALISE: "Análise",
  APROVACAO: "Aprovação",
  COTACAO: "Cotação",
  APROVACAO_MARGENS: "Aprov. Margens",
  ENVIO: "Envio",
  CONCLUIDO: "Concluído",
  REJEITADO: "Rejeitado",
}

const STEPS: { status: StatusEdital; label: string }[] = [
  { status: "ANALISE", label: "Análise" },
  { status: "APROVACAO", label: "Aprovação" },
  { status: "COTACAO", label: "Cotação" },
  { status: "APROVACAO_MARGENS", label: "Aprov. Margens" },
  { status: "ENVIO", label: "Envio" },
]

const STEP_ORDER = STEPS.map((s) => s.status)

function formatDate(date: Date | null) {
  if (!date) return "—"
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function formatCurrency(value: number | null) {
  if (value === null) return "—"
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export default async function EditalPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const edital = await prisma.edital.findUnique({
    where: { id },
    include: { itens: { orderBy: { numero: "asc" } } },
  })

  if (!edital) notFound()

  const currentStep = STEP_ORDER.indexOf(edital.status)

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/editais" className="hover:underline">
          Editais
        </Link>
        <span>/</span>
        <span className="truncate max-w-xs">{edital.titulo}</span>
      </div>

      {/* Title + status */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{edital.titulo}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{edital.orgao}</p>
        </div>
        <Badge variant="secondary">{STATUS_LABEL[edital.status]}</Badge>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-0">
        {STEPS.map((step, i) => {
          const done = i < currentStep
          const active = i === currentStep
          return (
            <div key={step.status} className="flex items-center">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium border ${
                  done
                    ? "bg-primary text-primary-foreground border-primary"
                    : active
                    ? "border-primary text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                {done ? "✓" : i + 1}
              </div>
              <span
                className={`ml-1.5 text-xs font-medium ${
                  active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-2 h-px w-8 ${done ? "bg-primary" : "bg-border"}`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Metadata grid */}
      <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 text-sm md:grid-cols-3">
        {edital.numero_pregao && (
          <div>
            <p className="text-xs text-muted-foreground">Pregão</p>
            <p className="font-medium">{edital.numero_pregao}</p>
          </div>
        )}
        {edital.numero_processo && (
          <div>
            <p className="text-xs text-muted-foreground">Processo</p>
            <p className="font-medium">{edital.numero_processo}</p>
          </div>
        )}
        {edital.plataforma && (
          <div>
            <p className="text-xs text-muted-foreground">Plataforma</p>
            <p className="font-medium">{edital.plataforma}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-muted-foreground">Data da Proposta</p>
          <p className="font-medium">{formatDate(edital.data_proposta)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Abertura da Sessão</p>
          <p className="font-medium">{formatDate(edital.data_abertura)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Valor de Referência</p>
          <p className="font-medium">
            {edital.valor_sigiloso ? "Sigiloso" : formatCurrency(edital.valor_referencia)}
          </p>
        </div>
        {edital.validade_proposta && (
          <div>
            <p className="text-xs text-muted-foreground">Validade da Proposta</p>
            <p className="font-medium">{edital.validade_proposta}</p>
          </div>
        )}
        {edital.modalidade && (
          <div>
            <p className="text-xs text-muted-foreground">Modalidade</p>
            <p className="font-medium">{edital.modalidade}</p>
          </div>
        )}
      </div>

      {/* Itens */}
      <div>
        <h2 className="text-sm font-semibold mb-3">
          Itens ({edital.itens.length})
        </h2>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Nº</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Participação</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Vl. Unit.</TableHead>
                <TableHead className="text-right">Vl. Total</TableHead>
                <TableHead>Lote</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {edital.itens.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground">{item.numero}</TableCell>
                  <TableCell className="max-w-sm">
                    <p className="text-sm line-clamp-2">{item.descricao}</p>
                  </TableCell>
                  <TableCell>
                    {item.participacao ? (
                      <Badge
                        variant={item.participacao === "EXCLUSIVA" ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        {item.participacao === "EXCLUSIVA" ? "Exclusiva" : "Ampla"}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{item.unidade ?? "—"}</TableCell>
                  <TableCell className="text-right text-sm">
                    {item.quantidade.toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {formatCurrency(item.valor_unitario)}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {formatCurrency(item.valor_total)}
                  </TableCell>
                  <TableCell className="text-sm">{item.lote ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
