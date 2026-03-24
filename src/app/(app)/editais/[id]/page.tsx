import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import type { StatusEdital } from "@/generated/prisma/enums"
import { EditalView } from "./edital-view"

const STATUS_LABEL: Record<StatusEdital, string> = {
  ANALISE: "Análise",
  APROVACAO: "Aprovação",
  COTACAO: "Cotação",
  APROVACAO_MARGENS: "Aprov. Margens",
  ENVIO: "Envio",
  CONCLUIDO: "Concluído",
  REJEITADO: "Rejeitado",
}

const STATUS_VARIANT: Record<
  StatusEdital,
  "default" | "secondary" | "destructive" | "outline"
> = {
  ANALISE: "secondary",
  APROVACAO: "secondary",
  COTACAO: "default",
  APROVACAO_MARGENS: "default",
  ENVIO: "default",
  CONCLUIDO: "outline",
  REJEITADO: "destructive",
}

const STEPS: { status: StatusEdital; label: string }[] = [
  { status: "ANALISE", label: "Análise" },
  { status: "APROVACAO", label: "Aprovação" },
  { status: "COTACAO", label: "Cotação" },
  { status: "APROVACAO_MARGENS", label: "Aprov. Margens" },
  { status: "ENVIO", label: "Envio" },
]

const STEP_ORDER = STEPS.map((s) => s.status)

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

  const rawIndex = STEP_ORDER.indexOf(edital.status as StatusEdital)
  const currentStep =
    rawIndex >= 0 ? rawIndex : edital.status === "CONCLUIDO" ? STEPS.length : -1

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
        <Badge variant={STATUS_VARIANT[edital.status]}>
          {STATUS_LABEL[edital.status]}
        </Badge>
      </div>

      {/* Step progress */}
      {edital.status !== "REJEITADO" && (
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
                  <div className={`mx-2 h-px w-8 ${done ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Dynamic content — key forces remount when edital is updated */}
      <EditalView key={edital.atualizado_em.toISOString()} edital={edital} />
    </div>
  )
}
