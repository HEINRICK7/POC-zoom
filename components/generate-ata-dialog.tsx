"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Loader2, Download, CheckCircle2, AlertCircle, TestTube, Plus, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { fetchWithFallback } from "@/lib/api-config"

interface Meeting {
  id: string
  topic: string
  start_time: string
}

interface GenerateAtaDialogProps {
  meeting: Meeting
  invitees?: Array<{ email: string }>
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GenerateAtaDialog({ meeting, invitees = [], open, onOpenChange }: GenerateAtaDialogProps) {
  const [includeSignature, setIncludeSignature] = useState(false)
  const [testMode, setTestMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [ataContent, setAtaContent] = useState<string | null>(null)
  const [docusignEnvelopeId, setDocusignEnvelopeId] = useState<string | null>(null)
  const [docusignConfigured, setDocusignConfigured] = useState(true)
  const [missingCredentials, setMissingCredentials] = useState<string[]>([])
  const [consentRequired, setConsentRequired] = useState(false)
  const [consentUrl, setConsentUrl] = useState<string | null>(null)

  const [signers, setSigners] = useState<Array<{ email: string }>>(() => {
    if (invitees.length > 0) {
      return invitees.map((inv) => ({ email: inv.email }))
    }
    return [{ email: "" }]
  })

  useEffect(() => {
    if (includeSignature && open) {
      fetchWithFallback("/api/test-backend")
        .then((res) => res.json())
        .then((data) => {
          if (data.docusign && !data.docusign.configured) {
            setDocusignConfigured(false)
            const match = data.docusign.message.match(/Credenciais faltando: (.+)/)
            if (match) {
              setMissingCredentials(match[1].split(", "))
            }
          } else {
            setDocusignConfigured(true)
            setMissingCredentials([])
          }
        })
        .catch((err) => {
          console.error("[v0] Error checking DocuSign status:", err)
        })
    }
  }, [includeSignature, open])

  function addSigner() {
    setSigners([...signers, { email: "" }])
  }

  function removeSigner(index: number) {
    setSigners(signers.filter((_, i) => i !== index))
  }

  function updateSigner(index: number, value: string) {
    const newSigners = [...signers]
    newSigners[index].email = value
    setSigners(newSigners)
  }

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    setErrorDetails(null)
    setSuccess(false)
    setConsentRequired(false)
    setConsentUrl(null)

    try {
      let validSigners = []
      if (includeSignature) {
        validSigners = signers.filter((s) => s.email.trim())
        if (validSigners.length === 0) {
          setError("Adicione pelo menos um signatário")
          setLoading(false)
          return
        }
      }

      const response = await fetchWithFallback("/api/meetings/generate-ata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          meetingId: meeting.id,
          includeSignature,
          testMode,
          signers: validSigners,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        let errorData = data.error

        // If error is a string, try to parse it as JSON
        if (typeof errorData === "string") {
          try {
            errorData = JSON.parse(errorData)
          } catch (e) {
            // Not JSON, keep as string
          }
        }

        // Check if it's a consent required error
        if (errorData && typeof errorData === "object" && errorData.code === "CONSENT_REQUIRED") {
          setConsentRequired(true)
          setConsentUrl(errorData.consentUrl)
          setError("Consentimento do DocuSign necessário")
          setErrorDetails(errorData.instructions)
        } else if (typeof errorData === "string" && errorData.includes("CONSENT_REQUIRED")) {
          // Fallback for string format
          try {
            const parsed = JSON.parse(errorData)
            setConsentRequired(true)
            setConsentUrl(parsed.consentUrl)
            setError("Consentimento do DocuSign necessário")
            setErrorDetails(parsed.instructions)
          } catch (parseError) {
            setError(errorData || "Erro ao gerar ata")
            if (data.details) {
              setErrorDetails(data.details)
            }
          }
        } else {
          // Regular error
          setError(typeof errorData === "string" ? errorData : data.error || "Erro ao gerar ata")
          if (data.details) {
            setErrorDetails(data.details)
          }
        }

        throw new Error(typeof errorData === "string" ? errorData : data.error || "Erro ao gerar ata")
      }

      setSuccess(true)
      setAtaContent(data.ataContent)
      if (data.docusignEnvelopeId) {
        setDocusignEnvelopeId(data.docusignEnvelopeId)
      }
    } catch (err) {
      console.error("[v0] Error generating ata:", err)
      if (!error) {
        setError(err instanceof Error ? err.message : "Erro desconhecido")
      }
    } finally {
      setLoading(false)
    }
  }

  function handleDownload() {
    if (ataContent) {
      const blob = new Blob([ataContent], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `ata-${meeting.topic.replace(/\s+/g, "-")}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  function handleClose() {
    setSuccess(false)
    setError(null)
    setErrorDetails(null)
    setAtaContent(null)
    setDocusignEnvelopeId(null)
    setTestMode(false)
    setSigners(invitees.length > 0 ? invitees.map((inv) => ({ email: inv.email })) : [{ email: "" }])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerar Ata de Reunião</DialogTitle>
          <DialogDescription>Configure as opções para gerar a ata da reunião</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Reunião</h4>
            <p className="text-sm text-muted-foreground">{meeting.topic}</p>
            <p className="text-xs text-muted-foreground">{new Date(meeting.start_time).toLocaleString("pt-BR")}</p>
          </div>

          {!success && (
            <>
              <div className="flex items-center justify-between space-x-2 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="testMode" className="text-sm font-medium flex items-center gap-2">
                    <TestTube className="h-4 w-4" />
                    Modo de Teste
                  </Label>
                  <p className="text-xs text-muted-foreground">Gerar ata de exemplo sem precisar de gravação do Zoom</p>
                </div>
                <Switch id="testMode" checked={testMode} onCheckedChange={setTestMode} disabled={loading || success} />
              </div>

              <div className="flex items-center justify-between space-x-2 rounded-lg border border-border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="signature" className="text-sm font-medium">
                    Assinatura Digital
                  </Label>
                  <p className="text-xs text-muted-foreground">Enviar documento para assinatura via DocuSign</p>
                </div>
                <Switch
                  id="signature"
                  checked={includeSignature}
                  onCheckedChange={setIncludeSignature}
                  disabled={loading || success}
                />
              </div>

              {includeSignature && (
                <>
                  {!docusignConfigured && missingCredentials.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p className="font-medium">Credenciais do DocuSign faltando</p>
                          <p className="text-sm">
                            Para enviar documentos para assinatura, adicione as seguintes variáveis de ambiente na seção
                            "Vars" da barra lateral:
                          </p>
                          <ul className="text-sm list-disc list-inside space-y-1">
                            {missingCredentials.map((cred) => (
                              <li key={cred}>{cred}</li>
                            ))}
                          </ul>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-3 rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Signatários (Email)</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addSigner} disabled={loading}>
                        <Plus className="h-3 w-3 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {signers.map((signer, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            type="email"
                            placeholder="email@exemplo.com"
                            value={signer.email}
                            onChange={(e) => updateSigner(index, e.target.value)}
                            disabled={loading}
                            className="flex-1"
                          />
                          {signers.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSigner(index)}
                              disabled={loading}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">{error}</p>
                  {errorDetails && (
                    <pre className="text-xs whitespace-pre-wrap font-mono bg-destructive/10 p-2 rounded mt-2">
                      {errorDetails}
                    </pre>
                  )}
                  {consentRequired && consentUrl && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-medium">Passos para conceder consentimento:</p>
                      <ol className="text-sm list-decimal list-inside space-y-1">
                        <li>Clique no botão abaixo para abrir a página de consentimento do DocuSign</li>
                        <li>Faça login com sua conta DocuSign</li>
                        <li>Clique em "Allow Access" para autorizar a aplicação</li>
                        <li>Volte aqui e tente gerar a ata novamente</li>
                      </ol>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(consentUrl, "_blank")}
                        className="mt-2"
                      >
                        Abrir Página de Consentimento do DocuSign
                      </Button>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {success && ataContent && (
            <>
              <Alert className="border-green-500/50 bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-500">
                  <div className="space-y-1">
                    <p>Ata gerada com sucesso!{testMode && " (Modo de Teste)"}</p>
                    {docusignEnvelopeId && <p className="text-sm">Envelope DocuSign criado: {docusignEnvelopeId}</p>}
                  </div>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Conteúdo da Ata</Label>
                <ScrollArea className="h-[300px] w-full rounded-md border border-border bg-muted/30 p-4">
                  <pre className="text-xs whitespace-pre-wrap font-mono">{ataContent}</pre>
                </ScrollArea>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          {success ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Fechar
              </Button>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Baixar Ata
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleGenerate} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {testMode ? "Gerar Ata de Teste" : "Gerar Ata"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
