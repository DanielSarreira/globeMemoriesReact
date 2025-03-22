import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaHeart, FaComment, FaChevronDown, FaSearch, FaFlag } from 'react-icons/fa';
import defaultAvatar from '../images/assets/avatar.jpg';
import '../styles/styles.css';

// Dados simulados (substituir por API no futuro)
const QandAData = [
  {
    id: 1,
    user: 'Tiago Miranda',
    userProfilePicture: null,
    question: 'Quais são as melhores dicas para economizar em hospedagem em Lisboa?',
    category: 'Hospedagem',
    createdAt: '2025-03-15',
    likes: 5,
    answers: [
      {
        id: 1,
        user: 'Ana Silva',
        text: 'Procure hostels no centro de Lisboa, como o Yes! Lisbon Hostel. Eles têm ótimos preços e localização.',
        createdAt: '2025-03-16',
        likes: 3,
      },
      {
        id: 2,
        user: 'João Pereira',
        text: 'Tente reservar com antecedência no Booking ou Airbnb. Muitas vezes, há descontos para estadias mais longas.',
        createdAt: '2025-03-16',
        likes: 2,
      },
    ],
  },
  {
    id: 2,
    user: 'Maria Oliveira',
    userProfilePicture: null,
    question: 'É seguro usar transporte público em São Paulo à noite?',
    category: 'Transporte',
    createdAt: '2025-03-14',
    likes: 8,
    answers: [
      {
        id: 1,
        user: 'Carlos Souza',
        text: 'Depende da região. Evite áreas mais desertas e prefira o metrô, que é mais seguro. Sempre fique atento aos seus pertences.',
        createdAt: '2025-03-15',
        likes: 4,
      },
    ],
  },
];

const QandA = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [category, setCategory] = useState('');
  const [newAnswer, setNewAnswer] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortOption, setSortOption] = useState('date');
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [likedQuestions, setLikedQuestions] = useState([]);
  const [likedAnswers, setLikedAnswers] = useState([]);
  const [error, setError] = useState('');
  const questionsPerPage = 5;

  useEffect(() => {
    // Simula carregamento de dados
    setTimeout(() => {
      setQuestions(QandAData);
    }, 1000);
  }, []);

  const handleAskQuestion = (e) => {
    e.preventDefault();
    if (!user) {
      alert('Faça login para criar uma pergunta!');
      return;
    }
    if (!newQuestion.trim()) {
      setError('Escreva uma pergunta antes de enviar!');
      return;
    }
    if (!category) {
      setError('Selecione uma categoria para sua pergunta!');
      return;
    }

    const newQuestionData = {
      id: questions.length + 1,
      user: user.username,
      userProfilePicture: user.profilePicture || null,
      question: newQuestion,
      category,
      createdAt: new Date().toISOString().split('T')[0],
      likes: 0,
      answers: [],
    };

    setQuestions([newQuestionData, ...questions]);
    setNewQuestion('');
    setCategory('');
    setError('');
  };

  const handleAnswerQuestion = (questionId) => {
    if (!user) {
      alert('Faça login para responder!');
      return;
    }
    if (!newAnswer[questionId]?.trim()) {
      alert('Escreva uma resposta antes de enviar!');
      return;
    }

    const updatedQuestions = questions.map((question) => {
      if (question.id === questionId) {
        return {
          ...question,
          answers: [
            ...question.answers,
            {
              id: question.answers.length + 1,
              user: user.username,
              text: newAnswer[questionId],
              createdAt: new Date().toISOString().split('T')[0],
              likes: 0,
            },
          ],
        };
      }
      return question;
    });

    setQuestions(updatedQuestions);
    setNewAnswer({ ...newAnswer, [questionId]: '' });
  };

  const handleLikeQuestion = (questionId) => {
    if (!user) {
      alert('Faça login para curtir!');
      return;
    }

    if (likedQuestions.includes(questionId)) {
      setLikedQuestions(likedQuestions.filter((id) => id !== questionId));
      setQuestions(
        questions.map((q) =>
          q.id === questionId ? { ...q, likes: q.likes - 1 } : q
        )
      );
    } else {
      setLikedQuestions([...likedQuestions, questionId]);
      setQuestions(
        questions.map((q) =>
          q.id === questionId ? { ...q, likes: q.likes + 1 } : q
        )
      );
    }
  };

  const handleLikeAnswer = (questionId, answerId) => {
    if (!user) {
      alert('Faça login para curtir!');
      return;
    }

    const answerKey = `${questionId}-${answerId}`;
    if (likedAnswers.includes(answerKey)) {
      setLikedAnswers(likedAnswers.filter((key) => key !== answerKey));
      setQuestions(
        questions.map((q) =>
          q.id === questionId
            ? {
                ...q,
                answers: q.answers.map((a) =>
                  a.id === answerId ? { ...a, likes: a.likes - 1 } : a
                ),
              }
            : q
        )
      );
    } else {
      setLikedAnswers([...likedAnswers, answerKey]);
      setQuestions(
        questions.map((q) =>
          q.id === questionId
            ? {
                ...q,
                answers: q.answers.map((a) =>
                  a.id === answerId ? { ...a, likes: a.likes + 1 } : a
                ),
              }
            : q
        )
      );
    }
  };

  const handleLoadMore = () => {
    setCurrentPage((prevPage) => prevPage + 1);
  };

  const filteredQuestions = useMemo(() => {
    return questions
      .filter(
        (q) =>
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.user.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .filter((q) => q.category === filterCategory || filterCategory === '');
  }, [questions, searchQuery, filterCategory]);

  const sortedQuestions = useMemo(() => {
    return [...filteredQuestions].sort((a, b) => {
      if (sortOption === 'answers') {
        return b.answers.length - a.answers.length;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [filteredQuestions, sortOption]);

  const paginatedQuestions = sortedQuestions.slice(
    0,
    currentPage * questionsPerPage
  );
  const hasMoreQuestions = paginatedQuestions.length < sortedQuestions.length;

  const renderQuestionItem = (question) => (
    <div key={question.id} className="question-item fade-in">
      <div className="question-header">
        <img
          src={question.userProfilePicture || defaultAvatar}
          alt={`${question.user}'s avatar`}
          className="question-avatar"
        />
        <div className="question-meta">
          <span className="question-user">{question.user}</span>
          <span className="question-date">
            Publicado em: {question.createdAt}
          </span>
          <span className="question-category">{question.category}</span>
        </div>
        <button
          className="report-button"
          aria-label="Reportar pergunta"
          onClick={() => alert('Funcionalidade de reportar em desenvolvimento!')}
        >
          <FaFlag />
        </button>
      </div>
      <div className="question-content">
        <h3>{question.question}</h3>
        <div className="question-actions">
          <button
            className={`like-button ${
              likedQuestions.includes(question.id) ? 'liked' : ''
            }`}
            onClick={() => handleLikeQuestion(question.id)}
            aria-label={
              likedQuestions.includes(question.id)
                ? 'Descurtir pergunta'
                : 'Curtir pergunta'
            }
          >
            <FaHeart /> {question.likes}
          </button>
          <button
            className="comment-button"
            onClick={() =>
              setExpandedQuestion(
                expandedQuestion === question.id ? null : question.id
              )
            }
            aria-label={
              expandedQuestion === question.id
                ? 'Fechar respostas'
                : 'Ver respostas'
            }
          >
            <FaComment /> {question.answers.length}
          </button>
        </div>
      </div>
      {expandedQuestion === question.id && (
        <div className="answers-section">
          <h4>Respostas</h4>
          {question.answers.length > 0 ? (
            <ul>
              {question.answers.map((answer) => (
                <li key={answer.id} className="answer-item">
                  <div className="answer-header">
                    <strong>{answer.user}:</strong>
                    <span className="answer-date">
                      Publicado em: {answer.createdAt}
                    </span>
                    <button
                      className="report-button"
                      aria-label="Reportar resposta"
                      onClick={() =>
                        alert('Funcionalidade de reportar em desenvolvimento!')
                      }
                    >
                      <FaFlag />
                    </button>
                  </div>
                  <p>{answer.text}</p>
                  <button
                    className={`like-button ${
                      likedAnswers.includes(`${question.id}-${answer.id}`)
                        ? 'liked'
                        : ''
                    }`}
                    onClick={() => handleLikeAnswer(question.id, answer.id)}
                    aria-label={
                      likedAnswers.includes(`${question.id}-${answer.id}`)
                        ? 'Descurtir resposta'
                        : 'Curtir resposta'
                    }
                  >
                    <FaHeart /> {answer.likes}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>Nenhuma resposta ainda. Seja o primeiro a responder!</p>
          )}
          {user && (
            <div className="add-answer">
              <textarea
                value={newAnswer[question.id] || ''}
                onChange={(e) =>
                  setNewAnswer({
                    ...newAnswer,
                    [question.id]: e.target.value,
                  })
                }
                placeholder="Escreva sua resposta..."
                className="answer-input"
                aria-label="Escrever uma resposta"
              />
              <button
                onClick={() => handleAnswerQuestion(question.id)}
                className="submit-answer-button"
                aria-label="Enviar resposta"
              >
                Enviar Resposta
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="qanda-page">
      <header className="qanda-header">
        <h1>Perguntas e Respostas</h1>
        <p>
          Faça as suas perguntas sobre viagens ou ajude outros viajantes com suas
          dúvidas. Compartilhe conhecimento e organize as suas experiências!
        </p>
      </header>

      {user && (
        <div className="ask-question-section">
          <h2>Faça uma Pergunta</h2>
          <form onSubmit={handleAskQuestion} className="ask-question-form">
            <textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Escreva sua pergunta aqui..."
              className="question-input"
              aria-label="Escrever uma pergunta"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="category-select"
              aria-label="Selecionar categoria da pergunta"
            >
              <option value="">Selecione uma categoria</option>
              <option value="Hospedagem">Hospedagem</option>
              <option value="Transporte">Transporte</option>
              <option value="Dicas Locais">Dicas Locais</option>
              <option value="Cultura">Cultura</option>
              <option value="Gastronomia">Gastronomia</option>
              <option value="Outros">Outros</option>
            </select>
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="submit-question-button">
              Enviar Pergunta
            </button>
          </form>
        </div>
      )}

      <div className="qanda-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Pesquisar perguntas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            aria-label="Pesquisar perguntas"
          />
          <FaSearch className="search-icon" />
        </div>
        <div className="filter-container">
          <label htmlFor="categoryFilter">Filtrar por Categoria: </label>
          <select
            id="categoryFilter"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="category-filter"
            aria-label="Filtrar por categoria"
          >
            <option value="">Todas</option>
            <option value="Hospedagem">Hospedagem</option>
            <option value="Transporte">Transporte</option>
            <option value="Dicas Locais">Dicas Locais</option>
            <option value="Cultura">Cultura</option>
            <option value="Gastronomia">Gastronomia</option>
            <option value="Outros">Outros</option>
          </select>
        </div>
        <div className="sort-container">
          <label htmlFor="sortOption">Ordenar por: </label>
          <select
            id="sortOption"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="sort-filter"
            aria-label="Ordenar perguntas"
          >
            <option value="date">Mais Recentes</option>
            <option value="answers">Mais Respondidas</option>
          </select>
        </div>
      </div>

      <div className="questions-list">
        {questions.length > 0 ? (
          <>
            {paginatedQuestions.map(renderQuestionItem)}
            {hasMoreQuestions && (
              <button
                onClick={handleLoadMore}
                className="load-more-button"
                aria-label="Carregar mais perguntas"
              >
                Carregar Mais <FaChevronDown />
              </button>
            )}
          </>
        ) : (
          <p>Nenhuma pergunta disponível. Seja o primeiro a perguntar!</p>
        )}
      </div>
    </div>
  );
};

export default QandA;