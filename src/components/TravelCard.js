import React, { memo } from 'react';
import PropTypes from 'prop-types';

/**
 * TravelCard - Componente de cartão de viagem otimizado
 * @component
 * @param {Object} travel - Objeto de viagem
 * @param {string} travel.imageUrl - URL da imagem
 * @param {string} travel.title - Título da viagem
 * @param {string} travel.description - Descrição
 * @param {string} travel.category - Categoria
 * @param {number} travel.views - Número de visualizações
 * @returns {React.ReactElement}
 */
const TravelCard = memo(({ travel }) => {
  return (
    <div className="travel-card">
      <img src={travel.imageUrl} alt={travel.title} className="travel-image" />
      <h3>{travel.title}</h3>
      <p>{travel.description}</p>
      <span className="travel-category">{travel.category}</span>
      <span className="travel-views">{travel.views} visualizações</span>
    </div>
  );
});

TravelCard.displayName = 'TravelCard';

// PropTypes para validação de tipos
TravelCard.propTypes = {
  travel: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    imageUrl: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    category: PropTypes.string,
    views: PropTypes.number,
    likes: PropTypes.number,
    location: PropTypes.string,
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    author: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string)
  }).isRequired
};

// Valores padrão
TravelCard.defaultProps = {
  travel: {
    description: '',
    category: 'Viagem',
    views: 0,
    likes: 0,
    location: '',
    author: 'Utilizador Anónimo',
    tags: []
  }
};

export default TravelCard;
