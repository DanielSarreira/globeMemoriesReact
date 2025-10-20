# 🚀 Guia de Integração - Sistema de Sugestões

## ✅ PASSO 1: Frontend está Completo!

Todos os componentes React foram criados e o Header.js foi atualizado automaticamente.

### Ficheiros criados:
```
✅ src/components/SuggestionModal.js
✅ src/components/SuggestionButton.js
✅ src/components/admin/AdminSuggestionsManager.js
✅ src/styles/components/suggestion-modal.css
✅ src/styles/components/suggestion-button.css
✅ src/styles/components/admin-suggestions.css
✅ src/components/Header.js (ATUALIZADO)
```

---

## 📦 PASSO 2: Implementar Backend (Node.js/Express)

### 2.1 - Instalar Dependências

```bash
npm install mongoose multer dotenv
```

### 2.2 - Criar Model Mongoose

Crie o ficheiro `backend/models/Suggestion.js`:

```javascript
const mongoose = require('mongoose');

const SuggestionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  username: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['error', 'suggestion'],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'approved', 'rejected', 'implemented'],
    default: 'pending',
    index: true
  },
  page: String,
  title: String,
  description: String,
  steps: String,
  screenshot: {
    filename: String,
    url: String,
    uploadedAt: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  votes: {
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    votersUp: [String],
    votersDown: [String]
  },
  responses: [{
    adminId: String,
    adminName: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now },
  resolvedAt: Date
}, { timestamps: true });

SuggestionSchema.index({ userId: 1, createdAt: -1 });
SuggestionSchema.index({ status: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('Suggestion', SuggestionSchema);
```

### 2.3 - Criar Routes

Crie o ficheiro `backend/routes/suggestions.js`:

```javascript
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Suggestion = require('../models/Suggestion');

const router = express.Router();

// Configurar multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/suggestions');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'suggestion-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas ficheiros PNG, JPEG e GIF são permitidos'));
    }
  }
});

// POST - Criar sugestão
router.post('/create', upload.single('screenshot'), async (req, res) => {
  try {
    const { userId, username, type, page, title, description, steps } = req.body;

    if (!userId || !username || !type || !page || !title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios em falta'
      });
    }

    const suggestion = new Suggestion({
      userId,
      username,
      type,
      page,
      title,
      description,
      steps: steps || null,
      priority: type === 'error' ? 'high' : 'medium'
    });

    if (req.file) {
      suggestion.screenshot = {
        filename: req.file.filename,
        url: `/uploads/suggestions/${req.file.filename}`,
        uploadedAt: new Date()
      };
    }

    await suggestion.save();

    // ATUALIZAR PONTOS (integrar com seu sistema de achievements)
    const achievementPoints = type === 'error' ? 50 : 30;
    
    // TODO: await User.findByIdAndUpdate(userId, {
    //   $inc: { 'achievements.points': achievementPoints }
    // });

    res.status(201).json({
      success: true,
      message: 'Sugestão enviada com sucesso',
      suggestion: {
        id: suggestion._id,
        type: suggestion.type,
        status: suggestion.status,
        createdAt: suggestion.createdAt
      },
      achievementPoints: achievementPoints
    });

  } catch (error) {
    console.error('Erro ao criar sugestão:', error);
    
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Erro ao eliminar ficheiro:', err);
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro ao enviar sugestão: ' + error.message
    });
  }
});

// GET - Sugestões do utilizador
router.get('/user/:userId', async (req, res) => {
  try {
    const suggestions = await Suggestion.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      total: suggestions.length,
      suggestions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter sugestões'
    });
  }
});

// GET - Admin: Todas as sugestões
router.get('/admin/all', async (req, res) => {
  try {
    // TODO: Adicionar verificação de admin aqui
    const { status, type, page } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (page) filter.page = { $regex: page, $options: 'i' };

    const suggestions = await Suggestion.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      total: suggestions.length,
      suggestions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter sugestões'
    });
  }
});

// PATCH - Atualizar status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, priority, adminNotes } = req.body;

    const suggestion = await Suggestion.findByIdAndUpdate(
      req.params.id,
      {
        status,
        priority: priority || undefined,
        adminNotes: adminNotes || undefined,
        updatedAt: new Date(),
        ...(status === 'implemented' && { resolvedAt: new Date() })
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Status atualizado',
      suggestion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar status'
    });
  }
});

// POST - Adicionar resposta (admin)
router.post('/:id/response', async (req, res) => {
  try {
    const { adminId, adminName, message } = req.body;

    const suggestion = await Suggestion.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          responses: {
            adminId,
            adminName,
            message,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Resposta adicionada',
      suggestion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar resposta'
    });
  }
});

// POST - Votar
router.post('/:id/vote', async (req, res) => {
  try {
    const { userId, voteType } = req.body;
    const suggestion = await Suggestion.findById(req.params.id);
    
    if (voteType === 'up') {
      if (!suggestion.votes.votersUp.includes(userId)) {
        suggestion.votes.votersUp.push(userId);
        suggestion.votes.upvotes += 1;
        
        const downvoteIndex = suggestion.votes.votersDown.indexOf(userId);
        if (downvoteIndex > -1) {
          suggestion.votes.votersDown.splice(downvoteIndex, 1);
          suggestion.votes.downvotes -= 1;
        }
      }
    } else if (voteType === 'down') {
      if (!suggestion.votes.votersDown.includes(userId)) {
        suggestion.votes.votersDown.push(userId);
        suggestion.votes.downvotes += 1;
        
        const upvoteIndex = suggestion.votes.votersUp.indexOf(userId);
        if (upvoteIndex > -1) {
          suggestion.votes.votersUp.splice(upvoteIndex, 1);
          suggestion.votes.upvotes -= 1;
        }
      }
    }

    await suggestion.save();

    res.json({
      success: true,
      upvotes: suggestion.votes.upvotes,
      downvotes: suggestion.votes.downvotes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao registar voto'
    });
  }
});

// GET - Estatísticas (admin)
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await Suggestion.aggregate([
      {
        $facet: {
          byType: [{ $group: { _id: '$type', count: { $sum: 1 } } }],
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          byPriority: [{ $group: { _id: '$priority', count: { $sum: 1 } } }]
        }
      }
    ]);

    res.json({
      success: true,
      stats: stats[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas'
    });
  }
});

module.exports = router;
```

### 2.4 - Integrar no app.js/server.js

```javascript
// No seu app.js ou server.js
const express = require('express');
const mongoose = require('mongoose');
const suggestionRoutes = require('./routes/suggestions');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Conectar MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/globe-memories');

// Routes
app.use('/api/suggestions', suggestionRoutes);

// Serve static files
app.listen(process.env.PORT || 3001, () => {
  console.log('Server running on port ' + (process.env.PORT || 3001));
});
```

---

## 🏅 PASSO 3: Integrar Sistema de Pontos de Conquista

No seu User model ou Achievement model:

```javascript
// models/User.js (exemplo)
const userSchema = new Schema({
  // ... outros campos
  achievements: {
    points: { type: Number, default: 0 },
    totalContributions: { type: Number, default: 0 },
    errorsReported: { type: Number, default: 0 },
    suggestionsSubmitted: { type: Number, default: 0 },
    lastContributionDate: Date
  }
});

// Após criar sugestão com sucesso, no backend:
const achievementPoints = type === 'error' ? 50 : 30;

await User.findByIdAndUpdate(userId, {
  $inc: {
    'achievements.points': achievementPoints,
    'achievements.totalContributions': 1,
    ...(type === 'error' ? { 'achievements.errorsReported': 1 } : { 'achievements.suggestionsSubmitted': 1 })
  },
  $set: { 'achievements.lastContributionDate': new Date() }
});
```

---

## 👨‍💼 PASSO 4: Adicionar AdminSuggestionsManager ao Dashboard

No seu `src/pages/admin/AdminDashboard.js` ou similar:

```javascript
import AdminSuggestionsManager from '../../components/admin/AdminSuggestionsManager';

const AdminDashboard = () => {
  return (
    <div className="admin-dashboard">
      {/* ... outros componentes */}
      <AdminSuggestionsManager />
      {/* ... */}
    </div>
  );
};

export default AdminDashboard;
```

---

## 📱 PASSO 5: Testar a Aplicação

### Testes Frontend:
1. ✅ Clique no botão "Feedback" no header
2. ✅ Modal abre corretamente
3. ✅ Selecione tipo (Erro/Sugestão)
4. ✅ Página é preenchida automaticamente
5. ✅ Preencida todos os campos
6. ✅ Upload opcional de screenshot
7. ✅ Clique "Enviar Sugestão"

### Testes Backend:
1. ✅ Sugestão é salva no MongoDB
2. ✅ Screenshot é salvo em `/uploads/suggestions/`
3. ✅ Pontos de conquista são adicionados
4. ✅ Response com `achievementPoints`

### Testes Admin:
1. ✅ AdminSuggestionsManager carrega
2. ✅ Sugestões aparecem na lista
3. ✅ Filtros funcionam
4. ✅ Modal de detalhe abre
5. ✅ Status pode ser atualizado
6. ✅ Resposta pode ser adicionada

---

## 🔧 Variáveis de Ambiente (.env)

```bash
# Backend
MONGODB_URI=mongodb://localhost:27017/globe-memories
NODE_ENV=development
PORT=3001
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# Opcional
ADMIN_EMAIL=admin@globememories.com
NOTIFICATION_SERVICE=email # ou outro serviço
```

---

## 📧 Configurações Opcionais

### Email de Notificação (Recomendado)

```javascript
// Enviar email ao admin quando novo erro é reportado
const nodemailer = require('nodemailer');

async function notifyAdminOfNewSuggestion(suggestion) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.ADMIN_EMAIL,
      pass: process.env.ADMIN_PASSWORD
    }
  });

  await transporter.sendMail({
    from: process.env.ADMIN_EMAIL,
    to: process.env.ADMIN_EMAIL,
    subject: `[${suggestion.type.toUpperCase()}] ${suggestion.title}`,
    html: `
      <h2>${suggestion.title}</h2>
      <p><strong>Tipo:</strong> ${suggestion.type}</p>
      <p><strong>Página:</strong> ${suggestion.page}</p>
      <p><strong>Descrição:</strong> ${suggestion.description}</p>
      <p><strong>Utilizador:</strong> ${suggestion.username}</p>
      <a href="http://admin.globememories.com/suggestions/${suggestion._id}">Ver no Admin</a>
    `
  });
}
```

---

## 🎯 Próximos Passos

1. ✅ Frontend implementado
2. 📋 Backend implementar conforme guia acima
3. 📧 Configurar notificações de admin
4. 🧪 Testar completo
5. 📊 Adicionar analytics
6. 🚀 Deploy em produção

---

## ❓ Dúvidas Frequentes

**P: Como actualizar para produção?**
A: Certifique-se de ter variáveis de ambiente configuradas e BD MongoDB em produção.

**P: O upload de screenshots é obrigatório?**
A: Não, é opcional. O utilizador pode reportar sem screenshot.

**P: Quantos pontos ganha?**
A: Erro: 50 pontos | Sugestão: 30 pontos

**P: O utilizador pode editar a sugestão?**
A: Não neste MVP. Pode ser adicionado depois.

**P: Posso notificar o utilizador quando a sugestão é implementada?**
A: Sim, enviar notificação quando status = 'implemented'

---

## 📞 Suporte

Verifique o ficheiro `SUGGESTIONS_SYSTEM_DOCUMENTATION.md` para mais detalhes.

**Desenvolvido para Globe Memories** 🌍✈️
