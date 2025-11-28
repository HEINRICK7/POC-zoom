// Zoom Server-to-Server OAuth helper
export async function getZoomAccessToken(): Promise<string | null> {
  const clientId = process.env.ZOOM_CLIENT_ID
  const clientSecret = process.env.ZOOM_CLIENT_SECRET
  const accountId = process.env.ZOOM_ACCOUNT_ID

  if (!clientId || !clientSecret || !accountId) {
    console.log("[v0] Missing Zoom credentials")
    return null
  }

  try {
    const trimmedClientId = clientId.trim()
    const trimmedClientSecret = clientSecret.trim()
    const trimmedAccountId = accountId.trim()

    const credentials = Buffer.from(`${trimmedClientId}:${trimmedClientSecret}`).toString("base64")

    const grantTypes = ["account_credentials", "client_credentials"]

    for (const grantType of grantTypes) {
      const body = new URLSearchParams({
        grant_type: grantType,
        account_id: trimmedAccountId,
      })

      console.log(`[v0] Trying Zoom OAuth with grant_type: ${grantType}`)

      const response = await fetch("https://zoom.us/oauth/token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`[v0] Zoom OAuth success with grant_type: ${grantType}`)
        return data.access_token
      }

      const errorText = await response.text()
      console.log(`[v0] Zoom OAuth failed with ${grantType}:`, response.status, errorText)
    }

    console.log("[v0] ❌ Ambos os grant types falhou. Verifique:")
    console.log("[v0] 1. O app é do tipo 'Server-to-Server OAuth' no Zoom Marketplace")
    console.log("[v0] 2. O app está ATIVADO (não apenas criado)")
    console.log("[v0] 3. As credenciais (Client ID, Secret, Account ID) estão corretas")
    console.log("[v0] 4. O Account ID é da conta correta (não do usuário)")

    return null
  } catch (error) {
    console.log("[v0] Zoom token fetch error:", error)
    return null
  }
}
