"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Plus, X, AlertCircle, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { fetchWithFallback } from "@/lib/api-config"

interface AddParticipantsDialogProps {
  meetingId: string
  currentInvitees: Array<{ email: string }>
  open: boolean
  onOpenChange: (open: boolean) => void
  onParticipantsAdded: () => void
}

export function AddParticipantsDialog({
  meetingId,
  currentInvitees,
  open,
  onOpenChange,
  onParticipantsAdded,
}: AddParticipantsDialogProps) {
  const [emails, setEmails] = useState<string[]>([""])
  const [loading, setLoading] = useState(false)
  const [scopeError, setScopeError] = useState(false)
  const { toast } = useToast()

  const addEmailField = () => {
    setEmails([...emails, ""])
  }

  const removeEmailField = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index))
  }

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails]
    newEmails[index] = value
    setEmails(newEmails)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setScopeError(false)

    try {
      const validEmails = emails.filter((email) => email.trim() && email.includes("@"))

      if (validEmails.length === 0) {
        toast({
          title: "Erro",
          description: "Adicione pelo menos um email válido",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const existingInvitees = Array.isArray(currentInvitees) ? currentInvitees : []
      const allInvitees = [...existingInvitees, ...validEmails.map((email) => ({ email: email.trim() }))]

      const response = await fetchWithFallback(`/api/meeting/${meetingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            meeting_invitees: allInvitees,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.needsScopes) {
          setScopeError(true)
          return
        }
        throw new Error(data.error || "Erro ao adicionar participantes")
      }

      if (validEmails.length > 0 && data.meeting) {
        try {
          const emailResponse = await fetchWithFallback("/api/send-invitation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              emails: validEmails,
              meetingDetails: {
                id: data.meeting.id,
                topic: data.meeting.topic,
                start_time: data.meeting.start_time,
                duration: data.meeting.duration,
                agenda: data.meeting.agenda,
                join_url: data.meeting.join_url,
                password: data.meeting.password,
              },
            }),
          })

          const emailData = await emailResponse.json()
          console.log("[v0] Email invitations sent to new participants:", emailData)
        } catch (emailError) {
          console.error("[v0] Failed to send invitations:", emailError)
        }
      }

      toast({
        title: "Sucesso!",
        description: `${validEmails.length} participante(s) adicionado(s) e notificado(s)`,
      })

      onParticipantsAdded()
      onOpenChange(false)
      setEmails([""])
    } catch (error) {
      console.error("[v0] Error adding participants:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao adicionar participantes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Participantes</DialogTitle>
          <DialogDescription>Adicione novos participantes à reunião</DialogDescription>
        </DialogHeader>

        {scopeError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Permissão Necessária</AlertTitle>
            <AlertDescription className="space-y-3">
              <p className="text-sm">
                Para adicionar participantes, você precisa adicionar o scope{" "}
                <code className="bg-destructive/20 px-1 rounded">meeting:update:meeting:admin</code> no Zoom
                Marketplace.
              </p>
              <div className="text-sm space-y-2 bg-destructive/10 p-3 rounded">
                <p className="font-semibold">Se você já adicionou o scope:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Vá para o Zoom Marketplace</li>
                  <li>Abra seu app Server-to-Server OAuth</li>
                  <li>Clique em "Deactivate" (desativar)</li>
                  <li>Clique em "Activate" (ativar) novamente</li>
                  <li>Aguarde alguns segundos e tente novamente</li>
                </ol>
              </div>
              <Button variant="outline" size="sm" asChild className="bg-transparent">
                <a href="https://marketplace.zoom.us/user/build" target="_blank" rel="noopener noreferrer">
                  Abrir Zoom Marketplace
                  <ExternalLink className="h-3 w-3 ml-2" />
                </a>
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              {emails.map((email, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor={`email-${index}`} className="sr-only">
                      Email {index + 1}
                    </Label>
                    <Input
                      id={`email-${index}`}
                      type="email"
                      placeholder="email@exemplo.com"
                      value={email}
                      onChange={(e) => updateEmail(index, e.target.value)}
                      required
                    />
                  </div>
                  {emails.length > 1 && (
                    <Button type="button" variant="outline" size="icon" onClick={() => removeEmailField(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button type="button" variant="outline" onClick={addEmailField} className="w-full bg-transparent">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar outro email
            </Button>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  "Adicionar"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
