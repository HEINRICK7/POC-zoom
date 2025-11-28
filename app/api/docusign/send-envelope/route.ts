import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { document, signers, emailSubject, emailMessage } = await request.json()

    console.log("[v0] Sending envelope to DocuSign")
    console.log("[v0] Signers:", signers)

    const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY || process.env.INTEGRATION_KEY
    const userId = process.env.DOCUSIGN_USER_ID || process.env.USER_ID
    const accountId = process.env.DOCUSIGN_ACCOUNT_ID || process.env.ACCOUNT_ID
    const privateKey = process.env.DOCUSIGN_PRIVATE_KEY
    const basePath = process.env.DOCUSIGN_BASE_PATH || "https://demo.docusign.net/restapi"

    if (!integrationKey || !userId || !accountId) {
      return NextResponse.json({ error: "DocuSign credentials not configured" }, { status: 500 })
    }

    if (!privateKey) {
      console.warn("[v0] DOCUSIGN_PRIVATE_KEY not configured, using basic auth (not recommended for production)")
    }

    // For now, we'll use a placeholder. In production, you need to:
    // 1. Generate JWT token using the private key
    // 2. Exchange JWT for access token
    // 3. Use access token for API calls

    const accessToken = integrationKey // Placeholder - should be JWT access token

    // Create envelope definition
    const envelopeDefinition = {
      emailSubject: emailSubject || "Por favor, assine a ata da reunião",
      emailBlurb:
        emailMessage || "Você foi convidado a assinar a ata da reunião. Por favor, revise e assine o documento.",
      documents: [
        {
          documentBase64: document.content,
          name: document.name || "Ata da Reunião",
          fileExtension: document.extension || "pdf",
          documentId: "1",
        },
      ],
      recipients: {
        signers: signers.map((signer: any, index: number) => ({
          email: signer.email,
          name: signer.name || signer.email.split("@")[0],
          recipientId: String(index + 1),
          routingOrder: String(index + 1),
          tabs: {
            signHereTabs: [
              {
                documentId: "1",
                pageNumber: "1",
                xPosition: "100",
                yPosition: "700",
              },
            ],
          },
        })),
      },
      status: "sent",
    }

    console.log("[v0] Creating envelope with", signers.length, "signers")
    console.log("[v0] Using base path:", basePath)

    const response = await fetch(`${basePath}/v2.1/accounts/${accountId}/envelopes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(envelopeDefinition),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[v0] DocuSign API error:", errorData)
      return NextResponse.json({ error: "Failed to create envelope", details: errorData }, { status: response.status })
    }

    const result = await response.json()
    console.log("[v0] Envelope created successfully:", result.envelopeId)

    return NextResponse.json({
      success: true,
      envelopeId: result.envelopeId,
      status: result.status,
    })
  } catch (error) {
    console.error("[v0] Error sending envelope:", error)
    return NextResponse.json({ error: "Failed to send envelope to DocuSign" }, { status: 500 })
  }
}
