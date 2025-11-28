"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { fetchWithFallback } from "@/lib/api-config"

interface ServiceStatus {
  configured: boolean
  connected: boolean
  message: string
  url?: string
}

interface SystemStatus {
  zoom: ServiceStatus
  openai: ServiceStatus
  docusign: ServiceStatus
  backend: ServiceStatus
}

export function StatusCard() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchStatus() {
    setLoading(true)
    try {
      console.log("[v0] Fetching backend status...")
      const response = await fetchWithFallback("/api/status")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Status received:", data)
      setStatus(data)
    } catch (error) {
      console.error("[v0] Failed to fetch status:", error)
      setStatus({
        zoom: { configured: false, connected: false, message: "Erro ao conectar" },
        openai: { configured: false, connected: false, message: "Erro ao conectar" },
        docusign: { configured: false, connected: false, message: "Erro ao conectar" },
        backend: { configured: false, connected: false, message: "Erro ao conectar com o servidor" },
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const hasZoomError = status?.zoom.configured && !status?.zoom.connected

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Status do Sistema</CardTitle>
            <CardDescription>Integrações e serviços disponíveis</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchStatus}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {hasZoomError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Erro de autenticação Zoom:</strong> Verifique se você criou um app{" "}
                <strong>Server-to-Server OAuth</strong> (não OAuth ou JWT) e se ele está ativado. Consulte o guia de
                configuração abaixo.
              </AlertDescription>
            </Alert>
          )}

          <StatusItem
            label="Backend API"
            service={status?.backend}
            description={status?.backend.url || "Servidor backend"}
          />

          <div className="grid gap-4 md:grid-cols-3">
            <StatusItem label="Zoom API" service={status?.zoom} description="Acesso às reuniões" />
            <StatusItem label="OpenAI" service={status?.openai} description="Geração de atas" />
            <StatusItem label="DocuSign" service={status?.docusign} description="Assinatura digital" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatusItem({
  label,
  service,
  description,
}: {
  label: string
  service?: ServiceStatus
  description: string
}) {
  const getStatusIcon = () => {
    if (!service?.configured) {
      return <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
    }
    if (service.connected) {
      return <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
    }
    return <XCircle className="h-5 w-5 text-destructive mt-0.5" />
  }

  const getStatusBadge = () => {
    if (!service?.configured) {
      return (
        <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-500">
          Local
        </Badge>
      )
    }
    if (service.connected) {
      return (
        <Badge variant="default" className="text-xs bg-green-500">
          Conectado
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="text-xs border-orange-500 text-orange-500">
        Fallback Local
      </Badge>
    )
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/50 p-4">
      {getStatusIcon()}
      <div className="space-y-1 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{label}</p>
          {getStatusBadge()}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {service?.message && <p className="text-xs text-muted-foreground italic mt-1">{service.message}</p>}
      </div>
    </div>
  )
}
