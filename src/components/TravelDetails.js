import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import travels from '../data/travelsData'; // Verifique se o caminho está correto
import '../components/TravelDetails.css'; // Certifique-se de que o caminho está correto
import { FaStar } from 'react-icons/fa';

const TravelDetails = () => {
  const { id } = useParams();
  const travel = travels.find((t) => t.id === parseInt(id, 10));
  const [activeTab, setActiveTab] = useState('description');
  const [isFavorite, setIsFavorite] = useState(false);
  const [comments, setComments] = useState('');
  const [commentList, setCommentList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filtrar viagens recomendadas pela categoria da viagem atual
  const recommendedTravels = travels.filter(
    (t) => t.category.includes(travel.category[0]) && t.id !== travel.id
  );

  const handleFavoriteToggle = () => {
    setIsFavorite(!isFavorite);
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (comments.trim()) {
      setCommentList([...commentList, comments]);
      setComments('');
    }
  };

  // Funções de navegação no slider
  const nextTravel = () => {
    if (currentIndex < recommendedTravels.length - 4) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevTravel = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Função para rolar para o topo da página
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!travel) {
    return <div>Viagem não encontrada.</div>;
  }

  const renderStars = (stars) =>
    [...Array(5)].map((_, index) => (
      <FaStar
        key={index}
        color={index < stars ? '#ffc107' : '#e4e5e9'}
        size={20}
      />
    ));

  return (
    <div className="travel-details-container">
      <div className="travel-info">
        <div className="highlight-image">
          <img src={travel.highlightImage} alt="Imagem de destaque" />
        </div>
        <div className="info">
          <h1>{travel.name}</h1>
          <p><strong>Utilizador:</strong> {travel.user}</p>
          <p><strong>País:</strong> {travel.country}</p>
          <p><strong>Cidade:</strong> {travel.city}</p>
          <p><strong>Preço da Viagem:</strong> {travel.price}€</p>
          <p><strong>Avaliação da Viagem:</strong> {renderStars(travel.stars)}</p>
          <p><strong>Data de Início:</strong> {travel.startDate}</p>
          <p><strong>Data de Fim:</strong> {travel.endDate}</p>
          <p><strong>Duração:</strong> {travel.days} dia(s)</p>
          <p><strong>Método de Transporte:</strong> {travel.transport}</p>
          <p><strong>Descrição Curta:</strong> {travel.description}</p>
          <p><strong>Categoria:</strong> {travel.category.join(', ')}</p>
          <p>
            <strong>Acomodações:</strong>
            {travel.accommodations.map((acc, index) => (
              <span key={index}>
                {acc.name} ({acc.type} - {acc.priceRange}) -{' '}
                <a href={acc.link} target="_blank" rel="noopener noreferrer">
                  Link
                </a>
              </span>
            ))}
          </p>
          <p>
            <strong>Recomendações de Comida:</strong>
            {travel.foodRecommendations.map((food, index) => (
              <span key={index}>
                {food.dish} -{' '}
                <a href={food.link} target="_blank" rel="noopener noreferrer">
                  {food.restaurant}
                </a>
              </span>
            ))}
          </p>
          <p>
            <strong>Clima:</strong> Média de {travel.climate.averageTemperature}
            , melhor época para visitar: {travel.climate.bestTimeToVisit}
          </p>
          <p>
            <strong>Pontos de Interesse:</strong>
            {travel.pointsOfInterest.map((poi, index) => (
              <span key={index}>
                {poi.name} ({poi.type}) -{' '}
                <a href={poi.link} target="_blank" rel="noopener noreferrer">
                  Link
                </a>
              </span>
            ))}
          </p>
          <button onClick={handleFavoriteToggle}>
            {isFavorite ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
          </button>
        </div>
      </div>

<div className='moreDetails'>
    {/* Tabs */}
    <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'description' ? 'active' : ''}`}
          onClick={() => setActiveTab('description')}
        >
          Descrição Longa
        </button>
        <button 
          className={`tab-button ${activeTab === 'interests' ? 'active' : ''}`}
          onClick={() => setActiveTab('interests')}
        >
          Interesses
        </button>
        <button 
          className={`tab-button ${activeTab === 'activities_interests' ? 'active' : ''}`}
          onClick={() => setActiveTab('activities_interests')}
        >
          Atividades e Pontos de Interesse
        </button>
      </div>

      {/* Conteúdo das Tabs */}
      <div className="tab-content">
        {activeTab === 'description' && (
          <div>
            <h2>Descrição Longa</h2>
            <p>{travel.longDescription}</p>
          </div>
        )}
        {activeTab === 'interests' && (
          <div>
            <h2>Interesses</h2>
            <ul>
              {travel.interests.map((interest, index) => (
                <li key={index}>{interest}</li>
              ))}
            </ul>
          </div>
        )}
        {activeTab === 'activities_interests' && (
          <div>
            <h2>Atividades</h2>
            <ul>
              {travel.activities.map((activity, index) => (
                <li key={index}>{activity}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
  
</div>

      <div className="gallery">
        <h2>Galeria</h2>
        <div className="gallery-images">
          {travel.images ? (
            travel.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Imagem da viagem ${index + 1}`}
              />
            ))
          ) : (
            <p>Sem imagens disponíveis.</p>
          )}
        </div>
      </div>

      <div className="comments-section">
        <h2>Comentários</h2>
        <form onSubmit={handleCommentSubmit}>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Deixe seu comentário"
            required
          />
          <button type="submit">Enviar Comentário</button>
        </form>
        <div className="comment-list">
          {commentList.map((comment, index) => (
            <p key={index}>{comment}</p>
          ))}
        </div>
      </div>

      <div className="recommended-travels">
        <h2>Viagens Recomendadas</h2>
        <div className="carousel">
          {recommendedTravels.length > 4 && (
            <button
              className="carousel-button left"
              onClick={prevTravel}
              disabled={currentIndex === 0}
            >
              ❮
            </button>
          )}

          <div
            className="recommended-travel-list"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {recommendedTravels.map((travel, index) => (
              <Link
                key={index}
                to={`/travel/${travel.id}`}
                className="recommended-travel-item"
                onClick={scrollToTop}
              >
                <div className="card">
                  <img src={travel.highlightImage} alt="Viagem recomendada" />
                  <p><strong>{travel.name}</strong></p>
                  <p><strong>Preço:</strong> {travel.price}€</p>
                  <p>
                    <strong>Avaliação:</strong> {renderStars(travel.stars)}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {recommendedTravels.length > 4 && (
            <button
              className="carousel-button right"
              onClick={nextTravel}
              disabled={currentIndex >= recommendedTravels.length - 4}
            >
              ❯
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TravelDetails;
