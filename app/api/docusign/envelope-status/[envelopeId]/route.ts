import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { envelopeId: string } }) {
  try {
    const envelopeId = params.envelopeId

    if (!envelopeId) {
      return NextResponse.json({ error: "Envelope ID é obrigatório" }, { status: 400 })
    }

    const accountId = process.env.ACCOUNT_ID
    const integrationKey = process.env.INTEGRATION_KEY
    const userId = process.env.USER_ID

    if (!accountId || !integrationKey || !userId) {
      return NextResponse.json({ error: "Credenciais do DocuSign não configuradas" }, { status: 500 })
    }

    // Get DocuSign access token (using JWT)
    const tokenResponse = await fetch("https://account-d.docusign.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: integrationKey,
      }),
    })

    if (!tokenResponse.ok) {
      console.error("[v0] Failed to get DocuSign token")
      return NextResponse.json({ error: "Falha ao autenticar com DocuSign" }, { status: 500 })
    }

    const { access_token } = await tokenResponse.json()

    // Get envelope status
    const envelopeResponse = await fetch(
      `https://demo.docusign.net/restapi/v2.1/accounts/${accountId}/envelopes/${envelopeId}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
      },
    )

    if (!envelopeResponse.ok) {
      const errorData = await envelopeResponse.json()
      console.error("[v0] Failed to get envelope status:", errorData)
      return NextResponse.json({ error: "Falha ao buscar status do envelope" }, { status: envelopeResponse.status })
    }

    const envelopeData = await envelopeResponse.json()

    return NextResponse.json({
      envelopeId: envelopeData.envelopeId,
      status: envelopeData.status,
      statusDateTime: envelopeData.statusChangedDateTime,
      emailSubject: envelopeData.emailSubject,
      recipients: envelopeData.recipients,
      completed: envelopeData.status === "completed",
    })
  } catch (error) {
    console.error("[v0] Error checking envelope status:", error)
    return NextResponse.json({ error: "Erro ao verificar status do envelope" }, { status: 500 })
  }
}
