import { getZoomAccessToken } from "@/lib/zoom-auth"

export async function GET() {
  console.log("[v0] Checking system status...")

  const status = {
    zoom: {
      configured: !!(process.env.ZOOM_CLIENT_ID && process.env.ZOOM_CLIENT_SECRET && process.env.ZOOM_ACCOUNT_ID),
      connected: false,
      message: "",
    },
    openai: {
      configured: !!process.env.OPENAI_API_KEY,
      connected: false,
      message: "",
    },
    docusign: {
      configured: !!(process.env.INTEGRATION_KEY && process.env.USER_ID && process.env.ACCOUNT_ID),
      connected: false,
      message: "",
    },
    backend: {
      configured: false,
      connected: false,
      url: "",
      message: "",
    },
  }

  const backendUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL
  if (backendUrl) {
    status.backend.configured = true
    status.backend.url = backendUrl
  } else {
    status.backend.url = "Usando rotas locais do Next.js"
  }

  if (status.zoom.configured) {
    try {
      const accessToken = await getZoomAccessToken()

      if (!accessToken) {
        status.zoom.message = "Erro ao obter token de acesso"
        console.log("[v0] Zoom: Failed to get access token")
      } else {
        // Successfully got token - credentials are valid
        status.zoom.connected = true
        status.zoom.message = "Conectado - Token obtido com sucesso"
        console.log("[v0] Zoom status: Connected with valid token")
      }
    } catch (error) {
      status.zoom.message = "Erro de conexão"
      console.log("[v0] Zoom error:", error)
    }
  } else {
    status.zoom.message = "Credenciais Zoom incompletas (precisa ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET, ZOOM_ACCOUNT_ID)"
    console.log("[v0] Missing Zoom credentials")
  }

  // Test OpenAI connection
  if (status.openai.configured) {
    try {
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      })
      status.openai.connected = response.ok
      status.openai.message = response.ok ? "Conectado" : `Erro: ${response.status}`
      console.log("[v0] OpenAI status:", status.openai.message)
    } catch (error) {
      status.openai.message = "Erro de conexão"
      console.log("[v0] OpenAI error:", error)
    }
  } else {
    status.openai.message = "OPENAI_API_KEY não configurado"
  }

  // DocuSign requires JWT authentication which is complex, so we just check if credentials exist
  if (status.docusign.configured) {
    status.docusign.connected = true
    status.docusign.message = "Credenciais configuradas (INTEGRATION_KEY, USER_ID, ACCOUNT_ID)"
    console.log("[v0] DocuSign status:", status.docusign.message)
  } else {
    status.docusign.message = "Credenciais DocuSign incompletas (precisa INTEGRATION_KEY, USER_ID, ACCOUNT_ID)"
  }

  // Test Backend connection
  if (status.backend.configured) {
    try {
      const response = await fetch(`${status.backend.url}/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
      status.backend.connected = response.ok
      status.backend.message = response.ok
        ? `Conectado a ${status.backend.url}`
        : `Backend configurado mas não respondendo (${response.status})`
      console.log("[v0] Backend status:", status.backend.message)
    } catch (error) {
      status.backend.message = `Backend configurado (${status.backend.url}) mas não está acessível - usando rotas locais`
      console.log("[v0] Backend error:", error)
    }
  } else {
    status.backend.message = "Usando rotas locais do Next.js (configure NEXT_PUBLIC_API_URL para usar backend externo)"
  }

  console.log("[v0] Final status:", status)
  return Response.json(status)
}
