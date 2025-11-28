"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Plus, X, Calendar, Clock, AlertCircle, ExternalLink, Copy, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { fetchWithFallback } from "@/lib/api-config"

interface CreateMeetingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onMeetingCreated?: () => void
}

export function CreateMeetingDialog({ open, onOpenChange, onMeetingCreated }: CreateMeetingDialogProps) {
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [duration, setDuration] = useState("60")
  const [participants, setParticipants] = useState<string[]>([])
  const [emailInput, setEmailInput] = useState("")
  const [scopeError, setScopeError] = useState<string | null>(null)
  const [createdMeeting, setCreatedMeeting] = useState<{
    join_url: string
    topic: string
    start_time: string
    participants: string[]
  } | null>(null)
  const { toast } = useToast()

  const addParticipant = () => {
    const email = emailInput.trim()
    if (!email) return

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido",
        variant: "destructive",
      })
      return
    }

    if (participants.includes(email)) {
      toast({
        title: "Email duplicado",
        description: "Este participante já foi adicionado",
        variant: "destructive",
      })
      return
    }

    setParticipants([...participants, email])
    setEmailInput("")
  }

  const removeParticipant = (email: string) => {
    setParticipants(participants.filter((p) => p !== email))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !date || !time) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha título, data e horário",
        variant: "destructive",
      })
      return
    }

    setScopeError(null)
    setLoading(true)

    try {
      const startTime = new Date(`${date}T${time}`).toISOString()

      const response = await fetchWithFallback("/api/meetings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: title,
          agenda: description,
          start_time: startTime,
          duration: Number.parseInt(duration),
          participants,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.needsScopes) {
          setScopeError(data.details || data.error)
          return
        }
        throw new Error(data.error || "Erro ao criar reunião")
      }

      if (participants.length > 0) {
        try {
          const emailResponse = await fetchWithFallback("/api/send-invitation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              emails: participants,
              meetingDetails: {
                id: data.meeting.id,
                topic: data.meeting.topic,
                start_time: data.meeting.start_time,
                duration: data.meeting.duration,
                agenda: description,
                join_url: data.meeting.join_url,
                password: data.meeting.password,
              },
            }),
          })

          const emailData = await emailResponse.json()
          console.log("[v0] Email invitations prepared:", emailData)
        } catch (emailError) {
          console.error("[v0] Failed to send invitations:", emailError)
          // Don't fail the whole operation if email fails
        }
      }

      setCreatedMeeting({
        join_url: data.meeting.join_url,
        topic: data.meeting.topic,
        start_time: data.meeting.start_time,
        participants: data.participants || [],
      })

      toast({
        title: "Reunião criada!",
        description: `Reunião agendada para ${new Date(startTime).toLocaleString("pt-BR")}`,
      })

      onMeetingCreated?.()
    } catch (error) {
      console.error("[v0] Failed to create meeting:", error)
      toast({
        title: "Erro ao criar reunião",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyJoinUrl = () => {
    if (createdMeeting?.join_url) {
      navigator.clipboard.writeText(createdMeeting.join_url)
      toast({
        title: "Link copiado!",
        description: "O link da reunião foi copiado para a área de transferência",
      })
    }
  }

  const copyInvitation = () => {
    if (!createdMeeting) return

    const message = `Você foi convidado para a reunião: ${createdMeeting.topic}

Data/Hora: ${new Date(createdMeeting.start_time).toLocaleString("pt-BR")}

Link para participar:
${createdMeeting.join_url}

Esta reunião será gravada automaticamente.`

    navigator.clipboard.writeText(message)
    toast({
      title: "Convite copiado!",
      description: "Mensagem de convite copiada. Cole e envie para os participantes.",
    })
  }

  const handleClose = () => {
    setTitle("")
    setDescription("")
    setDate("")
    setTime("")
    setDuration("60")
    setParticipants([])
    setEmailInput("")
    setScopeError(null)
    setCreatedMeeting(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{createdMeeting ? "Reunião Criada com Sucesso!" : "Criar Nova Reunião"}</DialogTitle>
          <DialogDescription>
            {createdMeeting
              ? "Envie o link de convite para os participantes"
              : "Agende uma reunião no Zoom com gravação automática"}
          </DialogDescription>
        </DialogHeader>

        {createdMeeting ? (
          <div className="space-y-4">
            <Alert className="bg-green-500/10 border-green-500/20">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-500">Reunião agendada no Zoom</AlertTitle>
              <AlertDescription>
                <p className="text-sm text-muted-foreground mt-1">
                  {createdMeeting.topic} - {new Date(createdMeeting.start_time).toLocaleString("pt-BR")}
                </p>
              </AlertDescription>
            </Alert>

            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Atenção: Configure a Gravação na Nuvem</AlertTitle>
              <AlertDescription className="space-y-3">
                <p className="text-sm">
                  Para gerar atas automaticamente, você precisa habilitar a gravação na nuvem nas configurações da sua
                  conta Zoom:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-sm ml-2">
                  <li>
                    Acesse{" "}
                    <a
                      href="https://zoom.us/profile/setting"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      zoom.us/profile/setting
                    </a>
                  </li>
                  <li>Vá em "Recording" (Gravação)</li>
                  <li>Ative "Cloud Recording" (Gravação na Nuvem)</li>
                  <li>Ative "Automatic Recording" (Gravação Automática)</li>
                  <li>Selecione "Record in the cloud" (Gravar na nuvem)</li>
                </ol>
                <Button variant="outline" size="sm" asChild className="mt-2 bg-transparent">
                  <a href="https://zoom.us/profile/setting" target="_blank" rel="noopener noreferrer">
                    Abrir Configurações do Zoom
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </a>
                </Button>
              </AlertDescription>
            </Alert>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Importante: Envie o convite manualmente</AlertTitle>
              <AlertDescription className="space-y-3">
                <p className="text-sm">
                  O Zoom não envia convites automaticamente via API. Você precisa enviar o link para os participantes.
                </p>

                {createdMeeting.participants.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Participantes para convidar:</p>
                    <div className="flex flex-wrap gap-2">
                      {createdMeeting.participants.map((email) => (
                        <Badge key={email} variant="secondary">
                          {email}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <Label>Link da Reunião:</Label>
                  <div className="flex gap-2">
                    <Input value={createdMeeting.join_url} readOnly className="font-mono text-xs" />
                    <Button type="button" variant="outline" size="icon" onClick={copyJoinUrl}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button type="button" onClick={copyInvitation} className="w-full bg-transparent" variant="outline">
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Mensagem de Convite Completa
                </Button>
              </AlertDescription>
            </Alert>

            <div className="flex justify-end">
              <Button onClick={handleClose}>Fechar</Button>
            </div>
          </div>
        ) : (
          <>
            {scopeError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Permissões do Zoom Insuficientes</AlertTitle>
                <AlertDescription className="space-y-3">
                  <p>{scopeError}</p>
                  <div className="text-sm space-y-2">
                    <p className="font-medium">Para criar reuniões, adicione estes scopes no Zoom Marketplace:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>
                        <code className="bg-muted px-1 py-0.5 rounded">meeting:write:meeting:admin</code> (criar
                        reuniões)
                      </li>
                    </ul>
                    <Button variant="outline" size="sm" asChild className="mt-2 bg-transparent">
                      <a href="https://marketplace.zoom.us/" target="_blank" rel="noopener noreferrer">
                        Abrir Zoom Marketplace
                        <ExternalLink className="h-3 w-3 ml-2" />
                      </a>
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Título da Reunião <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Ex: Reunião de Planejamento Q1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição / Agenda</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva os tópicos que serão discutidos..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">
                    Data <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      disabled={loading}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">
                    Horário <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="time"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      disabled={loading}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duração (minutos)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="15"
                  step="15"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Participantes</Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addParticipant()
                      }
                    }}
                    disabled={loading}
                  />
                  <Button type="button" onClick={addParticipant} disabled={loading} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {participants.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {participants.map((email) => (
                      <Badge key={email} variant="secondary" className="gap-1">
                        {email}
                        <button
                          type="button"
                          onClick={() => removeParticipant(email)}
                          className="ml-1 hover:text-destructive"
                          disabled={loading}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Agendar no Zoom"
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
