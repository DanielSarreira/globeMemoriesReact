import React from 'react';

const TravelCard = ({ travel }) => {
  return (
    <div className="travel-card">
      <h2>{travel.title}</h2>
      <p>{travel.description}</p>
      <button>Ver Detalhes</button>
    </div>
  );
};

export default TravelCard;
