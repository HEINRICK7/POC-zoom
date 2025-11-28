export async function GET(request: Request, { params }: { params: { filename: string } }) {
  try {
    const { filename } = params

    const backendUrl = process.env.BACKEND_API_URL || "http://localhost:3000"

    const response = await fetch(`${backendUrl}/api/atas/download/${filename}`)

    if (!response.ok) {
      throw new Error("Arquivo não encontrado")
    }

    // Forward the PDF file from backend
    const pdfBuffer = await response.arrayBuffer()

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("[v0] Error downloading file:", error)
    return Response.json({ error: "Erro ao baixar arquivo" }, { status: 404 })
  }
}
