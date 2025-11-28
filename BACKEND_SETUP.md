# Configuração do Backend Externo

Este guia explica como configurar e conectar um backend externo ao aplicativo.

## Status Atual

Atualmente, o aplicativo está configurado para tentar se conectar a um backend em:
\`\`\`
http://192.168.1.18:3000
\`\`\`

Se a conexão falhar, o aplicativo automaticamente usa as rotas de API locais do Next.js como fallback.

## Pré-requisitos

Para usar um backend externo, você precisa:

1. **Servidor Backend Rodando**: Um servidor backend deve estar rodando em `http://192.168.1.18:3000`
2. **CORS Configurado**: O backend deve permitir requisições do frontend (CORS)
3. **Endpoints Implementados**: O backend deve implementar todos os endpoints necessários

## Configuração do Frontend

### 1. Variável de Ambiente

Adicione a seguinte variável de ambiente ao seu projeto:

\`\`\`env
NEXT_PUBLIC_API_URL=http://192.168.1.18:3000
\`\`\`

**Nota**: Use `NEXT_PUBLIC_` para variáveis que precisam estar disponíveis no cliente (browser).

### 2. Verificar Conexão

O aplicativo tentará automaticamente se conectar ao backend. Você pode verificar o status na interface:

- ✅ **Verde**: Conectado ao backend externo
- ⚠️ **Amarelo**: Usando fallback (API local)
- ❌ **Vermelho**: Erro de conexão

## Configuração do Backend

### 1. CORS (Obrigatório)

O backend DEVE configurar CORS para permitir requisições do frontend:

**Express.js exemplo:**
\`\`\`javascript
const cors = require('cors');

app.use(cors({
  origin: ['http://localhost:3000', 'https://seu-dominio.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
\`\`\`

**Fastify exemplo:**
\`\`\`javascript
await fastify.register(require('@fastify/cors'), {
  origin: ['http://localhost:3000', 'https://seu-dominio.vercel.app'],
  credentials: true
});
\`\`\`

### 2. Endpoints Necessários

O backend deve implementar os seguintes endpoints:

#### Health Check
\`\`\`
GET /health
Response: { status: "ok" }
\`\`\`

#### Status do Sistema
\`\`\`
GET /api/status
Response: {
  zoom: { configured: boolean, connected: boolean, message: string },
  openai: { configured: boolean, connected: boolean, message: string },
  docusign: { configured: boolean, connected: boolean, message: string },
  backend: { configured: boolean, connected: boolean, url: string, message: string }
}
\`\`\`

#### Listar Reuniões
\`\`\`
GET /api/meetings/list
Response: {
  meetings: Array<{
    id: string,
    topic: string,
    start_time: string,
    duration: number,
    status: string,
    join_url: string
  }>
}
\`\`\`

#### Criar Reunião
\`\`\`
POST /api/meetings/create
Body: {
  topic: string,
  start_time: string,
  duration: number,
  agenda?: string,
  settings?: object
}
Response: { meeting: object }
\`\`\`

#### Obter Detalhes da Reunião
\`\`\`
GET /api/meeting/:meetingId
Response: { meeting: object }
\`\`\`

#### Atualizar Reunião (Adicionar Participantes)
\`\`\`
PUT /api/meeting/:meetingId
Body: {
  invitees: Array<{ email: string }>
}
Response: { success: boolean }
\`\`\`

#### Gerar Ata da Reunião
\`\`\`
POST /api/meetings/generate-ata
Body: {
  meetingId: string,
  meetingTitle: string,
  participants: string[],
  sendToDocuSign: boolean
}
Response: {
  success: boolean,
  ataContent: string,
  pdfUrl?: string,
  envelopeId?: string
}
\`\`\`

#### Download de Arquivo
\`\`\`
GET /api/meetings/download/:filename
Response: File download
\`\`\`

#### DocuSign - Enviar Envelope
\`\`\`
POST /api/docusign/send-envelope
Body: {
  documentBase64: string,
  documentName: string,
  signers: Array<{ email: string, name: string }>
}
Response: {
  envelopeId: string,
  status: string
}
\`\`\`

#### DocuSign - Status do Envelope
\`\`\`
GET /api/docusign/envelope-status/:envelopeId
Response: {
  status: string,
  sentDateTime: string,
  statusChangedDateTime: string,
  recipients: Array<object>
}
\`\`\`

#### DocuSign - Webhook
\`\`\`
POST /api/docusign/webhook
Body: DocuSign webhook payload
Response: { received: true }
\`\`\`

## Testando a Conexão

### 1. Teste Manual

Use curl ou Postman para testar o backend:

\`\`\`bash
# Health check
curl http://192.168.1.18:3000/health

# Status
curl http://192.168.1.18:3000/api/status

# Listar reuniões
curl http://192.168.1.18:3000/api/meetings/list
\`\`\`

### 2. Logs do Console

Abra o console do navegador (F12) e procure por logs com `[v0]`:

\`\`\`
[v0] Attempting to fetch from: http://192.168.1.18:3000/api/status
[v0] Successfully fetched from external backend
\`\`\`

Ou, se houver erro:

\`\`\`
[v0] Failed to fetch from external backend: TypeError: Failed to fetch
[v0] Falling back to local API route: /api/status
\`\`\`

## Problemas Comuns

### 1. "Failed to fetch"

**Causa**: O backend não está rodando ou não é acessível.

**Solução**:
- Verifique se o backend está rodando: `curl http://192.168.1.18:3000/health`
- Verifique se o IP e porta estão corretos
- Verifique firewall e configurações de rede

### 2. "CORS Error"

**Causa**: O backend não está configurado para aceitar requisições do frontend.

**Solução**:
- Configure CORS no backend (veja seção acima)
- Adicione a origem do frontend na lista de origens permitidas

### 3. "404 Not Found"

**Causa**: O endpoint não existe no backend.

**Solução**:
- Verifique se todos os endpoints necessários estão implementados
- Verifique a rota exata (com ou sem `/api/` no início)

### 4. "Network Error"

**Causa**: Problema de rede ou firewall.

**Solução**:
- Verifique se o backend está acessível na rede
- Verifique configurações de firewall
- Tente acessar o backend diretamente no navegador

## Modo Fallback

Se o backend externo não estiver disponível, o aplicativo automaticamente usa as rotas de API locais do Next.js. Isso permite que o aplicativo continue funcionando mesmo sem o backend externo.

Para desabilitar o fallback e forçar o uso do backend externo, você pode modificar a função `fetchWithFallback` em `lib/api-config.ts`.

## Variáveis de Ambiente do Backend

O backend precisa das seguintes variáveis de ambiente:

\`\`\`env
# Zoom
ZOOM_CLIENT_ID=seu_client_id
ZOOM_CLIENT_SECRET=seu_client_secret
ZOOM_ACCOUNT_ID=seu_account_id

# OpenAI
OPENAI_API_KEY=sua_api_key

# DocuSign
INTEGRATION_KEY=sua_integration_key
USER_ID=seu_user_id
ACCOUNT_ID=seu_account_id
DOCUSIGN_PRIVATE_KEY=sua_private_key_pkcs8
DOCUSIGN_BASE_PATH=https://demo.docusign.net

# Servidor
PORT=3000
HOST=0.0.0.0
\`\`\`

## Próximos Passos

1. Implemente o backend seguindo a especificação em `BACKEND_SPECIFICATION.md`
2. Configure as variáveis de ambiente
3. Inicie o backend em `http://192.168.1.18:3000`
4. Configure `NEXT_PUBLIC_API_URL` no frontend
5. Teste a conexão

Para mais detalhes sobre a implementação do backend, consulte `BACKEND_SPECIFICATION.md`.
