import { MeetingsList } from "@/components/meetings-list"
import { Header } from "@/components/header"
import { StatusCard } from "@/components/status-card"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-balance">Geração de Atas de Reunião</h1>
            <p className="text-muted-foreground text-lg">
              Sistema automatizado com IA para gerar atas profissionais das suas reuniões do Zoom
            </p>
          </div>

          <StatusCard />

          <MeetingsList />
        </div>
      </main>
    </div>
  )
}
