"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, FileSignature, Download, XCircle, Loader2 } from "lucide-react"
import { checkEnvelopeStatus, downloadSignedDocument, type EnvelopeStatus } from "@/lib/docusign"

interface EnvelopeStatusTrackerProps {
  envelopeId: string
  meetingTopic: string
}

export function EnvelopeStatusTracker({ envelopeId, meetingTopic }: EnvelopeStatusTrackerProps) {
  const [status, setStatus] = useState<EnvelopeStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    async function fetchStatus() {
      const envelopeStatus = await checkEnvelopeStatus(envelopeId)
      setStatus(envelopeStatus)
      setLoading(false)
    }

    fetchStatus()

    // Poll every 30 seconds for status updates
    const interval = setInterval(fetchStatus, 30000)

    return () => clearInterval(interval)
  }, [envelopeId])

  async function handleDownload() {
    setDownloading(true)
    try {
      const blob = await downloadSignedDocument(envelopeId)
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `ata_assinada_${envelopeId}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const statusConfig = {
    created: { icon: Clock, label: "Criado", variant: "secondary" as const, color: "text-gray-500" },
    sent: { icon: FileSignature, label: "Enviado", variant: "secondary" as const, color: "text-blue-500" },
    delivered: { icon: FileSignature, label: "Entregue", variant: "secondary" as const, color: "text-blue-500" },
    signed: { icon: CheckCircle2, label: "Assinado", variant: "default" as const, color: "text-green-500" },
    completed: { icon: CheckCircle2, label: "Concluído", variant: "default" as const, color: "text-green-500" },
    declined: { icon: XCircle, label: "Recusado", variant: "destructive" as const, color: "text-red-500" },
    voided: { icon: XCircle, label: "Cancelado", variant: "destructive" as const, color: "text-red-500" },
  }

  const currentStatus = status ? statusConfig[status.status] : statusConfig.created
  const Icon = currentStatus.icon

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Status da Assinatura</CardTitle>
        <CardDescription>{meetingTopic}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className={`h-5 w-5 ${currentStatus.color}`} />
            <div>
              <p className="text-sm font-medium">Status do Envelope</p>
              <p className="text-xs text-muted-foreground">ID: {envelopeId}</p>
            </div>
          </div>
          <Badge variant={currentStatus.variant}>{currentStatus.label}</Badge>
        </div>

        {status && (status.status === "completed" || status.status === "signed") && (
          <Button onClick={handleDownload} disabled={downloading} className="w-full">
            {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Baixar Documento Assinado
          </Button>
        )}

        {status?.statusDateTime && (
          <p className="text-xs text-muted-foreground">
            Última atualização: {new Date(status.statusDateTime).toLocaleString("pt-BR")}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
