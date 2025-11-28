import { SignJWT, importPKCS8 } from "jose"

function convertPKCS1toPKCS8(pkcs1Key: string): string {
  console.log("[v0] Converting PKCS#1 to PKCS#8 format...")

  // Extract base64 content from PKCS#1 key
  const base64Content = pkcs1Key
    .replace(/-----BEGIN RSA PRIVATE KEY-----/g, "")
    .replace(/-----END RSA PRIVATE KEY-----/g, "")
    .replace(/\s/g, "")
    .trim()

  // Decode base64 to binary
  const binaryString = atob(base64Content)
  const pkcs1Bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    pkcs1Bytes[i] = binaryString.charCodeAt(i)
  }

  // PKCS#8 structure for RSA private key:
  // SEQUENCE {
  //   version INTEGER (0),
  //   algorithm AlgorithmIdentifier {
  //     algorithm OBJECT IDENTIFIER (rsaEncryption: 1.2.840.113549.1.1.1),
  //     parameters NULL
  //   },
  //   privateKey OCTET STRING (containing PKCS#1 key)
  // }

  // RSA algorithm identifier (OID 1.2.840.113549.1.1.1 + NULL)
  const rsaOID = new Uint8Array([
    0x30,
    0x0d, // SEQUENCE length 13
    0x06,
    0x09, // OID length 9
    0x2a,
    0x86,
    0x48,
    0x86,
    0xf7,
    0x0d,
    0x01,
    0x01,
    0x01, // rsaEncryption OID
    0x05,
    0x00, // NULL
  ])

  // Build PKCS#8 structure
  const version = new Uint8Array([0x02, 0x01, 0x00]) // INTEGER 0

  // OCTET STRING wrapper for PKCS#1 key
  const octetStringHeader = new Uint8Array([0x04])
  const pkcs1Length = pkcs1Bytes.length
  let lengthBytes: Uint8Array

  if (pkcs1Length < 128) {
    lengthBytes = new Uint8Array([pkcs1Length])
  } else if (pkcs1Length < 256) {
    lengthBytes = new Uint8Array([0x81, pkcs1Length])
  } else {
    lengthBytes = new Uint8Array([0x82, (pkcs1Length >> 8) & 0xff, pkcs1Length & 0xff])
  }

  const octetString = new Uint8Array(octetStringHeader.length + lengthBytes.length + pkcs1Bytes.length)
  octetString.set(octetStringHeader, 0)
  octetString.set(lengthBytes, octetStringHeader.length)
  octetString.set(pkcs1Bytes, octetStringHeader.length + lengthBytes.length)

  // Combine all parts
  const pkcs8Content = new Uint8Array(version.length + rsaOID.length + octetString.length)
  pkcs8Content.set(version, 0)
  pkcs8Content.set(rsaOID, version.length)
  pkcs8Content.set(octetString, version.length + rsaOID.length)

  // SEQUENCE wrapper
  const sequenceHeader = new Uint8Array([0x30])
  const contentLength = pkcs8Content.length
  let sequenceLengthBytes: Uint8Array

  if (contentLength < 128) {
    sequenceLengthBytes = new Uint8Array([contentLength])
  } else if (contentLength < 256) {
    sequenceLengthBytes = new Uint8Array([0x81, contentLength])
  } else {
    sequenceLengthBytes = new Uint8Array([0x82, (contentLength >> 8) & 0xff, contentLength & 0xff])
  }

  const pkcs8Bytes = new Uint8Array(sequenceHeader.length + sequenceLengthBytes.length + pkcs8Content.length)
  pkcs8Bytes.set(sequenceHeader, 0)
  pkcs8Bytes.set(sequenceLengthBytes, sequenceHeader.length)
  pkcs8Bytes.set(pkcs8Content, sequenceHeader.length + sequenceLengthBytes.length)

  // Encode to base64
  let base64 = ""
  const bytes = pkcs8Bytes
  for (let i = 0; i < bytes.length; i++) {
    base64 += String.fromCharCode(bytes[i])
  }
  const pkcs8Base64 = btoa(base64)

  // Format with line breaks (64 chars per line)
  const formattedBase64 = pkcs8Base64.match(/.{1,64}/g)?.join("\n") || pkcs8Base64

  // Add PKCS#8 PEM headers
  const pkcs8Key = `-----BEGIN PRIVATE KEY-----\n${formattedBase64}\n-----END PRIVATE KEY-----`

  console.log("[v0] Successfully converted PKCS#1 to PKCS#8")
  return pkcs8Key
}

function formatPrivateKey(key: string): string {
  // Remove any extra whitespace and replace literal \n with actual newlines
  let formattedKey = key.trim().replace(/\\n/g, "\n")

  // Check if key has PEM headers
  const hasPKCS8Header = formattedKey.includes("-----BEGIN PRIVATE KEY-----")
  const hasPKCS1Header = formattedKey.includes("-----BEGIN RSA PRIVATE KEY-----")

  if (hasPKCS1Header) {
    console.log("[v0] Private key is in PKCS#1 format (RSA PRIVATE KEY), converting to PKCS#8...")
    try {
      formattedKey = convertPKCS1toPKCS8(formattedKey)
    } catch (error) {
      console.error("[v0] Failed to convert PKCS#1 to PKCS#8:", error)
      throw new Error(
        "Failed to convert PKCS#1 to PKCS#8 format automatically. " +
          "Please convert your key manually using:\n" +
          "openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt -in your_private_key.pem -out private_key_pkcs8.pem\n\n" +
          "Then use the content of private_key_pkcs8.pem in the DOCUSIGN_PRIVATE_KEY environment variable.",
      )
    }
  }

  if (!hasPKCS8Header && !hasPKCS1Header) {
    console.log("[v0] Private key missing PEM headers, formatting base64 content")

    // Remove all whitespace, newlines, and any PEM-like markers
    const base64Content = formattedKey
      .replace(/-----BEGIN.*?-----/g, "")
      .replace(/-----END.*?-----/g, "")
      .replace(/\s/g, "")
      .trim()

    // Validate that we have base64 content
    if (!base64Content || base64Content.length === 0) {
      throw new Error("Private key content is empty after cleaning")
    }

    // Format base64 content with line breaks (64 chars per line is PEM standard)
    const formattedBase64 = base64Content.match(/.{1,64}/g)?.join("\n") || base64Content

    // Wrap with PKCS#8 headers
    formattedKey = `-----BEGIN PRIVATE KEY-----\n${formattedBase64}\n-----END PRIVATE KEY-----`
    console.log("[v0] Private key formatted with PKCS#8 headers")
  }

  // Validate the final format
  if (!formattedKey.includes("-----BEGIN PRIVATE KEY-----") || !formattedKey.includes("-----END PRIVATE KEY-----")) {
    throw new Error("Invalid private key format. Expected PKCS#8 PEM format with proper headers.")
  }

  console.log("[v0] Private key format validated")
  return formattedKey
}

export async function getDocuSignAccessToken(): Promise<string> {
  try {
    const integrationKey = process.env.INTEGRATION_KEY
    const userId = process.env.USER_ID
    const privateKey = process.env.DOCUSIGN_PRIVATE_KEY
    const basePath = process.env.DOCUSIGN_BASE_PATH || "https://demo.docusign.net"

    console.log("[v0] DocuSign credentials check:", {
      integrationKey: integrationKey ? "present" : "missing",
      userId: userId ? "present" : "missing",
      privateKey: privateKey ? "present" : "missing",
      basePath: basePath ? "present" : "missing",
    })

    if (!integrationKey || !userId || !privateKey) {
      const missing = []
      if (!integrationKey) missing.push("INTEGRATION_KEY")
      if (!userId) missing.push("USER_ID")
      if (!privateKey) missing.push("DOCUSIGN_PRIVATE_KEY")
      throw new Error(`Missing DocuSign credentials: ${missing.join(", ")}`)
    }

    console.log("[v0] Generating DocuSign JWT token using jose library")

    let jwt: string
    try {
      // Determine the audience based on environment
      const aud = basePath.includes("demo") ? "account-d.docusign.com" : "account.docusign.com"

      console.log("[v0] JWT parameters:", { iss: integrationKey, sub: userId, aud })

      console.log("[v0] Formatting and validating private key...")
      const formattedPrivateKey = formatPrivateKey(privateKey)

      console.log("[v0] Importing private key with jose...")
      let privateKeyObject
      try {
        privateKeyObject = await importPKCS8(formattedPrivateKey, "RS256")
        console.log("[v0] Private key imported successfully")
      } catch (importError: any) {
        console.error("[v0] Failed to import private key. Error details:", {
          message: importError?.message,
          name: importError?.name,
          stack: importError?.stack,
          fullError: JSON.stringify(importError, Object.getOwnPropertyNames(importError)),
        })
        throw new Error(
          `Failed to import private key: ${importError?.message || importError?.name || "Unknown error"}. ` +
            `Please ensure your DOCUSIGN_PRIVATE_KEY is in PKCS#8 PEM format. ` +
            `It should start with "-----BEGIN PRIVATE KEY-----" (not "-----BEGIN RSA PRIVATE KEY-----"). ` +
            `If you have a PKCS#1 key, convert it using: openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt -in private.key -out private_pkcs8.key`,
        )
      }

      console.log("[v0] Creating and signing JWT...")

      // Create and sign JWT using jose
      jwt = await new SignJWT({
        scope: "signature impersonation",
      })
        .setProtectedHeader({ alg: "RS256", typ: "JWT" })
        .setIssuer(integrationKey)
        .setSubject(userId)
        .setAudience(aud)
        .setIssuedAt()
        .setExpirationTime("1h")
        .sign(privateKeyObject)

      console.log("[v0] JWT token generated successfully")
    } catch (error: any) {
      console.error("[v0] Error generating JWT. Full error details:", {
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      })
      throw error
    }

    console.log("[v0] Exchanging JWT for access token")

    // Exchange JWT for access token
    const authUrl = basePath.includes("demo")
      ? "https://account-d.docusign.com/oauth/token"
      : "https://account.docusign.com/oauth/token"

    console.log("[v0] Auth URL:", authUrl)

    try {
      const response = await fetch(authUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
      })

      console.log("[v0] Token exchange response status:", response.status)

      if (!response.ok) {
        const error = await response.json()
        console.error("[v0] DocuSign JWT auth failed:", error)

        if (error.error === "consent_required") {
          const consentUrl = getConsentUrl(integrationKey, basePath)
          throw new Error(
            JSON.stringify({
              code: "CONSENT_REQUIRED",
              message: "DocuSign application consent required",
              consentUrl,
              instructions:
                "You need to grant consent to the DocuSign application before using JWT authentication. Click the consent URL to authorize the application.",
            }),
          )
        }

        throw new Error(`DocuSign JWT authentication failed (${response.status}): ${JSON.stringify(error)}`)
      }

      const data = await response.json()
      console.log("[v0] DocuSign access token obtained successfully")

      return data.access_token
    } catch (error: any) {
      console.error("[v0] Error exchanging JWT for token:", error)
      throw error
    }
  } catch (error) {
    console.error("[v0] DocuSign authentication error:", error)
    throw error
  }
}

export function getConsentUrl(integrationKey: string, basePath: string): string {
  const authDomain = basePath.includes("demo") ? "account-d.docusign.com" : "account.docusign.com"
  const redirectUri = encodeURIComponent("https://developers.docusign.com/platform/auth/consent")

  return `https://${authDomain}/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=${integrationKey}&redirect_uri=${redirectUri}`
}
