import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { buttonVariants } from "@/lib/button-variants"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
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

function formatDate(date: Date | null) {
  if (!date) return "—"
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

export default async function EditaisPage() {
  const editais = await prisma.edital.findMany({
    orderBy: { criado_em: "desc" },
    include: { _count: { select: { itens: true } } },
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Editais</h1>
          <p className="text-sm text-muted-foreground">
            {editais.length === 0
              ? "Nenhum edital cadastrado"
              : `${editais.length} edital${editais.length !== 1 ? "is" : ""}`}
          </p>
        </div>
        <Link href="/editais/novo" className={cn(buttonVariants(), "gap-1.5")}>
          <Plus className="h-4 w-4" />
          Novo Edital
        </Link>
      </div>

      {/* Empty state */}
      {editais.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
          <FileText className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm font-medium">Nenhum edital ainda</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Faça o upload de um PDF para começar a análise.
          </p>
          <Link
            href="/editais/novo"
            className={cn(buttonVariants({ size: "sm" }), "mt-4 gap-1.5")}
          >
            <Plus className="h-4 w-4" />
            Novo Edital
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Órgão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Data Proposta</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {editais.map((edital) => (
                <TableRow key={edital.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Link
                      href={`/editais/${edital.id}`}
                      className="font-medium hover:underline"
                    >
                      {edital.titulo}
                    </Link>
                    {edital.numero_pregao && (
                      <p className="text-xs text-muted-foreground">
                        Pregão {edital.numero_pregao}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{edital.orgao}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[edital.status]}>
                      {STATUS_LABEL[edital.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{edital._count.itens}</TableCell>
                  <TableCell className="text-sm">
                    {formatDate(edital.data_proposta)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(edital.criado_em)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
