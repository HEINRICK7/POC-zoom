"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, Mail, RefreshCw, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SignatureStatusCardProps {
  envelopeId: string
  meetingTitle: string
}

export function SignatureStatusCard({ envelopeId, meetingTitle }: SignatureStatusCardProps) {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/docusign/envelope-status/${envelopeId}`)

      if (!response.ok) {
        throw new Error("Falha ao buscar status")
      }

      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error("[v0] Error fetching envelope status:", error)
      toast({
        title: "Erro",
        description: "Não foi possível buscar o status das assinaturas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    // Poll every 30 seconds
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [envelopeId])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Concluído
          </Badge>
        )
      case "sent":
        return (
          <Badge className="bg-blue-500">
            <Mail className="h-3 w-3 mr-1" />
            Enviado
          </Badge>
        )
      case "delivered":
        return (
          <Badge className="bg-yellow-500">
            <Clock className="h-3 w-3 mr-1" />
            Aguardando
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (!status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status das Assinaturas</CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Status das Assinaturas</CardTitle>
            <CardDescription>{meetingTitle}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchStatus} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status Geral:</span>
          {getStatusBadge(status.status)}
        </div>

        {status.statusDateTime && (
          <div className="text-sm text-muted-foreground">
            Última atualização: {new Date(status.statusDateTime).toLocaleString("pt-BR")}
          </div>
        )}

        {status.recipients?.signers && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Assinantes:</h4>
            {status.recipients.signers.map((signer: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium">{signer.name}</p>
                  <p className="text-xs text-muted-foreground">{signer.email}</p>
                </div>
                {getStatusBadge(signer.status)}
              </div>
            ))}
          </div>
        )}

        {status.completed && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-600 dark:text-green-400">Todas as assinaturas foram coletadas!</p>
          </div>
        )}

        {!status.completed && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <p className="text-sm text-blue-600 dark:text-blue-400">Aguardando assinaturas dos participantes</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
