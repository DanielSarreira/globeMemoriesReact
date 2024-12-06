import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import travels from '../data/travelsData'; // Verifique se o caminho está correto
import '../components/TravelDetails.css'; // Certifique-se de que o caminho está correto
import { FaStar } from 'react-icons/fa';

const TravelDetails = () => {
  const { id } = useParams();
  const travel = travels.find((t) => t.id === parseInt(id));

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
      behavior: 'smooth', // Animação suave
    });
  };

  if (!travel) {
    return <div>Viagem não encontrada.</div>;
  }

  const renderStars = (stars) => (
    [...Array(5)].map((_, index) => (
      <FaStar key={index} color={index < stars ? "#ffc107" : "#e4e5e9"} size={20} />
    ))
  );

  return (
    <div className="travel-details-container">
      <div className="travel-info">
        <div className="highlight-image">
          <img src={travel.highlightImage} alt="Imagem de destaque" />
        </div>
        <div className="info">
          <h1>{travel.name}</h1>
          <p><strong>Usuário:</strong> {travel.user}</p>
          <p><strong>País:</strong> {travel.country}</p>
          <p><strong>Cidade:</strong> {travel.city}</p>
          <p><strong>Preço da Viagem:</strong> {travel.price}€</p>
          <p><strong>Avaliação da Viagem:</strong> {renderStars(travel.stars)}</p>
          <p><strong>Data de Início:</strong> {travel.startDate}</p>
          <p><strong>Data de Fim:</strong> {travel.endDate}</p>
          <p><strong>Descrição Curta:</strong> {travel.description}</p>
          <p><strong>Categoria:</strong> {travel.category.join(', ')}</p>
          <button onClick={handleFavoriteToggle}>
            {isFavorite ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
          </button>
        </div>
      </div>

      <div className="gallery">
        <h2>Galeria</h2>
        <div className="gallery-images">
          {travel.images ? (
            travel.images.map((image, index) => (
              <img key={index} src={image} alt={`Imagem da viagem ${index + 1}`} />
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
              style={{ color: 'black' }}
            >
              ❮
            </button>
          )}
          
          <div className="recommended-travel-list" style={{ transform: `translateX(-${currentIndex * 25}%)` }}>
            {recommendedTravels.map((travel, index) => (
              <Link 
                key={index} 
                to={`/travel/${travel.id}`} 
                className="recommended-travel-item"
                onClick={scrollToTop}
              >
                <div className="card">
                  <img src={travel.highlightImage} alt="Viagem recomendada" />
                  <h3>{travel.name}</h3>
                  <p><strong>Preço:</strong> {travel.price}€</p>
                  <p><strong>Avaliação:</strong> {renderStars(travel.stars)}</p>
                </div>
              </Link>
            ))}
          </div>
          
          {recommendedTravels.length > 4 && (
            <button 
              className="carousel-button right" 
              onClick={nextTravel} 
              disabled={currentIndex >= recommendedTravels.length - 4}
              style={{ color: 'black' }}
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
