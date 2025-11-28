"use client"

import { FileText, Settings, Server } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { getBackendStatus } from "@/lib/api-config"

export function Header() {
  const [backendStatus, setBackendStatus] = useState<{
    enabled: boolean
    url: string | null
    available: boolean | null
  }>({ enabled: false, url: null, available: null })

  useEffect(() => {
    // Update backend status every 5 seconds
    const updateStatus = () => {
      setBackendStatus(getBackendStatus())
    }

    updateStatus()
    const interval = setInterval(updateStatus, 5000)

    return () => clearInterval(interval)
  }, [])

  const getBackendBadge = () => {
    if (!backendStatus.enabled) {
      return (
        <Badge variant="secondary" className="gap-1.5">
          <Server className="h-3 w-3" />
          Backend Local
        </Badge>
      )
    }

    if (backendStatus.available === false) {
      return (
        <Badge variant="outline" className="gap-1.5 border-yellow-500 text-yellow-600">
          <Server className="h-3 w-3" />
          Backend Local (Fallback)
        </Badge>
      )
    }

    if (backendStatus.available === true) {
      return (
        <Badge variant="default" className="gap-1.5 bg-green-600">
          <Server className="h-3 w-3" />
          Backend Externo
        </Badge>
      )
    }

    return (
      <Badge variant="secondary" className="gap-1.5">
        <Server className="h-3 w-3" />
        Verificando...
      </Badge>
    )
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <FileText className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Zoom Atas</h1>
              <p className="text-xs text-muted-foreground">Gerador de Atas com IA</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {getBackendBadge()}
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
