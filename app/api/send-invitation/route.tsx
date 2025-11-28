export async function POST(request: Request) {
  try {
    const { emails, meetingDetails } = await request.json()

    console.log("[v0] Sending invitations to:", emails)

    // Formatar mensagem do convite
    const invitationMessage = `
Você foi convidado para uma reunião no Zoom!

📅 Reunião: ${meetingDetails.topic}
🕐 Data/Hora: ${new Date(meetingDetails.start_time).toLocaleString("pt-BR")}
⏱️ Duração: ${meetingDetails.duration} minutos

${meetingDetails.agenda ? `📋 Descrição: ${meetingDetails.agenda}\n` : ""}
🔗 Link para participar: ${meetingDetails.join_url}

ID da Reunião: ${meetingDetails.id}
${meetingDetails.password ? `Senha: ${meetingDetails.password}` : ""}

Clique no link acima para entrar na reunião no horário agendado.
    `.trim()

    // Aqui você pode integrar com um serviço de email real
    // Por enquanto, vou retornar os dados para que você possa implementar o envio

    const emailData = emails.map((email: string) => ({
      to: email,
      subject: `Convite: ${meetingDetails.topic}`,
      text: invitationMessage,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Você foi convidado para uma reunião no Zoom!</h2>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>📅 Reunião:</strong> ${meetingDetails.topic}</p>
            <p style="margin: 10px 0;"><strong>🕐 Data/Hora:</strong> ${new Date(meetingDetails.start_time).toLocaleString("pt-BR")}</p>
            <p style="margin: 10px 0;"><strong>⏱️ Duração:</strong> ${meetingDetails.duration} minutos</p>
            ${meetingDetails.agenda ? `<p style="margin: 10px 0;"><strong>📋 Descrição:</strong> ${meetingDetails.agenda}</p>` : ""}
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${meetingDetails.join_url}" 
               style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Entrar na Reunião
            </a>
          </div>

          <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>ID da Reunião:</strong> ${meetingDetails.id}</p>
            ${meetingDetails.password ? `<p style="margin: 5px 0;"><strong>Senha:</strong> ${meetingDetails.password}</p>` : ""}
          </div>

          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            Este é um convite automático gerado pelo sistema de gerenciamento de reuniões.
          </p>
        </div>
      `,
    }))

    // TODO: Integrar com serviço de email (Resend, SendGrid, etc)
    // Exemplo com Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send(emailData)

    console.log("[v0] Email data prepared:", emailData.length, "emails")

    return Response.json({
      success: true,
      message: `Convites preparados para ${emails.length} participante(s)`,
      emailData, // Retorna os dados para você implementar o envio
    })
  } catch (error) {
    console.error("[v0] Error preparing invitations:", error)
    return Response.json({ error: "Erro ao preparar convites" }, { status: 500 })
  }
}
