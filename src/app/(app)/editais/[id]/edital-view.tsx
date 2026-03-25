"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { PlusIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { aprovarEdital, rejeitarEdital, atualizarEdital } from "@/app/actions/editais"

type ItemEditalData = {
  id: string
  numero: number
  descricao: string
  participacao: string | null
  unidade: string | null
  quantidade: number
  valor_unitario: number | null
  valor_total: number | null
  lote: string | null
}

type EditalWithItems = {
  id: string
  titulo: string
  orgao: string
  status: string
  numero_processo: string | null
  numero_pregao: string | null
  plataforma: string | null
  site: string | null
  populacao: number | null
  valor_referencia: number | null
  valor_sigiloso: boolean
  data_proposta: Date | null
  data_abertura: Date | null
  data_disputa: Date | null
  prazo_adequacao: string | null
  validade_proposta: string | null
  modalidade: string | null
  atualizado_em: Date
  itens: ItemEditalData[]
}

type ItemForm = {
  _key: string
  numero: string
  descricao: string
  participacao: string
  unidade: string
  quantidade: string
  valor_unitario: string
  lote: string
}

function toDatetimeLocal(date: Date | string | null | undefined): string {
  if (!date) return ""
  const d = new Date(date)
  if (isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—"
  const d = new Date(date)
  if (isNaN(d.getTime())) return "—"
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

function formatCurrency(value: number | null) {
  if (value === null) return "—"
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

function initItemsForm(items: ItemEditalData[]): ItemForm[] {
  return items.map((item) => ({
    _key: item.id,
    numero: item.numero.toString(),
    descricao: item.descricao,
    participacao: item.participacao ?? "",
    unidade: item.unidade ?? "",
    quantidade: item.quantidade.toString(),
    valor_unitario: item.valor_unitario?.toString() ?? "",
    lote: item.lote ?? "",
  }))
}

export function EditalView({ edital }: { edital: EditalWithItems }) {
  const canApprove = edital.status === "ANALISE" || edital.status === "APROVACAO"
  const [editMode, setEditMode] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [form, setForm] = useState({
    titulo: edital.titulo,
    orgao: edital.orgao,
    numero_processo: edital.numero_processo ?? "",
    numero_pregao: edital.numero_pregao ?? "",
    plataforma: edital.plataforma ?? "",
    site: edital.site ?? "",
    populacao: edital.populacao?.toString() ?? "",
    valor_referencia: edital.valor_referencia?.toString() ?? "",
    valor_sigiloso: edital.valor_sigiloso,
    data_proposta: toDatetimeLocal(edital.data_proposta),
    data_abertura: toDatetimeLocal(edital.data_abertura),
    data_disputa: toDatetimeLocal(edital.data_disputa),
    prazo_adequacao: edital.prazo_adequacao ?? "",
    validade_proposta: edital.validade_proposta ?? "",
    modalidade: edital.modalidade ?? "",
  })

  const [itens, setItens] = useState<ItemForm[]>(() => initItemsForm(edital.itens))

  const patch = (update: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...update }))

  const updateItem = (key: string, field: keyof ItemForm, value: string) =>
    setItens((prev) => prev.map((i) => (i._key === key ? { ...i, [field]: value } : i)))

  const addItem = () =>
    setItens((prev) => [
      ...prev,
      {
        _key: `new-${Date.now()}`,
        numero: (prev.length + 1).toString(),
        descricao: "",
        participacao: "",
        unidade: "",
        quantidade: "1",
        valor_unitario: "",
        lote: "",
      },
    ])

  const removeItem = (key: string) => setItens((prev) => prev.filter((i) => i._key !== key))

  const cancelEdit = () => {
    setForm({
      titulo: edital.titulo,
      orgao: edital.orgao,
      numero_processo: edital.numero_processo ?? "",
      numero_pregao: edital.numero_pregao ?? "",
      plataforma: edital.plataforma ?? "",
      site: edital.site ?? "",
      populacao: edital.populacao?.toString() ?? "",
      valor_referencia: edital.valor_referencia?.toString() ?? "",
      valor_sigiloso: edital.valor_sigiloso,
      data_proposta: toDatetimeLocal(edital.data_proposta),
      data_abertura: toDatetimeLocal(edital.data_abertura),
      data_disputa: toDatetimeLocal(edital.data_disputa),
      prazo_adequacao: edital.prazo_adequacao ?? "",
      validade_proposta: edital.validade_proposta ?? "",
      modalidade: edital.modalidade ?? "",
    })
    setItens(initItemsForm(edital.itens))
    setEditMode(false)
  }

  const handleSave = () => {
    startTransition(async () => {
      const result = await atualizarEdital(edital.id, {
        titulo: form.titulo,
        orgao: form.orgao,
        numero_processo: form.numero_processo || undefined,
        numero_pregao: form.numero_pregao || undefined,
        plataforma: form.plataforma || undefined,
        site: form.site || undefined,
        populacao: form.populacao ? parseInt(form.populacao) : undefined,
        valor_referencia: form.valor_referencia ? parseFloat(form.valor_referencia) : undefined,
        valor_sigiloso: form.valor_sigiloso,
        data_proposta: form.data_proposta || undefined,
        data_abertura: form.data_abertura || undefined,
        data_disputa: form.data_disputa || undefined,
        prazo_adequacao: form.prazo_adequacao || undefined,
        validade_proposta: form.validade_proposta || undefined,
        modalidade: form.modalidade || undefined,
        itens: itens.map((item, i) => ({
          numero: parseInt(item.numero) || i + 1,
          descricao: item.descricao,
          participacao: item.participacao || undefined,
          unidade: item.unidade || undefined,
          quantidade: parseFloat(item.quantidade) || 0,
          valor_unitario: item.valor_unitario ? parseFloat(item.valor_unitario) : undefined,
          lote: item.lote || undefined,
        })),
      })
      if (result.success) {
        setEditMode(false)
        toast.success("Alterações salvas com sucesso.")
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleAprovar = () => {
    startTransition(async () => {
      const result = await aprovarEdital(edital.id)
      if (!result.success) toast.error(result.error)
    })
  }

  const handleRejeitar = () => {
    startTransition(async () => {
      const result = await rejeitarEdital(edital.id)
      if (result.success) {
        setRejectOpen(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Action bar */}
      {canApprove && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/20">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Revise os dados extraídos pela IA. Corrija se necessário e aprove para avançar.
          </p>
          {!editMode ? (
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                onClick={() => setRejectOpen(true)}
                disabled={isPending}
              >
                Rejeitar
              </Button>
              <Button size="sm" onClick={handleAprovar} disabled={isPending}>
                {isPending ? "Aprovando..." : "Aprovar →"}
              </Button>
            </div>
          ) : (
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" size="sm" onClick={cancelEdit} disabled={isPending}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isPending}>
                {isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Metadata */}
      {!editMode ? (
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
          {edital.data_disputa && (
            <div>
              <p className="text-xs text-muted-foreground">Início da Disputa</p>
              <p className="font-medium">{formatDate(edital.data_disputa)}</p>
            </div>
          )}
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
          {edital.prazo_adequacao && (
            <div>
              <p className="text-xs text-muted-foreground">Prazo de Adequação</p>
              <p className="font-medium">{edital.prazo_adequacao}</p>
            </div>
          )}
          {edital.site && (
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">Site</p>
              <p className="font-medium truncate">{edital.site}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border p-4 space-y-4">
          <h3 className="text-sm font-semibold">Editar Dados do Edital</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                value={form.titulo}
                onChange={(e) => patch({ titulo: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="orgao">Órgão</Label>
              <Input
                id="orgao"
                value={form.orgao}
                onChange={(e) => patch({ orgao: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="numero_pregao">Nº do Pregão</Label>
              <Input
                id="numero_pregao"
                value={form.numero_pregao}
                onChange={(e) => patch({ numero_pregao: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="numero_processo">Nº do Processo</Label>
              <Input
                id="numero_processo"
                value={form.numero_processo}
                onChange={(e) => patch({ numero_processo: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plataforma">Plataforma</Label>
              <Input
                id="plataforma"
                value={form.plataforma}
                onChange={(e) => patch({ plataforma: e.target.value })}
                placeholder="ComprasGov, BLL, Licitanet..."
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="site">Site</Label>
              <Input
                id="site"
                value={form.site}
                onChange={(e) => patch({ site: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="modalidade">Modalidade</Label>
              <Select
                value={form.modalidade || "_none"}
                onValueChange={(v) => patch({ modalidade: !v || v === "_none" ? "" : v })}
              >
                <SelectTrigger id="modalidade">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">—</SelectItem>
                  <SelectItem value="ABERTO_FECHADO">Aberto/Fechado</SelectItem>
                  <SelectItem value="POR_ITEM">Por Item</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="data_proposta">Data da Proposta</Label>
              <Input
                id="data_proposta"
                type="datetime-local"
                value={form.data_proposta}
                onChange={(e) => patch({ data_proposta: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="data_abertura">Abertura da Sessão</Label>
              <Input
                id="data_abertura"
                type="datetime-local"
                value={form.data_abertura}
                onChange={(e) => patch({ data_abertura: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="data_disputa">Início da Disputa</Label>
              <Input
                id="data_disputa"
                type="datetime-local"
                value={form.data_disputa}
                onChange={(e) => patch({ data_disputa: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="validade_proposta">Validade da Proposta</Label>
              <Input
                id="validade_proposta"
                value={form.validade_proposta}
                onChange={(e) => patch({ validade_proposta: e.target.value })}
                placeholder="Ex: 60 dias"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prazo_adequacao">Prazo de Adequação</Label>
              <Input
                id="prazo_adequacao"
                value={form.prazo_adequacao}
                onChange={(e) => patch({ prazo_adequacao: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="populacao">População do Município</Label>
              <Input
                id="populacao"
                type="number"
                value={form.populacao}
                onChange={(e) => patch({ populacao: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="valor_referencia">Valor de Referência (R$)</Label>
              <Input
                id="valor_referencia"
                type="number"
                step="0.01"
                value={form.valor_referencia}
                disabled={form.valor_sigiloso}
                onChange={(e) => patch({ valor_referencia: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="valor_sigiloso"
                checked={form.valor_sigiloso}
                onChange={(e) => patch({ valor_sigiloso: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="valor_sigiloso">Valor Sigiloso</Label>
            </div>
          </div>
        </div>
      )}

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">
            Itens ({editMode ? itens.length : edital.itens.length})
          </h2>
          {editMode && (
            <Button variant="outline" size="sm" onClick={addItem}>
              <PlusIcon className="mr-1.5 h-4 w-4" />
              Adicionar Item
            </Button>
          )}
        </div>
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Nº</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Participação</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Vl. Unit.</TableHead>
                {!editMode && <TableHead className="text-right">Vl. Total</TableHead>}
                <TableHead>Lote</TableHead>
                {editMode && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {editMode
                ? itens.map((item) => (
                    <TableRow key={item._key}>
                      <TableCell>
                        <Input
                          className="w-14 h-8 text-sm"
                          value={item.numero}
                          onChange={(e) => updateItem(item._key, "numero", e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="min-w-52 h-8 text-sm"
                          value={item.descricao}
                          onChange={(e) => updateItem(item._key, "descricao", e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={item.participacao || "_none"}
                          onValueChange={(v) =>
                            updateItem(item._key, "participacao", !v || v === "_none" ? "" : v)
                          }
                        >
                          <SelectTrigger className="w-28 h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_none">—</SelectItem>
                            <SelectItem value="EXCLUSIVA">Exclusiva</SelectItem>
                            <SelectItem value="AMPLA">Ampla</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          className="w-20 h-8 text-sm"
                          value={item.unidade}
                          onChange={(e) => updateItem(item._key, "unidade", e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="w-24 h-8 text-sm text-right"
                          type="number"
                          value={item.quantidade}
                          onChange={(e) => updateItem(item._key, "quantidade", e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="w-28 h-8 text-sm text-right"
                          type="number"
                          step="0.01"
                          value={item.valor_unitario}
                          onChange={(e) =>
                            updateItem(item._key, "valor_unitario", e.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="w-20 h-8 text-sm"
                          value={item.lote}
                          onChange={(e) => updateItem(item._key, "lote", e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                          onClick={() => removeItem(item._key)}
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                : edital.itens.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-muted-foreground">{item.numero}</TableCell>
                      <TableCell className="max-w-sm">
                        <p className="text-sm line-clamp-2">{item.descricao}</p>
                      </TableCell>
                      <TableCell>
                        {item.participacao ? (
                          <Badge
                            variant={
                              item.participacao === "EXCLUSIVA" ? "secondary" : "outline"
                            }
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

      {/* Reject confirmation */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Edital</DialogTitle>
            <DialogDescription>
              O edital será marcado como rejeitado. Esta ação não pode ser desfeita. Deseja
              continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleRejeitar} disabled={isPending}>
              {isPending ? "Rejeitando..." : "Rejeitar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
