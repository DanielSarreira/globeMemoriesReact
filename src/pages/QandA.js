import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaHeart, FaSearch, FaFlag, FaReply, FaPaperPlane, FaTimes, FaUser, FaCalendarAlt, FaMapMarkerAlt, FaComments, FaPlus, FaFilter, FaSort, FaChevronDown, FaChevronUp, FaEye, FaSpinner } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Toast from '../components/Toast';
import defaultAvatar from '../images/assets/avatar.jpg';
import { COMMENT_LIMITS, validateComment } from '../config/commentConfig';
import { request } from '../axios_helper';
import '../styles/pages/globe-memories-interactive-map.css'; // Para usar o estilo do modal
import '../styles/pages/register-travel.css'; // Para SearchableDropdown
import { qandaModalUtils } from '../utils/modalUtils';

// Custom Searchable Dropdown
const SearchableDropdown = ({ options, value, onChange, placeholder, disabled, labelKey = 'label', valueKey = 'value' }) => {
  const [search, setSearch] = React.useState('');
  const [showOptions, setShowOptions] = React.useState(false);
  const [focusedIndex, setFocusedIndex] = React.useState(-1);
  const dropdownRef = React.useRef(null);

  const filteredOptions = options.filter(opt =>
    opt[labelKey].toLowerCase().includes(search.toLowerCase())
  );
  const selectedLabel = value ? options.find(opt => opt[valueKey] === value)?.[labelKey] || '' : '';

  const handleSelect = (val) => {
    onChange(val);
    setShowOptions(false);
    setSearch('');
    setFocusedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Backspace' && value && !search) {
      e.preventDefault(); onChange(null); setSearch(''); setShowOptions(true); return;
    }
    if (!showOptions && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      e.preventDefault(); setShowOptions(true); return;
    }
    if (showOptions) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIndex(p => (p < filteredOptions.length - 1 ? p + 1 : p)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedIndex(p => (p > 0 ? p - 1 : -1)); }
      else if (e.key === 'Enter') { e.preventDefault(); if (focusedIndex >= 0) handleSelect(filteredOptions[focusedIndex][valueKey]); }
      else if (e.key === 'Escape') { e.preventDefault(); setShowOptions(false); setFocusedIndex(-1); }
    }
  };

  React.useEffect(() => {
    const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowOptions(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={dropdownRef} className={`searchable-dropdown-container${disabled ? ' disabled' : ''}${showOptions ? ' open' : ''}`} style={{ position: 'relative', width: '100%' }}>
      <div className="dropdown-input-wrapper">
        <input
          type="text"
          value={selectedLabel || search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => !disabled && setShowOptions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="dropdown-input"
          autoComplete="off"
          spellCheck="false"
          role="combobox"
          aria-expanded={showOptions}
          aria-haspopup="listbox"
        />
        <div className="dropdown-arrow">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 8 10 12 14 8"></polyline>
          </svg>
        </div>
      </div>
      {showOptions && filteredOptions.length > 0 && (
        <ul className="dropdown-options-list" role="listbox">
          {filteredOptions.map((opt, idx) => (
            <li key={opt[valueKey]} onMouseDown={() => handleSelect(opt[valueKey])} onMouseEnter={() => setFocusedIndex(idx)}
              className={`dropdown-option${focusedIndex === idx ? ' focused' : ''}${value === opt[valueKey] ? ' selected' : ''}`}
              role="option" aria-selected={value === opt[valueKey]}>
              {opt[labelKey]}
            </li>
          ))}
        </ul>
      )}
      {showOptions && filteredOptions.length === 0 && (
        <div className="dropdown-no-results">Nenhum resultado encontrado</div>
      )}
    </div>
  );
};

const QandA = () => {
  const { user } = useAuth();

  // ── All-questions feed state ──────────────────────────────────────────────
  const [questions, setQuestions] = useState([]);
  const [allPage, setAllPage] = useState(0);
  const [allTotalPages, setAllTotalPages] = useState(0);
  const [allTotal, setAllTotal] = useState(0);

  // ── My-questions feed state ───────────────────────────────────────────────
  const [myQuestions, setMyQuestions] = useState([]);
  const [myPage, setMyPage] = useState(0);
  const [myTotalPages, setMyTotalPages] = useState(0);
  const [myTotal, setMyTotal] = useState(0);

  // ── Form / UI state ───────────────────────────────────────────────────────
  const [newQuestion, setNewQuestion] = useState('');
  const [category, setCategory] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [cityId, setCityId] = useState(null);

  // ── Countries/cities for question form ───────────────────────────────────
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const countryOptions = countries.map(c => ({ label: c, value: c }));
  const cityOptions = cities.map(c => ({ label: c.cityName, value: c.id }));

  // ── Comments loading state per question ──────────────────────────────────
  const [commentsLoading, setCommentsLoading] = useState({});
  const [newComment, setNewComment] = useState({});
  const [newReply, setNewReply] = useState({});
  const [replyOpen, setReplyOpen] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ category: '', answered: '' });
  const [sortOption, setSortOption] = useState('created_at');
  const [expandedSections, setExpandedSections] = useState({});
  const [likedQuestions, setLikedQuestions] = useState([]);
  const [likedComments, setLikedComments] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [activeSection, setActiveSection] = useState('all');
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });
  const [showWelcomeModal, setShowWelcomeModal] = useState(() => qandaModalUtils.shouldShow());
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // ── Transform backend DTO → frontend question shape ──────────────────────
  const transformQuestion = useCallback((dto) => ({
    id: dto.questionId,
    userId: dto.userId,
    user: dto.username || 'Utilizador',
    userProfilePicture: dto.userProfilePhoto || null,
    question: dto.questionText,
    category: dto.category || '',
    country: dto.countryName || 'N/A',
    city: dto.cityName || 'N/A',
    createdAt: dto.createdAt,
    likes: dto.totalLikes || 0,
    totalComments: dto.totalComments || 0,
    currentUserLiked: dto.userLiked || false,
    comments: [], // loaded on demand when section is expanded
  }), []);

  // ── Fetch all questions from API ──────────────────────────────────────────
  const fetchAllQuestions = useCallback(async (page = 0, append = false) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page, size: 20, sortBy: sortOption });
      if (filters.category) params.append('category', filters.category);
      if (filters.answered === 'yes') params.append('hasComments', 'true');
      if (filters.answered === 'no') params.append('hasComments', 'false');
      if (searchQuery.trim()) params.append('searchText', searchQuery.trim());

      const resp = await request('GET', `/forum/questions?${params.toString()}`);
      const data = resp.data;
      const transformed = (data.content || []).map(transformQuestion);

      // Seed liked state
      const liked = transformed.filter(q => q.currentUserLiked).map(q => q.id);
      setLikedQuestions(prev => [...new Set([...prev, ...liked])]);

      setQuestions(prev => append ? [...prev, ...transformed] : transformed);
      setAllPage(data.number ?? page);
      setAllTotalPages(data.totalPages ?? 0);
      setAllTotal(data.totalElements ?? 0);
    } catch (err) {
      console.error('Erro ao carregar perguntas:', err);
      showToast('Erro ao carregar perguntas.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [sortOption, filters, searchQuery, transformQuestion]);

  // ── Fetch my questions from API ───────────────────────────────────────────
  const fetchMyQuestions = useCallback(async (page = 0, append = false) => {
    setIsLoading(true);
    try {
      const resp = await request('GET', `/forum/questions/my?page=${page}&size=20`);
      const data = resp.data;
      const transformed = (data.content || []).map(transformQuestion);

      setMyQuestions(prev => append ? [...prev, ...transformed] : transformed);
      setMyPage(data.number ?? page);
      setMyTotalPages(data.totalPages ?? 0);
      setMyTotal(data.totalElements ?? 0);
    } catch (err) {
      console.error('Erro ao carregar as minhas perguntas:', err);
      showToast('Erro ao carregar as suas perguntas.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [transformQuestion]);

  // ── Load countries on mount ──────────────────────────────────────────────
  useEffect(() => {
    request('GET', '/cities/countries')
      .then(r => setCountries(r.data || []))
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load cities when country changes ─────────────────────────────────────
  useEffect(() => {
    if (!country) { setCities([]); setCityId(null); setCity(''); return; }
    setLoadingCities(true);
    request('GET', `/cities/by-country?countryName=${encodeURIComponent(country)}`)
      .then(r => setCities(Array.isArray(r.data) ? r.data : []))
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false));
    setCityId(null);
    setCity('');
  }, [country]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load on mount and when filters/sort/search change (all section) ───────
  useEffect(() => {
    if (activeSection === 'all') {
      fetchAllQuestions(0, false);
    }
  }, [activeSection, sortOption, filters, searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load my questions when section switches to 'mine' ─────────────────────
  useEffect(() => {
    if (activeSection === 'mine' && user) {
      fetchMyQuestions(0, false);
    }
  }, [activeSection, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = (message, type) => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 2600);
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

  const handleAskQuestion = useCallback(async (e) => {
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

    if (!cityId) {
      setError('Selecione uma cidade!');
      showToast('Selecione uma cidade!', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const resp = await request('POST', '/forum/questions', {
        questionText: sanitizedQuestion,
        category,
        cityId,
      });
      const created = transformQuestion(resp.data);
      setQuestions(prev => [created, ...prev]);
      setAllTotal(prev => prev + 1);
      // Reset form
      setNewQuestion('');
      setCategory('');
      setCountry('');
      setCity('');
      setCityId(null);
      setCities([]);
      setIsAskingQuestion(false);
      setError('');
      showToast('Pergunta criada com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao criar pergunta:', err);
      showToast('Erro ao criar pergunta.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [user, newQuestion, category, cityId, transformQuestion]);

  const handleCommentOrReply = useCallback(async (questionId, parentCommentId = null, text, replyKey = null) => {
    setError('');
    
    if (!user) {
      setError('Inicie sessão para comentar!');
      showToast('Inicie sessão para comentar!', 'error');
      return;
    }
    
    const validation = validateComment(text);
    if (!validation.valid) {
      setError(validation.message);
      showToast(validation.message, 'error');
      return;
    }

    const sanitizedText = sanitizeContent(text);
    if (!sanitizedText) {
      setError(COMMENT_LIMITS.MESSAGES.INVALID_CONTENT);
      showToast(COMMENT_LIMITS.MESSAGES.INVALID_CONTENT, 'error');
      return;
    }

    if (sanitizedText !== text.trim()) {
      setError(COMMENT_LIMITS.MESSAGES.DANGEROUS_CONTENT);
      showToast(COMMENT_LIMITS.MESSAGES.DANGEROUS_CONTENT, 'error');
      return;
    }

    try {
      const body = { content: sanitizedText };
      if (parentCommentId != null) body.parentCommentId = parentCommentId;
      const resp = await request('POST', `/forum/questions/${questionId}/comments`, body);
      const dto = resp.data;
      const newCommentObj = {
        id: dto.commentId,
        userId: dto.userId,
        user: dto.username || user.username,
        userProfilePicture: dto.userProfilePhoto || user.profilePicture || null,
        text: dto.content,
        createdAt: dto.createdAt,
        likes: dto.totalLikes || 0,
        currentUserLiked: dto.userLiked || false,
        replies: dto.replies || [],
      };

      if (parentCommentId == null) {
        // Top-level comment
        setQuestions(prev => prev.map(q =>
          q.id === questionId
            ? { ...q, comments: [...q.comments, newCommentObj], totalComments: (q.totalComments || 0) + 1 }
            : q
        ));
        setNewComment(prev => ({ ...prev, [questionId]: '' }));
        showToast('Comentário adicionado com sucesso!', 'success');
      } else {
        // Reply — insert into parent
        const addReply = (comments) => comments.map(c =>
          c.id === parentCommentId
            ? { ...c, replies: [...(c.replies || []), newCommentObj] }
            : { ...c, replies: addReply(c.replies || []) }
        );
        setQuestions(prev => prev.map(q =>
          q.id === questionId ? { ...q, comments: addReply(q.comments) } : q
        ));
        if (replyKey) {
          setNewReply(prev => ({ ...prev, [replyKey]: '' }));
          setReplyOpen(prev => ({ ...prev, [replyKey]: false }));
        }
        showToast('Resposta adicionada com sucesso!', 'success');
      }
      setError('');
    } catch (err) {
      console.error('Erro ao adicionar comentário:', err);
      showToast('Erro ao adicionar comentário.', 'error');
    }
  }, [user, sanitizeContent]);

  const handleLikeQuestion = useCallback(async (questionId) => {
    if (!user) return showToast('Inicie sessão para gostar!', 'error');
    const isLiked = likedQuestions.includes(questionId);
    // Optimistic update
    setLikedQuestions(prev => isLiked ? prev.filter(id => id !== questionId) : [...prev, questionId]);
    setQuestions(prev => prev.map(q =>
      q.id === questionId ? { ...q, likes: q.likes + (isLiked ? -1 : 1) } : q
    ));
    try {
      if (isLiked) {
        await request('DELETE', `/forum/questions/${questionId}/like`);
      } else {
        await request('POST', `/forum/questions/${questionId}/like`);
      }
    } catch (err) {
      // Revert on failure
      setLikedQuestions(prev => isLiked ? [...prev, questionId] : prev.filter(id => id !== questionId));
      setQuestions(prev => prev.map(q =>
        q.id === questionId ? { ...q, likes: q.likes + (isLiked ? 1 : -1) } : q
      ));
      showToast('Erro ao processar gosto.', 'error');
    }
  }, [user, likedQuestions]);

  const handleLikeComment = useCallback(async (commentId, questionId) => {
    if (!user) return showToast('Inicie sessão para gostar!', 'error');
    const isLiked = likedComments.includes(commentId);
    // Optimistic update
    setLikedComments(prev => isLiked ? prev.filter(id => id !== commentId) : [...prev, commentId]);
    const updateLikesInTree = (comments) => comments.map(c =>
      c.id === commentId
        ? { ...c, likes: c.likes + (isLiked ? -1 : 1) }
        : { ...c, replies: updateLikesInTree(c.replies || []) }
    );
    setQuestions(prev => prev.map(q =>
      q.id === questionId ? { ...q, comments: updateLikesInTree(q.comments) } : q
    ));
    try {
      if (isLiked) {
        await request('DELETE', `/forum/comments/${commentId}/like`);
      } else {
        await request('POST', `/forum/comments/${commentId}/like`);
      }
    } catch (err) {
      // Revert
      setLikedComments(prev => isLiked ? [...prev, commentId] : prev.filter(id => id !== commentId));
      const revertLikes = (comments) => comments.map(c =>
        c.id === commentId
          ? { ...c, likes: c.likes + (isLiked ? 1 : -1) }
          : { ...c, replies: revertLikes(c.replies || []) }
      );
      setQuestions(prev => prev.map(q =>
        q.id === questionId ? { ...q, comments: revertLikes(q.comments) } : q
      ));
      showToast('Erro ao processar gosto.', 'error');
    }
  }, [user, likedComments]);

  const handleDeleteQuestion = useCallback(async (questionId) => {
    if (!window.confirm('Tem a certeza que quer eliminar esta pergunta?')) return;
    try {
      await request('DELETE', `/forum/questions/${questionId}`);
      setMyQuestions(prev => prev.filter(q => q.id !== questionId));
      setQuestions(prev => prev.filter(q => q.id !== questionId));
      setMyTotal(prev => Math.max(0, prev - 1));
      setAllTotal(prev => Math.max(0, prev - 1));
      showToast('Pergunta eliminada.', 'success');
    } catch (err) {
      console.error('Erro ao eliminar pergunta:', err);
      showToast('Erro ao eliminar pergunta.', 'error');
    }
  }, []);

  const handleDeleteComment = useCallback(async (commentId, questionId) => {
    if (!window.confirm('Tem a certeza que quer eliminar este comentário?')) return;
    try {
      await request('DELETE', `/forum/comments/${commentId}`);
      const removeFromTree = (comments) => comments
        .filter(c => c.id !== commentId)
        .map(c => ({ ...c, replies: removeFromTree(c.replies || []) }));
      setQuestions(prev => prev.map(q =>
        q.id === questionId
          ? { ...q, comments: removeFromTree(q.comments), totalComments: Math.max(0, (q.totalComments || 1) - 1) }
          : q
      ));
      showToast('Comentário eliminado.', 'success');
    } catch (err) {
      console.error('Erro ao eliminar comentário:', err);
      showToast('Erro ao eliminar comentário.', 'error');
    }
  }, []);

  const fetchQuestionComments = useCallback(async (questionId) => {
    setCommentsLoading(prev => ({ ...prev, [questionId]: true }));
    try {
      const resp = await request('GET', `/forum/questions/${questionId}/comments?page=0&size=50`);
      const data = resp.data;
      const transformComment = (dto) => ({
        id: dto.commentId,
        userId: dto.userId,
        user: dto.username || 'Utilizador',
        userProfilePicture: dto.userProfilePhoto || null,
        text: dto.content,
        createdAt: dto.createdAt,
        likes: dto.totalLikes || 0,
        currentUserLiked: dto.userLiked || false,
        replies: (dto.replies || []).map(r => transformComment(r)),
      });
      const comments = (data.content || []).map(transformComment);
      // Seed liked state
      const likedIds = [];
      const collectLiked = (list) => list.forEach(c => { if (c.currentUserLiked) likedIds.push(c.id); collectLiked(c.replies || []); });
      collectLiked(comments);
      setLikedComments(prev => [...new Set([...prev, ...likedIds])]);
      setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, comments } : q));
      setMyQuestions(prev => prev.map(q => q.id === questionId ? { ...q, comments } : q));
    } catch (err) {
      console.error('Erro ao carregar comentários:', err);
    } finally {
      setCommentsLoading(prev => ({ ...prev, [questionId]: false }));
    }
  }, []);

  const toggleSection = (questionId) => {
    const key = `question-${questionId}`;
    const isCurrentlyOpen = expandedSections[key];
    setExpandedSections(prev => ({ ...prev, [key]: !isCurrentlyOpen }));
    // Fetch comments on first open
    if (!isCurrentlyOpen) {
      const q = questions.find(q => q.id === questionId) || myQuestions.find(q => q.id === questionId);
      if (q && q.comments.length === 0) {
        fetchQuestionComments(questionId);
      }
    }
  };

  const toggleReply = (key) => {
    setReplyOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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

  const renderComment = useCallback((comment, questionId, parentCommentId = null, index = 0) => {
    const replyKey = `${questionId}-${comment.id}`;
    const isLiked = likedComments.includes(comment.id);
    const isOwner = user && user.id === comment.userId;
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
              {isOwner && (
                <motion.button
                  className="delete-comment-btn"
                  onClick={() => handleDeleteComment(comment.id, questionId)}
                  title="Eliminar comentário"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '12px', padding: '2px 6px' }}
                >
                  <FaTimes />
                </motion.button>
              )}
            </div>
            <p className="comment-text">{comment.text}</p>
            <div className="comment-actions-modern">
              <motion.button
                className={`comment-like-btn ${isLiked ? 'liked' : ''}`}
                onClick={() => handleLikeComment(comment.id, questionId)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaHeart className={`heart-icon ${isLiked ? 'liked' : ''}`} />
                {comment.likes > 0 && <span>{comment.likes}</span>}
              </motion.button>
              <motion.button
                className="reply-btn-modern"
                onClick={() => toggleReply(replyKey)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaReply /> Responder
              </motion.button>
            </div>
            
            <AnimatePresence>
              {replyOpen[replyKey] && (
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
                      value={newReply[replyKey] || ''}
                      onChange={(e) => {
                        if (e.target.value.length <= COMMENT_LIMITS.MAX_LENGTH) {
                          setNewReply({ ...newReply, [replyKey]: e.target.value });
                        }
                      }}
                      placeholder="Escreva uma resposta..."
                      className="reply-input-modern"
                      rows="2"
                      maxLength={COMMENT_LIMITS.MAX_LENGTH}
                      autoFocus
                    />
                    <div className="reply-actions">
                      <span style={{ fontSize: '12px', color: '#999', marginRight: 'auto' }}>{(newReply[replyKey] || '').length}/{COMMENT_LIMITS.MAX_LENGTH}</span>
                      <motion.button
                        className="cancel-reply-btn"
                        onClick={() => toggleReply(replyKey)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Cancelar
                      </motion.button>
                      <motion.button
                        onClick={() => handleCommentOrReply(questionId, comment.id, newReply[replyKey], replyKey)}
                        className="send-reply-btn"
                        disabled={!newReply[replyKey]?.trim()}
                        whileHover={newReply[replyKey]?.trim() ? { scale: 1.05 } : {}}
                        whileTap={newReply[replyKey]?.trim() ? { scale: 0.95 } : {}}
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
            {[...comment.replies].map((reply, replyIndex) => 
              renderComment(reply, questionId, comment.id, replyIndex)
            )}
          </motion.div>
        )}
      </motion.div>
    );
  }, [newReply, replyOpen, handleLikeComment, handleCommentOrReply, handleDeleteComment, likedComments, user, getRelativeTime]);

  const renderQuestionItem = useCallback((question, index, showDelete = false) => {
    const questionKey = `question-${question.id}`;
    const isLikedQuestion = likedQuestions.includes(question.id);
    const isOwner = user && user.id === question.userId;
    const commentsOpen = expandedSections[questionKey];
    const loadingComments = commentsLoading[question.id];
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
          
          {(showDelete || isOwner) && (
            <motion.button
              className="delete-question-btn"
              onClick={() => handleDeleteQuestion(question.id)}
              title="Eliminar pergunta"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              style={{ background: 'none', border: '1px solid #e74c3c', borderRadius: '6px', color: '#e74c3c', cursor: 'pointer', fontSize: '12px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <FaTimes /> Eliminar
            </motion.button>
          )}
        </div>

        <div className="question-content-modern">
          <h3 className="question-title">{question.question}</h3>
          
          <div className="question-stats">
            <div className="stat-item">
              <motion.button
                className={`like-btn ${isLikedQuestion ? 'liked' : ''}`}
                onClick={() => handleLikeQuestion(question.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaHeart className={`heart-icon ${isLikedQuestion ? 'liked' : ''}`} />
                <span>{question.likes}</span>
              </motion.button>
            </div>
            
            <div className="stat-item">
              <motion.button
                className={`comments-btn ${commentsOpen ? 'active' : ''}`}
                onClick={() => toggleSection(question.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaComments className="comments-icon" />
                <span>{question.totalComments ?? question.comments.length}</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Seção de comentários com animação */}
        <AnimatePresence>
          {commentsOpen && (
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
                  onClick={() => toggleSection(question.id)}
                  aria-label="Fechar comentários"
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FaTimes />
                </motion.button>
              </div>
              
              <div className="comments-container-modern">
                {loadingComments ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    <FaSpinner className="spinning" /> A carregar comentários...
                  </div>
                ) : question.comments.length > 0 ? (
                  <div className="comments-list-modern">
                    {question.comments.map((comment, commentIndex) => 
                      renderComment(comment, question.id, null, commentIndex)
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
                          if (e.target.value.length <= COMMENT_LIMITS.MAX_LENGTH) {
                            setNewComment({ ...newComment, [question.id]: e.target.value });
                          }
                        }}
                        placeholder="Escreva a sua resposta..."
                        className="comment-input-modern"
                        rows="2"
                        maxLength={COMMENT_LIMITS.MAX_LENGTH}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingRight: '10px' }}>
                        <span style={{ fontSize: '12px', color: '#999' }}>{(newComment[question.id] || '').length}/{COMMENT_LIMITS.MAX_LENGTH}</span>
                        <AnimatePresence>
                          {newComment[question.id]?.trim() && (
                            <motion.button
                              onClick={() => handleCommentOrReply(question.id, null, newComment[question.id])}
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
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }, [expandedSections, commentsLoading, newComment, user, likedQuestions, handleLikeQuestion, handleDeleteQuestion, handleCommentOrReply, renderComment]);

  return (
    <div className="qanda-page-modern">
      {/* Modal de Boas-vindas */}
      {showWelcomeModal && (
        <div className="gm-map-welcome-overlay">
          <div className="gm-map-welcome-modal">
            <div className="gm-map-welcome-header">
              <h2>Comunidade Q&A de Viajantes</h2>
              <button className="gm-map-close-btn" onClick={() => setShowWelcomeModal(false)}>×</button>
            </div>
            <div className="gm-map-welcome-content">
              <p>Tire as suas dúvidas e partilhe conhecimentos com uma comunidade experiente de viajantes! Faça perguntas, responda e ajude outros exploradores.</p>
              <div className="gm-map-features-grid">
                <div className="gm-map-feature-item">
                  <span className="gm-map-feature-icon">❓</span>
                  <div>
                    <strong>Sistema de Perguntas Inteligente</strong>
                    <p>Faça perguntas categorizadas por país, cidade ou tipo de viagem para respostas mais precisas</p>
                  </div>
                </div>
                <div className="gm-map-feature-item">
                  <span className="gm-map-feature-icon">💬</span>
                  <div>
                    <strong>Respostas da Comunidade</strong>
                    <p>Receba respostas de viajantes experientes que já estiveram nos seus destinos de interesse</p>
                  </div>
                </div>
                <div className="gm-map-feature-item">
                  <span className="gm-map-feature-icon">❤️</span>
                  <div>
                    <strong>Sistema de Likes e Classificações</strong>
                    <p>Vote nas melhores respostas e identifique rapidamente o conteúdo mais útil e confiável</p>
                  </div>
                </div>
                <div className="gm-map-feature-item">
                  <span className="gm-map-feature-icon">🔍</span>
                  <div>
                    <strong>Pesquisa e Filtros Avançados</strong>
                    <p>Encontre rapidamente perguntas similares por categoria, destino ou número de respostas</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="gm-map-welcome-footer">
              <div className="dont-show-again">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  <span className="checkbox-text">
                    Não mostrar novamente esta mensagem
                  </span>
                </label>
              </div>
              <button className="gm-map-welcome-btn primary" onClick={() => {
                if (dontShowAgain) {
                  qandaModalUtils.dismiss();
                }
                setShowWelcomeModal(false);
              }}>
                Começar a perguntar!
              </button>
            </div>
          </div>
        </div>
      )}

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
                    <SearchableDropdown
                      options={['Alojamento', 'Transportes', 'Dicas Locais', 'Cultura', 'Gastronomia', 'Outros'].map(c => ({ label: c, value: c }))}
                      value={category}
                      onChange={(val) => setCategory(val || '')}
                      placeholder="Selecione uma categoria"
                    />
                  </div>

                  <div className="form-group">
                    <label>🌍 País</label>
                    <SearchableDropdown
                      options={countryOptions}
                      value={country}
                      onChange={(val) => setCountry(val || '')}
                      placeholder="Selecione um país"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>🏙️ Cidade *</label>
                    <SearchableDropdown
                      options={cityOptions}
                      value={cityId}
                      onChange={(val) => {
                        setCityId(val);
                        const found = cities.find(c => c.id === val);
                        setCity(found ? found.cityName : '');
                      }}
                      placeholder={loadingCities ? 'A carregar...' : country ? 'Selecione uma cidade' : 'Selecione primeiro um país'}
                      disabled={!country || loadingCities}
                    />
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
              <option value="created_at">📅 Mais recentes</option>
              <option value="total_comments">💬 Mais comentadas</option>
              <option value="total_likes">❤️ Mais gostadas</option>
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
                  <span className="question-count">{myTotal} pergunta{myTotal !== 1 ? 's' : ''}</span>
                </motion.div>
                {myQuestions.length > 0 ? (
                  <>
                    {myQuestions.map((question, index) => renderQuestionItem(question, index, true))}
                    {myPage + 1 < myTotalPages && (
                      <motion.button 
                        onClick={() => fetchMyQuestions(myPage + 1, true)} 
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
                  <span className="question-count">{allTotal} pergunta{allTotal !== 1 ? 's' : ''}</span>
                </motion.div>
                {questions.length > 0 ? (
                  <>
                    {questions.map((question, index) => renderQuestionItem(question, index))}
                    {allPage + 1 < allTotalPages && (
                      <motion.button 
                        onClick={() => fetchAllQuestions(allPage + 1, true)} 
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

export default QandA;