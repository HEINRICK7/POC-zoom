"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  FileText,
  Loader2,
  Calendar,
  Clock,
  Users,
  AlertCircle,
  ExternalLink,
  Plus,
  MessageCircle,
  Copy,
  LinkIcon,
} from "lucide-react"
import { GenerateAtaDialog } from "@/components/generate-ata-dialog"
import { CreateMeetingDialog } from "@/components/create-meeting-dialog"
import { AddParticipantsDialog } from "@/components/add-participants-dialog"
import { useToast } from "@/hooks/use-toast"
import { fetchWithFallback } from "@/lib/api-config"

interface Meeting {
  id: string
  topic: string
  start_time: string
  duration: number
  participants_count?: number
  has_recording: boolean
  has_transcript: boolean
  status?: string
}

export function MeetingsList() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [needsScopes, setNeedsScopes] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [meetingDetails, setMeetingDetails] = useState<any>(null)

  const refreshMeetings = async () => {
    setLoading(true)
    try {
      console.log("[v0] Fetching meetings...")
      const response = await fetchWithFallback("/api/meetings/list")

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Erro ao buscar reuniões")
        setNeedsScopes(data.needsScopes || false)
        setMeetings([])
        setWarning(null)
        return
      }

      const data = await response.json()
      setMeetings(data.meetings || [])
      setError(null)
      setNeedsScopes(false)
      setWarning(data.warning || null)
    } catch (error) {
      console.error("[v0] Failed to fetch meetings:", error)
      setError("Erro ao conectar com o servidor")
      setWarning(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshMeetings()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reuniões Disponíveis</CardTitle>
          <CardDescription>Carregando suas reuniões do Zoom...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reuniões Disponíveis</CardTitle>
          <CardDescription>Erro ao carregar reuniões</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro de Permissão</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>{error}</p>
              {needsScopes && (
                <div className="space-y-2">
                  <p className="font-medium">Para corrigir:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Acesse o Zoom Marketplace</li>
                    <li>Abra seu app Server-to-Server OAuth</li>
                    <li>Vá em "Scopes"</li>
                    <li>
                      Adicione: <code className="bg-destructive/20 px-1 rounded">recording:read:admin</code>
                    </li>
                    <li>Salve e recarregue esta página</li>
                  </ol>
                  <Button variant="outline" size="sm" asChild className="mt-2 bg-transparent">
                    <a href="https://marketplace.zoom.us/user/build" target="_blank" rel="noopener noreferrer">
                      Abrir Zoom Marketplace
                      <ExternalLink className="h-3 w-3 ml-2" />
                    </a>
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (meetings.length === 0) {
    return (
      <>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Reuniões Disponíveis</CardTitle>
                <CardDescription>Nenhuma reunião encontrada</CardDescription>
              </div>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Reunião
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {warning && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Permissão Necessária</AlertTitle>
                <AlertDescription className="space-y-3">
                  <p className="text-sm">{warning}</p>
                  <div className="space-y-2">
                    <p className="font-medium text-sm">Para adicionar o scope:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Acesse o Zoom Marketplace</li>
                      <li>Abra seu app Server-to-Server OAuth</li>
                      <li>Vá em "Scopes"</li>
                      <li>
                        Adicione: <code className="bg-muted px-1 rounded">meeting:read:list_meetings:admin</code>
                      </li>
                      <li>Salve e clique em "Atualizar" abaixo</li>
                    </ol>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" asChild>
                        <a href="https://marketplace.zoom.us/user/build" target="_blank" rel="noopener noreferrer">
                          Abrir Zoom Marketplace
                          <ExternalLink className="h-3 w-3 ml-2" />
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" onClick={refreshMeetings}>
                        Atualizar
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground max-w-sm">
                {warning
                  ? "Adicione as permissões necessárias para ver suas reuniões agendadas."
                  : "Não há reuniões disponíveis. Crie uma nova reunião ou certifique-se de que suas reuniões do Zoom estão sendo gravadas."}
              </p>
            </div>
          </CardContent>
        </Card>

        <CreateMeetingDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onMeetingCreated={refreshMeetings}
        />
      </>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Reuniões Disponíveis</CardTitle>
              <CardDescription>
                {loading
                  ? "Carregando suas reuniões do Zoom..."
                  : meetings.length === 0
                    ? "Nenhuma reunião encontrada"
                    : `${meetings.length} ${meetings.length === 1 ? "reunião encontrada" : "reuniões encontradas"}`}
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Reunião
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {warning && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Aviso</AlertTitle>
              <AlertDescription className="space-y-2">
                <p className="text-sm">{warning}</p>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://marketplace.zoom.us/user/build" target="_blank" rel="noopener noreferrer">
                    Configurar Scopes
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </a>
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            {meetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onGenerate={() => setSelectedMeeting(meeting)}
                setMeetingDetails={setMeetingDetails}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <CreateMeetingDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onMeetingCreated={refreshMeetings}
      />

      {selectedMeeting && (
        <GenerateAtaDialog
          meeting={selectedMeeting}
          invitees={meetingDetails?.settings?.meeting_invitees || []}
          open={!!selectedMeeting}
          onOpenChange={(open) => !open && setSelectedMeeting(null)}
        />
      )}
    </>
  )
}

function MeetingCard({
  meeting,
  onGenerate,
  setMeetingDetails,
}: { meeting: Meeting; onGenerate: () => void; setMeetingDetails: (details: any) => void }) {
  const [showDetails, setShowDetails] = useState(false)
  const [showAddParticipants, setShowAddParticipants] = useState(false)
  const [localMeetingDetails, setLocalMeetingDetails] = useState<any>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const { toast } = useToast()

  const date = new Date(meeting.start_time)
  const formattedDate = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
  const formattedTime = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })

  const isPastMeeting = date < new Date()
  const canAddParticipants = !isPastMeeting && meeting.status !== "finished"

  const fetchMeetingDetails = async () => {
    setLoadingDetails(true)
    try {
      const response = await fetchWithFallback(`/api/meeting/${meeting.id}`)
      if (response.ok) {
        const data = await response.json()
        setLocalMeetingDetails(data)
        setMeetingDetails(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching meeting details:", error)
    } finally {
      setLoadingDetails(false)
    }
  }

  const toggleDetails = () => {
    if (!showDetails && !localMeetingDetails) {
      fetchMeetingDetails()
    }
    setShowDetails(!showDetails)
  }

  const handleGenerateClick = async () => {
    if (!localMeetingDetails) {
      await fetchMeetingDetails()
    }
    onGenerate()
  }

  const invitees = localMeetingDetails?.settings?.meeting_invitees || []

  const copyInvitation = () => {
    const invitationText = `Você foi convidado para a reunião: ${meeting.topic}

📅 Data: ${formattedDate}
🕐 Horário: ${formattedTime}
⏱️ Duração: ${meeting.duration} minutos

Link para participar:
${localMeetingDetails?.join_url || "Carregando..."}

Por favor, confirme sua presença.`

    navigator.clipboard.writeText(invitationText)
    toast({
      title: "Convite copiado!",
      description: "O convite foi copiado para a área de transferência.",
    })
  }

  const shareViaWhatsApp = () => {
    const invitationText = `Você foi convidado para a reunião: ${meeting.topic}

📅 Data: ${formattedDate}
🕐 Horário: ${formattedTime}
⏱️ Duração: ${meeting.duration} minutos

Link para participar:
${localMeetingDetails?.join_url || ""}

Por favor, confirme sua presença.`

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(invitationText)}`
    window.open(whatsappUrl, "_blank")
  }

  const copyJoinUrl = () => {
    if (localMeetingDetails?.join_url) {
      navigator.clipboard.writeText(localMeetingDetails.join_url)
      toast({
        title: "Link copiado!",
        description: "O link da reunião foi copiado.",
      })
    }
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-card p-4 hover:bg-accent/50 transition-colors space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <h3 className="font-semibold text-lg">{meeting.topic}</h3>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{formattedTime}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{invitees.length || 0} participante(s)</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {meeting.has_recording && <Badge variant="secondary">Gravada</Badge>}
            {meeting.has_transcript && <Badge variant="secondary">Transcrita</Badge>}
            {!isPastMeeting && <Badge>Agendada</Badge>}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={toggleDetails} variant="outline" size="sm" disabled={loadingDetails}>
            {loadingDetails ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : showDetails ? (
              "Ocultar Detalhes"
            ) : (
              "Ver Detalhes"
            )}
          </Button>
          {canAddParticipants && (
            <Button onClick={() => setShowAddParticipants(true)} variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Adicionar Participantes
            </Button>
          )}
          <Button onClick={handleGenerateClick} size="sm" disabled={loadingDetails}>
            {loadingDetails ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Gerar Ata
              </>
            )}
          </Button>
        </div>

        {showDetails && localMeetingDetails && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Informações da Reunião</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Duração:</span>
                  <span>{meeting.duration} minutos</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={isPastMeeting ? "secondary" : "default"}>
                    {isPastMeeting ? "Finalizada" : "Agendada"}
                  </Badge>
                </div>
              </div>
            </div>

            {invitees.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Participantes Convidados</h4>
                <ul className="space-y-1 text-sm">
                  {invitees.map((invitee: any, index: number) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      {invitee.email}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Compartilhar Convite</p>
                  <p className="text-xs text-muted-foreground">
                    O Zoom não envia emails automaticamente via API. Compartilhe o convite manualmente com os
                    participantes.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={shareViaWhatsApp}
                  variant="default"
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Enviar via WhatsApp
                </Button>
                <Button onClick={copyInvitation} variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Convite
                </Button>
                <Button onClick={copyJoinUrl} variant="outline" size="sm">
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Copiar Link
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showAddParticipants && (
        <AddParticipantsDialog
          meetingId={meeting.id}
          currentInvitees={invitees}
          open={showAddParticipants}
          onOpenChange={setShowAddParticipants}
          onParticipantsAdded={() => {
            fetchMeetingDetails()
          }}
        />
      )}
    </>
  )
}
