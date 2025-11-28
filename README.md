# Zoom Atas - Sistema de Geração Automática de Atas com IA

Sistema automatizado para gerar atas profissionais de reuniões do Zoom usando Inteligência Artificial, com integração DocuSign para assinatura digital.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Configuração](#configuração)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [API Endpoints](#api-endpoints)
- [Componentes](#componentes)
- [Integrações](#integrações)
- [Fluxo de Trabalho](#fluxo-de-trabalho)
- [Desenvolvimento](#desenvolvimento)

## 🎯 Visão Geral

O Zoom Atas é uma aplicação Next.js que automatiza o processo de criação de atas de reunião. O sistema:

1. Conecta-se à API do Zoom para listar reuniões
2. Obtém transcrições e gravações das reuniões
3. Usa OpenAI para gerar atas profissionais e estruturadas
4. Cria PDFs formatados das atas
5. Envia automaticamente para DocuSign para assinatura digital
6. Rastreia o status das assinaturas em tempo real

## ✨ Funcionalidades

### Gerenciamento de Reuniões
- ✅ Listar reuniões agendadas e realizadas do Zoom
- ✅ Criar novas reuniões diretamente pela interface
- ✅ Adicionar participantes às reuniões
- ✅ Visualizar detalhes completos das reuniões
- ✅ Verificar status de gravação

### Geração de Atas
- ✅ Geração automática usando IA (OpenAI GPT-4)
- ✅ Análise de transcrições e gravações
- ✅ Formatação profissional em PDF
- ✅ Modo de teste para desenvolvimento
- ✅ Atas concisas que cabem em uma página A4

### Assinatura Digital
- ✅ Integração completa com DocuSign
- ✅ Autenticação JWT (PKCS#8)
- ✅ Conversão automática de chaves PKCS#1 para PKCS#8
- ✅ Envio automático de envelopes para assinatura
- ✅ Rastreamento de status em tempo real
- ✅ Download de documentos assinados
- ✅ Fluxo de consentimento guiado

### Interface
- ✅ Design moderno e profissional (dark mode)
- ✅ Dashboard com status do sistema
- ✅ Indicadores visuais de status
- ✅ Feedback em tempo real
- ✅ Tratamento de erros amigável

## 🏗️ Arquitetura

\`\`\`
┌─────────────────┐
│   Next.js App   │
│   (Frontend)    │
└────────┬────────┘
         │
         ├─────────────────────────────────────┐
         │                                     │
         ▼                                     ▼
┌─────────────────┐                  ┌─────────────────┐
│   Zoom API      │                  │   OpenAI API    │
│  - Meetings     │                  │  - GPT-4        │
│  - Recordings   │                  │  - Text Gen     │
│  - Transcripts  │                  └─────────────────┘
└─────────────────┘                           │
         │                                     │
         │                                     ▼
         │                          ┌─────────────────┐
         │                          │   jsPDF         │
         │                          │  - PDF Gen      │
         │                          └─────────────────┘
         │                                     │
         └─────────────────┬───────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  DocuSign API   │
                  │  - JWT Auth     │
                  │  - Envelopes    │
                  │  - Signatures   │
                  └─────────────────┘
\`\`\`

## 🛠️ Tecnologias

### Frontend
- **Next.js 15** - Framework React com App Router
- **React 19** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS v4** - Estilização
- **shadcn/ui** - Componentes UI

### Backend/API
- **Next.js API Routes** - Endpoints serverless
- **Zoom API** - Integração com Zoom
- **OpenAI API** - Geração de texto com IA
- **DocuSign API** - Assinatura digital
- **jose** - JWT para autenticação
- **jsPDF** - Geração de PDFs

### Ferramentas
- **Vercel Analytics** - Monitoramento
- **Geist Font** - Tipografia

## ⚙️ Configuração

### Pré-requisitos

1. Node.js 18+ instalado
2. Conta Zoom com acesso à API
3. Conta OpenAI com API key
4. Conta DocuSign (Developer ou Production)

### Instalação

\`\`\`bash
# Clone o repositório
git clone <repository-url>

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local

# Execute em desenvolvimento
npm run dev
\`\`\`

## 🔐 Variáveis de Ambiente

### Obrigatórias

\`\`\`env
# OpenAI
OPENAI_API_KEY=sk-...

# Zoom
ZOOM_ACCOUNT_ID=...
ZOOM_CLIENT_ID=...
ZOOM_CLIENT_SECRET=...

# DocuSign
DOCUSIGN_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...-----END PRIVATE KEY-----
DOCUSIGN_BASE_PATH=https://demo.docusign.net
INTEGRATION_KEY=...
USER_ID=...
ACCOUNT_ID=...
\`\`\`

### Opcionais

\`\`\`env
# Backend (se usar backend customizado)
BACKEND_API_URL=https://api.example.com
BASE_URL=https://yourapp.com
\`\`\`

### Configuração do Zoom

1. Acesse [Zoom Marketplace](https://marketplace.zoom.us/)
2. Crie um Server-to-Server OAuth App
3. Adicione os escopos necessários:
   - `meeting:read:admin`
   - `meeting:write:admin`
   - `recording:read:admin`
   - `user:read:admin`
4. Copie Account ID, Client ID e Client Secret

### Configuração do DocuSign

1. Acesse [DocuSign Developer](https://developers.docusign.com/)
2. Crie uma Integration Key
3. Gere um par de chaves RSA (PKCS#8)
4. Configure o Redirect URI: `https://yourapp.com/callback`
5. Copie Integration Key, User ID e Account ID
6. Salve a chave privada em DOCUSIGN_PRIVATE_KEY

**Importante:** A chave privada deve estar no formato PKCS#8:
\`\`\`
-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----
\`\`\`

Se sua chave estiver em PKCS#1 (RSA PRIVATE KEY), o sistema converterá automaticamente.

### Consentimento do DocuSign

Na primeira vez que usar a integração DocuSign, você precisará conceder consentimento:

1. O sistema detectará automaticamente a necessidade de consentimento
2. Um botão aparecerá na interface
3. Clique para abrir a página de consentimento do DocuSign
4. Faça login e autorize a aplicação
5. Após autorizar, tente gerar a ata novamente

## 📁 Estrutura do Projeto

\`\`\`
zoom/
├── app/
│   ├── api/
│   │   ├── docusign/
│   │   │   ├── envelope-status/[envelopeId]/route.ts
│   │   │   ├── send-envelope/route.ts
│   │   │   └── webhook/route.ts
│   │   ├── meeting/[meetingId]/route.ts
│   │   ├── meetings/
│   │   │   ├── create/route.ts
│   │   │   ├── download/[filename]/route.ts
│   │   │   ├── generate-ata/route.ts
│   │   │   └── list/route.ts
│   │   ├── send-invitation/route.tsx
│   │   ├── status/route.ts
│   │   └── test-backend/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                          # Componentes shadcn/ui
│   ├── add-participants-dialog.tsx
│   ├── create-meeting-dialog.tsx
│   ├── envelope-status-tracker.tsx
│   ├── generate-ata-dialog.tsx
│   ├── header.tsx
│   ├── meetings-list.tsx
│   ├── signature-status-card.tsx
│   ├── status-card.tsx
│   └── theme-provider.tsx
├── lib/
│   ├── docusign-auth.ts            # Autenticação JWT DocuSign
│   ├── docusign.ts                 # Funções DocuSign
│   ├── utils.ts                    # Utilitários
│   └── zoom-auth.ts                # Autenticação Zoom
├── hooks/
│   ├── use-mobile.tsx
│   └── use-toast.ts
├── next.config.mjs
├── package.json
├── tsconfig.json
└── README.md
\`\`\`

## 🔌 API Endpoints

### Reuniões

#### `GET /api/meetings/list`
Lista todas as reuniões do Zoom (agendadas e realizadas).

**Response:**
\`\`\`json
{
  "meetings": [
    {
      "id": "123456789",
      "topic": "Reunião de Planejamento",
      "start_time": "2024-01-15T10:00:00Z",
      "duration": 60,
      "status": "finished",
      "hasRecording": true,
      "hasTranscript": true
    }
  ]
}
\`\`\`

#### `POST /api/meetings/create`
Cria uma nova reunião no Zoom.

**Request:**
\`\`\`json
{
  "topic": "Nova Reunião",
  "start_time": "2024-01-20T14:00:00Z",
  "duration": 60,
  "participants": ["email@example.com"]
}
\`\`\`

#### `GET /api/meeting/[meetingId]`
Obtém detalhes de uma reunião específica.

#### `PATCH /api/meeting/[meetingId]`
Atualiza uma reunião (adiciona participantes).

**Request:**
\`\`\`json
{
  "invitees": [
    { "email": "novo@example.com" }
  ]
}
\`\`\`

### Geração de Atas

#### `POST /api/meetings/generate-ata`
Gera uma ata de reunião usando IA.

**Request:**
\`\`\`json
{
  "meetingId": "123456789",
  "meetingTopic": "Reunião de Planejamento",
  "testMode": false,
  "sendToDocuSign": true,
  "signers": [
    {
      "email": "signer@example.com",
      "name": "João Silva"
    }
  ]
}
\`\`\`

**Response:**
\`\`\`json
{
  "ata": "Conteúdo da ata...",
  "envelopeId": "abc-123-def",
  "envelopeStatus": "sent"
}
\`\`\`

#### `GET /api/meetings/download/[filename]`
Faz download de uma ata em PDF.

### DocuSign

#### `POST /api/docusign/send-envelope`
Envia um envelope para assinatura.

#### `GET /api/docusign/envelope-status/[envelopeId]`
Verifica o status de um envelope.

**Response:**
\`\`\`json
{
  "status": "completed",
  "sentDateTime": "2024-01-15T10:00:00Z",
  "completedDateTime": "2024-01-15T11:30:00Z",
  "recipients": [
    {
      "email": "signer@example.com",
      "name": "João Silva",
      "status": "completed"
    }
  ]
}
\`\`\`

#### `POST /api/docusign/webhook`
Webhook para receber atualizações do DocuSign.

### Sistema

#### `GET /api/status`
Verifica o status de todas as integrações.

**Response:**
\`\`\`json
{
  "zoom": {
    "status": "connected",
    "message": "Conectado com sucesso"
  },
  "openai": {
    "status": "connected",
    "message": "API key configurada"
  },
  "docusign": {
    "status": "connected",
    "message": "Credenciais configuradas"
  }
}
\`\`\`

## 🧩 Componentes

### `MeetingsList`
Lista todas as reuniões com cards interativos.

**Features:**
- Filtro por status (agendadas/realizadas)
- Indicadores de gravação e transcrição
- Botões de ação (gerar ata, adicionar participantes)
- Atualização automática

### `GenerateAtaDialog`
Diálogo para gerar atas de reunião.

**Features:**
- Modo de teste
- Configuração de signatários
- Envio automático para DocuSign
- Tratamento de erros com instruções
- Fluxo de consentimento DocuSign

### `EnvelopeStatusTracker`
Rastreamento em tempo real do status de assinatura.

**Features:**
- Polling automático a cada 30 segundos
- Indicadores visuais de status
- Lista de signatários com status individual
- Download de documento assinado

### `StatusCard`
Card de status do sistema na página inicial.

**Features:**
- Verificação de todas as integrações
- Indicadores visuais (conectado/erro)
- Mensagens de erro detalhadas
- Atualização manual

### `CreateMeetingDialog`
Diálogo para criar novas reuniões.

**Features:**
- Formulário completo de reunião
- Adição de múltiplos participantes
- Validação de dados
- Cópia de link e convite

## 🔗 Integrações

### Zoom API

**Autenticação:** Server-to-Server OAuth

**Endpoints Utilizados:**
- `GET /users/me/meetings` - Listar reuniões
- `POST /users/me/meetings` - Criar reunião
- `GET /meetings/{meetingId}` - Detalhes da reunião
- `PATCH /meetings/{meetingId}` - Atualizar reunião
- `GET /meetings/{meetingId}/recordings` - Obter gravações

**Biblioteca:** `lib/zoom-auth.ts`

### OpenAI API

**Modelo:** GPT-4

**Uso:**
- Análise de transcrições
- Geração de atas estruturadas
- Resumo de discussões
- Identificação de decisões e ações

**Prompt:** Otimizado para gerar atas concisas (≤2000 caracteres)

### DocuSign API

**Autenticação:** JWT Grant (OAuth 2.0)

**Formato de Chave:** PKCS#8 (conversão automática de PKCS#1)

**Endpoints Utilizados:**
- `POST /oauth/token` - Obter access token
- `POST /accounts/{accountId}/envelopes` - Criar envelope
- `GET /accounts/{accountId}/envelopes/{envelopeId}` - Status do envelope
- `GET /accounts/{accountId}/envelopes/{envelopeId}/documents/combined` - Download

**Biblioteca:** `lib/docusign-auth.ts`, `lib/docusign.ts`

**Features Especiais:**
- Conversão automática PKCS#1 → PKCS#8
- Fluxo de consentimento guiado
- Retry automático com refresh token
- Validação de formato de chave

## 🔄 Fluxo de Trabalho

### 1. Geração de Ata Completa

\`\`\`
1. Usuário clica em "Gerar Ata"
   ↓
2. Sistema verifica se reunião tem gravação
   ↓
3. Busca transcrição da reunião no Zoom
   ↓
4. Envia transcrição para OpenAI
   ↓
5. OpenAI gera ata estruturada
   ↓
6. Sistema cria PDF formatado (jsPDF)
   ↓
7. Se "Enviar para DocuSign" ativado:
   ├─ Autentica com DocuSign (JWT)
   ├─ Cria envelope com PDF
   ├─ Adiciona signatários
   └─ Envia para assinatura
   ↓
8. Retorna ata e ID do envelope
   ↓
9. Inicia rastreamento de status
\`\`\`

### 2. Autenticação DocuSign JWT

\`\`\`
1. Carrega credenciais (Integration Key, User ID, Private Key)
   ↓
2. Valida formato da chave privada
   ├─ Se PKCS#1: converte para PKCS#8
   └─ Se PKCS#8: usa diretamente
   ↓
3. Cria JWT claims (iss, sub, aud, scope, exp)
   ↓
4. Assina JWT com chave privada (RS256)
   ↓
5. Troca JWT por access token
   ├─ Se sucesso: retorna token
   └─ Se "consent_required": mostra URL de consentimento
   ↓
6. Usa access token para chamadas API
\`\`\`

### 3. Rastreamento de Assinatura

\`\`\`
1. Envelope criado e enviado
   ↓
2. Sistema inicia polling (30s)
   ↓
3. A cada intervalo:
   ├─ Consulta status no DocuSign
   ├─ Atualiza UI com status atual
   └─ Mostra progresso dos signatários
   ↓
4. Quando status = "completed":
   ├─ Para polling
   ├─ Mostra botão de download
   └─ Permite baixar documento assinado
\`\`\`

## 🚀 Desenvolvimento

### Executar Localmente

\`\`\`bash
npm run dev
\`\`\`

Acesse: http://localhost:3000

### Build para Produção

\`\`\`bash
npm run build
npm start
\`\`\`

### Deploy na Vercel

\`\`\`bash
vercel
\`\`\`

Ou conecte o repositório GitHub à Vercel para deploy automático.

### Variáveis de Ambiente na Vercel

1. Acesse o projeto na Vercel
2. Vá em Settings → Environment Variables
3. Adicione todas as variáveis listadas acima
4. Redeploy o projeto

### Debug

O sistema usa logs prefixados com `[v0]` para facilitar debug:

\`\`\`typescript
console.log("[v0] Mensagem de debug")
console.error("[v0] Erro:", error)
\`\`\`

Ative o console do navegador para ver os logs em tempo real.

### Modo de Teste

Para testar a geração de atas sem reuniões reais:

1. Marque "Modo de Teste" no diálogo
2. Sistema gerará uma ata de exemplo
3. Útil para testar integração DocuSign

## 📝 Notas Importantes

### Gravação de Reuniões

Para gerar atas, as reuniões precisam ter:
- ✅ Gravação na nuvem habilitada
- ✅ Transcrição automática ativada

Configure nas configurações da conta Zoom.

### Formato de Chave DocuSign

O sistema aceita ambos os formatos:
- PKCS#8: `-----BEGIN PRIVATE KEY-----`
- PKCS#1: `-----BEGIN RSA PRIVATE KEY-----` (convertido automaticamente)

### Limites da API

- **Zoom:** 100 requisições/dia (plano gratuito)
- **OpenAI:** Depende do plano contratado
- **DocuSign:** 5 envelopes/hora (sandbox), ilimitado (produção)

### Segurança

- ✅ Chaves privadas nunca são expostas no frontend
- ✅ Todas as chamadas de API são server-side
- ✅ Tokens são gerados sob demanda
- ✅ Sem armazenamento de credenciais no cliente

## 🐛 Troubleshooting

### Erro: "consent_required"
**Solução:** Clique no botão "Conceder Consentimento" que aparece no diálogo.

### Erro: "Unable to load document"
**Solução:** Verifique se o PDF está sendo gerado corretamente. Teste no modo de teste.

### Erro: "Invalid token"
**Solução:** Verifique se a chave privada está no formato correto (PKCS#8).

### Erro: "Meeting has no recording"
**Solução:** Habilite gravação na nuvem nas configurações do Zoom.

### Erro: "Zoom authentication failed"
**Solução:** Verifique se as credenciais Zoom estão corretas e os escopos estão configurados.

## 📄 Licença

Este projeto é privado e proprietário.

## 👥 Suporte

Para suporte, entre em contato através do repositório ou abra uma issue.

---

**Desenvolvido com ❤️ usando Next.js, OpenAI e DocuSign**
