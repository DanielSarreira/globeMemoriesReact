import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaHeart, FaSearch, FaFlag, FaReply, FaPaperPlane, FaTimes } from 'react-icons/fa';
import defaultAvatar from '../images/assets/avatar.jpg';
import '../styles/styles.css';

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
  const [sortOption, setSortOption] = useState('date');
  const [expandedSections, setExpandedSections] = useState({});
  const [currentPage, setCurrentPage] = useState({ all: 1, mine: 1 });
  const [likedQuestions, setLikedQuestions] = useState([]);
  const [likedComments, setLikedComments] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const questionsPerPage = 5;

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setQuestions(QandAData);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleAskQuestion = useCallback((e) => {
    e.preventDefault();
    if (!user) return setError('Inicie sessão para criar uma pergunta!');
    if (!newQuestion.trim()) return setError('Escreva uma pergunta!');
    if (!category) return setError('Selecione uma categoria!');

    const newQuestionData = {
      id: Date.now(),
      user: user.username,
      userProfilePicture: user.profilePicture || null,
      question: newQuestion,
      category,
      country: country || 'Não especificado',
      city: city || 'Não especificado',
      tripId: selectedTrip || null,
      tripName: selectedTrip ? pastTripsData.find((t) => t.id === parseInt(selectedTrip))?.name : null,
      createdAt: new Date().toISOString().split('T')[0],
      likes: 0,
      comments: [],
    };

    setQuestions((prev) => [newQuestionData, ...prev]);
    setNewQuestion('');
    setCategory('');
    setCountry('');
    setCity('');
    setSelectedTrip('');
    setError('');
  }, [user, newQuestion, category, country, city, selectedTrip]);

  const handleCommentOrReply = useCallback((questionId, parentIds = [], text) => {
    if (!user) return setError('Inicie sessão para comentar!');
    if (!text?.trim()) return setError('Escreva um comentário!');

    const updateComments = (comments, path) => {
      if (path.length === 0) {
        return [
          ...comments,
          {
            id: Date.now(),
            user: user.username,
            userProfilePicture: user.profilePicture || null,
            text,
            createdAt: new Date().toISOString().split('T')[0],
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

    if (parentIds.length === 0) {
      setNewComment((prev) => ({ ...prev, [questionId]: '' }));
    } else {
      const replyKey = `${questionId}-${parentIds.join('-')}`;
      setNewReply((prev) => ({ ...prev, [replyKey]: '' }));
      setReplyOpen((prev) => ({ ...prev, [replyKey]: false })); // Fecha o campo de réplica após enviar
    }
    setError('');
  }, [user]);

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

  const sortedQuestions = (list) =>
    [...list].sort((a, b) =>
      sortOption === 'comments'
        ? b.comments.length - a.comments.length
        : sortOption === 'likes'
        ? b.likes - a.likes
        : new Date(b.createdAt) - new Date(a.createdAt)
    );

  const paginatedMyQuestions = sortedQuestions(myQuestions).slice(0, currentPage.mine * questionsPerPage);
  const paginatedAllQuestions = sortedQuestions(allQuestions).slice(0, currentPage.all * questionsPerPage);

  const getRelativeTime = (date) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffInHours = Math.floor((now - commentDate) / (1000 * 60 * 60));
    return `${diffInHours} h`;
  };

  const renderComment = useCallback((comment, questionId, parentIds = []) => {
    const key = `${questionId}-${parentIds.concat(comment.id).join('-')}`;
    return (
      <li key={comment.id} className="comment-item">
        <div className="comment-header">
          <img src={comment.userProfilePicture || defaultAvatar} alt={`Avatar de ${comment.user}`} className="comment-avatar" />
          <div className="comment-content">
            <strong className="comment-user">{comment.user}</strong>
            <p>{comment.text}</p>
            <div className="comment-actions">
              <span className="relative-time">{getRelativeTime(comment.createdAt)}</span>
              <button
                className={`like-button ${likedComments.includes(`${parentIds.concat(comment.id).join('-')}-${comment.id}`) ? 'liked' : ''}`}
                onClick={() => handleLike('comment', comment.id, [questionId, ...parentIds])}
              >
                <FaHeart className={likedComments.includes(`${parentIds.concat(comment.id).join('-')}-${comment.id}`) ? 'liked-heart' : 'unliked-heart'} />
                {comment.likes > 0 && ` (${comment.likes})`}
              </button>
              <button
                className="reply-button"
                onClick={() => toggleReply(key)}
              >
                Responder
              </button>
             
            </div>
            {replyOpen[key] && (
              <div className="add-reply">
                <textarea
                  value={newReply[key] || ''}
                  onChange={(e) => setNewReply({ ...newReply, [key]: e.target.value })}
                  placeholder="Escreva uma resposta..."
                  className="reply-input"
                  autoFocus
                />
                <button
                  onClick={() => handleCommentOrReply(questionId, parentIds.concat(comment.id), newReply[key])}
                  className="submit-reply-button"
                >
                  <FaPaperPlane />
                </button>
              </div>
            )}
            {comment.replies?.length > 0 && (
              <ul className="replies-list">
                {comment.replies.map((reply) => renderComment(reply, questionId, parentIds.concat(comment.id)))}
              </ul>
            )}
          </div>
        </div>
      </li>
    );
  }, [newReply, replyOpen, handleLike, handleCommentOrReply, likedComments]);

  const renderQuestionItem = useCallback((question) => {
    const questionKey = `question-${question.id}`;
    return (
      <div key={question.id} className="question-item fade-in">
        <div className="question-header">
          <img src={question.userProfilePicture || defaultAvatar} alt={`Avatar de ${question.user}`} className="question-avatar" />
          <div className="question-meta">
            <span className="question-user">{question.user}</span>
            <span className="question-date">{new Date(question.createdAt).toLocaleDateString('pt-PT')}</span>
            <span className="question-category">{question.category} • {question.country} • {question.city} {question.tripName ? ` • ${question.tripName}` : ''}</span>
          </div>
        </div>
        <div className="question-content">
          <h3>{question.question}</h3>
          <div className="question-actions">
            <button
              className={`like-button ${likedQuestions.includes(question.id) ? 'liked' : ''}`}
              onClick={() => handleLike('question', question.id)}
            >
              <FaHeart className={likedQuestions.includes(question.id) ? 'liked-heart' : 'unliked-heart'} />
              {question.likes > 0 && ` (${question.likes})`}
            </button>
            <button
              className="comment-button"
              onClick={() => toggleSection(questionKey)}
            >
              Comentários ({question.comments.length})
            </button>
          </div>
        </div>
        {expandedSections[questionKey] && (
          <div className="comments-section">
            <div className="comments-header">
              <h4>Comentários</h4>
              <button
                className="close-comments-button"
                onClick={() => toggleSection(questionKey)}
                aria-label="Fechar comentários"
              >
                <FaTimes />
              </button>
            </div>
            {question.comments.length > 0 ? (
              <ul className="comments-list">
                {question.comments.map((comment) => renderComment(comment, question.id))}
              </ul>
            ) : (
              <p>Ainda não há comentários.</p>
            )}
            {user && (
              <div className="add-comment">
                <textarea
                  value={newComment[question.id] || ''}
                  onChange={(e) => setNewComment({ ...newComment, [question.id]: e.target.value })}
                  placeholder="Escreva uma resposta..."
                  className="comment-input"
                />
                {newComment[question.id]?.trim() && (
                  <button
                    onClick={() => handleCommentOrReply(question.id, [], newComment[question.id])}
                    className="submit-comment-button"
                  >
                    <FaPaperPlane />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }, [expandedSections, newComment, user, likedQuestions, likedComments, handleLike, handleCommentOrReply, renderComment]);

  return (
    <div className="qanda-page">
      <div className="qanda-top-section">
       
        {user && (
          <div className="ask-question-section">
            
            <form onSubmit={handleAskQuestion} className="ask-question-form">
              <textarea
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Qual é a sua dúvida sobre viagens?"
                className="question-input"
              />
              <div className="question-meta-inputs">
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="category-select">
                  <option value="">Categoria</option>
                  {['Alojamento', 'Transportes', 'Dicas Locais', 'Cultura', 'Gastronomia', 'Outros'].map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select value={country} onChange={(e) => setCountry(e.target.value)} className="country-select">
                  <option value="">País</option>
                  {['Portugal', 'Brasil', 'Espanha', 'Itália', 'França'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select value={city} onChange={(e) => setCity(e.target.value)} className="city-select">
                  <option value="">Cidade</option>
                  {['Lisboa', 'São Paulo', 'Madrid', 'Roma', 'Paris'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select value={selectedTrip} onChange={(e) => setSelectedTrip(e.target.value)} className="trip-select">
                  <option value="">Viagem Relacionada (opcional)</option>
                  {pastTripsData.filter((t) => t.user === user.username).map((trip) => (
                    <option key={trip.id} value={trip.id}>{trip.name} - {trip.date}</option>
                  ))}
                </select>
              </div>
              {error && <p className="error-message">{error}</p>}
              <button type="submit" className="submit-question-button">Enviar Pergunta</button>
            </form>
          </div>
        )}
      </div>

      <div className="qanda-controls">
        <div className="filters-container" style={{ 
          display: 'flex', 
          gap: '10px', 
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div className="search-container" style={{ 
            position: 'relative',
            flex: 1,
            minWidth: '200px'
          }}>
         
            <input
              type="text"
              placeholder="Pesquisar perguntas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              style={{
                width: '100%',
                padding: '8px 30px 8px 10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          <select 
            value={filters.category} 
            onChange={(e) => setFilters({ ...filters, category: e.target.value })} 
            className="filter-select"
            style={{
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              minWidth: '120px'
            }}
          >
            <option value="">Categoria</option>
            {['Alojamento', 'Transportes', 'Dicas Locais', 'Cultura', 'Gastronomia', 'Outros'].map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select 
            value={filters.country} 
            onChange={(e) => setFilters({ ...filters, country: e.target.value })} 
            className="filter-select"
            style={{
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              minWidth: '120px'
            }}
          >
            <option value="">País</option>
            {['Portugal', 'Brasil', 'Espanha', 'Itália', 'França'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select 
            value={filters.city} 
            onChange={(e) => setFilters({ ...filters, city: e.target.value })} 
            className="filter-select"
            style={{
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              minWidth: '120px'
            }}
          >
            <option value="">Cidade</option>
            {['Lisboa', 'São Paulo', 'Madrid', 'Roma', 'Paris'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
     
          <select 
            value={sortOption} 
            onChange={(e) => setSortOption(e.target.value)} 
            className="filter-select"
            style={{
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              minWidth: '120px'
            }}
          >
            <option value="date">Mais recentes</option>
            <option value="comments">Mais comentadas</option>
            <option value="likes">Mais gostadas</option>
          </select>
        </div>
      </div>

      {user && (
        <div className="questions-section">
          <h2>As Minhas Perguntas</h2>
          {isLoading ? (
            <p className="loading">A carregar...</p>
          ) : paginatedMyQuestions.length > 0 ? (
            <>
              {paginatedMyQuestions.map(renderQuestionItem)}
              {paginatedMyQuestions.length < sortedQuestions(myQuestions).length && (
                <button onClick={() => setCurrentPage((prev) => ({ ...prev, mine: prev.mine + 1 }))} className="load-more-button">
                  Carregar Mais
                </button>
              )}
            </>
          ) : (
            <p>Ainda não fez nenhuma pergunta.</p>
          )}
        </div>
      )}

      <div className="questions-section">
        <h2>Todas as Perguntas</h2>
        {isLoading ? (
          <p className="loading">A carregar...</p>
        ) : paginatedAllQuestions.length > 0 ? (
          <>
            {paginatedAllQuestions.map(renderQuestionItem)}
            {paginatedAllQuestions.length < sortedQuestions(allQuestions).length && (
              <button onClick={() => setCurrentPage((prev) => ({ ...prev, all: prev.all + 1 }))} className="load-more-button">
                Carregar Mais
              </button>
            )}
          </>
        ) : (
          <p>Nenhuma pergunta encontrada.</p>
        )}
      </div>
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
    createdAt: '2025-03-15',
    likes: 5,
    comments: [
      {
        id: 1,
        user: 'Ana Silva',
        userProfilePicture: null,
        text: 'Procure hostels no centro.',
        createdAt: '2025-03-16',
        likes: 3,
        replies: [
          {
            id: 1,
            user: 'João Pereira',
            userProfilePicture: null,
            text: 'Concordo, os hostels são ótimos!',
            createdAt: '2025-03-17',
            likes: 2,
            replies: [
              {
                id: 2,
                user: 'Tiago Miranda',
                userProfilePicture: null,
                text: 'Sim, e têm boa localização!',
                createdAt: '2025-03-18',
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
    createdAt: '2025-03-14',
    likes: 8,
    comments: [
      { id: 1, user: 'Carlos Souza', userProfilePicture: null, text: 'Depende da região.', createdAt: '2025-03-15', likes: 4, replies: [] },
    ],
  },
];

export default QandA;