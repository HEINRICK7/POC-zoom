# Especificação do Backend - Sistema de Gerenciamento de Reuniões e Atas

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura Proposta](#arquitetura-proposta)
3. [Stack Tecnológica Recomendada](#stack-tecnológica-recomendada)
4. [Modelos de Dados](#modelos-de-dados)
5. [API Endpoints](#api-endpoints)
6. [Integrações Externas](#integrações-externas)
7. [Autenticação e Autorização](#autenticação-e-autorização)
8. [Segurança](#segurança)
9. [Estratégia de Migração](#estratégia-de-migração)
10. [Infraestrutura e Deploy](#infraestrutura-e-deploy)

---

## 🎯 Visão Geral

Este documento especifica a arquitetura e implementação de um backend separado para o sistema de gerenciamento de reuniões e atas automatizadas. O sistema atual utiliza Next.js API Routes, mas esta especificação propõe uma arquitetura backend independente que pode ser escalada e mantida separadamente do frontend.

### Funcionalidades Principais

- **Gerenciamento de Reuniões**: Criar, listar, atualizar e deletar reuniões via Zoom
- **Geração de Atas**: Processar transcrições de reuniões e gerar atas formais usando IA
- **Assinaturas Digitais**: Enviar atas para assinatura via DocuSign
- **Rastreamento de Status**: Monitorar status de envelopes e assinaturas
- **Webhooks**: Receber notificações de eventos do DocuSign

---

## 🏗️ Arquitetura Proposta

### Arquitetura em Camadas

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                      │
│                    React Components + UI                     │
└─────────────────────────────────────────────────────────────┘
                              ↓ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway / Load Balancer             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Backend API Server                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Routes     │  │  Controllers │  │   Services   │      │
│  │  (Express)   │→ │   (Logic)    │→ │  (Business)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                              ↓                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Middleware  │  │  Validators  │  │    Utils     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │    Redis     │  │  File Store  │      │
│  │  (Primary)   │  │   (Cache)    │  │   (S3/Blob)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   External Services                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Zoom API   │  │ DocuSign API │  │  OpenAI API  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
\`\`\`

### Princípios Arquiteturais

1. **Separação de Responsabilidades**: Cada camada tem uma responsabilidade clara
2. **Escalabilidade Horizontal**: Stateless design permite múltiplas instâncias
3. **Resiliência**: Circuit breakers e retry logic para integrações externas
4. **Observabilidade**: Logging estruturado, métricas e tracing
5. **Segurança em Camadas**: Autenticação, autorização, validação e sanitização

---

## 🛠️ Stack Tecnológica Recomendada

### Opção 1: Node.js + Express (Recomendado para migração suave)

**Vantagens:**
- Mesma linguagem do frontend (TypeScript)
- Reutilização de código existente
- Ecossistema maduro
- Fácil migração das API Routes atuais

**Stack:**
\`\`\`typescript
// Core
- Node.js 20+ LTS
- Express.js 4.x
- TypeScript 5.x

// Database & ORM
- PostgreSQL 15+
- Prisma ORM / TypeORM
- Redis (cache e sessões)

// Validação & Segurança
- Zod / Joi (validação de schemas)
- Helmet (security headers)
- express-rate-limit
- bcrypt / argon2 (hashing)

// Integrações
- axios / node-fetch (HTTP client)
- jose (JWT handling)
- jspdf (PDF generation)

// Observabilidade
- Winston / Pino (logging)
- Prometheus client
- OpenTelemetry

// Testing
- Jest
- Supertest
- MSW (Mock Service Worker)
\`\`\`

### Opção 2: Python + FastAPI (Para IA-heavy workloads)

**Vantagens:**
- Melhor para processamento de IA/ML
- Async nativo
- Documentação automática (OpenAPI)
- Type hints nativos

**Stack:**
\`\`\`python
# Core
- Python 3.11+
- FastAPI
- Uvicorn (ASGI server)

# Database & ORM
- PostgreSQL
- SQLAlchemy / Tortoise ORM
- Redis

# Validação
- Pydantic

# Integrações
- httpx (async HTTP)
- python-jose (JWT)
- reportlab (PDF)

# Observabilidade
- structlog
- prometheus-client
\`\`\`

### Opção 3: Go (Para máxima performance)

**Vantagens:**
- Performance superior
- Concorrência nativa
- Binário único
- Baixo consumo de memória

**Stack:**
\`\`\`go
// Core
- Go 1.21+
- Gin / Echo framework

// Database
- PostgreSQL
- GORM / sqlx
- go-redis

// Validação
- validator

// Observabilidade
- zap / zerolog
- prometheus
\`\`\`

**Recomendação:** Node.js + Express para facilitar a migração e manter consistência com o frontend.

---

## 📊 Modelos de Dados

### Schema do Banco de Dados (PostgreSQL)

\`\`\`sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    zoom_user_id VARCHAR(255),
    docusign_user_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Meetings table
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zoom_meeting_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    topic VARCHAR(500) NOT NULL,
    agenda TEXT,
    start_time TIMESTAMP NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
    join_url TEXT,
    start_url TEXT,
    recording_url TEXT,
    transcript_url TEXT,
    has_recording BOOLEAN DEFAULT FALSE,
    has_transcript BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_zoom_meeting_id (zoom_meeting_id),
    INDEX idx_start_time (start_time),
    INDEX idx_status (status)
);

-- Participants table
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'participant', -- host, co-host, participant
    joined_at TIMESTAMP,
    left_at TIMESTAMP,
    duration INTEGER, -- in seconds
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_meeting_id (meeting_id),
    INDEX idx_email (email)
);

-- Meeting Minutes (Atas) table
CREATE TABLE meeting_minutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    pdf_url TEXT,
    pdf_blob_key VARCHAR(500),
    status VARCHAR(50) DEFAULT 'draft', -- draft, finalized, sent_for_signature
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    finalized_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_meeting_id (meeting_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
);

-- DocuSign Envelopes table
CREATE TABLE docusign_envelopes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    envelope_id VARCHAR(255) UNIQUE NOT NULL,
    meeting_minutes_id UUID REFERENCES meeting_minutes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'sent', -- sent, delivered, completed, declined, voided
    email_subject VARCHAR(500),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    declined_at TIMESTAMP,
    voided_at TIMESTAMP,
    decline_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_envelope_id (envelope_id),
    INDEX idx_meeting_minutes_id (meeting_minutes_id),
    INDEX idx_status (status)
);

-- Signers table
CREATE TABLE signers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    envelope_id UUID REFERENCES docusign_envelopes(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    recipient_id VARCHAR(50),
    routing_order INTEGER,
    status VARCHAR(50) DEFAULT 'sent', -- sent, delivered, signed, declined
    signed_at TIMESTAMP,
    declined_at TIMESTAMP,
    decline_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_envelope_id (envelope_id),
    INDEX idx_email (email),
    INDEX idx_status (status)
);

-- Integration Credentials table (encrypted)
CREATE TABLE integration_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- zoom, docusign, openai
    credentials JSONB NOT NULL, -- encrypted credentials
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, provider),
    INDEX idx_user_provider (user_id, provider)
);

-- Audit Log table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_resource (resource_type, resource_id),
    INDEX idx_created_at (created_at)
);

-- Webhook Events table
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL, -- docusign, zoom
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP,
    error TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_provider (provider),
    INDEX idx_processed (processed),
    INDEX idx_created_at (created_at)
);
\`\`\`

### Prisma Schema (Alternativa)

\`\`\`prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id              String   @id @default(uuid())
  email           String   @unique
  name            String?
  zoomUserId      String?  @map("zoom_user_id")
  docusignUserId  String?  @map("docusign_user_id")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  meetings        Meeting[]
  meetingMinutes  MeetingMinutes[]
  envelopes       DocuSignEnvelope[]
  credentials     IntegrationCredential[]
  auditLogs       AuditLog[]

  @@map("users")
}

model Meeting {
  id              String   @id @default(uuid())
  zoomMeetingId   String   @unique @map("zoom_meeting_id")
  userId          String   @map("user_id")
  topic           String
  agenda          String?
  startTime       DateTime @map("start_time")
  duration        Int
  status          String   @default("scheduled")
  joinUrl         String?  @map("join_url")
  startUrl        String?  @map("start_url")
  recordingUrl    String?  @map("recording_url")
  transcriptUrl   String?  @map("transcript_url")
  hasRecording    Boolean  @default(false) @map("has_recording")
  hasTranscript   Boolean  @default(false) @map("has_transcript")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  participants    Participant[]
  meetingMinutes  MeetingMinutes[]

  @@index([userId])
  @@index([zoomMeetingId])
  @@index([startTime])
  @@index([status])
  @@map("meetings")
}

model Participant {
  id          String    @id @default(uuid())
  meetingId   String    @map("meeting_id")
  email       String
  name        String?
  role        String    @default("participant")
  joinedAt    DateTime? @map("joined_at")
  leftAt      DateTime? @map("left_at")
  duration    Int?
  createdAt   DateTime  @default(now()) @map("created_at")

  meeting     Meeting   @relation(fields: [meetingId], references: [id], onDelete: Cascade)

  @@index([meetingId])
  @@index([email])
  @@map("participants")
}

model MeetingMinutes {
  id          String    @id @default(uuid())
  meetingId   String    @map("meeting_id")
  userId      String    @map("user_id")
  content     String
  pdfUrl      String?   @map("pdf_url")
  pdfBlobKey  String?   @map("pdf_blob_key")
  status      String    @default("draft")
  generatedAt DateTime  @default(now()) @map("generated_at")
  finalizedAt DateTime? @map("finalized_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  meeting     Meeting   @relation(fields: [meetingId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  envelopes   DocuSignEnvelope[]

  @@index([meetingId])
  @@index([userId])
  @@index([status])
  @@map("meeting_minutes")
}

model DocuSignEnvelope {
  id                String    @id @default(uuid())
  envelopeId        String    @unique @map("envelope_id")
  meetingMinutesId  String    @map("meeting_minutes_id")
  userId            String    @map("user_id")
  status            String    @default("sent")
  emailSubject      String?   @map("email_subject")
  sentAt            DateTime  @default(now()) @map("sent_at")
  completedAt       DateTime? @map("completed_at")
  declinedAt        DateTime? @map("declined_at")
  voidedAt          DateTime? @map("voided_at")
  declineReason     String?   @map("decline_reason")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  meetingMinutes    MeetingMinutes @relation(fields: [meetingMinutesId], references: [id], onDelete: Cascade)
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  signers           Signer[]

  @@index([envelopeId])
  @@index([meetingMinutesId])
  @@index([status])
  @@map("docusign_envelopes")
}

model Signer {
  id            String    @id @default(uuid())
  envelopeId    String    @map("envelope_id")
  email         String
  name          String?
  recipientId   String?   @map("recipient_id")
  routingOrder  Int?      @map("routing_order")
  status        String    @default("sent")
  signedAt      DateTime? @map("signed_at")
  declinedAt    DateTime? @map("declined_at")
  declineReason String?   @map("decline_reason")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  envelope      DocuSignEnvelope @relation(fields: [envelopeId], references: [id], onDelete: Cascade)

  @@index([envelopeId])
  @@index([email])
  @@index([status])
  @@map("signers")
}

model IntegrationCredential {
  id          String    @id @default(uuid())
  userId      String    @map("user_id")
  provider    String
  credentials Json
  isActive    Boolean   @default(true) @map("is_active")
  expiresAt   DateTime? @map("expires_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, provider])
  @@index([userId, provider])
  @@map("integration_credentials")
}

model AuditLog {
  id           String    @id @default(uuid())
  userId       String?   @map("user_id")
  action       String
  resourceType String    @map("resource_type")
  resourceId   String?   @map("resource_id")
  details      Json?
  ipAddress    String?   @map("ip_address")
  userAgent    String?   @map("user_agent")
  createdAt    DateTime  @default(now()) @map("created_at")

  user         User?     @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([action])
  @@index([resourceType, resourceId])
  @@index([createdAt])
  @@map("audit_logs")
}

model WebhookEvent {
  id          String    @id @default(uuid())
  provider    String
  eventType   String    @map("event_type")
  payload     Json
  processed   Boolean   @default(false)
  processedAt DateTime? @map("processed_at")
  error       String?
  retryCount  Int       @default(0) @map("retry_count")
  createdAt   DateTime  @default(now()) @map("created_at")

  @@index([provider])
  @@index([processed])
  @@index([createdAt])
  @@map("webhook_events")
}
\`\`\`

---

## 🔌 API Endpoints

### Base URL
\`\`\`
Production: https://api.yourdomain.com/v1
Development: http://localhost:3001/v1
\`\`\`

### Autenticação

Todos os endpoints (exceto webhooks) requerem autenticação via JWT Bearer token:
\`\`\`
Authorization: Bearer <jwt_token>
\`\`\`

### Endpoints Detalhados

#### 1. Autenticação

\`\`\`typescript
// POST /v1/auth/register
// Registrar novo usuário
Request: {
  email: string
  password: string
  name?: string
}
Response: {
  user: User
  token: string
}

// POST /v1/auth/login
// Login de usuário
Request: {
  email: string
  password: string
}
Response: {
  user: User
  token: string
}

// POST /v1/auth/refresh
// Renovar token
Request: {
  refreshToken: string
}
Response: {
  token: string
}

// POST /v1/auth/logout
// Logout (invalidar token)
Response: {
  success: boolean
}
\`\`\`

#### 2. Reuniões (Meetings)

\`\`\`typescript
// GET /v1/meetings
// Listar reuniões do usuário
Query Params: {
  status?: 'scheduled' | 'completed' | 'cancelled'
  startDate?: string (ISO 8601)
  endDate?: string (ISO 8601)
  page?: number
  limit?: number
}
Response: {
  meetings: Meeting[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// GET /v1/meetings/:id
// Obter detalhes de uma reunião
Response: {
  meeting: Meeting
  participants: Participant[]
  hasMinutes: boolean
}

// POST /v1/meetings
// Criar nova reunião no Zoom
Request: {
  topic: string
  agenda?: string
  startTime: string (ISO 8601)
  duration: number (minutes)
  participants?: Array<{
    email: string
    name?: string
  }>
}
Response: {
  meeting: Meeting
  zoomJoinUrl: string
  zoomStartUrl: string
}

// PATCH /v1/meetings/:id
// Atualizar reunião
Request: {
  topic?: string
  agenda?: string
  startTime?: string
  duration?: number
}
Response: {
  meeting: Meeting
}

// DELETE /v1/meetings/:id
// Cancelar reunião
Response: {
  success: boolean
}

// POST /v1/meetings/:id/participants
// Adicionar participantes
Request: {
  participants: Array<{
    email: string
    name?: string
  }>
}
Response: {
  participants: Participant[]
}

// GET /v1/meetings/:id/recording
// Obter informações de gravação
Response: {
  hasRecording: boolean
  recordingUrl?: string
  transcriptUrl?: string
  recordingFiles: Array<{
    id: string
    fileType: string
    downloadUrl: string
    fileSize: number
  }>
}
\`\`\`

#### 3. Atas (Meeting Minutes)

\`\`\`typescript
// POST /v1/meetings/:meetingId/minutes
// Gerar ata da reunião
Request: {
  includeSignature?: boolean
  signers?: Array<{
    email: string
    name?: string
  }>
  testMode?: boolean
}
Response: {
  minutes: MeetingMinutes
  content: string
  pdfUrl?: string
  envelopeId?: string (if includeSignature)
}

// GET /v1/meetings/:meetingId/minutes
// Listar atas de uma reunião
Response: {
  minutes: MeetingMinutes[]
}

// GET /v1/minutes/:id
// Obter detalhes de uma ata
Response: {
  minutes: MeetingMinutes
  meeting: Meeting
  envelope?: DocuSignEnvelope
}

// PATCH /v1/minutes/:id
// Atualizar ata
Request: {
  content?: string
  status?: 'draft' | 'finalized'
}
Response: {
  minutes: MeetingMinutes
}

// GET /v1/minutes/:id/pdf
// Download PDF da ata
Response: Binary (application/pdf)

// POST /v1/minutes/:id/send-for-signature
// Enviar ata para assinatura
Request: {
  signers: Array<{
    email: string
    name?: string
  }>
  emailSubject?: string
}
Response: {
  envelope: DocuSignEnvelope
  envelopeId: string
}
\`\`\`

#### 4. DocuSign

\`\`\`typescript
// GET /v1/docusign/envelopes
// Listar envelopes
Query Params: {
  status?: 'sent' | 'delivered' | 'completed' | 'declined'
  page?: number
  limit?: number
}
Response: {
  envelopes: DocuSignEnvelope[]
  pagination: PaginationInfo
}

// GET /v1/docusign/envelopes/:envelopeId
// Obter status do envelope
Response: {
  envelope: DocuSignEnvelope
  signers: Signer[]
}

// POST /v1/docusign/envelopes/:envelopeId/void
// Cancelar envelope
Request: {
  reason: string
}
Response: {
  success: boolean
}

// POST /v1/docusign/envelopes/:envelopeId/resend
// Reenviar envelope
Response: {
  success: boolean
}

// GET /v1/docusign/consent-url
// Obter URL de consentimento
Response: {
  consentUrl: string
}
\`\`\`

#### 5. Webhooks

\`\`\`typescript
// POST /v1/webhooks/docusign
// Webhook do DocuSign (não requer autenticação)
Headers: {
  X-DocuSign-Signature: string
}
Request: DocuSignWebhookPayload
Response: {
  success: boolean
}

// POST /v1/webhooks/zoom
// Webhook do Zoom (não requer autenticação)
Headers: {
  Authorization: string (Zoom verification token)
}
Request: ZoomWebhookPayload
Response: {
  success: boolean
}
\`\`\`

#### 6. Integrações

\`\`\`typescript
// GET /v1/integrations
// Listar integrações do usuário
Response: {
  integrations: Array<{
    provider: 'zoom' | 'docusign' | 'openai'
    isActive: boolean
    expiresAt?: string
  }>
}

// POST /v1/integrations/:provider
// Configurar integração
Request: {
  credentials: Record<string, string>
}
Response: {
  integration: IntegrationCredential
}

// DELETE /v1/integrations/:provider
// Remover integração
Response: {
  success: boolean
}

// GET /v1/integrations/status
// Verificar status das integrações
Response: {
  zoom: {
    connected: boolean
    scopes: string[]
  }
  docusign: {
    connected: boolean
    consentRequired: boolean
    consentUrl?: string
  }
  openai: {
    connected: boolean
  }
}
\`\`\`

#### 7. Usuário

\`\`\`typescript
// GET /v1/user/profile
// Obter perfil do usuário
Response: {
  user: User
}

// PATCH /v1/user/profile
// Atualizar perfil
Request: {
  name?: string
  email?: string
}
Response: {
  user: User
}

// GET /v1/user/audit-logs
// Obter logs de auditoria
Query Params: {
  action?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}
Response: {
  logs: AuditLog[]
  pagination: PaginationInfo
}
\`\`\`

#### 8. Health & Status

\`\`\`typescript
// GET /v1/health
// Health check (não requer autenticação)
Response: {
  status: 'ok' | 'degraded' | 'down'
  timestamp: string
  services: {
    database: 'ok' | 'down'
    redis: 'ok' | 'down'
    zoom: 'ok' | 'down'
    docusign: 'ok' | 'down'
    openai: 'ok' | 'down'
  }
}

// GET /v1/metrics
// Métricas Prometheus (requer autenticação admin)
Response: Prometheus metrics format
\`\`\`

---

## 🔗 Integrações Externas

### 1. Zoom API

**Autenticação:** Server-to-Server OAuth

**Endpoints Utilizados:**
- `POST /oauth/token` - Obter access token
- `GET /users/me/meetings` - Listar reuniões
- `POST /users/me/meetings` - Criar reunião
- `GET /meetings/{meetingId}` - Detalhes da reunião
- `PATCH /meetings/{meetingId}` - Atualizar reunião
- `DELETE /meetings/{meetingId}` - Deletar reunião
- `GET /meetings/{meetingId}/recordings` - Obter gravações
- `POST /meetings/{meetingId}/registrants` - Adicionar participantes

**Configuração:**
\`\`\`typescript
interface ZoomConfig {
  clientId: string
  clientSecret: string
  accountId: string
  webhookSecretToken?: string
}
\`\`\`

**Rate Limits:**
- 10 requests/second por endpoint
- Implementar exponential backoff

**Error Handling:**
\`\`\`typescript
class ZoomAPIError extends Error {
  constructor(
    public code: number,
    public zoomCode: number,
    message: string
  ) {
    super(message)
  }
}

// Retry logic
async function callZoomAPI(endpoint: string, options: RequestOptions) {
  const maxRetries = 3
  let attempt = 0
  
  while (attempt < maxRetries) {
    try {
      const response = await fetch(endpoint, options)
      if (response.ok) return await response.json()
      
      if (response.status === 429) {
        // Rate limited - wait and retry
        const retryAfter = response.headers.get('Retry-After')
        await sleep(parseInt(retryAfter || '60') * 1000)
        attempt++
        continue
      }
      
      throw new ZoomAPIError(response.status, ...)
    } catch (error) {
      if (attempt === maxRetries - 1) throw error
      await sleep(Math.pow(2, attempt) * 1000)
      attempt++
    }
  }
}
\`\`\`

### 2. DocuSign API

**Autenticação:** JWT Grant (OAuth 2.0)

**Endpoints Utilizados:**
- `POST /oauth/token` - Obter access token
- `POST /accounts/{accountId}/envelopes` - Criar envelope
- `GET /accounts/{accountId}/envelopes/{envelopeId}` - Status do envelope
- `PUT /accounts/{accountId}/envelopes/{envelopeId}` - Atualizar envelope
- `POST /accounts/{accountId}/envelopes/{envelopeId}/void` - Cancelar envelope

**Configuração:**
\`\`\`typescript
interface DocuSignConfig {
  integrationKey: string
  userId: string
  accountId: string
  privateKey: string // PKCS#8 format
  basePath: string // demo.docusign.net or docusign.net
}
\`\`\`

**JWT Token Generation:**
\`\`\`typescript
import { SignJWT, importPKCS8 } from 'jose'

async function generateDocuSignJWT(config: DocuSignConfig): Promise<string> {
  const privateKey = await importPKCS8(config.privateKey, 'RS256')
  
  const jwt = await new SignJWT({
    scope: 'signature impersonation'
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(config.integrationKey)
    .setSubject(config.userId)
    .setAudience(config.basePath.includes('demo') 
      ? 'account-d.docusign.com' 
      : 'account.docusign.com')
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(privateKey)
  
  return jwt
}
\`\`\`

**Webhook Verification:**
\`\`\`typescript
import crypto from 'crypto'

function verifyDocuSignWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  const expectedSignature = hmac.digest('base64')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}
\`\`\`

### 3. OpenAI API

**Autenticação:** API Key

**Endpoints Utilizados:**
- `POST /v1/chat/completions` - Gerar atas

**Configuração:**
\`\`\`typescript
interface OpenAIConfig {
  apiKey: string
  model: string // 'gpt-4o-mini' ou 'gpt-4'
  maxTokens: number
  temperature: number
}
\`\`\`

**Implementação com Streaming:**
\`\`\`typescript
async function generateMinutes(
  transcript: string,
  meetingInfo: MeetingInfo
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: `Título: ${meetingInfo.topic}\nData: ${meetingInfo.startTime}\n\nTranscrição:\n${transcript}`
        }
      ],
      max_tokens: config.maxTokens,
      temperature: config.temperature
    })
  })
  
  if (!response.ok) {
    throw new OpenAIError(await response.json())
  }
  
  const data = await response.json()
  return data.choices[0].message.content
}
\`\`\`

---

## 🔐 Autenticação e Autorização

### JWT Authentication

**Token Structure:**
\`\`\`typescript
interface JWTPayload {
  sub: string // user ID
  email: string
  iat: number // issued at
  exp: number // expiration
  type: 'access' | 'refresh'
}
\`\`\`

**Token Generation:**
\`\`\`typescript
import jwt from 'jsonwebtoken'

function generateTokens(user: User) {
  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      type: 'access'
    },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  )
  
  const refreshToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  )
  
  return { accessToken, refreshToken }
}
\`\`\`

**Middleware de Autenticação:**
\`\`\`typescript
import { Request, Response, NextFunction } from 'express'

interface AuthRequest extends Request {
  user?: JWTPayload
}

async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid token' })
    }
    
    const token = authHeader.substring(7)
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    
    if (payload.type !== 'access') {
      return res.status(401).json({ error: 'Invalid token type' })
    }
    
    req.user = payload
    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' })
    }
    return res.status(401).json({ error: 'Invalid token' })
  }
}
\`\`\`

### RBAC (Role-Based Access Control)

\`\`\`typescript
enum Role {
  USER = 'user',
  ADMIN = 'admin'
}

enum Permission {
  READ_MEETINGS = 'read:meetings',
  WRITE_MEETINGS = 'write:meetings',
  DELETE_MEETINGS = 'delete:meetings',
  GENERATE_MINUTES = 'generate:minutes',
  SEND_FOR_SIGNATURE = 'send:signature',
  MANAGE_USERS = 'manage:users'
}

const rolePermissions: Record<Role, Permission[]> = {
  [Role.USER]: [
    Permission.READ_MEETINGS,
    Permission.WRITE_MEETINGS,
    Permission.GENERATE_MINUTES,
    Permission.SEND_FOR_SIGNATURE
  ],
  [Role.ADMIN]: Object.values(Permission)
}

function authorize(...requiredPermissions: Permission[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role || Role.USER
    const userPermissions = rolePermissions[userRole]
    
    const hasPermission = requiredPermissions.every(
      permission => userPermissions.includes(permission)
    )
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    
    next()
  }
}

// Usage
app.delete(
  '/v1/meetings/:id',
  authenticate,
  authorize(Permission.DELETE_MEETINGS),
  deleteMeeting
)
\`\`\`

---

## 🛡️ Segurança

### 1. Proteção de Dados Sensíveis

**Criptografia de Credenciais:**
\`\`\`typescript
import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex') // 32 bytes

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':')
  
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv)
  
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}
\`\`\`

### 2. Rate Limiting

\`\`\`typescript
import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL!)

// Global rate limit
const globalLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:global:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later'
})

// Endpoint-specific rate limit
const generateMinutesLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:generate:'
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 generations per hour
  message: 'Too many generation requests, please try again later'
})

app.use('/v1', globalLimiter)
app.post('/v1/meetings/:id/minutes', generateMinutesLimiter, generateMinutes)
\`\`\`

### 3. Input Validation

\`\`\`typescript
import { z } from 'zod'

const createMeetingSchema = z.object({
  topic: z.string().min(1).max(500),
  agenda: z.string().max(2000).optional(),
  startTime: z.string().datetime(),
  duration: z.number().int().min(15).max(480),
  participants: z.array(z.object({
    email: z.string().email(),
    name: z.string().max(255).optional()
  })).optional()
})

function validateRequest(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        })
      }
      next(error)
    }
  }
}

app.post(
  '/v1/meetings',
  authenticate,
  validateRequest(createMeetingSchema),
  createMeeting
)
\`\`\`

### 4. Security Headers

\`\`\`typescript
import helmet from 'helmet'

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:']
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}))
\`\`\`

### 5. CORS Configuration

\`\`\`typescript
import cors from 'cors'

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}

app.use(cors(corsOptions))
\`\`\`

### 6. Audit Logging

\`\`\`typescript
async function auditLog(
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  details: any,
  req: Request
) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      resourceType,
      resourceId,
      details,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }
  })
}

// Middleware
function auditMiddleware(action: string, resourceType: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res)
    
    res.json = function(body: any) {
      if (res.statusCode < 400) {
        auditLog(
          req.user!.sub,
          action,
          resourceType,
          req.params.id || body.id,
          { request: req.body, response: body },
          req
        ).catch(console.error)
      }
      return originalJson(body)
    }
    
    next()
  }
}
\`\`\`

---

## 🚀 Estratégia de Migração

### Fase 1: Preparação (Semana 1-2)

1. **Setup do Projeto Backend**
   \`\`\`bash
   mkdir backend
   cd backend
   npm init -y
   npm install express typescript @types/node @types/express
   npm install prisma @prisma/client
   npm install dotenv cors helmet express-rate-limit
   npm install winston pino
   npm install zod joi
   npm install jsonwebtoken bcrypt
   npm install ioredis
   \`\`\`

2. **Configuração do Banco de Dados**
   - Criar instância PostgreSQL
   - Executar migrations do Prisma
   - Configurar Redis para cache

3. **Estrutura de Pastas**
   \`\`\`
   backend/
   ├── src/
   │   ├── config/
   │   │   ├── database.ts
   │   │   ├── redis.ts
   │   │   └── env.ts
   │   ├── middleware/
   │   │   ├── auth.ts
   │   │   ├── validation.ts
   │   │   ├── errorHandler.ts
   │   │   └── rateLimit.ts
   │   ├── routes/
   │   │   ├── auth.routes.ts
   │   │   ├── meetings.routes.ts
   │   │   ├── minutes.routes.ts
   │   │   ├── docusign.routes.ts
   │   │   └── webhooks.routes.ts
   │   ├── controllers/
   │   │   ├── auth.controller.ts
   │   │   ├── meetings.controller.ts
   │   │   ├── minutes.controller.ts
   │   │   └── docusign.controller.ts
   │   ├── services/
   │   │   ├── zoom.service.ts
   │   │   ├── docusign.service.ts
   │   │   ├── openai.service.ts
   │   │   ├── pdf.service.ts
   │   │   └── email.service.ts
   │   ├── models/
   │   │   └── (Prisma generated)
   │   ├── utils/
   │   │   ├── logger.ts
   │   │   ├── crypto.ts
   │   │   └── errors.ts
   │   ├── types/
   │   │   └── index.ts
   │   └── index.ts
   ├── prisma/
   │   ├── schema.prisma
   │   └── migrations/
   ├── tests/
   ├── .env.example
   ├── tsconfig.json
   └── package.json
   \`\`\`

### Fase 2: Migração Gradual (Semana 3-6)

**Estratégia: Strangler Fig Pattern**

1. **Semana 3: Autenticação e Usuários**
   - Implementar endpoints de auth no backend
   - Manter API routes do Next.js funcionando
   - Frontend começa a usar backend para auth

2. **Semana 4: Reuniões**
   - Migrar endpoints de meetings
   - Proxy requests do Next.js para backend
   - Testar em paralelo

3. **Semana 5: Atas e DocuSign**
   - Migrar geração de atas
   - Migrar integração DocuSign
   - Configurar webhooks

4. **Semana 6: Finalização**
   - Remover API routes do Next.js
   - Atualizar frontend para usar apenas backend
   - Testes end-to-end

**Proxy Temporário no Next.js:**
\`\`\`typescript
// app/api/[...proxy]/route.ts
export async function GET(request: Request) {
  const url = new URL(request.url)
  const backendUrl = `${process.env.BACKEND_URL}${url.pathname.replace('/api', '/v1')}`
  
  const response = await fetch(backendUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body
  })
  
  return new Response(response.body, {
    status: response.status,
    headers: response.headers
  })
}
\`\`\`

### Fase 3: Otimização (Semana 7-8)

1. **Performance**
   - Implementar caching com Redis
   - Otimizar queries do banco
   - Adicionar índices

2. **Monitoramento**
   - Configurar APM (Application Performance Monitoring)
   - Adicionar métricas Prometheus
   - Configurar alertas

3. **Documentação**
   - Gerar documentação OpenAPI/Swagger
   - Documentar fluxos de integração
   - Criar guias de troubleshooting

---

## 🏗️ Infraestrutura e Deploy

### Arquitetura de Deploy

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                      Load Balancer (Nginx)                   │
│                    SSL Termination (Let's Encrypt)           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      API Servers (3 instances)               │
│                    Node.js + Express + PM2                   │
│                    Auto-scaling (CPU > 70%)                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────┬──────────────────┬──────────────────────┐
│   PostgreSQL     │      Redis       │    File Storage      │
│   (Primary +     │   (Cluster)      │    (S3/Blob)         │
│    Replica)      │                  │                      │
└──────────────────┴──────────────────┴──────────────────────┘
\`\`\`

### Docker Configuration

**Dockerfile:**
\`\`\`dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001

CMD ["npm", "start"]
\`\`\`

**docker-compose.yml:**
\`\`\`yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@postgres:5432/meetings
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1'
          memory: 1G

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=meetings
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
\`\`\`

### CI/CD Pipeline (GitHub Actions)

\`\`\`yaml
name: Deploy Backend

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Run linter
        run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t backend:${{ github.sha }} .
        
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push backend:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /app/backend
            docker-compose pull
            docker-compose up -d
            docker-compose exec api npx prisma migrate deploy
\`\`\`

### Monitoramento

**Prometheus + Grafana:**
\`\`\`typescript
import promClient from 'prom-client'

const register = new promClient.Registry()

// Métricas padrão
promClient.collectDefaultMetrics({ register })

// Métricas customizadas
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
})

const meetingsCreated = new promClient.Counter({
  name: 'meetings_created_total',
  help: 'Total number of meetings created',
  registers: [register]
})

const minutesGenerated = new promClient.Counter({
  name: 'minutes_generated_total',
  help: 'Total number of minutes generated',
  registers: [register]
})

// Endpoint de métricas
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType)
  res.end(await register.metrics())
})
\`\`\`

### Variáveis de Ambiente

\`\`\`bash
# .env.example

# Server
NODE_ENV=production
PORT=3001
API_VERSION=v1

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/meetings
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Encryption
ENCRYPTION_KEY=your-32-byte-hex-key-here

# Zoom
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=
ZOOM_ACCOUNT_ID=
ZOOM_WEBHOOK_SECRET=

# DocuSign
DOCUSIGN_INTEGRATION_KEY=
DOCUSIGN_USER_ID=
DOCUSIGN_ACCOUNT_ID=
DOCUSIGN_PRIVATE_KEY=
DOCUSIGN_BASE_PATH=https://demo.docusign.net
DOCUSIGN_WEBHOOK_SECRET=

# OpenAI
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.7

# File Storage
STORAGE_TYPE=s3 # or 'blob' or 'local'
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Monitoring
ENABLE_METRICS=true
SENTRY_DSN=
\`\`\`

---

## 📚 Recursos Adicionais

### Documentação Recomendada

- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Zoom API Reference](https://marketplace.zoom.us/docs/api-reference)
- [DocuSign API Guide](https://developers.docusign.com/docs/esign-rest-api/)
- [OpenAI API Documentation](https://platform.openai.com/docs)

### Ferramentas de Desenvolvimento

- **API Testing:** Postman, Insomnia, Thunder Client
- **Database Management:** pgAdmin, DBeaver
- **Monitoring:** Grafana, Prometheus, Sentry
- **Logging:** ELK Stack, Datadog
- **Load Testing:** k6, Apache JMeter

### Checklist de Produção

- [ ] Todas as variáveis de ambiente configuradas
- [ ] Banco de dados com backups automáticos
- [ ] SSL/TLS configurado
- [ ] Rate limiting implementado
- [ ] Logging estruturado configurado
- [ ] Monitoramento e alertas ativos
- [ ] Documentação API atualizada
- [ ] Testes automatizados passando
- [ ] CI/CD pipeline funcionando
- [ ] Disaster recovery plan documentado
- [ ] Security audit realizado
- [ ] Performance testing concluído

---

## 🎯 Próximos Passos

1. **Revisar e aprovar esta especificação**
2. **Definir prioridades e timeline**
3. **Configurar ambiente de desenvolvimento**
4. **Iniciar implementação fase 1**
5. **Configurar CI/CD**
6. **Implementar monitoramento**
7. **Realizar testes de carga**
8. **Deploy em produção**

---

**Versão:** 1.0  
**Data:** 2025-01-15  
**Autor:** Sistema de Documentação Automática
