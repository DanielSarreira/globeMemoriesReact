import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaHeart, FaSearch, FaFlag, FaReply, FaPaperPlane, FaTimes, FaUser, FaCalendarAlt, FaMapMarkerAlt, FaComments, FaPlus, FaFilter, FaSort, FaChevronDown, FaChevronUp, FaEye, FaSpinner } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Toast from '../components/Toast';
import defaultAvatar from '../images/assets/avatar.jpg';

// Dados simulados de viagens realizadas
const pastTripsData = [
  { id: 1, name: 'Viagem a Lisboa', date: '2024-05-10', user: 'Tiago Miranda' },
  { id: 2, name: 'Férias em São Paulo', date: '2024-08-15', user: 'Tiago Miranda' },
];

const QandA = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [category, setCategory] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [selectedTrip, setSelectedTrip] = useState('');
  const [newComment, setNewComment] = useState({});
  const [newReply, setNewReply] = useState({});
  const [replyOpen, setReplyOpen] = useState({}); // Estado para controlar quais campos de réplica estão abertos
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ category: '', country: '', city: '', minLikes: '', answered: '' });
  const [sortOption, setSortOption] = useState('date'); // Sempre ordena por data por padrão
  const [expandedSections, setExpandedSections] = useState({});
  const [currentPage, setCurrentPage] = useState({ all: 1, mine: 1 });
  const [likedQuestions, setLikedQuestions] = useState([]);
  const [likedComments, setLikedComments] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [activeSection, setActiveSection] = useState('all'); // 'all' ou 'mine'
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });
  const questionsPerPage = 5;

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setQuestions(QandAData);
      setIsLoading(false);
    }, 1000);
  }, []);

  const showToast = (message, type) => {
    setToast({ message, type, show: true });
  };

  const closeToast = () => {
    setToast({ ...toast, show: false });
  };

  // Função para sanitizar conteúdo contra XSS
  const sanitizeContent = (content) => {
    if (!content) return '';
    
    const dangerousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>.*?<\/embed>/gi,
      /<link[^>]*>/gi,
      /<meta[^>]*>/gi,
      /<style[^>]*>.*?<\/style>/gi
    ];
    
    let sanitized = content;
    dangerousPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
    
    return sanitized.trim();
  };

  const handleAskQuestion = useCallback((e) => {
    e.preventDefault();
    setError('');
    
    // Validações melhoradas
    if (!user) {
      setError('Inicie sessão para criar uma pergunta!');
      showToast('Inicie sessão para criar uma pergunta!', 'error');
      return;
    }
    
    if (!newQuestion.trim()) {
      setError('Escreva uma pergunta!');
      showToast('Escreva uma pergunta!', 'error');
      return;
    }
    
    if (newQuestion.trim().length < 10) {
      setError('A pergunta deve ter pelo menos 10 caracteres!');
      showToast('A pergunta deve ter pelo menos 10 caracteres!', 'error');
      return;
    }

    if (newQuestion.trim().length > 500) {
      setError('A pergunta deve ter no máximo 500 caracteres!');
      showToast('A pergunta deve ter no máximo 500 caracteres!', 'error');
      return;
    }

    // Sanitizar conteúdo contra XSS
    const sanitizedQuestion = sanitizeContent(newQuestion);
    if (!sanitizedQuestion) {
      setError('Pergunta contém conteúdo não permitido!');
      showToast('Pergunta contém conteúdo não permitido!', 'error');
      return;
    }

    if (sanitizedQuestion !== newQuestion.trim()) {
      setError('Pergunta contém conteúdo perigoso que foi removido!');
      showToast('Pergunta contém conteúdo perigoso que foi removido!', 'error');
      return;
    }
    
    if (!category) {
      setError('Selecione uma categoria!');
      showToast('Selecione uma categoria!', 'error');
      return;
    }

    setIsLoading(true);

    // Simular delay de API
    setTimeout(() => {
      const newQuestionData = {
        id: Date.now(),
        user: user.username,
        userProfilePicture: user.profilePicture || null,
        question: sanitizedQuestion,
        category,
        country: country || 'Não especificado',
        city: city || 'Não especificado',
        tripId: selectedTrip || null,
        tripName: selectedTrip ? pastTripsData.find((t) => t.id === parseInt(selectedTrip))?.name : null,
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: [],
      };

      setQuestions((prev) => [newQuestionData, ...prev]);
      
      // Reset form
      setNewQuestion('');
      setCategory('');
      setCountry('');
      setCity('');
      setSelectedTrip('');
      setIsAskingQuestion(false);
      setIsLoading(false);
      setError('');
      showToast('Pergunta criada com sucesso!', 'success');
      
      // Show success message
      setTimeout(() => {
        setError(''); // Clear any existing errors
      }, 100);
    }, 1000);
  }, [user, newQuestion, category, country, city, selectedTrip]);

  const handleCommentOrReply = useCallback((questionId, parentIds = [], text) => {
    setError('');
    
    if (!user) {
      setError('Inicie sessão para comentar!');
      showToast('Inicie sessão para comentar!', 'error');
      return;
    }
    
    if (!text?.trim()) {
      setError('Escreva um comentário!');
      showToast('Escreva um comentário!', 'error');
      return;
    }

    if (text.trim().length < 3) {
      setError('O comentário deve ter pelo menos 3 caracteres!');
      showToast('O comentário deve ter pelo menos 3 caracteres!', 'error');
      return;
    }

    if (text.trim().length > 300) {
      setError('O comentário deve ter no máximo 300 caracteres!');
      showToast('O comentário deve ter no máximo 300 caracteres!', 'error');
      return;
    }

    // Sanitizar conteúdo contra XSS
    const sanitizedText = sanitizeContent(text);
    if (!sanitizedText) {
      setError('Comentário contém conteúdo não permitido!');
      showToast('Comentário contém conteúdo não permitido!', 'error');
      return;
    }

    if (sanitizedText !== text.trim()) {
      setError('Comentário contém conteúdo perigoso que foi removido!');
      showToast('Comentário contém conteúdo perigoso que foi removido!', 'error');
      return;
    }

    // Show loading state
    const commentKey = parentIds.length === 0 ? `comment-${questionId}` : `reply-${questionId}-${parentIds.join('-')}`;
    
    // Simulate API delay
    setTimeout(() => {
      const updateComments = (comments, path) => {
        if (path.length === 0) {
          return [
            ...comments,
            {
              id: Date.now(),
              user: user.username,
              userProfilePicture: user.profilePicture || null,
              text: sanitizedText,
              createdAt: new Date().toISOString(),
              likes: 0,
              replies: [],
            },
          ];
        }
        const [currentId, ...rest] = path;
        return comments.map((c) =>
          c.id === currentId
            ? { ...c, replies: updateComments(c.replies || [], rest) }
            : c
        );
      };

      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId
            ? { ...q, comments: updateComments(q.comments, parentIds) }
            : q
        )
      );

      // Clear inputs
      if (parentIds.length === 0) {
        setNewComment((prev) => ({ ...prev, [questionId]: '' }));
        showToast('Comentário adicionado com sucesso!', 'success');
      } else {
        const replyKey = `${questionId}-${parentIds.join('-')}`;
        setNewReply((prev) => ({ ...prev, [replyKey]: '' }));
        setReplyOpen((prev) => ({ ...prev, [replyKey]: false }));
        showToast('Resposta adicionada com sucesso!', 'success');
      }
      
      setError('');
    }, 500);
  }, [user, showToast]);

  const handleLike = useCallback((type, id, parentIds = []) => {
    if (!user) return setError('Inicie sessão para gostar!');
    const key = `${parentIds.join('-')}-${id}`;

    const updateLikes = (items, path, isLiked) => {
      if (path.length === 0) {
        return items.map((item) =>
          item.id === id ? { ...item, likes: item.likes + (isLiked ? -1 : 1) } : item
        );
      }
      const [currentId, ...rest] = path;
      return items.map((item) =>
        item.id === currentId
          ? { ...item, replies: updateLikes(item.replies || [], rest, isLiked) }
          : item
      );
    };

    if (type === 'question') {
      const isLiked = likedQuestions.includes(id);
      setLikedQuestions((prev) => (isLiked ? prev.filter((qId) => qId !== id) : [...prev, id]));
      setQuestions((prev) =>
        prev.map((q) => (q.id === id ? { ...q, likes: q.likes + (isLiked ? -1 : 1) } : q))
      );
    } else {
      const isLiked = likedComments.includes(key);
      setLikedComments((prev) => (isLiked ? prev.filter((k) => k !== key) : [...prev, key]));
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === parentIds[0]
            ? { ...q, comments: updateLikes(q.comments, parentIds.slice(1), isLiked) }
            : q
        )
      );
    }
  }, [user, likedQuestions, likedComments]);

  const toggleSection = (key) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleReply = (key) => {
    setReplyOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const applyFilters = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    return (q) =>
      (q.question.toLowerCase().includes(lowerQuery) || q.user.toLowerCase().includes(lowerQuery)) &&
      (!filters.category || q.category === filters.category) &&
      (!filters.country || q.country === filters.country) &&
      (!filters.city || q.city === filters.city) &&
      (!filters.minLikes || q.likes >= parseInt(filters.minLikes)) &&
      (filters.answered === '' || (filters.answered === 'yes' ? q.comments.length > 0 : q.comments.length === 0));
  }, [searchQuery, filters]);

  const myQuestions = useMemo(() => user ? questions.filter((q) => q.user === user.username).filter(applyFilters) : [], [questions, user, applyFilters]);
  const allQuestions = useMemo(() => questions.filter(applyFilters), [questions, applyFilters]);

  const paginatedMyQuestions = useMemo(() => {
    const sorted = [...myQuestions].sort((a, b) =>
      sortOption === 'comments'
        ? b.comments.length - a.comments.length
        : sortOption === 'likes'
        ? b.likes - a.likes
        : new Date(b.createdAt) - new Date(a.createdAt)
    );
    return sorted.slice(0, currentPage.mine * questionsPerPage);
  }, [myQuestions, currentPage.mine, questionsPerPage, sortOption]);

  const paginatedAllQuestions = useMemo(() => {
    const sorted = [...allQuestions].sort((a, b) =>
      sortOption === 'comments'
        ? b.comments.length - a.comments.length
        : sortOption === 'likes'
        ? b.likes - a.likes
        : new Date(b.createdAt) - new Date(a.createdAt)
    );
    return sorted.slice(0, currentPage.all * questionsPerPage);
  }, [allQuestions, currentPage.all, questionsPerPage, sortOption]);

  const getRelativeTime = (date) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffInSeconds = Math.floor((now - commentDate) / 1000);
    
    if (diffInSeconds < 60) {
      return 'agora mesmo';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} h`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
    }
    
    return commentDate.toLocaleDateString('pt-PT', {
      day: 'numeric',
      month: 'short'
    });
  };

  const renderComment = useCallback((comment, questionId, parentIds = [], index = 0) => {
    const key = `${questionId}-${parentIds.concat(comment.id).join('-')}`;
    const likeKey = `${[questionId, ...parentIds].join('-')}-${comment.id}`;
    return (
      <motion.div 
        key={comment.id} 
        className="comment-item-modern"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
      >
        <div className="comment-main">
          <img 
            src={comment.userProfilePicture || defaultAvatar} 
            alt={`Avatar de ${comment.user}`} 
            className="comment-avatar-modern" 
          />
          <div className="comment-content-modern">
            <div className="comment-header-modern">
              <span className="comment-username">{comment.user}</span>
              <span className="comment-time">{getRelativeTime(comment.createdAt)}</span>
            </div>
            <p className="comment-text">{comment.text}</p>
            <div className="comment-actions-modern">
              <motion.button
                className={`comment-like-btn ${likedComments.includes(likeKey) ? 'liked' : ''}`}
                onClick={() => handleLike('comment', comment.id, [questionId, ...parentIds])}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaHeart className={`heart-icon ${likedComments.includes(likeKey) ? 'liked' : ''}`} />
                {comment.likes > 0 && <span>{comment.likes}</span>}
              </motion.button>
              <motion.button
                className="reply-btn-modern"
                onClick={() => toggleReply(key)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaReply /> Responder
              </motion.button>
            </div>
            
            <AnimatePresence>
              {replyOpen[key] && (
                <motion.div 
                  className="reply-input-container"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <img 
                    src={user?.profilePicture || defaultAvatar} 
                    alt="Seu avatar" 
                    className="reply-user-avatar" 
                  />
                  <div className="reply-input-wrapper">
                    <textarea
                      value={newReply[key] || ''}
                      onChange={(e) => {
                        if (e.target.value.length <= 300) {
                          setNewReply({ ...newReply, [key]: e.target.value });
                        }
                      }}
                      placeholder="Escreva uma resposta..."
                      className="reply-input-modern"
                      rows="2"
                      maxLength={300}
                      autoFocus
                    />
                    <div className="reply-actions">
                      <motion.button
                        className="cancel-reply-btn"
                        onClick={() => toggleReply(key)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Cancelar
                      </motion.button>
                      <motion.button
                        onClick={() => handleCommentOrReply(questionId, parentIds.concat(comment.id), newReply[key])}
                        className="send-reply-btn"
                        disabled={!newReply[key]?.trim()}
                        whileHover={newReply[key]?.trim() ? { scale: 1.05 } : {}}
                        whileTap={newReply[key]?.trim() ? { scale: 0.95 } : {}}
                      >
                        <FaPaperPlane />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {comment.replies?.length > 0 && (
          <motion.div 
            className="replies-container-modern"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {comment.replies.map((reply, replyIndex) => 
              renderComment(reply, questionId, parentIds.concat(comment.id), replyIndex)
            )}
          </motion.div>
        )}
      </motion.div>
    );
  }, [newReply, replyOpen, handleLike, handleCommentOrReply, likedComments, user, getRelativeTime]);

  const renderQuestionItem = useCallback((question, index) => {
    const questionKey = `question-${question.id}`;
    return (
      <motion.div 
        key={question.id} 
        className="question-card-modern"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
        whileHover={{ y: -5 }}
      >
        <div className="question-card-header">
          <div className="user-info2">
            <img 
              src={question.userProfilePicture || defaultAvatar} 
              alt={`Avatar de ${question.user}`} 
              className="user-avatar2" 
            />
            <div className="user-details">
              <span className="username">{question.user}</span>
              <div className="question-metadata">
                <span className="metadata-item">
                  <FaCalendarAlt className="metadata-icon" />
                  {new Date(question.createdAt).toLocaleDateString('pt-PT', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
                <span className="metadata-item">
                  <FaMapMarkerAlt className="metadata-icon" />
                  {question.country} • {question.city}
                </span>
                <span className="category-badge">{question.category}</span>
              </div>
            </div>
          </div>
          
          {question.tripName && (
            <motion.div 
              className="trip-badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <span>✈️ {question.tripName}</span>
            </motion.div>
          )}
        </div>

        <div className="question-content-modern">
          <h3 className="question-title">{question.question}</h3>
          
          <div className="question-stats">
            <div className="stat-item">
              <motion.button
                className={`like-btn ${likedQuestions.includes(question.id) ? 'liked' : ''}`}
                onClick={() => handleLike('question', question.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaHeart className={`heart-icon ${likedQuestions.includes(question.id) ? 'liked' : ''}`} />
                <span>{question.likes}</span>
              </motion.button>
            </div>
            
            <div className="stat-item">
              <motion.button
                className="comments-btn"
                onClick={() => toggleSection(questionKey)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaComments className="comments-icon" />
                <span>{question.comments.length}</span>
              </motion.button>
            </div>
            
         
          </div>
        </div>

        {/* Seção de comentários com animação */}
        <AnimatePresence>
          {expandedSections[questionKey] && (
            <motion.div 
              className="comments-section-modern"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="comments-header-modern">
                <h4>💬 Comentários ({question.comments.length})</h4>
                <motion.button
                  className="close-comments-btn"
                  onClick={() => toggleSection(questionKey)}
                  aria-label="Fechar comentários"
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FaTimes />
                </motion.button>
              </div>
              
              <div className="comments-container-modern">
                {question.comments.length > 0 ? (
                  <div className="comments-list-modern">
                    {question.comments.map((comment, commentIndex) => 
                      renderComment(comment, question.id, [], commentIndex)
                    )}
                  </div>
                ) : (
                  <motion.div 
                    className="no-comments"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <span>💭 Ainda não há comentários. Seja o primeiro a responder!</span>
                  </motion.div>
                )}
                
                {user && (
                  <motion.div 
                    className="add-comment-modern"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <img 
                      src={user.profilePicture || defaultAvatar} 
                      alt="Seu avatar" 
                      className="comment-user-avatar" 
                    />
                    <div className="comment-input-container">
                      <textarea
                        value={newComment[question.id] || ''}
                        onChange={(e) => {
                          if (e.target.value.length <= 300) {
                            setNewComment({ ...newComment, [question.id]: e.target.value });
                          }
                        }}
                        placeholder="Escreva a sua resposta..."
                        className="comment-input-modern"
                        rows="2"
                        maxLength={300}
                      />
                      <AnimatePresence>
                        {newComment[question.id]?.trim() && (
                          <motion.button
                            onClick={() => handleCommentOrReply(question.id, [], newComment[question.id])}
                            className="send-comment-btn"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <FaPaperPlane />
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }, [expandedSections, newComment, user, likedQuestions, likedComments, handleLike, handleCommentOrReply, renderComment]);

  return (
    <div className="qanda-page-modern">
      {/* Header com estatísticas */}


      {/* Barra de ações principais */}
      <motion.div 
        className="qanda-main-actions"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="action-buttons">
          <motion.button 
            className={`action-btn ${activeSection === 'all' ? 'active' : ''}`}
            onClick={() => setActiveSection('all')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaComments /> Todas as Perguntas
          </motion.button>
          {user && (
            <motion.button 
              className={`action-btn ${activeSection === 'mine' ? 'active' : ''}`}
              onClick={() => setActiveSection('mine')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaUser /> As Minhas Perguntas
            </motion.button>
          )}
        </div>
        
        {user && (
          <motion.button 
            className="ask-question-btn"
            onClick={() => setIsAskingQuestion(!isAskingQuestion)}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaPlus /> Fazer Pergunta
          </motion.button>
        )}
      </motion.div>

      {/* Formulário de nova pergunta com animação */}
      <AnimatePresence>
        {user && isAskingQuestion && (
          <motion.div 
            className="ask-question-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="ask-question-card"
              initial={{ opacity: 0, scale: 0.8, y: -50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -50 }}
              transition={{ duration: 0.3 }}
            >
              <div className="card-header">
                <h3>✨ Nova Pergunta</h3>
                <motion.button 
                  className="close-btn"
                  onClick={() => setIsAskingQuestion(false)}
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FaTimes />
                </motion.button>
              </div>
              
              <form onSubmit={handleAskQuestion} className="ask-question-form-modern">
                <div className="form-group">
                  <label>📝 Qual é a sua dúvida?</label>
                  <textarea
                    value={newQuestion}
                    onChange={(e) => {
                      if (e.target.value.length <= 500) {
                        setNewQuestion(e.target.value);
                      }
                    }}
                    placeholder="Descreva a sua pergunta de forma clara e detalhada..."
                    className="question-textarea"
                    rows="4"
                    maxLength={500}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>🏷️ Categoria</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="modern-select">
                      <option value="">Selecione uma categoria</option>
                      {['Alojamento', 'Transportes', 'Dicas Locais', 'Cultura', 'Gastronomia', 'Outros'].map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>🌍 País</label>
                    <select value={country} onChange={(e) => setCountry(e.target.value)} className="modern-select">
                      <option value="">Selecione um país</option>
                      {['Portugal', 'Brasil', 'Espanha', 'Itália', 'França'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>🏙️ Cidade</label>
                    <select value={city} onChange={(e) => setCity(e.target.value)} className="modern-select">
                      <option value="">Selecione uma cidade</option>
                      {['Lisboa', 'São Paulo', 'Madrid', 'Roma', 'Paris'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>✈️ Viagem Relacionada</label>
                    <select value={selectedTrip} onChange={(e) => setSelectedTrip(e.target.value)} className="modern-select">
                      <option value="">Escolha uma viagem (opcional)</option>
                      {pastTripsData.filter((t) => t.user === user.username).map((trip) => (
                        <option key={trip.id} value={trip.id}>{trip.name} - {trip.date}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div 
                      className="error-message-modern"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="form-actions">
                  <motion.button 
                    type="button" 
                    className="cancel-btn" 
                    onClick={() => setIsAskingQuestion(false)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancelar
                  </motion.button>
                  <motion.button 
                    type="submit" 
                    className="submit-btn"
                    disabled={isLoading}
                    whileHover={!isLoading ? { scale: 1.05 } : {}}
                    whileTap={!isLoading ? { scale: 0.95 } : {}}
                  >
                    {isLoading ? (
                      <>
                        <FaSpinner className="spinning" /> A publicar...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane /> Publicar Pergunta
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controles de pesquisa e filtros */}
      <motion.div 
        className="qanda-controls-modern"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="search-section">
          <div className="search-input-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Pesquisar perguntas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input-modern2"
            />
          </div>
          
          <div className="control-buttons">
            <motion.button 
              className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaFilter /> Filtros {showFilters ? <FaChevronUp /> : <FaChevronDown />}
            </motion.button>
            
            <select 
              value={sortOption} 
              onChange={(e) => setSortOption(e.target.value)} 
              className="sort-select"
            >
              <option value="date">📅 Mais recentes</option>
              <option value="comments">💬 Mais comentadas</option>
              <option value="likes">❤️ Mais gostadas</option>
            </select>
          </div>
        </div>

        {/* Filtros expandidos */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              className="filters-expanded"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="filter-group">
                <select 
                  value={filters.category} 
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })} 
                  className="filter-select-modern"
                >
                  <option value="">🏷️ Todas as categorias</option>
                  {['Alojamento', 'Transportes', 'Dicas Locais', 'Cultura', 'Gastronomia', 'Outros'].map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <select 
                  value={filters.country} 
                  onChange={(e) => setFilters({ ...filters, country: e.target.value })} 
                  className="filter-select-modern"
                >
                  <option value="">🌍 Todos os países</option>
                  {['Portugal', 'Brasil', 'Espanha', 'Itália', 'França'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <select 
                  value={filters.city} 
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })} 
                  className="filter-select-modern"
                >
                  <option value="">🏙️ Todas as cidades</option>
                  {['Lisboa', 'São Paulo', 'Madrid', 'Roma', 'Paris'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <select 
                  value={filters.answered} 
                  onChange={(e) => setFilters({ ...filters, answered: e.target.value })} 
                  className="filter-select-modern"
                >
                  <option value="">💭 Todas as perguntas</option>
                  <option value="yes">✅ Com respostas</option>
                  <option value="no">❓ Sem respostas</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Lista de perguntas */}
      <motion.div 
        className="questions-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        {isLoading ? (
          <motion.div 
            className="loading-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="loading-spinner"></div>
            <p>A carregar perguntas...</p>
          </motion.div>
        ) : (
          <>
            {activeSection === 'mine' && user ? (
              <div className="questions-section-modern">
                <motion.div 
                  className="section-header"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2>As Minhas Perguntas</h2>
                  <span className="question-count">{myQuestions.length} pergunta{myQuestions.length !== 1 ? 's' : ''}</span>
                </motion.div>
                {paginatedMyQuestions.length > 0 ? (
                  <>
                    {paginatedMyQuestions.map((question, index) => renderQuestionItem(question, index))}
                    {paginatedMyQuestions.length < [...myQuestions].sort((a, b) =>
                        sortOption === 'comments'
                          ? b.comments.length - a.comments.length
                          : sortOption === 'likes'
                          ? b.likes - a.likes
                          : new Date(b.createdAt) - new Date(a.createdAt)
                      ).length && (
                      <motion.button 
                        onClick={() => setCurrentPage((prev) => ({ ...prev, mine: prev.mine + 1 }))} 
                        className="load-more-btn-modern"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Carregar Mais Perguntas
                      </motion.button>
                    )}
                  </>
                ) : (
                  <motion.div 
                    className="empty-state"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="empty-icon">🤔</div>
                    <h3>Ainda não fez nenhuma pergunta</h3>
                    <p>Comece a interagir com a comunidade. <br></br>Faça a sua primeira pergunta!</p>
                    <motion.button 
                      className="cta-btn"
                      onClick={() => setIsAskingQuestion(true)}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FaPlus /> Fazer Primeira Pergunta
                    </motion.button>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="questions-section-modern">
                <motion.div 
                  className="section-header"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2>Todas as Perguntas</h2>
                  <span className="question-count">{allQuestions.length} pergunta{allQuestions.length !== 1 ? 's' : ''}</span>
                </motion.div>
                {paginatedAllQuestions.length > 0 ? (
                  <>
                    {paginatedAllQuestions.map((question, index) => renderQuestionItem(question, index))}
                    {paginatedAllQuestions.length < [...allQuestions].sort((a, b) =>
                        sortOption === 'comments'
                          ? b.comments.length - a.comments.length
                          : sortOption === 'likes'
                          ? b.likes - a.likes
                          : new Date(b.createdAt) - new Date(a.createdAt)
                      ).length && (
                      <motion.button 
                        onClick={() => setCurrentPage((prev) => ({ ...prev, all: prev.all + 1 }))} 
                        className="load-more-btn-modern"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Carregar Mais Perguntas
                      </motion.button>
                    )}
                  </>
                ) : (
                  <motion.div 
                    className="empty-state"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="empty-icon">🔍</div>
                    <h3>Nenhuma pergunta encontrada</h3>
                    <p>Tente ajustar os filtros ou fazer uma nova pesquisa.</p>
                  </motion.div>
                )}
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Toast para feedback */}
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={closeToast}
      />
    </div>
  );
};

// Dados simulados
const QandAData = [
  {
    id: 1,
    user: 'Tiago Miranda',
    userProfilePicture: null,
    question: 'Quais são as melhores dicas para economizar em alojamento em Lisboa?',
    category: 'Alojamento',
    country: 'Portugal',
    city: 'Lisboa',
    tripId: 1,
    tripName: 'Viagem a Lisboa',
    createdAt: '2025-03-15T10:30:00.000Z',
    likes: 5,
    comments: [
      {
        id: 1,
        user: 'Ana Silva',
        userProfilePicture: null,
        text: 'Procure hostels no centro.',
        createdAt: '2025-03-16T09:15:00.000Z',
        likes: 3,
        replies: [
          {
            id: 1,
            user: 'João Pereira',
            userProfilePicture: null,
            text: 'Concordo, os hostels são ótimos!',
            createdAt: '2025-03-17T11:30:00.000Z',
            likes: 2,
            replies: [
              {
                id: 2,
                user: 'Tiago Miranda',
                userProfilePicture: null,
                text: 'Sim, e têm boa localização!',
                createdAt: '2025-03-18T16:45:00.000Z',
                likes: 1,
                replies: [],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 2,
    user: 'Maria Oliveira',
    userProfilePicture: null,
    question: 'É seguro usar transportes públicos em São Paulo à noite?',
    category: 'Transportes',
    country: 'Brasil',
    city: 'São Paulo',
    tripId: null,
    tripName: null,
    createdAt: '2025-03-14T15:45:00.000Z',
    likes: 8,
    comments: [
      { id: 1, user: 'Carlos Souza', userProfilePicture: null, text: 'Depende da região.', createdAt: '2025-03-15T12:00:00.000Z', likes: 4, replies: [] },
    ],
  },
];

export default QandA;