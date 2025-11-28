import { getZoomAccessToken } from "@/lib/zoom-auth"

export async function GET() {
  try {
    const accessToken = await getZoomAccessToken()

    if (!accessToken) {
      return Response.json(
        {
          error: "Failed to authenticate with Zoom",
          meetings: [],
        },
        { status: 401 },
      )
    }

    const meetings: any[] = []
    let scopeWarning: string | null = null

    // Try to fetch scheduled meetings
    try {
      const scheduledResponse = await fetch("https://api.zoom.us/v2/users/me/meetings?type=scheduled&page_size=50", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (scheduledResponse.ok) {
        const scheduledData = await scheduledResponse.json()
        const scheduled =
          scheduledData.meetings?.map((meeting: any) => ({
            id: meeting.id,
            topic: meeting.topic,
            start_time: meeting.start_time,
            duration: meeting.duration,
            participants_count: 0,
            has_recording: false,
            has_transcript: false,
            status: "scheduled",
            join_url: meeting.join_url,
            agenda: meeting.agenda,
          })) || []
        meetings.push(...scheduled)
        console.log("[v0] Fetched", scheduled.length, "scheduled meetings")
      } else if (scheduledResponse.status === 400) {
        const errorData = await scheduledResponse.json()
        if (errorData.code === 4711) {
          scopeWarning =
            "Para ver reuniões agendadas, adicione o scope 'meeting:read:list_meetings:admin' no Zoom Marketplace."
          console.log("[v0] Missing scope for scheduled meetings:", errorData.message)
        }
      }
    } catch (error) {
      console.log("[v0] Error fetching scheduled meetings:", error)
    }

    // Try to fetch recordings
    try {
      const recordingsResponse = await fetch("https://api.zoom.us/v2/users/me/recordings", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (recordingsResponse.ok) {
        const recordingsData = await recordingsResponse.json()
        const recordings =
          recordingsData.meetings?.map((meeting: any) => ({
            id: meeting.uuid,
            topic: meeting.topic,
            start_time: meeting.start_time,
            duration: meeting.duration,
            participants_count: meeting.participant_count || 0,
            has_recording: true,
            has_transcript:
              meeting.recording_files?.some(
                (file: any) => file.file_type === "TRANSCRIPT" || file.recording_type === "audio_transcript",
              ) || false,
            status: "completed",
          })) || []
        meetings.push(...recordings)
        console.log("[v0] Fetched", recordings.length, "recordings")
      } else if (recordingsResponse.status === 400) {
        const errorData = await recordingsResponse.json()
        if (errorData.code === 4711) {
          const recordingScopeWarning =
            "Para ver gravações, adicione o scope 'cloud_recording:read:list_user_recordings:admin' no Zoom Marketplace."
          scopeWarning = scopeWarning ? `${scopeWarning} ${recordingScopeWarning}` : recordingScopeWarning
          console.log("[v0] Missing scope for recordings:", errorData.message)
        }
      }
    } catch (error) {
      console.log("[v0] Error fetching recordings:", error)
    }

    // Sort by start time (most recent first)
    meetings.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())

    console.log("[v0] Total meetings fetched:", meetings.length)

    return Response.json({
      meetings,
      warning: scopeWarning,
    })
  } catch (error) {
    console.log("[v0] Error fetching meetings:", error)
    return Response.json(
      {
        error: "Internal server error",
        meetings: [],
      },
      { status: 500 },
    )
  }
}
