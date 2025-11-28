import { type NextRequest, NextResponse } from "next/server"
import { getZoomAccessToken } from "@/lib/zoom-auth"

export async function GET(request: NextRequest, { params }: { params: { meetingId: string } }) {
  try {
    console.log("[v0] Fetching meeting details for:", params.meetingId)
    const token = await getZoomAccessToken()

    const response = await fetch(`https://api.zoom.us/v2/meetings/${params.meetingId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[v0] Failed to fetch meeting details:", errorData)

      if (errorData.code === 4711) {
        return NextResponse.json(
          {
            error: "Permissão necessária para ver detalhes da reunião",
            needsScopes: true,
            requiredScope: "meeting:read:meeting:admin",
          },
          { status: 403 },
        )
      }

      return NextResponse.json({ error: "Erro ao buscar detalhes da reunião" }, { status: response.status })
    }

    const meeting = await response.json()
    return NextResponse.json(meeting)
  } catch (error) {
    console.error("[v0] Error fetching meeting details:", error)
    return NextResponse.json({ error: "Erro ao buscar detalhes da reunião" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { meetingId: string } }) {
  try {
    const body = await request.json()
    const token = await getZoomAccessToken()

    const response = await fetch(`https://api.zoom.us/v2/meetings/${params.meetingId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[v0] Failed to update meeting:", errorData.message)

      if (errorData.code === 4711) {
        return NextResponse.json(
          {
            error: errorData.message || "Permissão necessária para atualizar reunião",
            needsScopes: true,
            requiredScope: "meeting:update:meeting:admin",
          },
          { status: 403 },
        )
      }

      return NextResponse.json({ error: "Erro ao atualizar reunião" }, { status: response.status })
    }

    if (response.status === 204) {
      console.log("[v0] Meeting updated successfully (204 No Content)")
      return NextResponse.json({ success: true })
    }

    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      const meeting = await response.json()
      return NextResponse.json({ success: true, meeting })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating meeting:", error)
    return NextResponse.json({ error: "Erro ao atualizar reunião" }, { status: 500 })
  }
}
