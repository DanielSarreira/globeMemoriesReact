import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import travels from '../data/travelsData';
import '../components/TravelDetails.css';
import { FaStar } from 'react-icons/fa';

const TravelDetails = () => {
  const { id } = useParams();
  const travel = travels.find((t) => t.id === parseInt(id));
  const [isFavorite, setIsFavorite] = useState(false);
  const [comments, setComments] = useState('');
  const [commentList, setCommentList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('info'); // Aba ativa

  const recommendedTravels = travels.filter(
    (t) => t.category.includes(travel.category[0]) && t.id !== travel.id
  );

  const handleFavoriteToggle = () => setIsFavorite(!isFavorite);
  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (comments.trim()) {
      setCommentList([...commentList, comments]);
      setComments('');
    }
  };

  const renderStars = (stars) =>
    [...Array(5)].map((_, index) => (
      <FaStar key={index} color={index < stars ? '#ffc107' : '#e4e5e9'} size={20} />
    ));

  if (!travel) return <div>Viagem não encontrada.</div>;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return (
          <div className="info">
            <h1>{travel.name}</h1>
            <p><strong>Usuário:</strong> {travel.user}</p>
            <p><strong>País:</strong> {travel.country}</p>
            <p><strong>Cidade:</strong> {travel.city}</p>
            <p><strong>Preço da Viagem:</strong> {travel.price}€</p>
            <p><strong>Avaliação:</strong> {renderStars(travel.stars)}</p>
            <p><strong>Descrição:</strong> {travel.description}</p>
            <button onClick={handleFavoriteToggle}>
              {isFavorite ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
            </button>
          </div>
        );
      case 'gallery':
        return (
          <div className="gallery">
            <h2>Galeria</h2>
            <div className="gallery-images">
              {travel.images ? (
                travel.images.map((image, index) => (
                  <img key={index} src={image} alt={`Imagem ${index + 1}`} />
                ))
              ) : (
                <p>Sem imagens disponíveis.</p>
              )}
            </div>
          </div>
        );
      case 'comments':
        return (
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
        );
      case 'recommended':
        return (
          <div className="recommended-travels">
            <h2>Viagens Recomendadas</h2>
            <div className="carousel">
              {recommendedTravels.map((travel, index) => (
                <Link key={index} to={`/travel/${travel.id}`} className="recommended-travel-item">
                  <div className="card">
                    <img src={travel.highlightImage} alt="Viagem recomendada" />
                    <p><strong>{travel.name}</strong></p>
                    <p><strong>Preço:</strong> {travel.price}€</p>
                    <p><strong>Avaliação:</strong> {renderStars(travel.stars)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="travel-details-container">
      <div className="tabs">
        <button className={activeTab === 'info' ? 'active' : ''} onClick={() => setActiveTab('info')}>
          Informações da Viagem
        </button>
        <button className={activeTab === 'gallery' ? 'active' : ''} onClick={() => setActiveTab('gallery')}>
          Galeria
        </button>
        <button className={activeTab === 'comments' ? 'active' : ''} onClick={() => setActiveTab('comments')}>
          Comentários
        </button>
        <button className={activeTab === 'recommended' ? 'active' : ''} onClick={() => setActiveTab('recommended')}>
          Viagens Recomendadas
        </button>
      </div>
      <div className="tab-content">{renderTabContent()}</div>
    </div>
  );
};

export default TravelDetails;
