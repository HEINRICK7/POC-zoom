export async function GET() {
  console.log("[v0] Checking system status...")

  // Check Zoom credentials
  const zoomAccountId = process.env.ZOOM_ACCOUNT_ID
  const zoomClientId = process.env.ZOOM_CLIENT_ID
  const zoomClientSecret = process.env.ZOOM_CLIENT_SECRET

  const zoomStatus = {
    configured: !!(zoomAccountId && zoomClientId && zoomClientSecret),
    connected: false,
    message: "",
  }

  if (zoomStatus.configured) {
    try {
      const { getZoomAccessToken } = await import("@/lib/zoom-auth")
      await getZoomAccessToken()
      zoomStatus.connected = true
      zoomStatus.message = "Conectado - Token obtido com sucesso"
    } catch (error) {
      zoomStatus.message = error instanceof Error ? error.message : "Erro ao conectar"
    }
  } else {
    zoomStatus.message = "Credenciais não configuradas"
  }

  // Check OpenAI credentials
  const openaiKey = process.env.OPENAI_API_KEY
  const openaiStatus = {
    configured: !!openaiKey,
    connected: !!openaiKey,
    message: openaiKey ? "Conectado" : "OPENAI_API_KEY não configurado",
  }

  const docusignIntegrationKey = process.env.INTEGRATION_KEY
  const docusignUserId = process.env.USER_ID
  const docusignAccountId = process.env.ACCOUNT_ID
  const docusignPrivateKey = process.env.DOCUSIGN_PRIVATE_KEY
  const docusignBasePath = process.env.DOCUSIGN_BASE_PATH

  const docusignConfigured = !!(docusignIntegrationKey && docusignUserId && docusignAccountId && docusignPrivateKey)

  const docusignStatus = {
    configured: docusignConfigured,
    connected: docusignConfigured,
    message: docusignConfigured
      ? `Credenciais configuradas (INTEGRATION_KEY, USER_ID, ACCOUNT_ID, DOCUSIGN_PRIVATE_KEY${docusignBasePath ? ", DOCUSIGN_BASE_PATH" : ""})`
      : (() => {
          const missing = []
          if (!docusignIntegrationKey) missing.push("INTEGRATION_KEY")
          if (!docusignUserId) missing.push("USER_ID")
          if (!docusignAccountId) missing.push("ACCOUNT_ID")
          if (!docusignPrivateKey) missing.push("DOCUSIGN_PRIVATE_KEY")
          return `Credenciais faltando: ${missing.join(", ")}`
        })(),
  }

  // Check Backend API
  const backendUrl = process.env.BACKEND_API_URL
  const backendStatus = {
    configured: !!backendUrl,
    connected: !!backendUrl,
    url: backendUrl || "",
    message: backendUrl ? "Conectado" : "BACKEND_API_URL não configurado",
  }

  console.log("[v0] Final status:", {
    zoom: zoomStatus,
    openai: openaiStatus,
    docusign: docusignStatus,
    backend: backendStatus,
  })

  return Response.json({
    zoom: zoomStatus,
    openai: openaiStatus,
    docusign: docusignStatus,
    backend: backendStatus,
  })
}
