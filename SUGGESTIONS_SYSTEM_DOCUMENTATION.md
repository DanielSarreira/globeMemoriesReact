# 📋 Sistema de Sugestões e Reportagem de Erros - Documentação Completa

## 🎯 Visão Geral

Sistema completo implementado na aplicação **Globe Memories** que permite aos viajantes (utilizadores) reportar erros encontrados e sugerir melhorias. Cada contribuição é recompensada com pontos de conquista.

## 📁 Ficheiros Criados

### Frontend (React)

#### 1. **SuggestionModal.js** 
- Componente modal principal para reportar erros/sugestões
- Localização: `src/components/SuggestionModal.js`
- Funcionalidades:
  - Seleção entre "Erro" ou "Sugestão"
  - Detecção automática da página atual
  - Upload de captura de ecrã (até 5MB)
  - Campos para descrição detalhada
  - Passos para reproduzir (apenas para erros)
  - Integração com sistema de pontos de conquista

#### 2. **SuggestionButton.js**
- Botão flutuante no Header
- Localização: `src/components/SuggestionButton.js`
- Ativa o modal ao clique
- Estilos responsivos (texto em desktop, apenas ícone em mobile)

#### 3. **AdminSuggestionsManager.js**
- Dashboard de admin para gerenciar sugestões
- Localização: `src/components/admin/AdminSuggestionsManager.js`
- Funcionalidades:
  - Visualizar todas as sugestões
  - Filtrar por status e tipo
  - Ver estatísticas
  - Atualizar prioridade e status
  - Adicionar respostas
  - Visualização detalhada com screenshot

### Estilos (CSS)

#### 1. **suggestion-modal.css**
- Localização: `src/styles/components/suggestion-modal.css`
- Estilos do modal principal
- Animações suaves
- Design responsivo completo

#### 2. **suggestion-button.css**
- Localização: `src/styles/components/suggestion-button.css`
- Estilos do botão no header
- Animações e efeitos hover
- Responsivo para mobile

#### 3. **admin-suggestions.css**
- Localização: `src/styles/components/admin-suggestions.css`
- Estilos da interface de admin
- Cards, filtros e modais
- Layout responsivo

### Backend (Referência)

#### **BACKEND_SUGGESTIONS_IMPLEMENTATION.js**
- Localização: `src/docs/BACKEND_SUGGESTIONS_IMPLEMENTATION.js`
- Schema MongoDB completo
- Endpoints REST
- Integração com pontos de conquista
- Sistema de voting (upvote/downvote)
- Respostas de admin

## 🚀 Como Integrar

### Passo 1: Adicionar ao Header

Já está feito! O botão foi adicionado automaticamente ao `Header.js`

### Passo 2: Implementar Backend (Node.js/Express)

```javascript
// No seu routes/suggestions.js
const express = require('express');
const multer = require('multer');
const Suggestion = require('../models/Suggestion');

const router = express.Router();
const upload = multer({ dest: 'uploads/suggestions' });

router.post('/create', upload.single('screenshot'), async (req, res) => {
  // Implementação conforme BACKEND_SUGGESTIONS_IMPLEMENTATION.js
});

module.exports = router;

// Em app.js
app.use('/api/suggestions', require('./routes/suggestions'));
```

### Passo 3: Configurar Mongoose Schema

```javascript
// models/Suggestion.js
const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema({
  userId: String,
  username: String,
  type: { type: String, enum: ['error', 'suggestion'] },
  status: { type: String, enum: ['pending', 'reviewing', 'approved', 'rejected', 'implemented'] },
  page: String,
  title: String,
  description: String,
  steps: String,
  screenshot: {
    filename: String,
    url: String
  },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
  votes: {
    upvotes: Number,
    downvotes: Number,
    votersUp: [String],
    votersDown: [String]
  },
  responses: [{
    adminId: String,
    adminName: String,
    message: String,
    timestamp: Date
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Suggestion', suggestionSchema);
```

### Passo 4: Sistema de Pontos de Conquista

```javascript
// Pontos atribuídos:
// - Erro reportado: 50 pontos
// - Sugestão: 30 pontos

// Em axios_helper.js ou api.js, garantir:
const submitData = new FormData();
submitData.append('userId', user.id);
submitData.append('type', formData.type);
// ... outros campos

const response = await request('post', '/api/suggestions/create', submitData);
// Response contém: achievementPoints
```

### Passo 5: Adicionar ao Admin Dashboard

```javascript
// components/admin/AdminDashboard.js
import AdminSuggestionsManager from './AdminSuggestionsManager';

// Adicionar na página de admin:
<AdminSuggestionsManager />
```

## 📊 Endpoints Backend

### Criar Sugestão
```
POST /api/suggestions/create
Content-Type: multipart/form-data

Body:
- userId (required)
- username (required)
- type: 'error' | 'suggestion' (required)
- page (required)
- title (required)
- description (required)
- steps (optional)
- screenshot (optional, max 5MB)

Response:
{
  success: true,
  achievementPoints: 50,
  suggestion: { id, type, status, createdAt }
}
```

### Listar Sugestões do Utilizador
```
GET /api/suggestions/user/:userId

Response:
{
  success: true,
  total: number,
  suggestions: []
}
```

### Admin - Listar Todas
```
GET /api/suggestions/admin/all?status=pending&type=error&page=/travels

Response:
{
  success: true,
  total: number,
  suggestions: []
}
```

### Atualizar Status
```
PATCH /api/suggestions/:id/status

Body:
{
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'implemented',
  priority: 'low' | 'medium' | 'high' | 'critical',
  adminNotes: string
}
```

### Adicionar Resposta
```
POST /api/suggestions/:id/response

Body:
{
  adminId: string,
  adminName: string,
  message: string
}
```

### Votar
```
POST /api/suggestions/:id/vote

Body:
{
  userId: string,
  voteType: 'up' | 'down'
}
```

## 🎨 UI/UX

### Modal de Sugestão
- ✅ Seletor de tipo (Erro/Sugestão)
- ✅ Detecção automática de página
- ✅ Campo de título (100 caracteres max)
- ✅ Campo de descrição (1000 caracteres max)
- ✅ Passos para reproduzir (apenas erros)
- ✅ Upload de screenshot (PNG, JPEG, GIF, max 5MB)
- ✅ Animações suaves
- ✅ Totalmente responsivo

### Dashboard Admin
- ✅ Visualização de estatísticas
- ✅ Filtros por status e tipo
- ✅ Lista de sugestões com preview
- ✅ Modal de detalhe
- ✅ Sistema de gerenciamento de status
- ✅ Respostas do admin
- ✅ Sistema de voting

## 🔐 Segurança

1. **Upload de ficheiros**
   - Validação de tipo (apenas imagens)
   - Limite de tamanho: 5MB
   - Nomeação segura

2. **Dados**
   - Validação de campos obrigatórios
   - Sanitização de inputs
   - Rate limiting recomendado

3. **Autenticação**
   - Apenas utilizadores autenticados podem reportar
   - Admin requere autenticação especial

## 📱 Responsividade

### Desktop
- Botão com texto: "Feedback"
- Modal com largura máxima de 600px
- Layout com múltiplas colunas

### Tablet
- Botão com texto ainda visível
- Modal 90% da largura
- Filtros em coluna

### Mobile
- Botão apenas com ícone
- Modal em tela cheia (95%)
- Formulário em single column
- Tudo scrollável

## ⚡ Performance

1. **Lazy loading** - Imports otimizados
2. **CSS Crítico** - Inlined onde necessário
3. **Compressão** - Images otimizadas
4. **Caching** - LocalStorage para dados
5. **Throttling** - Limite de submissões

## 🔄 Integração com AuthContext

O sistema usa `useAuth()` para obter:
- `user.id`
- `user.username`
- `user.email` (opcional)

Certifique-se que o contexto está configurado:

```javascript
const { user } = useAuth();
// user = { id, username, email, profilePicture, ... }
```

## 📈 Métricas e Analytics

Backend deve registar:
1. Número de sugestões por tipo
2. Tempo de resolução
3. Taxa de implementação
4. Utilizadores mais ativos
5. Páginas com mais erros

## 🚨 Tratamento de Erros

```javascript
// O sistema trata:
- Ficheiro demasiado grande
- Tipo de ficheiro inválido
- Campos obrigatórios em falta
- Falha de conexão com backend
- Timeout de submissão
```

## 🎯 Fluxo Completo

1. **Utilizador clica em "Feedback"** no header
2. **Modal abre** com formulário
3. **Preenche informações** sobre erro/sugestão
4. **Anexa captura** de ecrã (opcional)
5. **Clica "Enviar"**
6. **Frontend valida** e envia para backend
7. **Backend processa** e salva no BD
8. **Retorna pontos** de conquista
9. **Admin recebe notificação** (implementar)
10. **Admin revê** no AdminSuggestionsManager
11. **Admin responde** e atualiza status
12. **Utilizador recebe feedback**

## ✅ Checklist de Implementação

- [ ] Copiou `SuggestionModal.js` para `src/components/`
- [ ] Copiou `SuggestionButton.js` para `src/components/`
- [ ] Copiou CSS files para `src/styles/components/`
- [ ] Header.js foi atualizado ✅ (já feito)
- [ ] Backend configurado com MongoDB
- [ ] Endpoints de sugestão implementados
- [ ] AdminSuggestionsManager integrado em admin dashboard
- [ ] Sistema de pontos de conquista conectado
- [ ] Testes de funcionalidade concluídos
- [ ] Testes responsivos em mobile/tablet
- [ ] Notificações de admin configuradas

## 🆘 Troubleshooting

### Modal não abre
- Verificar se `SuggestionButton` foi adicionado ao Header
- Verificar import em Header.js

### Upload não funciona
- Verificar se backend tem `multer` instalado
- Verificar permissões de pasta `uploads/`
- Verificar CORS se backend em domínio diferente

### Pontos não aparecem
- Verificar se response contém `achievementPoints`
- Verificar integração com Achievement context

### Admin dashboard não carrega
- Verificar autenticação de admin
- Verificar permissões de rota
- Verificar se backend retorna dados

## 📞 Suporte

Para questões ou problemas, verifique:
1. Console do browser (F12)
2. Logs do backend
3. Network tab (requisições HTTP)
4. MongoDB logs

---

**Desenvolvido para Globe Memories** 🌍✈️
