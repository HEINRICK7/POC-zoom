export interface DocuSignConfig {
  integrationKey: string
  userId: string
  accountId: string
  baseUrl: string
}

export interface EnvelopeStatus {
  envelopeId: string
  status: "created" | "sent" | "delivered" | "signed" | "completed" | "declined" | "voided"
  statusDateTime: string
  documentsUri?: string
}

/**
 * Check if DocuSign envelope has been signed
 */
export async function checkEnvelopeStatus(envelopeId: string): Promise<EnvelopeStatus | null> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3001"

    const response = await fetch(`${backendUrl}/api/docusign/envelope/${envelopeId}/status`)

    if (!response.ok) {
      throw new Error("Failed to fetch envelope status")
    }

    return await response.json()
  } catch (error) {
    console.error("[v0] Error checking envelope status:", error)
    return null
  }
}

/**
 * Download signed document from DocuSign
 */
export async function downloadSignedDocument(envelopeId: string): Promise<Blob | null> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3001"

    const response = await fetch(`${backendUrl}/api/docusign/envelope/${envelopeId}/documents`)

    if (!response.ok) {
      throw new Error("Failed to download signed document")
    }

    return await response.blob()
  } catch (error) {
    console.error("[v0] Error downloading signed document:", error)
    return null
  }
}
