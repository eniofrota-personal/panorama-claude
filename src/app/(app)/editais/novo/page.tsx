"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/lib/button-variants"
import { extrairEdital } from "@/app/actions/editais"
import { Upload, FileText, X, Loader2 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function NovoEditalPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const input = fileInputRef.current
    if (!input) return
    const listener = (e: Event) => {
      const f = (e.target as HTMLInputElement).files?.[0]
      console.log("native change fired", f?.name, f?.type)
      if (f) handleFile(f)
      ;(e.target as HTMLInputElement).value = ""
    }
    input.addEventListener("change", listener)
    return () => input.removeEventListener("change", listener)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleFile(f: File) {
    console.log("handleFile called", f.name, f.type)
    const isPdf = f.type === "application/pdf" || f.type === "" || f.name.toLowerCase().endsWith(".pdf")
    if (!isPdf) {
      toast.error("Apenas arquivos PDF são aceitos.")
      return
    }
    setFile(f)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  function handleSubmit() {
    if (!file) return
    const formData = new FormData()
    formData.set("pdf", file)

    startTransition(async () => {
      const result = await extrairEdital(formData)
      if (result.success) {
        toast.success("Edital extraído com sucesso!")
        router.push(`/editais/${result.editalId}`)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link href="/editais" className="hover:underline">
            Editais
          </Link>
          <span>/</span>
          <span>Novo Edital</span>
        </div>
        <h1 className="text-xl font-semibold">Analisar Edital</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Faça o upload do PDF do edital. A IA irá extrair os dados automaticamente.
        </p>
      </div>

      {/* Drop zone */}
      <input
        ref={fileInputRef}
        id="pdf-upload"
        type="file"
        accept=".pdf,application/pdf"
        className="sr-only"
        onChange={() => {}}
      />
      <label
        htmlFor="pdf-upload"
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center transition-colors",
          dragging
            ? "border-primary bg-primary/5"
            : file
            ? "border-border bg-muted/30"
            : "border-border hover:border-primary/50 hover:bg-muted/20 cursor-pointer select-none"
        )}
      >
        {file ? (
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary shrink-0" />
            <div className="text-left">
              <p className="text-sm font-medium truncate max-w-xs">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setFile(null) }}
              className="ml-2 rounded-full p-1 hover:bg-muted"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="mb-3 h-8 w-8 text-muted-foreground/60" />
            <p className="text-sm font-medium">Arraste o PDF aqui ou clique para selecionar</p>
            <p className="mt-1 text-xs text-muted-foreground">PDF até 20 MB</p>
          </>
        )}
      </label>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={!file || isPending}
          className="min-w-40"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analisando...
            </>
          ) : (
            "Analisar com IA"
          )}
        </Button>
        <Link
          href="/editais"
          className={cn(buttonVariants({ variant: "outline" }), isPending && "pointer-events-none opacity-50")}
          aria-disabled={isPending}
        >
          Cancelar
        </Link>
      </div>

      {isPending && (
        <p className="text-xs text-muted-foreground">
          A IA está lendo o edital e extraindo os dados. Isso pode levar até 30 segundos...
        </p>
      )}
    </div>
  )
}
