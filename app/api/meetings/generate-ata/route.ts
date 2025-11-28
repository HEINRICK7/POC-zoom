import { getZoomAccessToken } from "@/lib/zoom-auth"
import { getDocuSignAccessToken } from "@/lib/docusign-auth"
import { jsPDF } from "jspdf"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { meetingId, includeSignature, testMode, signers } = body

    console.log("[v0] Generating ata for meeting:", meetingId, "testMode:", testMode)

    if (!process.env.OPENAI_API_KEY) {
      console.log("[v0] OpenAI API key not configured")
      return Response.json(
        {
          error: "OpenAI não configurado",
          details: "A chave de API do OpenAI não está configurada. Adicione OPENAI_API_KEY nas variáveis de ambiente.",
        },
        { status: 500 },
      )
    }

    async function callOpenAI(messages: Array<{ role: string; content: string }>) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`)
      }

      return await response.json()
    }

    async function generatePDFBase64(content: string, title: string): Promise<string> {
      try {
        // Create a new PDF document
        const doc = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        })

        // Set font
        doc.setFont("helvetica")

        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("ATA DA REUNIÃO", 105, 15, { align: "center" })

        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        const titleLines = doc.splitTextToSize(title, 170)
        doc.text(titleLines, 105, 22, { align: "center" })

        doc.setFontSize(9)
        const date = new Date().toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
        doc.text(date, 105, 30, { align: "center" })

        doc.setFontSize(9)
        doc.setFont("helvetica", "normal")

        // Split content into lines that fit the page width
        const contentLines = doc.splitTextToSize(content, 180)

        let yPosition = 38
        const lineHeight = 5
        const pageHeight = 297
        const marginBottom = 15

        for (let i = 0; i < contentLines.length; i++) {
          // Stop adding content if we reach the bottom margin
          if (yPosition + lineHeight > pageHeight - marginBottom) {
            console.log("[v0] Content truncated to fit single page")
            break
          }

          doc.text(contentLines[i], 15, yPosition)
          yPosition += lineHeight
        }

        // Convert PDF to base64
        const pdfBase64 = doc.output("datauristring")
        // Remove the data URI prefix to get just the base64 content
        const base64Content = pdfBase64.split(",")[1]

        console.log("[v0] PDF generated successfully, size:", base64Content.length, "bytes")

        return base64Content
      } catch (error) {
        console.error("[v0] Error generating PDF:", error)
        throw new Error("Failed to generate PDF")
      }
    }

    async function sendToDocuSign(pdfBase64: string, documentName: string, emailSubject: string) {
      if (!signers || signers.length === 0) {
        console.log("[v0] No signers provided, skipping DocuSign")
        return null
      }

      console.log("[v0] Sending envelope to DocuSign with", signers.length, "signers")

      const accountId = process.env.DOCUSIGN_ACCOUNT_ID || process.env.ACCOUNT_ID
      let basePath = process.env.DOCUSIGN_BASE_PATH || "https://demo.docusign.net"

      // Remove trailing slash if present
      basePath = basePath.replace(/\/$/, "")
      // Add /restapi if not already present
      if (!basePath.endsWith("/restapi")) {
        basePath = `${basePath}/restapi`
      }
      console.log("[v0] DocuSign API base path:", basePath)

      if (!accountId) {
        console.error("[v0] DocuSign account ID not configured")
        return null
      }

      let accessToken: string
      try {
        accessToken = await getDocuSignAccessToken()
      } catch (error: any) {
        console.error("[v0] Failed to get DocuSign access token:", error)

        if (error.message && error.message.includes("CONSENT_REQUIRED")) {
          try {
            const errorData = JSON.parse(error.message)
            throw new Error(
              JSON.stringify({
                code: "CONSENT_REQUIRED",
                message: errorData.message,
                consentUrl: errorData.consentUrl,
                instructions: errorData.instructions,
              }),
            )
          } catch (parseError) {
            // If parsing fails, throw original error
            throw error
          }
        }

        throw error
      }

      const envelopeDefinition = {
        emailSubject: emailSubject,
        emailBlurb: "Por favor, revise e assine a ata da reunião anexada.",
        documents: [
          {
            documentBase64: pdfBase64,
            name: documentName,
            fileExtension: "pdf",
            documentId: "1",
          },
        ],
        recipients: {
          signers: signers.map((signer: any, index: number) => ({
            email: signer.email,
            name: signer.email.split("@")[0], // Use email prefix as name
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

      try {
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
          return null
        }

        const result = await response.json()
        console.log("[v0] DocuSign envelope created:", result.envelopeId)
        return result
      } catch (error) {
        console.error("[v0] Error sending to DocuSign:", error)
        return null
      }
    }

    if (testMode) {
      console.log("[v0] Using test mode - generating sample ATA")

      const sampleTranscript = `
Reunião de Planejamento - Projeto Sistema de Atas

Participantes:
- João Silva (Gerente de Projeto)
- Maria Santos (Desenvolvedora)
- Pedro Costa (Designer)

João: Bom dia a todos. Vamos começar nossa reunião de planejamento do sistema de atas automatizadas.

Maria: Bom dia! Estou animada para discutir as funcionalidades.

Pedro: Bom dia pessoal!

João: Primeiro ponto da pauta: integração com Zoom. Maria, como está o progresso?

Maria: A integração está funcionando bem. Conseguimos listar reuniões, criar novas reuniões e buscar gravações. O próximo passo é implementar a geração automática de atas usando IA.

João: Excelente! E quanto à interface, Pedro?

Pedro: Criei um design moderno e intuitivo. Os usuários podem facilmente navegar entre reuniões, ver participantes e gerar atas com um clique.

João: Perfeito. Sobre as assinaturas digitais, decidimos usar DocuSign?

Maria: Sim, a integração com DocuSign está em andamento. Os usuários poderão enviar as atas para assinatura digital automaticamente.

João: Ótimo trabalho, equipe. Vamos definir os próximos passos:
1. Maria vai finalizar a geração de atas com IA
2. Pedro vai refinar a interface de assinaturas
3. Eu vou preparar a documentação para os usuários

Maria: Combinado! Quando é nossa próxima reunião?

João: Vamos nos reunir novamente na próxima semana para revisar o progresso. Alguma dúvida?

Pedro: Nenhuma dúvida. Vamos em frente!

João: Reunião encerrada. Obrigado a todos!
      `

      try {
        console.log("[v0] Calling OpenAI API via fetch")

        const completion = await callOpenAI([
          {
            role: "system",
            content: `Você é um assistente especializado em criar atas de reunião formais e profissionais em português brasileiro. 
            Analise a transcrição fornecida e crie uma ata estruturada e CONCISA com:
            - Cabeçalho (data, horário, participantes)
            - Pauta/Assuntos tratados
            - Discussões principais (resumidas)
            - Decisões tomadas
            - Ações e responsáveis
            - Encerramento
            
            IMPORTANTE: A ata deve ser CONCISA e caber em uma única página A4. Use linguagem formal e objetiva, mas seja breve.
            Limite o texto a aproximadamente 2000 caracteres.`,
          },
          {
            role: "user",
            content: `Crie uma ata formal e CONCISA desta reunião de teste (deve caber em uma página A4):\n\nTítulo: Reunião de Teste - Sistema de Atas\nData: ${new Date().toISOString()}\n\nTranscrição:\n${sampleTranscript}`,
          },
        ])

        console.log("[v0] OpenAI API call successful")
        const ataContent = completion.choices[0].message.content || ""

        console.log("[v0] Test ATA generated successfully")

        let docusignData = null
        if (includeSignature) {
          const pdfBase64 = await generatePDFBase64(ataContent, "Reunião de Teste - Sistema de Atas")
          docusignData = await sendToDocuSign(pdfBase64, "Ata da Reunião", "Ata da Reunião - Assinatura Necessária")
        }

        return Response.json({
          success: true,
          ataContent,
          meetingInfo: {
            topic: "Reunião de Teste - Sistema de Atas",
            startTime: new Date().toISOString(),
            duration: 30,
          },
          testMode: true,
          docusignEnvelopeId: docusignData?.envelopeId,
          docusignStatus: docusignData?.status,
        })
      } catch (openaiError) {
        console.error("[v0] OpenAI API error:", openaiError)
        throw openaiError
      }
    }

    const zoomToken = await getZoomAccessToken()
    if (!zoomToken) {
      return Response.json({ error: "Failed to authenticate with Zoom" }, { status: 401 })
    }

    const meetingDetailsResponse = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      headers: {
        Authorization: `Bearer ${zoomToken}`,
      },
    })

    if (!meetingDetailsResponse.ok) {
      console.log("[v0] Failed to fetch meeting details:", meetingDetailsResponse.status)
      return Response.json({ error: "Reunião não encontrada" }, { status: 404 })
    }

    const meetingDetails = await meetingDetailsResponse.json()

    const meetingResponse = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}/recordings`, {
      headers: {
        Authorization: `Bearer ${zoomToken}`,
      },
    })

    if (!meetingResponse.ok) {
      const errorData = await meetingResponse.json()
      console.log("[v0] Failed to fetch recordings:", meetingResponse.status, errorData)

      if (meetingResponse.status === 404 || errorData.code === 3301) {
        return Response.json(
          {
            error: "Gravação não encontrada",
            details:
              "Esta reunião não possui gravação disponível. A reunião precisa ser realizada e gravada antes de gerar a ata.",
          },
          { status: 404 },
        )
      }

      return Response.json({ error: "Erro ao buscar gravação da reunião" }, { status: meetingResponse.status })
    }

    const meetingData = await meetingResponse.json()

    // Find transcript file
    const transcriptFile = meetingData.recording_files?.find(
      (file: any) => file.file_type === "TRANSCRIPT" || file.recording_type === "audio_transcript",
    )

    if (!transcriptFile) {
      return Response.json(
        {
          error: "Transcrição não disponível",
          details:
            "A gravação existe mas não possui transcrição. Certifique-se de que a transcrição automática estava habilitada durante a reunião.",
        },
        { status: 404 },
      )
    }

    // Download transcript
    const transcriptResponse = await fetch(transcriptFile.download_url, {
      headers: {
        Authorization: `Bearer ${zoomToken}`,
      },
    })

    const transcriptText = await transcriptResponse.text()
    console.log("[v0] Transcript downloaded, length:", transcriptText.length)

    try {
      console.log("[v0] Calling OpenAI API via fetch")

      const completion = await callOpenAI([
        {
          role: "system",
          content: `Você é um assistente especializado em criar atas de reunião formais e profissionais em português brasileiro. 
            Analise a transcrição fornecida e crie uma ata estruturada e CONCISA com:
            - Cabeçalho (data, horário, participantes)
            - Pauta/Assuntos tratados
            - Discussões principais (resumidas)
            - Decisões tomadas
            - Ações e responsáveis
            - Encerramento
            
            IMPORTANTE: A ata deve ser CONCISA e caber em uma única página A4. Use linguagem formal e objetiva, mas seja breve.
            Limite o texto a aproximadamente 2000 caracteres.`,
        },
        {
          role: "user",
          content: `Crie uma ata formal e CONCISA desta reunião (deve caber em uma página A4):\n\nTítulo: ${meetingData.topic}\nData: ${meetingData.start_time}\n\nTranscrição:\n${transcriptText}`,
        },
      ])

      console.log("[v0] OpenAI API call successful")
      const ataContent = completion.choices[0].message.content || ""

      console.log("[v0] Ata generated successfully")

      let docusignData = null
      if (includeSignature) {
        const pdfBase64 = await generatePDFBase64(ataContent, meetingData.topic)
        docusignData = await sendToDocuSign(
          pdfBase64,
          `Ata - ${meetingData.topic}`,
          `Ata da Reunião: ${meetingData.topic}`,
        )
      }

      return Response.json({
        success: true,
        ataContent,
        meetingInfo: {
          topic: meetingData.topic,
          startTime: meetingData.start_time,
          duration: meetingData.duration,
        },
        docusignEnvelopeId: docusignData?.envelopeId,
        docusignStatus: docusignData?.status,
      })
    } catch (openaiError) {
      console.error("[v0] OpenAI API error:", openaiError)
      throw openaiError
    }
  } catch (error) {
    console.error("[v0] Error in generate-ata:", error)
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Erro ao gerar ata",
      },
      { status: 500 },
    )
  }
}
