import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("[v0] DocuSign webhook received:", JSON.stringify(body, null, 2))

    // Extract envelope information
    const envelopeId = body.data?.envelopeId || body.envelopeId
    const status = body.data?.envelopeSummary?.status || body.status
    const event = body.event

    console.log("[v0] Envelope ID:", envelopeId)
    console.log("[v0] Status:", status)
    console.log("[v0] Event:", event)

    // Handle different events
    if (event === "envelope-completed" || status === "completed") {
      console.log("[v0] Envelope completed! All signatures collected.")

      // TODO: Update database or trigger notifications
      // You can add logic here to:
      // 1. Update meeting status in database
      // 2. Send notifications to admin
      // 3. Download signed document
    }

    if (event === "envelope-sent") {
      console.log("[v0] Envelope sent to recipients")
    }

    if (event === "recipient-completed") {
      console.log("[v0] A recipient completed signing")
    }

    // Return success response
    return NextResponse.json({
      message: "Webhook received successfully",
      envelopeId,
      status,
      event,
    })
  } catch (error) {
    console.error("[v0] Error processing webhook:", error)
    return NextResponse.json({ error: "Erro ao processar webhook" }, { status: 500 })
  }
}
