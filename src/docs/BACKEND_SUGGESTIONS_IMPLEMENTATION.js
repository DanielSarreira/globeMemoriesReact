/**
 * Backend - Sugestões e Reportagem de Erros (Node.js/Express)
 * 
 * Este ficheiro fornece a implementação necessária no backend para
 * receber, armazenar e gerenciar sugestões e relatórios de erro
 * dos utilizadores da aplicação Globe Memories.
 * 
 * INSTALAÇÃO:
 * npm install express multer mongoose axios
 */

// ===========================
// SCHEMA DE SUGESTÃO (Mongoose)
// ===========================

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
  userEmail: {
    type: String,
    default: null
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
  page: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  steps: {
    type: String,
    maxlength: 500,
    default: null
  },
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
  assignedTo: {
    type: String,
    default: null
  },
  adminNotes: {
    type: String,
    default: null
  },
  duplicateOf: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  votes: {
    upvotes: {
      type: Number,
      default: 0
    },
    downvotes: {
      type: Number,
      default: 0
    },
    votersUp: [String],
    votersDown: [String]
  },
  responses: [{
    adminId: String,
    adminName: String,
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Índices compostos para melhor performance
SuggestionSchema.index({ userId: 1, createdAt: -1 });
SuggestionSchema.index({ status: 1, type: 1, createdAt: -1 });
SuggestionSchema.index({ page: 1, status: 1 });

const Suggestion = mongoose.model('Suggestion', SuggestionSchema);

// ===========================
// ROTAS DO CONTROLLER
// ===========================

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Configuração do multer para uploads
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas ficheiros PNG, JPEG e GIF são permitidos'));
    }
  }
});

// ===========================
// ENDPOINTS
// ===========================

/**
 * POST /api/suggestions/create
 * Criar uma nova sugestão ou reportagem de erro
 * Retorna pontos de conquista ganhados
 */
router.post('/create', upload.single('screenshot'), async (req, res) => {
  try {
    const { userId, username, type, page, title, description, steps } = req.body;

    if (!userId || !username || !type || !page || !title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios em falta'
      });
    }

    // Criar documento de sugestão
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

    // Se houver ficheiro, salvar informações
    if (req.file) {
      suggestion.screenshot = {
        filename: req.file.filename,
        url: `/uploads/suggestions/${req.file.filename}`,
        uploadedAt: new Date()
      };
    }

    await suggestion.save();

    // ===========================
    // ATUALIZAR PONTOS DE CONQUISTA
    // ===========================
    const achievementPoints = type === 'error' ? 50 : 30; // Erros valem mais
    
    // Atualizar utilizador com os pontos
    // (implementar conforme a sua estrutura de utilizador)
    // await User.findByIdAndUpdate(userId, {
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
      achievementPoints: achievementPoints,
      message_toast: `✨ Parabéns! Ganhou ${achievementPoints} pontos por contribuir com feedback!`
    });

  } catch (error) {
    console.error('Erro ao criar sugestão:', error);
    
    // Limpar ficheiro se houver erro
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

/**
 * GET /api/suggestions/user/:userId
 * Obter sugestões do utilizador
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const suggestions = await Suggestion.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .select('-screenshot.url');

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

/**
 * GET /api/suggestions/admin/all
 * Obter todas as sugestões (ADMIN)
 */
router.get('/admin/all', async (req, res) => {
  try {
    // Adicionar verificação de admin aqui
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

/**
 * PATCH /api/suggestions/:id/status
 * Atualizar status de uma sugestão (ADMIN)
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, priority, assignedTo, adminNotes } = req.body;

    const suggestion = await Suggestion.findByIdAndUpdate(
      req.params.id,
      {
        status,
        priority: priority || undefined,
        assignedTo: assignedTo || undefined,
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

/**
 * POST /api/suggestions/:id/response
 * Adicionar resposta do admin (ADMIN)
 */
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

/**
 * POST /api/suggestions/:id/vote
 * Dar upvote/downvote numa sugestão
 */
router.post('/:id/vote', async (req, res) => {
  try {
    const { userId, voteType } = req.body; // voteType: 'up' ou 'down'

    const suggestion = await Suggestion.findById(req.params.id);
    
    if (voteType === 'up') {
      if (!suggestion.votes.votersUp.includes(userId)) {
        suggestion.votes.votersUp.push(userId);
        suggestion.votes.upvotes += 1;
        
        // Remover downvote se existir
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
        
        // Remover upvote se existir
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

/**
 * GET /api/suggestions/stats/summary
 * Obter estatísticas (ADMIN)
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await Suggestion.aggregate([
      {
        $facet: {
          byType: [
            { $group: { _id: '$type', count: { $sum: 1 } } }
          ],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          byPriority: [
            { $group: { _id: '$priority', count: { $sum: 1 } } }
          ],
          recentCount: [
            {
              $match: {
                createdAt: {
                  $gte: new Date(new Date().setDate(new Date().getDate() - 7))
                }
              }
            },
            { $count: 'count' }
          ]
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

// ===========================
// INTEGRAÇÃO NA APP PRINCIPAL
// ===========================

/*
No seu main server.js ou app.js:

const suggestionRoutes = require('./routes/suggestions');
app.use('/api/suggestions', suggestionRoutes);

// Também configure multer como middleware global se necessário
*/

// ===========================
// VARIÁVEIS DE AMBIENTE NECESSÁRIAS
// ===========================

/*
Adicione ao seu .env:

MONGODB_URI=mongodb://localhost:27017/globe-memories
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
ADMIN_EMAIL=admin@globememories.com
*/
