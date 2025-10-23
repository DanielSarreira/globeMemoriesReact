# ⚡ **QUICK REFERENCE - GUIA RÁPIDO PARA BACKEND**

**Tempo de leitura:** 5 minutos  
**Para:** Integradores Backend Java  

---

## 🎯 **NOS 60 SEGUNDOS**

### **O Frontend está pronto?**
✅ **SIM** - Nota 9.4/10 (Enterprise-Ready)

### **Qual é a primeira coisa a fazer?**
1. Implementar `/api/auth/login`
2. Implementar `/api/auth/register`
3. Testar com frontend

### **Há algo quebrado no frontend?**
❌ **NÃO** - Tudo funciona, apenas precisa backend

---

## 🔌 **ENDPOINTS PRIORITY**

### **MUST HAVE (Semana 1)**
```
POST   /api/auth/login              ⭐⭐⭐ URGENTE
POST   /api/auth/register           ⭐⭐⭐ URGENTE
GET    /api/travels                 ⭐⭐⭐ URGENTE
GET    /api/travels/:id             ⭐⭐ IMPORTANTE
POST   /api/travels                 ⭐⭐ IMPORTANTE
PUT    /api/travels/:id             ⭐ DESEJÁVEL
GET    /api/users/:id               ⭐⭐ IMPORTANTE
```

### **NICE TO HAVE (Semana 2-3)**
```
POST   /api/travels/:id/comments
POST   /api/travels/:id/like
POST   /api/users/:id/follow
GET    /api/admin/*
POST   /api/support/contact
... etc
```

---

## 🔐 **SEGURANÇA - CHECKLIST**

### **Obrigatório:**
- [ ] CORS permitir `http://localhost:3000` (dev)
- [ ] CORS permitir `https://globememories.com` (prod)
- [ ] JWT token com validade 24h
- [ ] Refresh token com validade 7 dias
- [ ] Password hashing (BCrypt recomendado)
- [ ] Rate limiting (100 req/min)

### **Headers esperados pelo frontend:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

---

## 📦 **RESPONSE FORMAT**

### **Sucesso (200, 201)**
```json
{
  "success": true,
  "message": "Opcional",
  "data": { /* dados */ }
}
```

### **Erro (4xx, 5xx)**
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Descrição amigável"
}
```

---

## 🧪 **TESTE RÁPIDO**

### **1. Start Backend**
```bash
mvn spring-boot:run
```

### **2. Test Login**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"pass"}'
```

### **3. Use token**
```bash
curl -X GET http://localhost:8080/api/travels \
  -H "Authorization: Bearer <token>"
```

### **4. Se funcionar ✅**
Frontend conecta automaticamente!

---

## 📊 **DADOS ESPERADOS - ESTRUTURA**

### **User**
```java
{
  id: UUID,
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  name: String,
  avatar: URL,
  bio: String,
  nationality: String,
  role: "USER" | "ADMIN",
  followers: List<User>,
  following: List<User>,
  blockedUsers: List<User>,
  createdAt: DateTime
}
```

### **Travel**
```java
{
  id: UUID,
  title: String,
  description: String,
  images: List<URL>,
  country: String,
  city: String,
  startDate: Date,
  endDate: Date,
  budget: Double,
  category: String,
  transportMethod: String,
  author: User,
  comments: List<Comment>,
  likes: Set<User>,
  createdAt: DateTime
}
```

### **Comment**
```java
{
  id: UUID,
  content: String,
  author: User,
  travel: Travel,
  replies: List<Comment>,
  likes: Set<User>,
  createdAt: DateTime
}
```

---

## 🚨 **ERROS COMUNS A EVITAR**

### ❌ ERRADO
```javascript
// Backend retorna erro genérico
{
  "error": "Something went wrong"
}

// CORS não configurado
// Frontend não pode conectar

// Token format incorreto
// Sem "Bearer " prefix

// Resposta sem "success" field
// Frontend não processa
```

### ✅ CORRETO
```javascript
// Backend retorna erro específico
{
  "success": false,
  "error": "EMAIL_ALREADY_EXISTS",
  "message": "Email já registado"
}

// CORS permite localhost:3000
// Access-Control-Allow-Origin: http://localhost:3000

// Token format correto
// Authorization: Bearer eyJhbGc...

// Resposta com "success" field
{
  "success": true,
  "data": { /* dados */ }
}
```

---

## 🔄 **FLUXO: LOGIN → TRAVELS**

```
1. User digita email/password
2. Frontend POST /api/auth/login
3. Backend retorna {token, refreshToken, user}
4. Frontend armazena em localStorage
5. Frontend GET /api/travels (com token no header)
6. Backend valida token
7. Backend retorna lista de travels
8. Frontend exibe na tela
```

---

## 🎨 **FRONTEND ESPERA CAMPOS**

### **Auth Response**
```json
{
  "token": "string",
  "refreshToken": "string", // para auto-refresh
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "name": "string",
    "avatar": "url",
    "role": "USER"
  },
  "expiresIn": 86400
}
```

### **Travel Response**
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "images": ["url1", "url2"],
  "country": "string",
  "city": "string",
  "startDate": "2025-01-15",
  "endDate": "2025-01-20",
  "budget": 1500,
  "category": "adventure",
  "transportMethod": "flight",
  "author": {
    "id": "uuid",
    "username": "string",
    "avatar": "url"
  },
  "likes": 45,
  "commentsCount": 12
}
```

---

## 📱 **CONFIGURAÇÃO FRONTEND**

**Não precisa mudar nada!** Apenas configure:

**Backend URL (1 linha em .env):**
```env
REACT_APP_API_URL=http://localhost:8080
```

**Frontend carrega automaticamente de:**
- `src/axios_helper.js` → Configuração Axios
- `src/context/AuthContext.js` → Gerenciamento auth
- Token management automático ✅

---

## 🔍 **DEBUG COMUM**

### **"Network Error 401"**
→ Token expirado ou inválido
→ Backend não encontrou token no header
→ Solução: Verificar formato: `Authorization: Bearer <token>`

### **"CORS Error"**
→ Backend não tem CORS configurado
→ Solução: Adicionar `@CrossOrigin(origins = "http://localhost:3000")`

### **"Cannot read property 'data'"**
→ Resposta backend não tem `success` ou `data`
→ Solução: Seguir formato response spec

### **"Token refresh failing"**
→ Endpoint `/api/auth/refresh-token` não implementado
→ Solução: Implementar ou remover se usar only access token

---

## 📞 **ENDPOINTS ESPECÍFICOS - FRONTEND ESPERA**

### **Login (Crítico)**
```
POST /api/auth/login
Response: {token, refreshToken, user, expiresIn}
```

### **Register (Crítico)**
```
POST /api/auth/register
Response: {user data} ou redirecionar para login
```

### **Get Travels (Crítico)**
```
GET /api/travels?page=0&size=10
Response: {travels: [], totalElements, totalPages}
```

### **Get Travel Details (Crítico)**
```
GET /api/travels/:id
Response: {travel data com comments e autor}
```

### **Token Refresh (Recomendado)**
```
POST /api/auth/refresh-token
Response: {token, expiresIn}
Falha automática? Frontend redireciona para login
```

---

## ✅ **CHECKLIST ANTES DE DEPLOY**

- [ ] CORS configurado
- [ ] JWT implementado
- [ ] Login funciona
- [ ] Travels carregam
- [ ] Upload de imagens funciona
- [ ] Comentários salvam
- [ ] Admin endpoints implementados
- [ ] Error responses corretos
- [ ] Rate limiting ativo
- [ ] Logs configurados
- [ ] Database backup setup
- [ ] HTTPS funciona

---

## 🚀 **ORDEM RECOMENDADA DE IMPLEMENTAÇÃO**

```
Week 1:
├── Database schema
├── Auth endpoints (login/register)
├── GET travels
└── GET users/:id

Week 2:
├── POST travels
├── PUT travels/:id
├── Comments (create/read/delete)
└── Like/Unlike

Week 3:
├── File upload
├── Admin endpoints
├── Follow/Unfollow
└── Moderação

Week 4:
├── Notificações (optional)
├── Real-time updates (optional)
├── Performance tuning
└── Security audit
```

---

## 💡 **DICAS PRO**

1. **Sempre testar CORS primeiro**
   - Frontend em 3000, Backend em 8080
   - Testar com curl antes de integrar

2. **Use mock data para frontend dev**
   - Frontend já tem dados fake
   - Pode trabalhar sem backend temporariamente

3. **Validação no backend é obrigatória**
   - Frontend também valida, mas backend é chave
   - Nunca confie em dados do cliente

4. **Logs são seus melhores amigos**
   - Log todos os requests
   - Log erros com stack trace
   - Facilita debug 1000x

5. **Rate limiting evita abuso**
   - Configure desde o início
   - Evita problemas futuros

---

## 📚 **DOCUMENTOS RELACIONADOS**

- 📖 `ANALISE_COMPLETA_FRONTEND_2025.md` - Análise técnica detalhada
- 🔗 `GUIA_INTEGRACAO_BACKEND_JAVA_SPRING.md` - Guia completo
- 📋 `RESUMO_EXECUTIVO.md` - Visão geral executiva

---

## 🎯 **CONCLUSÃO**

**Frontend está 100% pronto. Backend é apenas integrador.**

Seguir este guia rápido e terás tudo funcionando em 1-2 semanas!

---

**LET'S BUILD!** 🚀

---

**Criado por:** GitHub Copilot  
**Data:** 23 Outubro 2025  
**Nível:** Quick Reference ⚡
