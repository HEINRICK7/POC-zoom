import { NextResponse } from "next/server"
import { getZoomAccessToken } from "@/lib/zoom-auth"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { topic, agenda, start_time, duration, participants } = body

    // Validate required fields
    if (!topic || !start_time || !duration) {
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 })
    }

    // Get Zoom access token
    const accessToken = await getZoomAccessToken()

    // Create meeting on Zoom
    const meetingData = {
      topic,
      type: 2, // Scheduled meeting
      start_time,
      duration,
      agenda: agenda || "",
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: true,
        watermark: false,
        use_pmi: false,
        approval_type: 2, // No registration required
        audio: "both",
        auto_recording: "cloud", // Enable automatic cloud recording
      },
    }

    console.log("[v0] Creating Zoom meeting:", { topic, start_time, duration, participantsCount: participants?.length })

    const response = await fetch("https://api.zoom.us/v2/users/me/meetings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(meetingData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[v0] Zoom API error:", errorData)

      // Handle specific error codes
      if (errorData.code === 4711) {
        return NextResponse.json(
          {
            error: "Permissões insuficientes no Zoom",
            details: "Adicione o scope 'meeting:write:admin' no seu app Zoom",
            needsScopes: true,
          },
          { status: 403 },
        )
      }

      throw new Error(errorData.message || "Erro ao criar reunião no Zoom")
    }

    const meeting = await response.json()

    console.log("[v0] Meeting created successfully:", meeting.id)

    return NextResponse.json({
      success: true,
      meeting: {
        id: meeting.id,
        topic: meeting.topic,
        start_time: meeting.start_time,
        duration: meeting.duration,
        join_url: meeting.join_url,
        start_url: meeting.start_url,
      },
      participants: participants || [],
      note: "Reunião criada! Envie o link de convite manualmente para os participantes.",
      recordingWarning:
        "IMPORTANTE: Para gerar atas automaticamente, certifique-se de que a gravação na nuvem está habilitada nas configurações da sua conta Zoom (Settings > Recording > Cloud Recording).",
    })
  } catch (error) {
    console.error("[v0] Failed to create meeting:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro ao criar reunião",
      },
      { status: 500 },
    )
  }
}
