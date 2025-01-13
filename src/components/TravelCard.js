import React from 'react';

const TravelCard = ({ travel }) => {
  return (
    <div className="travel-card">
      <img src={travel.imageUrl} alt={travel.title} className="travel-image" />
      <h3>{travel.title}</h3>
      <p>{travel.description}</p>
      <span className="travel-category">{travel.category}</span>
      <span className="travel-views">{travel.views} visualizações</span>
    </div>
  );
};

export default TravelCard;
